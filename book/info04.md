# Приложение D. Extension Context Matrix

Extension Manifest V3 — это не единый JavaScript runtime.

Современное расширение состоит из нескольких **execution contexts**, каждый из которых имеет собственный lifecycle, JavaScript environment, набор доступных API и security boundary.

Для практической разработки особенно важно не просто знать отдельные contexts, а понимать **матрицу взаимодействий между ними**.

Главная модель:

```text
                         Browser
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
 Extension UI         Service Worker       Web Page
        │                   │                   │
   ┌────┼────┐              │             Content Script
   │    │    │              │                   │
Popup Options Side Panel    │             MAIN / Page JS
        │                   │
        └─────────── Messaging ────────────────┘
```

---

# D.1. Что такое Extension Context

**Execution context** — это изолированная среда выполнения JavaScript.

В Manifest V3 следует различать как минимум:

* Extension Pages;
* Service Worker;
* Content Scripts;
* Popup;
* Options Page;
* Side Panel;
* DevTools pages;
* Page JavaScript;
* isolated world;
* MAIN world.

У каждого context есть:

```text
JavaScript environment
       +
DOM availability
       +
Extension APIs
       +
Web APIs
       +
Lifecycle
       +
Security boundary
```

---

# D.2. Главная Context Matrix

Следующая таблица является базовой картой Manifest V3.

| Context           | DOM |    `chrome.*` APIs |                Web APIs | Persistent | Может быть UI |
| ----------------- | --: | -----------------: | ----------------------: | ---------: | ------------: |
| Service Worker    |   ❌ |                  ✅ | Частично/зависит от API |          ❌ |             ❌ |
| Popup             |   ✅ |                  ✅ |                       ✅ |          ❌ |             ✅ |
| Options Page      |   ✅ |                  ✅ |                       ✅ |          ❌ |             ✅ |
| Side Panel        |   ✅ |                  ✅ |                       ✅ |          ❌ |             ✅ |
| Extension Page    |   ✅ |                  ✅ |                       ✅ |          ❌ |             ✅ |
| Content Script    |  ✅* |        Ограниченно |                       ✅ |          ❌ |            ❌* |
| DevTools Page     |   ✅ | Специализированные |                       ✅ |          ❌ |   DevTools UI |
| Page Script       |   ✅ |                  ❌ |                       ✅ |          ❌ |             ✅ |
| MAIN-world script |   ✅ |        Ограниченно |                       ✅ |          ❌ |             ❌ |

`*` Content Script работает с DOM страницы, но находится в отдельном JavaScript world.

Главное:

> **DOM и JavaScript environment — не одно и то же.**

---

# D.3. Context ≠ Process

Очень важно не переносить автоматически модель:

```text
context = operating-system process
```

Это не обязательно так.

Browser сам управляет:

* процессами;
* renderer instances;
* workers;
* suspension;
* memory;
* scheduling.

Для extension developer правильнее мыслить:

```text
Context
   =
логическая execution environment
```

а не:

```text
Context
   =
гарантированный отдельный OS process
```

---

# D.4. Service Worker

Service Worker — основной background runtime Manifest V3.

Manifest:

```json
{
  "background": {
    "service_worker": "background.js"
  }
}
```

Архитектурная роль:

```text
Service Worker
      │
      ├── events
      ├── messages
      ├── storage
      ├── alarms
      ├── tabs
      ├── windows
      └── orchestration
```

Он не является постоянно работающим daemon process.

---

# D.5. Service Worker Matrix

| Возможность             |                     Service Worker |
| ----------------------- | ---------------------------------: |
| DOM                     |                                  ❌ |
| `document`              |                                  ❌ |
| `window`                |                                  ❌ |
| `chrome.runtime`        |                                  ✅ |
| `chrome.storage`        |                                  ✅ |
| `chrome.tabs`           |                                  ✅ |
| `chrome.scripting`      |                                  ✅ |
| `fetch()`               |                                  ✅ |
| `setTimeout()`          | ⚠️ Не для долгоживущего scheduling |
| `localStorage`          |                                  ❌ |
| UI                      |                                  ❌ |
| Persistent global state |                                  ❌ |

Особенно важен последний пункт.

Нельзя проектировать:

```javascript
let state = {};
```

как надёжное persistent storage.

---

# D.6. Popup

Popup — временный UI context.

Например:

```json
{
  "action": {
    "default_popup": "popup.html"
  }
}
```

Lifecycle:

```text
User clicks icon
       ↓
Popup created
       ↓
HTML loaded
       ↓
JavaScript executed
       ↓
User interacts
       ↓
Popup closes
       ↓
Context destroyed
```

Поэтому popup state:

```text
ephemeral
```

---

# D.7. Popup Matrix

| Возможность         |                               Popup |
| ------------------- | ----------------------------------: |
| DOM                 |                                   ✅ |
| `document`          |                                   ✅ |
| `window`            |                                   ✅ |
| Extension APIs      |                                   ✅ |
| `chrome.storage`    |                                   ✅ |
| `chrome.tabs`       | Обычно доступен через extension API |
| `fetch()`           |                                   ✅ |
| UI                  |                                   ✅ |
| Persistent JS state |                                   ❌ |
| Может жить долго    |                                   ❌ |

Popup нельзя рассматривать как главный runtime приложения.

Лучше:

```text
Popup
  ↓
command
  ↓
Service Worker
  ↓
persistent state
```

чем:

```text
Popup
  ↓
all application logic
```

---

# D.8. Options Page

Options Page — полноценная extension page.

Например:

```json
{
  "options_page": "options.html"
}
```

или:

```json
{
  "options_ui": {
    "page": "options.html"
  }
}
```

Она подходит для:

* настроек;
* configuration UI;
* preferences;
* account configuration;
* advanced settings.

---

# D.9. Options Matrix

| Возможность              |                Options |
| ------------------------ | ---------------------: |
| DOM                      |                      ✅ |
| `window`                 |                      ✅ |
| Extension APIs           |                      ✅ |
| Storage                  |                      ✅ |
| Fetch                    |                      ✅ |
| UI                       |                      ✅ |
| Long-lived               | Да, относительно popup |
| Background orchestration |                      ❌ |

Options page может жить значительно дольше popup, но всё равно не должна быть единственным источником состояния.

---

# D.10. Side Panel

Side Panel — один из наиболее интересных UI contexts современных browser extensions.

Он позволяет построить:

```text
Browser
┌──────────────────────────────┬──────────────┐
│                              │              │
│          Web Page            │  Extension   │
│                              │  Side Panel  │
│                              │              │
└──────────────────────────────┴──────────────┘
```

Side Panel особенно подходит для:

* AI assistants;
* productivity tools;
* page analyzers;
* research tools;
* dashboards;
* persistent workflows.

---

# D.11. Side Panel Matrix

| Возможность              |           Side Panel |
| ------------------------ | -------------------: |
| DOM                      |                    ✅ |
| `window`                 |                    ✅ |
| Extension APIs           |                    ✅ |
| Storage                  |                    ✅ |
| Fetch                    |                    ✅ |
| UI                       |                    ✅ |
| Persistent while open    |                   Да |
| Access to active tab     | Через extension APIs |
| Direct access to page JS |                    ❌ |

Side Panel является полноценным extension UI, но не заменяет Content Script.

---

# D.12. Content Script

Content Script работает непосредственно в контексте web page, но в отдельном JavaScript world.

Например:

```json
{
  "content_scripts": [
    {
      "matches": [
        "https://example.com/*"
      ],
      "js": [
        "content.js"
      ]
    }
  ]
}
```

Content Script получает:

```text
Page DOM
   +
Extension capabilities
   +
Isolated JavaScript world
```

---

# D.13. Content Script Matrix

| Возможность        |     Content Script |
| ------------------ | -----------------: |
| DOM страницы       |                  ✅ |
| `document`         |                  ✅ |
| `window`           |  ⚠️ Isolated world |
| Extension APIs     | Ограниченный набор |
| `chrome.runtime`   |                  ✅ |
| `chrome.storage`   |    Обычно доступен |
| `chrome.tabs`      |         ❌ напрямую |
| `chrome.scripting` |                  ❌ |
| `fetch()`          |                  ✅ |
| Page JS variables  |                  ❌ |
| Page functions     |                  ❌ |
| Extension UI       |                  ❌ |

Именно здесь возникает одна из главных архитектурных особенностей MV3.

---

# D.14. Page Script

Обычный JavaScript страницы:

```html
<script src="app.js"></script>
```

работает в web page context.

Он имеет:

```text
DOM
+
window
+
page globals
+
page JS
```

но не имеет:

```text
chrome.runtime
chrome.storage
chrome.tabs
```

как extension environment.

---

# D.15. Page Script Matrix

| Возможность      | Page Script |
| ---------------- | ----------: |
| DOM              |           ✅ |
| Page JavaScript  |           ✅ |
| `window`         |           ✅ |
| Extension APIs   |           ❌ |
| `chrome.runtime` |           ❌ |
| `chrome.storage` |           ❌ |
| `fetch()`        |           ✅ |
| Web APIs         |           ✅ |

Это fundamentally другая security domain.

---

# D.16. Isolated World

Content Script обычно выполняется в isolated world.

Можно представить:

```text
Same DOM
    │
    ├───────────────┐
    │               │
    ▼               ▼
Page World      Extension World
    │               │
page.js         content.js
    │               │
    └────── DOM ────┘
```

JavaScript environments различаются.

Например, page может иметь:

```javascript
window.appState
```

а Content Script не должен воспринимать этот объект как свой.

---

# D.17. MAIN World

В некоторых сценариях extension может выполнять код в MAIN world.

Это позволяет приблизиться к page JavaScript environment.

Но одновременно уменьшается изоляция.

Архитектурная модель:

```text
ISOLATED WORLD

Extension
    │
    └── content.js
          │
          └── isolated


MAIN WORLD

Page
    │
    └── injected code
```

MAIN world следует использовать только тогда, когда это действительно необходимо.

---

# D.18. Extension Page

Общее понятие:

> Extension Page — HTML page, принадлежащая extension origin.

К ним относятся:

* popup;
* options;
* side panel;
* другие extension HTML pages.

Они могут иметь URL вида:

```text
chrome-extension://<extension-id>/popup.html
```

В зависимости от browser implementation и context.

---

# D.19. Extension Origin

У extension существует собственный origin.

Концептуально:

```text
chrome-extension://<extension-id>
```

Например:

```text
chrome-extension://abcdefghijklmnop/
```

Поэтому:

```text
Web Page
https://example.com

≠

Extension Page
chrome-extension://...
```

Это разные security origins.

---

# D.20. Origin Matrix

| Context        | Origin                                 |
| -------------- | -------------------------------------- |
| Popup          | Extension origin                       |
| Options        | Extension origin                       |
| Side Panel     | Extension origin                       |
| Extension Page | Extension origin                       |
| Service Worker | Extension origin                       |
| Content Script | Page origin semantics + isolated world |
| Page Script    | Page origin                            |
| MAIN world     | Page origin                            |

Это одна из самых важных таблиц всей книги.

---

# D.21. Кто видит DOM

Условно:

```text
                    DOM
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
    Page JavaScript       Content Script
          │                     │
          └──── same DOM ───────┘
```

Но:

```text
Popup
Options
Side Panel
Service Worker
```

не имеют прямого доступа к DOM web page.

---

# D.22. Кто имеет `document`

| Context        | `document` |
| -------------- | ---------: |
| Service Worker |          ❌ |
| Popup          |          ✅ |
| Options        |          ✅ |
| Side Panel     |          ✅ |
| Extension Page |          ✅ |
| Content Script |          ✅ |
| Page Script    |          ✅ |
| MAIN world     |          ✅ |

Но наличие `document` не означает наличие одного и того же DOM.

Popup имеет:

```text
Popup DOM
```

Content Script:

```text
Web Page DOM
```

Options:

```text
Options DOM
```

Это разные documents.

---

# D.23. Кто имеет `window`

| Context        |          `window` |
| -------------- | ----------------: |
| Service Worker |                 ❌ |
| Popup          |                 ✅ |
| Options        |                 ✅ |
| Side Panel     |                 ✅ |
| Extension Page |                 ✅ |
| Content Script | ⚠️ Isolated world |
| Page Script    |                 ✅ |
| MAIN world     |                 ✅ |

Service Worker использует:

```text
globalThis
```

вместо browser page-style:

```text
window
```

---

# D.24. Web APIs

Необходимо разделять:

```text
Web Platform APIs
```

и:

```text
Extension APIs
```

Например:

```javascript
fetch()
```

— Web Platform API.

А:

```javascript
chrome.storage.local.get()
```

— Extension API.

---

# D.25. API Matrix

Упрощённо:

| API                | SW |            Popup | Options | Side Panel | Content |
| ------------------ | -: | ---------------: | ------: | ---------: | ------: |
| `fetch`            |  ✅ |                ✅ |       ✅ |          ✅ |       ✅ |
| DOM                |  ❌ |                ✅ |       ✅ |          ✅ |       ✅ |
| `chrome.runtime`   |  ✅ |                ✅ |       ✅ |          ✅ |       ✅ |
| `chrome.storage`   |  ✅ |                ✅ |       ✅ |          ✅ |       ✅ |
| `chrome.tabs`      |  ✅ |                ✅ |       ✅ |          ✅ |       ❌ |
| `chrome.scripting` |  ✅ |                ✅ |       ✅ |          ✅ |       ❌ |
| `chrome.alarms`    |  ✅ | обычно через API |  обычно |     обычно |       ❌ |

Точная доступность отдельных API должна проверяться по актуальной browser API reference.

---

# D.26. Storage

`chrome.storage` является одним из основных механизмов shared state.

Например:

```javascript
await chrome.storage.local.set({
  theme: "dark"
});
```

Это принципиально отличается от:

```javascript
let theme = "dark";
```

Потому что:

```text
global variable
    ↓
one context

chrome.storage
    ↓
shared persistence
```

---

# D.27. Storage Matrix

| Context        | `storage.local` | `storage.sync` | `storage.session` |
| -------------- | --------------: | -------------: | ----------------: |
| Service Worker |               ✅ |              ✅ |                 ✅ |
| Popup          |               ✅ |              ✅ |                 ✅ |
| Options        |               ✅ |              ✅ |                 ✅ |
| Side Panel     |               ✅ |              ✅ |                 ✅ |
| Content Script |               ✅ |              ✅ |                 ✅ |

Это делает `chrome.storage` естественным механизмом координации состояния между contexts.

---

# D.28. Messaging

Основной communication mechanism:

```text
runtime.sendMessage()
```

Архитектура:

```text
Popup
   │
   │ message
   ▼
Service Worker
   │
   │ message
   ▼
Content Script
```

Каждый context остаётся изолированным.

---

# D.29. Message Matrix

| From           | To             | Основной механизм               |
| -------------- | -------------- | ------------------------------- |
| Popup          | SW             | `runtime.sendMessage`           |
| Options        | SW             | `runtime.sendMessage`           |
| Side Panel     | SW             | `runtime.sendMessage`           |
| Content Script | SW             | `runtime.sendMessage`           |
| SW             | Content Script | `tabs.sendMessage`              |
| Popup          | Content Script | через SW или `tabs.sendMessage` |
| Page           | Content Script | `postMessage` / DOM bridge      |
| Content Script | Page           | `postMessage` / DOM bridge      |

---

# D.30. Почему Popup не должен напрямую владеть state

Плохая архитектура:

```text
Popup
  │
  ├── state
  ├── business logic
  ├── network
  ├── DOM
  └── storage
```

Popup закрывается.

Лучше:

```text
             Service Worker
                  │
          business/application
                  │
        ┌─────────┼─────────┐
        │         │         │
      Popup     Side      Options
```

UI contexts становятся clients.

---

# D.31. Recommended Architecture

Для сложного extension:

```text
                     Browser
                        │
          ┌─────────────┼─────────────┐
          │             │             │
        Popup        Side Panel     Options
          │             │             │
          └─────────────┼─────────────┘
                        │
                     Messaging
                        │
                        ▼
                Service Worker
                        │
       ┌────────────────┼────────────────┐
       │                │                │
    Storage           Network          Tabs
       │
       ▼
 Persistent State

                        │
                        ▼
                 Content Scripts
                        │
                        ▼
                    Page DOM
```

---

# D.32. Context Lifecycle Matrix

| Context        | Lifecycle                 |
| -------------- | ------------------------- |
| Service Worker | Event-driven / ephemeral  |
| Popup          | User-driven / short-lived |
| Options        | Page-driven               |
| Side Panel     | UI-driven / longer-lived  |
| Content Script | Page/frame-driven         |
| Page Script    | Page lifecycle            |
| DevTools       | DevTools lifecycle        |

Это означает:

```text
Не существует одного lifecycle
```

у всего extension.

---

# D.33. Lifecycle и State

Из этого следует важное правило:

```text
Context lifetime
      ≠
Application lifetime
```

Например:

```text
Popup
  created
  ↓
state loaded
  ↓
user changes setting
  ↓
state persisted
  ↓
popup destroyed
```

Application state продолжает существовать.

---

# D.34. Context Failure

Каждый context имеет собственную failure boundary.

Например:

```text
Popup crash
   ↓
Service Worker may continue
```

или:

```text
Content Script failure
   ↓
Page continues
```

или:

```text
Service Worker terminated
   ↓
Browser may restart it
```

Поэтому нельзя предполагать:

```text
one context fails
      ↓
whole application fails
```

---

# D.35. Context Matrix как distributed system

Сложное extension можно представить:

```text
           ┌───────────┐
           │   Popup   │
           └─────┬─────┘
                 │
                 ▼
           ┌───────────┐
           │   Worker  │
           └─────┬─────┘
                 │
       ┌─────────┼─────────┐
       ▼         ▼         ▼
    Storage    Tabs     Network
       │
       │
       ▼
   ┌─────────┐
   │ Content │
   └────┬────┘
        │
        ▼
      Page
```

Здесь присутствуют:

* independent runtimes;
* message passing;
* asynchronous operations;
* ephemeral processes;
* state synchronization;
* failure boundaries.

Поэтому архитектура действительно напоминает distributed application.

---

# D.36. Что нельзя передавать напрямую

Нельзя предполагать общий JavaScript state:

```javascript
// popup.js
window.appState = {};
```

и:

```javascript
// content.js
window.appState
```

как один объект.

Это разные JavaScript environments.

То же относится к:

```javascript
let state = {};
```

в Service Worker и Popup.

---

# D.37. Как передавать данные

Используйте:

```text
Messaging
```

для communication:

```text
Popup
   ↓ message
Worker
```

и:

```text
Storage
```

для shared/persistent state:

```text
Popup
   ↓
Storage
   ↑
Side Panel
```

---

# D.38. Communication vs State

Очень полезно разделять две концепции:

### Communication

```text
"Сделай действие"
```

например:

```json
{
  "type": "TAB_ANALYZE",
  "tabId": 123
}
```

### State

```text
"Каково текущее состояние?"
```

например:

```json
{
  "analysisEnabled": true
}
```

Первое — message.

Второе — storage/state layer.

---

# D.39. Context ownership

Для каждого state следует определить owner.

Например:

```text
User Settings
      ↓
Storage

Current analysis job
      ↓
Service Worker

Page DOM state
      ↓
Content Script

Temporary popup form
      ↓
Popup
```

Это предотвращает хаотичное изменение состояния из разных contexts.

---

# D.40. UI Contexts как clients

В production architecture полезно мыслить:

```text
Popup
Side Panel
Options
      │
      │ clients
      ▼
Application Runtime
      │
      ▼
Service Worker
```

То есть UI не является backend.

Service Worker становится:

```text
orchestrator
```

а Storage:

```text
persistent state layer
```

---

# D.41. Content Script как edge runtime

Content Script можно рассматривать как edge component:

```text
Web Page
    │
    ▼
Content Script
    │
    ▼
Extension Runtime
```

Он находится ближе всего к пользователю и web page.

Его задача:

* наблюдать DOM;
* взаимодействовать с page;
* собирать события;
* отображать UI;
* отправлять данные extension runtime.

---

# D.42. Service Worker как control plane

Service Worker удобно рассматривать как **control plane**:

```text
                 Service Worker
                       │
        ┌──────────────┼──────────────┐
        │              │              │
      Tabs          Storage         Network
        │              │              │
        └──────────────┼──────────────┘
                       │
                Context routing
```

Он не должен обязательно выполнять всю работу.

Его роль:

```text
route
coordinate
persist
schedule
authorize
recover
```

---

# D.43. Context Capability Matrix

Более полезная модель, чем просто список API:

| Capability         | SW | Popup | Options | Side Panel | Content |
| ------------------ | -: | ----: | ------: | ---------: | ------: |
| Background events  |  ✅ |     ❌ |       ❌ |          ❌ |       ❌ |
| DOM extension page |  ❌ |     ✅ |       ✅ |          ✅ |       ❌ |
| DOM web page       |  ❌ |     ❌ |       ❌ |          ❌ |       ✅ |
| Page interaction   |  ❌ |     ❌ |       ❌ |          ❌ |       ✅ |
| Storage            |  ✅ |     ✅ |       ✅ |          ✅ |       ✅ |
| Tabs control       |  ✅ |     ✅ |       ✅ |          ✅ |       ❌ |
| Messaging          |  ✅ |     ✅ |       ✅ |          ✅ |       ✅ |
| Scheduling         |  ✅ |     ❌ |       ❌ |          ❌ |       ❌ |
| Persistent UI      |  ❌ |     ❌ |      Да |         Да |       ❌ |

Это позволяет выбирать правильный context под задачу.

---

# D.44. Выбор Context

Можно использовать простое правило.

### Нужно работать с DOM страницы?

```text
Content Script
```

### Нужно реагировать на browser events?

```text
Service Worker
```

### Нужен toolbar interaction?

```text
Popup / Action
```

### Нужны постоянные настройки?

```text
Options Page
```

### Нужен persistent рабочий интерфейс?

```text
Side Panel
```

### Нужно работать с page JavaScript?

```text
MAIN world
```

только если isolated world недостаточен.

---

# D.45. Context Decision Tree

```text
Need UI?
 │
 ├── No ──► Need page DOM?
 │             │
 │             ├── Yes ──► Content Script
 │             │
 │             └── No ───► Service Worker
 │
 └── Yes
      │
      ├── Short interaction ──► Popup
      │
      ├── Persistent workspace ──► Side Panel
      │
      └── Configuration ──► Options
```

---

# D.46. Если нужно page JavaScript

Допустим, нужно вызвать:

```javascript
window.somePageFunction()
```

Content Script не должен автоматически делать:

```javascript
window.somePageFunction();
```

потому что:

```text
Content Script
      ↓
isolated world
```

а функция находится:

```text
Page world
```

Тогда архитектура:

```text
Content Script
      │
      ▼
Bridge
      │
      ▼
MAIN world
      │
      ▼
Page JavaScript
```

---

# D.47. Context Matrix и security

Каждый переход между contexts — security-sensitive boundary:

```text
Page
  ↕
Content Script
  ↕
Service Worker
  ↕
Storage
```

Нельзя доверять данным только потому, что они пришли:

```text
from extension
```

Особенно:

```text
Page → Content Script
```

потому что page является недоверенной средой.

---

# D.48. Message Validation

Каждое message должно иметь schema.

Например:

```json
{
  "type": "GET_SETTINGS"
}
```

или:

```json
{
  "type": "ANALYZE_PAGE",
  "url": "https://example.com/"
}
```

Вместо:

```javascript
if (message.action === "doSomething") {
  // ...
}
```

в сложном приложении лучше иметь formal protocol:

```text
Message
   ↓
Parse
   ↓
Validate
   ↓
Authorize
   ↓
Execute
   ↓
Response
```

---

# D.49. Typed Context Architecture

Для TypeScript можно описать protocol:

```typescript
type Message =
  | {
      type: "GET_SETTINGS";
    }
  | {
      type: "ANALYZE_PAGE";
      tabId: number;
    }
  | {
      type: "SET_ENABLED";
      value: boolean;
    };
```

Теперь contexts используют единый contract:

```text
Popup
   │
   ├── Message type
   │
   ▼
Service Worker
   │
   ├── Message type
   │
   ▼
Content Script
```

Это особенно важно для больших extensions.

---

# D.50. Context Matrix и testing

Каждый context следует тестировать отдельно.

Например:

```text
Service Worker
    ↓
unit/integration tests

Content Script
    ↓
DOM tests

Popup
    ↓
UI tests

Side Panel
    ↓
UI + integration tests

Full Extension
    ↓
E2E browser tests
```

Нельзя считать extension протестированным только потому, что:

```text
popup.test.ts
```

проходит успешно.

---

# D.51. Context Matrix и debugging

В DevTools также существуют отдельные среды.

Например:

```text
Extension
├── Service Worker DevTools
├── Popup DevTools
├── Side Panel DevTools
├── Options DevTools
└── Content Script / Page DevTools
```

Console output одного context не следует автоматически искать в другом.

Типичная ошибка:

```text
console.log()
```

есть в Service Worker, а разработчик смотрит Console страницы.

---

# D.52. Production Context Map

Для реального проекта полезно иметь отдельную схему:

```text
                    ┌───────────────┐
                    │     Popup     │
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐
                    │    Messaging  │
                    └───────┬───────┘
                            │
                     ┌──────▼──────┐
                     │   Service   │
                     │   Worker    │
                     └──────┬──────┘
                            │
           ┌────────────────┼────────────────┐
           │                │                │
           ▼                ▼                ▼
       Storage            Tabs           Network
                            │
                            ▼
                     ┌────────────┐
                     │   Content  │
                     │   Script   │
                     └─────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ Web Page DOM│
                    └─────────────┘
```

Side Panel и Options подключаются к тому же application runtime:

```text
Side Panel ───────► Service Worker
Options ──────────► Service Worker
```

---

# D.53. Рекомендуемая ответственность Contexts

| Context        | Основная ответственность    |
| -------------- | --------------------------- |
| Service Worker | Orchestration               |
| Content Script | Page integration            |
| Popup          | Quick interaction           |
| Side Panel     | Persistent interaction      |
| Options        | Configuration               |
| Storage        | Persistent state            |
| Page Script    | Website application         |
| MAIN world     | Controlled page integration |
| DevTools       | Developer tooling           |

Это не жёсткие правила платформы, а **архитектурные рекомендации**.

---

# D.54. Anti-pattern: God Context

Плохая архитектура:

```text
Service Worker
   │
   ├── UI
   ├── DOM
   ├── storage
   ├── network
   ├── business logic
   ├── routing
   ├── page manipulation
   └── everything
```

Service Worker физически не может выполнять DOM manipulation web page.

Поэтому такая архитектура приводит к искусственным обходам.

---

# D.55. Anti-pattern: God Content Script

Другая крайность:

```text
Content Script
   │
   ├── DOM
   ├── network
   ├── business logic
   ├── storage
   ├── state
   └── UI
```

Это создаёт:

* сильную связанность с page;
* проблемы с lifecycle;
* сложное тестирование;
* сложную поддержку разных сайтов.

---

# D.56. Anti-pattern: Popup as Application

Ещё одна ошибка:

```text
Popup
   │
   ├── entire state
   ├── network
   ├── business logic
   └── database
```

Popup уничтожается при закрытии.

Поэтому:

```text
Popup
   =
temporary client
```

а не:

```text
Popup
   =
application runtime
```

---

# D.57. Правильная модель

Для большинства сложных extensions:

```text
                 Application
                      │
                Service Worker
                      │
        ┌─────────────┼─────────────┐
        │             │             │
      Popup       Side Panel      Options
        │             │             │
        └─────────────┼─────────────┘
                      │
                  Messaging
                      │
                      ▼
               Content Script
                      │
                      ▼
                    Page
```

---

# D.58. Context Matrix как архитектурный инструмент

Перед реализацией feature полезно составить таблицу:

| Feature             | Context        | API      | State      | Communication |
| ------------------- | -------------- | -------- | ---------- | ------------- |
| Analyze page        | Content Script | DOM      | Temporary  | → SW          |
| Save result         | SW             | Storage  | Persistent | —             |
| Show result         | Side Panel     | DOM      | Shared     | ← SW          |
| Change settings     | Options        | Storage  | Persistent | → SW          |
| Keyboard command    | SW             | Commands | —          | → Content     |
| Modify current page | Content        | DOM      | Local      | ← SW          |

Это позволяет заранее определить:

```text
where code runs
where state lives
how contexts communicate
```

---

# D.59. Полная Extension Context Matrix

Итоговая расширенная таблица:

| Property             | SW |         Popup |       Options |    Side Panel | Content Script |       Page |       MAIN |
| -------------------- | -: | ------------: | ------------: | ------------: | -------------: | ---------: | ---------: |
| DOM                  |  ❌ |             ✅ |             ✅ |             ✅ |              ✅ |          ✅ |          ✅ |
| Extension origin     |  ✅ |             ✅ |             ✅ |             ✅ |              ❌ |          ❌ |          ❌ |
| Page DOM             |  ❌ |             ❌ |             ❌ |             ❌ |              ✅ |          ✅ |          ✅ |
| Page JS globals      |  ❌ |             ❌ |             ❌ |             ❌ |              ❌ |          ✅ |          ✅ |
| Extension APIs       |  ✅ |             ✅ |             ✅ |             ✅ |        Limited |          ❌ |    Limited |
| `chrome.runtime`     |  ✅ |             ✅ |             ✅ |             ✅ |              ✅ |          ❌ |          ❌ |
| `chrome.storage`     |  ✅ |             ✅ |             ✅ |             ✅ |              ✅ |          ❌ |          ❌ |
| `chrome.tabs`        |  ✅ |             ✅ |             ✅ |             ✅ |              ❌ |          ❌ |          ❌ |
| `chrome.scripting`   |  ✅ | API-dependent | API-dependent | API-dependent |              ❌ |          ❌ |          ❌ |
| `fetch()`            |  ✅ |             ✅ |             ✅ |             ✅ |              ✅ |          ✅ |          ✅ |
| Persistent JS memory |  ❌ |             ❌ |             ❌ |             ❌ |              ❌ |          ❌ |          ❌ |
| Long-lived UI        |  ❌ |             ❌ |             ✅ |             ✅ |              ❌ |          ✅ |          ❌ |
| Background events    |  ✅ |             ❌ |             ❌ |             ❌ |              ❌ |          ❌ |          ❌ |
| Page interaction     |  ❌ |             ❌ |             ❌ |             ❌ |              ✅ |          ✅ |          ✅ |
| Message transport    |  ✅ |             ✅ |             ✅ |             ✅ |              ✅ | Via bridge | Via bridge |

`Limited` означает, что доступность API зависит от конкретного API и context; не следует считать весь `chrome.*` namespace доступным из любого execution environment.

---

# D.60. Главная формула Manifest V3

Всё приложение можно свести к следующей модели:

```text
             USER
              │
              ▼
        ┌─────────────┐
        │ UI Contexts │
        │             │
        │ Popup       │
        │ Side Panel  │
        │ Options     │
        └──────┬──────┘
               │
               │ Messaging
               ▼
        ┌─────────────┐
        │   Service   │
        │   Worker    │
        └──────┬──────┘
               │
      ┌────────┼────────┐
      │        │        │
      ▼        ▼        ▼
   Storage    Tabs    Network
               │
               ▼
        ┌─────────────┐
        │   Content   │
        │   Script    │
        └──────┬──────┘
               │
               ▼
          Web Page DOM
```

А security model:

```text
                 Browser
                    │
          ┌─────────┴─────────┐
          │                   │
     Extension Origin     Web Origin
          │                   │
          │                   │
    Extension Contexts    Page Contexts
          │                   │
          └────── Bridge ─────┘
```

---

# D.61. Что необходимо запомнить

Если свести всё приложение к нескольким правилам:

### Правило 1

**Service Worker не является обычным background page.**

```text
Event
  ↓
Worker starts
  ↓
Handle event
  ↓
Worker may stop
```

---

### Правило 2

**Popup — временный context.**

```text
Open
 ↓
Use
 ↓
Close
 ↓
Destroy
```

---

### Правило 3

**Content Script — это не Page Script.**

```text
Same DOM
Different JavaScript world
```

---

### Правило 4

**Page Script не является частью extension runtime.**

```text
Page
  ≠
Extension
```

---

### Правило 5

**Contexts не имеют общего JavaScript state.**

Для обмена используйте:

```text
Messaging
Storage
Ports
```

---

### Правило 6

**Каждый context должен иметь одну понятную ответственность.**

```text
SW       → orchestration
Content  → page integration
Popup    → quick UI
Side     → persistent UI
Options  → configuration
Storage  → persistence
```

---

### Правило 7

**Не передавайте доверие через context boundary.**

Любые данные:

```text
Page
 ↓
Content Script
 ↓
Service Worker
```

должны рассматриваться как потенциально недоверенные и валидироваться.

---

### Правило 8

**Выбирайте context по capability, а не по удобству.**

Не:

> «Я уже нахожусь в popup, поэтому сделаю здесь».

А:

> «Где эта операция архитектурно должна выполняться?»

---

# D.62. Финальная архитектурная модель

Manifest V3 extension лучше всего понимать как **много-контекстную распределённую систему внутри браузера**:

```text
                      EXTENSION
                          │
       ┌──────────────────┼──────────────────┐
       │                  │                  │
       ▼                  ▼                  ▼
   UI Contexts       Background Runtime   Page Runtime
       │                  │                  │
 ┌─────┼─────┐            │                  │
 │     │     │            │                  │
Popup Side  Options       │            Content Script
 │     │     │            │                  │
 └─────┼─────┘            │                  │
       │                  │                  │
       └──────── Messaging ──────────────────┘
                          │
                          ▼
                       Storage
```

Именно эта модель является фундаментом для последующих архитектурных решений.

Когда extension становится большим, вопрос уже не звучит:

> «В какой файл положить этот код?»

Правильный вопрос звучит:

> **«В каком execution context должна выполняться эта операция, кто владеет её состоянием и через какой механизм она взаимодействует с остальными contexts?»**

Это и есть переход от разработки «простого browser extension» к **архитектурному проектированию Manifest V3 applications**.
