# Приложение I. Extension Performance Checklist

Производительность браузерного расширения отличается от производительности обычного веб-приложения.

У расширения нет одного единственного runtime. Оно состоит из нескольких execution contexts — Service Worker, Content Scripts, Popup, Side Panel, Options Page и других компонентов. Каждый из них имеет собственный lifecycle, собственную стоимость запуска и собственные ограничения.

Поэтому производительность extension следует рассматривать не как вопрос «насколько быстро работает JavaScript», а как вопрос:

> **Сколько browser resources extension использует, когда именно он их использует и насколько долго они остаются активными?**

Главная цель оптимизации Manifest V3 — **делать как можно меньше работы, как можно реже и как можно ближе к месту, где эта работа действительно нужна.**

---

# I.1. Общие принципы производительности

Перед оптимизацией отдельных компонентов необходимо определить несколько базовых принципов.

### Principle 1 — Load less

Не загружайте код, который не нужен текущему context.

Плохо:

```text
Content Script
    ↓
loads entire application
    ↓
loads UI
    ↓
loads storage layer
    ↓
loads networking layer
    ↓
loads analytics
```

Лучше:

```text
Content Script
    ↓
minimal DOM integration
    ↓
message
    ↓
Service Worker
```

---

### Principle 2 — Execute less

Наличие возможности выполнить код не означает, что его следует выполнять.

Особенно дорогостоящими могут быть:

* постоянные observers;
* частые DOM scans;
* polling;
* глобальные event listeners;
* обработка каждого network/event события;
* частые сообщения между contexts.

---

### Principle 3 — Keep the background ephemeral

Service Worker не должен превращаться в постоянно работающий application server.

Архитектура должна быть:

```text
Event
  ↓
Start worker
  ↓
Handle event
  ↓
Persist result
  ↓
Worker becomes idle
```

а не:

```text
Start worker
  ↓
Initialize application
  ↓
Keep state in memory
  ↓
Run timers
  ↓
Wait forever
```

---

### Principle 4 — Prefer browser-managed execution

Если задачу можно передать браузеру через declarative API, это часто лучше, чем постоянно выполнять JavaScript.

Например:

```text
JavaScript interception
        ↓
browser event
        ↓
JavaScript decision
```

можно заменить на:

```text
Declarative rule
        ↓
Browser engine
```

---

# I.2. Performance Architecture Checklist

Перед реализацией extension задайте следующие вопросы.

### Runtime

* [ ] Какие execution contexts действительно необходимы?
* [ ] Можно ли удалить хотя бы один context?
* [ ] Можно ли перенести часть логики в browser API?
* [ ] Можно ли использовать declarative API?
* [ ] Можно ли отказаться от постоянно выполняющегося JavaScript?

### Code

* [ ] Загружается только необходимый код?
* [ ] Используется code splitting?
* [ ] Нет ли большого общего bundle?
* [ ] Нет ли ненужных зависимостей?
* [ ] Нет ли дублирования библиотек?

### Lifecycle

* [ ] Service Worker запускается только по необходимости?
* [ ] Нет ли искусственного удержания worker?
* [ ] Нет ли бесконечных timers?
* [ ] Нет ли polling без необходимости?
* [ ] Состояние не зависит от global variables?

---

# I.3. Service Worker Performance

Service Worker — один из наиболее важных компонентов производительности MV3 extension.

Его следует проектировать как **ephemeral event processor**.

---

## I.3.1. Минимальный startup

При запуске worker не следует выполнять тяжёлую инициализацию.

Плохо:

```javascript
const database = initializeDatabase();
const configuration = loadEverything();
const cache = buildCache();
const application = createApplication();
```

Лучше:

```javascript
chrome.runtime.onMessage.addListener((message, sender) => {
    handleMessage(message, sender);
});
```

Тяжёлая работа выполняется только тогда, когда она действительно нужна.

---

# I.3.2. Cold start

Service Worker может быть запущен после периода отсутствия активности.

Поэтому важно минимизировать:

* количество импортов;
* размер JavaScript;
* синхронную инициализацию;
* parsing;
* создание объектов;
* чтение больших объёмов storage.

Проверяйте:

```text
Extension event
      ↓
Worker startup
      ↓
Module loading
      ↓
Initialization
      ↓
Handler
```

Чем меньше работы между startup и handler, тем лучше.

---

# I.3.3. Не храните критическое состояние в памяти

Плохо:

```javascript
let currentUser = null;
let currentTab = null;
let settings = {};
```

Если worker будет остановлен, состояние исчезнет.

Для устойчивой архитектуры:

```text
Service Worker memory
        ↓
temporary cache

chrome.storage
        ↓
persistent state
```

Это одновременно повышает надёжность и упрощает lifecycle management.

---

# I.3.4. Timers

Избегайте архитектуры:

```javascript
setInterval(() => {
    checkSomething();
}, 1000);
```

Особенно если операция может быть реализована через:

```text
chrome.alarms
```

или declarative API.

Вместо:

```text
poll → poll → poll → poll
```

предпочтительнее:

```text
scheduled event
      ↓
perform operation
      ↓
idle
```

---

# I.4. Content Script Performance

Content Script может оказаться самым дорогим компонентом расширения.

Причина проста:

> Content Script может запускаться на страницах, которые extension не контролирует.

Если расширение работает на сотнях вкладок, один небольшой overhead быстро превращается в значительную суммарную нагрузку.

---

# I.4.1. Минимизируйте область инъекции

Не используйте:

```json
{
  "matches": ["<all_urls>"]
}
```

если extension действительно не нужен на всех сайтах.

Лучше:

```json
{
  "matches": [
    "https://example.com/*"
  ]
}
```

или ограничить injection динамически.

---

# I.4.2. Минимизируйте размер Content Script

Content Script должен выполнять только page-specific работу.

Например:

```text
Content Script
├── DOM integration
├── page events
└── messaging
```

а не:

```text
Content Script
├── application framework
├── database
├── settings
├── authentication
├── networking
├── analytics
├── UI
└── DOM integration
```

---

# I.4.3. Не сканируйте DOM постоянно

Плохо:

```javascript
setInterval(() => {
    document.querySelectorAll(".item");
}, 500);
```

Лучше использовать:

```javascript
MutationObserver
```

и реагировать только на изменения.

Однако и `MutationObserver` нельзя использовать бездумно.

Например:

```javascript
observer.observe(document.body, {
    childList: true,
    subtree: true
});
```

на очень динамичной странице может генерировать огромное количество callback-вызовов.

Необходимо:

* фильтровать изменения;
* группировать события;
* debounce/throttle;
* ограничивать область наблюдения.

---

# I.4.4. Debounce и throttle

Если событие возникает часто:

```javascript
window.addEventListener("scroll", handler);
```

не следует выполнять тяжёлую операцию на каждом событии.

Можно использовать throttling:

```javascript
let scheduled = false;

window.addEventListener("scroll", () => {
    if (scheduled) return;

    scheduled = true;

    requestAnimationFrame(() => {
        scheduled = false;
        update();
    });
});
```

---

# I.5. DOM Performance

DOM является одним из основных источников frontend overhead.

Избегайте повторного поиска одних и тех же элементов:

```javascript
document.querySelector(".container");
document.querySelector(".container");
document.querySelector(".container");
```

Вместо этого:

```javascript
const container = document.querySelector(".container");
```

---

## I.5.1. Batch DOM operations

Плохо:

```javascript
for (const item of items) {
    container.appendChild(createItem(item));
}
```

Для больших объёмов данных лучше предварительно построить структуру и выполнить минимальное количество DOM mutations.

Например:

```javascript
const fragment = document.createDocumentFragment();

for (const item of items) {
    fragment.appendChild(createItem(item));
}

container.appendChild(fragment);
```

---

# I.5.2. Избегайте layout thrashing

Проблемный паттерн:

```javascript
element.style.width = "100px";

const width = element.offsetWidth;

element.style.width = "200px";

const height = element.offsetHeight;
```

Чередование DOM writes и reads может заставлять браузер выполнять дополнительные layout calculations.

Предпочтительнее группировать:

```text
Read
Read
Read

Write
Write
Write
```

---

# I.6. Popup Performance

Popup имеет короткий lifecycle.

Пользователь:

```text
click
 ↓
popup opens
 ↓
user interacts
 ↓
popup closes
```

Поэтому особенно важен startup time.

Не следует загружать в popup:

* большие библиотеки;
* ненужные framework runtime;
* большие datasets;
* тяжёлую бизнес-логику.

Popup должен быть:

```text
small
fast
temporary
```

---

# I.7. Side Panel Performance

Side Panel принципиально отличается от Popup.

Popup:

```text
open
 ↓
interaction
 ↓
close
```

Side Panel:

```text
open
 ↓
long-lived UI
 ↓
multiple interactions
 ↓
close
```

Поэтому Side Panel может оправдать более сложное состояние и более богатый UI.

Но это не означает, что его следует превращать в постоянно работающий backend.

Хорошая архитектура:

```text
Side Panel
    │
    ├── UI state
    │
    └── messages
             ↓
       Service Worker
             ↓
       persistent state
```

---

# I.8. Messaging Performance

Communication между contexts имеет стоимость.

Плохо:

```text
Content Script
   ↓ message
Service Worker
   ↓ message
Content Script
   ↓ message
Service Worker
```

для каждой маленькой операции.

Лучше группировать данные:

```text
10 small messages
        ↓
1 structured message
```

Например:

```javascript
{
    type: "PAGE_STATE",
    payload: {
        url,
        title,
        selection,
        items
    }
}
```

вместо серии:

```text
URL
TITLE
SELECTION
ITEMS
```

---

# I.8.1. Не передавайте большие объёмы данных без необходимости

Особенно осторожно следует относиться к:

* большим массивам;
* HTML;
* DOM snapshots;
* изображениями;
* бинарным данным;
* большим JSON structures.

Лучше передавать:

```text
ID
reference
small metadata
```

а данные получать только тогда, когда они нужны.

---

# I.9. Storage Performance

Storage — ещё один потенциальный bottleneck.

Не следует постоянно выполнять:

```javascript
await chrome.storage.local.get("state");
```

на каждую мелкую операцию.

Лучше:

```text
read
 ↓
use in current operation
 ↓
write only when changed
```

---

## I.9.1. Batch storage operations

Вместо:

```javascript
await chrome.storage.local.set({ a });
await chrome.storage.local.set({ b });
await chrome.storage.local.set({ c });
```

предпочтительнее:

```javascript
await chrome.storage.local.set({
    a,
    b,
    c
});
```

---

# I.9.2. Не сохраняйте то, что не нужно сохранять

Разделяйте:

```text
persistent state
```

и:

```text
ephemeral state
```

Например:

```text
user settings → storage
current hover → memory
temporary UI state → memory
cached result → cache/storage depending on requirements
```

---

# I.10. Network Performance

Сетевые запросы должны быть:

* минимальными;
* кешируемыми;
* отменяемыми;
* необходимыми.

Плохо:

```text
Every page event
       ↓
HTTP request
```

Лучше:

```text
Many events
       ↓
debounce
       ↓
one request
```

---

## I.10.1. Cache

Если данные редко изменяются:

```text
request
   ↓
cache
   ↓
reuse
```

может значительно уменьшить latency и network traffic.

Но cache должен иметь понятную:

* TTL;
* invalidation policy;
* size limit.

---

# I.11. Bundle Size

Размер extension bundle влияет на:

* installation size;
* startup;
* parsing;
* memory;
* update size.

Проверяйте:

```text
bundle size
dependency count
duplicate dependencies
unused modules
```

---

## I.11.1. Не используйте библиотеку ради одной функции

Плохо:

```text
10 KB utility
```

ради одной простой операции.

Например, если современный Web Platform уже предоставляет необходимый API, dependency может быть вообще не нужна.

Это особенно важно для Platform-first extension architecture.

---

# I.12. Code Splitting

Разные contexts не обязательно должны загружать одинаковый код.

Например:

```text
shared/
    types.js
    protocol.js

popup/
    popup.js

content/
    content.js

background/
    worker.js

sidepanel/
    panel.js
```

Вместо:

```text
application.js
```

который загружается всеми contexts.

---

# I.13. Memory Performance

Расширение должно контролировать memory usage.

Особенно опасны:

* глобальные caches;
* большие массивы;
* сохранённые DOM references;
* event listeners;
* observers;
* closures;
* незакрытые connections.

---

## I.13.1. Event listener cleanup

Если listener больше не нужен:

```javascript
element.removeEventListener("click", handler);
```

Для динамических компонентов необходимо контролировать lifecycle:

```text
create
 ↓
subscribe
 ↓
use
 ↓
unsubscribe
 ↓
destroy
```

---

# I.14. Port Performance

`Port` подходит для long-lived communication, но не следует создавать connection без необходимости.

Плохая архитектура:

```text
every component
    ↓
new Port()
```

Лучше определить явные communication channels:

```text
Side Panel
    ↓
Port
    ↓
Service Worker
```

и контролировать:

* connection;
* disconnection;
* reconnection;
* cleanup.

---

# I.15. Declarative Performance

Если задача может быть выражена declaratively, это часто лучший вариант для MV3.

Например:

```text
Request
 ↓
JavaScript
 ↓
extension logic
 ↓
decision
```

может быть заменено:

```text
Request
 ↓
DNR engine
 ↓
rule
 ↓
action
```

Второй вариант позволяет браузеру выполнять работу на уровне собственного engine.

Это одна из фундаментальных идей Manifest V3:

> **Performance optimization часто достигается не ускорением JavaScript, а устранением необходимости выполнять JavaScript.**

---

# I.16. Startup Checklist

### Service Worker

* [ ] Минимальный top-level initialization.
* [ ] Нет тяжёлой синхронной работы.
* [ ] Нет постоянного polling.
* [ ] Нет искусственного удержания worker.
* [ ] Используются event-driven APIs.
* [ ] Используются `chrome.alarms`, когда они подходят.

### Popup

* [ ] Минимальный bundle.
* [ ] Быстрый first render.
* [ ] Нет тяжёлой initialization logic.
* [ ] Нет ненужного background processing.

### Content Script

* [ ] Минимальный code footprint.
* [ ] Ограничены `matches`.
* [ ] Нет постоянного DOM polling.
* [ ] Events throttled/debounced.
* [ ] DOM mutations минимизированы.

### Side Panel

* [ ] UI не выполняет backend responsibilities.
* [ ] Нет лишних network requests.
* [ ] Состояние синхронизируется эффективно.

---

# I.17. Runtime Checklist

Проверьте каждый execution context:

| Context        | Проверить               |
| -------------- | ----------------------- |
| Service Worker | startup, memory, events |
| Content Script | injection cost, DOM     |
| Popup          | startup, bundle         |
| Side Panel     | memory, rendering       |
| Options        | unnecessary work        |
| DevTools       | lifecycle               |
| MAIN world     | page interference       |

---

# I.18. Messaging Checklist

* [ ] Messages минимальны.
* [ ] Нет message loops.
* [ ] Нет постоянного polling через messages.
* [ ] Payload не содержит ненужных данных.
* [ ] Используются typed messages.
* [ ] Большие данные не пересылаются без необходимости.
* [ ] Long-lived communication использует `Port`, когда это оправдано.

---

# I.19. Storage Checklist

* [ ] Нет чрезмерного количества reads.
* [ ] Нет чрезмерного количества writes.
* [ ] Используется batching.
* [ ] Persistent и ephemeral state разделены.
* [ ] Нет хранения больших ненужных объектов.
* [ ] Используется подходящий storage area.
* [ ] Учитываются quotas.

---

# I.20. DOM Checklist

* [ ] Нет постоянного polling.
* [ ] MutationObserver ограничен необходимой областью.
* [ ] DOM operations batch'ятся.
* [ ] Нет лишних `querySelector`.
* [ ] Нет layout thrashing.
* [ ] Event handlers throttled/debounced.
* [ ] Большие DOM trees не пересоздаются без необходимости.

---

# I.21. Network Checklist

* [ ] Нет ненужных requests.
* [ ] Requests batch'ятся.
* [ ] Используется cache.
* [ ] Есть timeout.
* [ ] Есть cancellation.
* [ ] Не передаются большие payload без необходимости.
* [ ] Повторные requests контролируются.
* [ ] Используются browser-managed APIs, где это возможно.

---

# I.22. Bundle Checklist

* [ ] Bundle минимален.
* [ ] Удалены unused dependencies.
* [ ] Нет duplicate libraries.
* [ ] Используется tree shaking.
* [ ] Используется code splitting.
* [ ] Context-specific code отделён.
* [ ] Native Web APIs предпочтительнее лишних dependencies.

---

# I.23. Performance Anti-Patterns

Ниже — типичные архитектурные ошибки.

### Anti-pattern 1 — Permanent Background

```text
Service Worker
    ↓
always running
```

**Проблема:** неправильная модель MV3 lifecycle.

---

### Anti-pattern 2 — Polling

```text
setInterval()
    ↓
check
    ↓
check
    ↓
check
```

**Проблема:** работа выполняется даже при отсутствии изменений.

---

### Anti-pattern 3 — `<all_urls>` без необходимости

```json
"matches": ["<all_urls>"]
```

**Проблема:** Content Script потенциально присутствует на огромном количестве страниц.

---

### Anti-pattern 4 — Giant Content Script

```text
Content Script
    ↓
entire application
```

**Проблема:** лишняя загрузка и выполнение кода на каждой странице.

---

### Anti-pattern 5 — Message Storm

```text
event
 ↓
message
 ↓
message
 ↓
message
 ↓
message
```

**Проблема:** unnecessary communication overhead.

---

### Anti-pattern 6 — Storage Chattyness

```text
operation
 ↓
get
 ↓
set
 ↓
get
 ↓
set
```

**Проблема:** excessive storage operations.

---

### Anti-pattern 7 — DOM Polling

```javascript
setInterval(scanDOM, 100);
```

**Проблема:** постоянная работа независимо от состояния страницы.

---

### Anti-pattern 8 — Framework Everywhere

```text
Popup
    ↓
framework

Content Script
    ↓
framework

Options
    ↓
framework

Side Panel
    ↓
framework
```

Иногда это оправдано, но часто приводит к избыточному runtime overhead.

Platform-first подход предполагает:

```text
Web Platform
    ↓
minimal extension runtime
    ↓
application
```

---

# I.24. Performance Measurement

Оптимизацию нельзя строить только на предположениях.

Необходимо измерять:

```text
Startup time
Memory
CPU
DOM operations
Network
Storage
Message frequency
Bundle size
```

Полезная модель:

```text
                Extension Performance
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
      CPU              Memory           Network
        │                │                │
        ↓                ↓                ↓
     JS/DOM          Contexts          Requests
        │                │                │
        └────────────────┼────────────────┘
                         ↓
                     Lifecycle
```

---

# I.25. Performance Budget

Для production extension полезно заранее установить budget.

Например:

```text
Content Script:
    minimal startup cost

Service Worker:
    minimal cold start

Popup:
    near-instant open

Messaging:
    only meaningful events

Network:
    no unnecessary requests

Storage:
    batched writes

DOM:
    event-driven updates
```

Точные числовые thresholds должны определяться конкретным проектом и измеряться на реальных сценариях, а не приниматься как универсальные нормы.

---

# I.26. Final Performance Checklist

Перед production release проверьте:

### Architecture

* [ ] Extension состоит только из необходимых contexts.
* [ ] Архитектура event-driven.
* [ ] Declarative APIs используются там, где они подходят.
* [ ] Service Worker не используется как постоянно работающий сервер.

### Service Worker

* [ ] Минимальный startup.
* [ ] Нет постоянного polling.
* [ ] Нет зависимости от in-memory state.
* [ ] Используется persistent state.
* [ ] Ошибки не приводят к бесконечным retry loops.

### Content Scripts

* [ ] Ограничены host patterns.
* [ ] Минимальный bundle.
* [ ] Нет DOM polling.
* [ ] MutationObserver используется осмысленно.
* [ ] Частые events throttled/debounced.

### UI

* [ ] Popup открывается быстро.
* [ ] Side Panel не выполняет ненужную работу.
* [ ] UI state отделён от application state.
* [ ] Большие datasets не загружаются без необходимости.

### Communication

* [ ] Messages минимальны.
* [ ] Payloads небольшие.
* [ ] Нет message storms.
* [ ] Ports используются только при необходимости.
* [ ] Есть cleanup connections.

### Storage

* [ ] Reads минимальны.
* [ ] Writes batch'ятся.
* [ ] State разделён на persistent и ephemeral.
* [ ] Quotas учитываются.

### Network

* [ ] Нет лишних requests.
* [ ] Используется caching.
* [ ] Есть timeout/cancellation.
* [ ] Requests batch'ятся.

### Code

* [ ] Bundle минимален.
* [ ] Нет ненужных dependencies.
* [ ] Используется tree shaking.
* [ ] Context-specific code разделён.
* [ ] Native Web Platform APIs используются вместо лишних библиотек.

### Measurement

* [ ] Startup измерен.
* [ ] CPU измерен.
* [ ] Memory проверена.
* [ ] Network activity проверена.
* [ ] Storage activity проверена.
* [ ] Message frequency проверена.
* [ ] Production build протестирован.

---

# I.27. Главный принцип

Производительность Manifest V3 extension можно свести к одной архитектурной формуле:

```text
                    PERFORMANCE
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
     Execute less     Load less       Communicate less
        │                │                │
        ↓                ↓                ↓
 Declarative APIs   Small bundles    Minimal messages
        │                │                │
        └────────────────┼────────────────┘
                         ↓
                 Event-driven runtime
                         ↓
                Ephemeral execution
                         ↓
                Browser-managed lifecycle
```

Именно поэтому производительность современного расширения начинается **не с оптимизации отдельных функций**, а с архитектуры.

Хорошее Manifest V3 extension не пытается заставить браузер постоянно выполнять JavaScript.

Оно, наоборот, стремится использовать браузер как runtime:

```text
                    Browser
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
   Web Platform   Extension APIs   Declarative APIs
        │              │              │
        └──────────────┼──────────────┘
                       ↓
                  Extension
                       ↓
                  Application
```

Отсюда следует важный вывод:

> **Самое быстрое расширение — не то, в котором JavaScript выполняется быстрее. Это расширение, которому вообще не приходится выполнять ненужный JavaScript.**

Это и есть естественная связь между **Performance**, **Security**, **Declarative APIs**, **Ephemeral Service Worker** и общей **Platform-first архитектурой Manifest V3**.
