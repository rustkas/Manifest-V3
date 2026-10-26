# Приложение J. Production Checklist

Production-ready браузерное расширение — это не просто расширение, которое работает в Developer Mode.

Между состоянием:

```text
"работает у разработчика"
```

и состоянием:

```text
"готово для реальных пользователей"
```

существует существенная разница.

В production extension необходимо проверить не только функциональность, но и:

* Manifest;
* permissions;
* security;
* lifecycle;
* contexts;
* messaging;
* storage;
* network;
* performance;
* error handling;
* compatibility;
* packaging;
* updates;
* privacy;
* distribution.

Это приложение представляет собой итоговый checklist перед публикацией Manifest V3 extension.

---

# J.1. Production Readiness Model

Production readiness удобно рассматривать как несколько независимых уровней:

```text
                    Production Extension
                            │
        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
   Functionality         Security          Reliability
        │                   │                   │
        ↓                   ↓                   ↓
 Performance           Permissions          Lifecycle
        │                   │                   │
        ↓                   ↓                   ↓
 Compatibility       Privacy/Trust       Distribution
```

Расширение считается production-ready только тогда, когда все основные области проверены.

---

# J.2. Project Structure

Перед production release проверьте структуру проекта.

Пример:

```text
extension/
│
├── manifest.json
│
├── src/
│   ├── background/
│   │   └── service-worker.js
│   │
│   ├── content/
│   │   └── content.js
│   │
│   ├── popup/
│   │   ├── index.html
│   │   ├── popup.js
│   │   └── popup.css
│   │
│   ├── options/
│   │   ├── index.html
│   │   ├── options.js
│   │   └── options.css
│   │
│   ├── sidepanel/
│   │   ├── index.html
│   │   ├── panel.js
│   │   └── panel.css
│   │
│   ├── shared/
│   │   ├── messages.js
│   │   ├── constants.js
│   │   └── storage.js
│   │
│   └── assets/
│
├── tests/
│
├── build/
│
└── package.json
```

Проверьте:

* [ ] нет случайных файлов;
* [ ] нет development-only code;
* [ ] нет debug scripts;
* [ ] нет тестовых credentials;
* [ ] нет секретов;
* [ ] production build воспроизводим;
* [ ] структура понятна другому разработчику.

---

# J.3. Manifest Checklist

`manifest.json` является главным контрактом расширения с браузером.

Проверьте:

* [ ] `"manifest_version": 3`;
* [ ] корректный `name`;
* [ ] корректный `version`;
* [ ] понятный `description`;
* [ ] корректные icons;
* [ ] корректный `action`;
* [ ] корректный `background`;
* [ ] permissions минимальны;
* [ ] host permissions минимальны;
* [ ] content scripts ограничены необходимыми страницами;
* [ ] options настроены правильно;
* [ ] side panel настроен правильно;
* [ ] commands настроены правильно;
* [ ] web accessible resources ограничены;
* [ ] CSP соответствует архитектуре;
* [ ] отсутствуют ненужные manifest fields.

---

# J.4. Version

Production version должна быть определена явно:

```json
{
  "manifest_version": 3,
  "name": "Example Extension",
  "version": "1.0.0",
  "description": "Example browser extension"
}
```

Не используйте development identifiers вроде:

```text
0.0.0-dev
test
latest
debug
```

если они не соответствуют вашей release strategy.

Версия должна изменяться контролируемо.

Например:

```text
1.0.0
1.0.1
1.1.0
2.0.0
```

---

# J.5. Permissions Checklist

Permissions должны проходить отдельный security review.

Проверьте каждое permission:

```text
permission
    ↓
Зачем оно нужно?
    ↓
Какой код его использует?
    ↓
Можно ли удалить?
    ↓
Можно ли заменить менее привилегированным API?
```

Для каждого permission должна существовать конкретная причина.

Плохо:

```json
{
  "permissions": [
    "tabs",
    "history",
    "bookmarks",
    "cookies",
    "storage"
  ]
}
```

если реально используется только:

```json
{
  "permissions": [
    "storage"
  ]
}
```

---

# J.6. Host Permissions Checklist

Особое внимание уделяется:

```json
"host_permissions": [...]
```

Проверьте:

* [ ] `<all_urls>` действительно необходим;
* [ ] wildcard patterns минимальны;
* [ ] HTTP access необходим;
* [ ] HTTPS access необходим;
* [ ] не используются лишние домены;
* [ ] permissions соответствуют реальной функциональности.

Предпочтительно:

```json
{
  "host_permissions": [
    "https://example.com/*"
  ]
}
```

вместо:

```json
{
  "host_permissions": [
    "<all_urls>"
  ]
}
```

если функциональность действительно ограничена одним доменом.

---

# J.7. Optional Permissions

Если permission нужен только для отдельной функции, рассмотрите optional permission model.

Например:

```text
Core extension
      │
      ├── basic functionality
      │
      └── advanced feature
              ↓
        request permission
```

Это позволяет:

* уменьшить initial permission surface;
* улучшить UX;
* реализовать capability-based architecture;
* минимизировать доверие, которое требуется от пользователя.

---

# J.8. Security Checklist

Security review должен проходить до публикации.

Проверьте:

* [ ] нет `eval()`;
* [ ] нет `new Function()`;
* [ ] нет remote JavaScript;
* [ ] нет загрузки исполняемого кода с внешнего сервера;
* [ ] нет небезопасного `innerHTML`;
* [ ] пользовательский input sanitised;
* [ ] message payload validation реализована;
* [ ] page data считается untrusted;
* [ ] DOM insertion безопасен;
* [ ] `postMessage` проверяет origin/source;
* [ ] MAIN world используется только при необходимости;
* [ ] sensitive data не передаётся без необходимости;
* [ ] secrets не находятся в extension bundle.

---

# J.9. XSS Checklist

Проверьте все места, где данные превращаются в HTML.

Особенно:

```javascript
element.innerHTML = value;
```

Если `value` происходит от:

* страницы;
* URL;
* query parameters;
* server response;
* user input;
* message;
* storage;

то оно должно считаться потенциально недоверенным.

Предпочитайте:

```javascript
element.textContent = value;
```

или безопасное построение DOM.

---

# J.10. Message Security

Каждый message следует рассматривать как потенциально недоверенный input.

Плохая модель:

```javascript
chrome.runtime.onMessage.addListener((message) => {
    execute(message.command);
});
```

Лучше:

```javascript
chrome.runtime.onMessage.addListener((message) => {
    if (!isValidMessage(message)) {
        return;
    }

    routeMessage(message);
});
```

Проверьте:

* [ ] message type проверяется;
* [ ] payload проверяется;
* [ ] sender проверяется;
* [ ] неожиданные fields не приводят к опасному поведению;
* [ ] privileged operations требуют проверки контекста.

---

# J.11. Content Script Security

Content Script работает рядом с потенциально недоверенной страницей.

Нельзя предполагать:

```text
page == trusted
```

Следует исходить из:

```text
page == untrusted
```

Проверьте:

* [ ] page DOM считается untrusted;
* [ ] page events не считаются trusted commands;
* [ ] данные страницы валидируются;
* [ ] page ↔ extension bridge защищён;
* [ ] privileged operations выполняются в extension context;
* [ ] content script не получает больше прав, чем необходимо.

---

# J.12. Service Worker Checklist

Проверьте:

* [ ] Service Worker зарегистрирован правильно;
* [ ] listeners регистрируются на startup;
* [ ] нет зависимости от постоянного runtime;
* [ ] состояние не хранится только в memory;
* [ ] async operations корректно обрабатываются;
* [ ] ошибки обрабатываются;
* [ ] повторный запуск безопасен;
* [ ] операции идемпотентны;
* [ ] нет бесконечных retry loops;
* [ ] нет ненужных timers.

---

# J.13. Lifecycle Checklist

Каждый context должен быть проверен с учётом его lifecycle.

### Service Worker

```text
start
 ↓
handle event
 ↓
idle
 ↓
terminate
 ↓
restart
```

Проверьте:

* [ ] приложение корректно переживает restart;
* [ ] нет hidden dependency на global state;
* [ ] операции можно безопасно повторить.

### Popup

```text
open
 ↓
interact
 ↓
close
```

Проверьте:

* [ ] закрытие popup не приводит к потере важного состояния;
* [ ] background work не зависит от popup.

### Content Script

Проверьте:

* [ ] корректную работу после navigation;
* [ ] SPA transitions;
* [ ] iframe scenarios;
* [ ] повторную injection;
* [ ] cleanup.

### Side Panel

Проверьте:

* [ ] active tab changes;
* [ ] navigation;
* [ ] context synchronization;
* [ ] reconnect после worker restart.

---

# J.14. Messaging Checklist

Проверьте communication graph:

```text
Popup
  ↕
Service Worker
  ↕
Content Script
  ↕
Page

Side Panel
  ↕
Service Worker

Options
  ↕
Service Worker
```

Для каждого канала определите:

* [ ] кто sender;
* [ ] кто receiver;
* [ ] message schema;
* [ ] error handling;
* [ ] timeout;
* [ ] retry policy;
* [ ] lifecycle;
* [ ] security boundary.

---

# J.15. Message Protocol

Для production extension желательно иметь явный protocol.

Например:

```javascript
{
    type: "GET_SETTINGS",
    requestId: "123"
}
```

Ответ:

```javascript
{
    type: "GET_SETTINGS_RESULT",
    requestId: "123",
    success: true,
    data: {
        enabled: true
    }
}
```

Проверьте:

* [ ] message types документированы;
* [ ] schema определена;
* [ ] versioning предусмотрен;
* [ ] ошибки стандартизированы;
* [ ] request IDs используются там, где необходимы;
* [ ] неизвестные messages корректно отклоняются.

---

# J.16. Storage Checklist

Проверьте:

* [ ] выбран правильный storage area;
* [ ] persistent state отделён от temporary state;
* [ ] quotas учитываются;
* [ ] storage errors обрабатываются;
* [ ] schema state определена;
* [ ] migration strategy существует;
* [ ] corrupt/incompatible state обрабатывается.

---

# J.17. Storage Migration

Если версия приложения меняет schema:

```text
v1
 ↓
v2
 ↓
v3
```

необходимо предусмотреть migration.

Например:

```javascript
{
    schemaVersion: 3,
    settings: {
        enabled: true
    }
}
```

При обновлении:

```text
read state
   ↓
check schemaVersion
   ↓
migrate
   ↓
save new state
```

Не рассчитывайте, что пользователь всегда начинает с чистого storage.

---

# J.18. Network Checklist

Проверьте:

* [ ] все endpoints production;
* [ ] нет localhost URLs;
* [ ] нет test API;
* [ ] нет debug endpoints;
* [ ] HTTPS используется там, где требуется;
* [ ] timeout определён;
* [ ] errors обрабатываются;
* [ ] retries ограничены;
* [ ] authentication работает;
* [ ] credentials не hardcoded;
* [ ] CORS/host permissions проверены.

---

# J.19. Secrets Checklist

Никогда не считайте extension bundle безопасным местом для secret.

Плохо:

```javascript
const API_SECRET = "super-secret-key";
```

В установленном extension код можно исследовать.

Следовательно:

```text
Extension
    ↓
public client
    ↓
backend
    ↓
secret
```

а не:

```text
Extension
    ↓
embedded secret
```

API keys, private keys и server secrets не должны находиться в клиентском bundle, если они действительно являются секретами.

---

# J.20. Privacy Checklist

Перед публикацией определите:

* [ ] какие данные собираются;
* [ ] какие данные отправляются на сервер;
* [ ] зачем они нужны;
* [ ] сколько времени хранятся;
* [ ] где хранятся;
* [ ] передаются ли third parties;
* [ ] можно ли отключить collection;
* [ ] удаляются ли данные по запросу пользователя.

Главный принцип:

> Собирайте только те данные, которые действительно необходимы функциональности.

---

# J.21. Analytics

Analytics должна быть минимальной.

Не следует отправлять:

```text
entire page DOM
full browsing history
complete URLs
user content
```

если это не абсолютно необходимо и не соответствует вашей privacy model.

Предпочтительнее агрегированные события:

```text
extension_opened
feature_enabled
feature_used
error_occurred
```

При этом необходимо учитывать требования магазина, законодательства и собственную privacy policy.

---

# J.22. Performance Checklist

Перед release проверьте:

* [ ] startup time;
* [ ] Service Worker cold start;
* [ ] Content Script overhead;
* [ ] memory usage;
* [ ] CPU usage;
* [ ] DOM performance;
* [ ] message frequency;
* [ ] storage operations;
* [ ] network requests;
* [ ] bundle size.

Особенно важно протестировать extension на:

```text
1 tab
10 tabs
50 tabs
100+ tabs
```

если предполагается соответствующий сценарий использования.

---

# J.23. Multiple Tabs

Расширение может отлично работать с одной вкладкой и плохо — с десятками.

Проверьте:

```text
Tab A
Tab B
Tab C
...
Tab N
```

Проверьте:

* [ ] нет глобального состояния, ошибочно общего для tabs;
* [ ] tab ID используется корректно;
* [ ] listeners не дублируются;
* [ ] state isolation работает;
* [ ] закрытие tab корректно очищает state;
* [ ] navigation не оставляет stale state.

---

# J.24. SPA Checklist

Современные сайты часто являются SPA.

Следовательно:

```text
page load
```

не всегда означает:

```text
new document
```

Проверьте:

* [ ] client-side navigation;
* [ ] `pushState`;
* [ ] `replaceState`;
* [ ] history navigation;
* [ ] dynamic rendering;
* [ ] route changes;
* [ ] повторное появление элементов;
* [ ] удаление элементов.

Content Script должен быть устойчив к динамическому DOM.

---

# J.25. Browser Compatibility

Если extension поддерживает несколько браузеров:

```text
Chrome
Firefox
Edge
...
```

необходимо определить compatibility matrix.

Например:

| Feature        | Chrome | Firefox               | Edge |
| -------------- | ------ | --------------------- | ---- |
| MV3            | ✓      | ✓                     | ✓    |
| Service Worker | ✓      | ✓                     | ✓    |
| Side Panel     | ✓      | зависит от реализации | ✓    |
| DNR            | ✓      | ✓                     | ✓    |
| Commands       | ✓      | ✓                     | ✓    |

Конкретные API и ограничения следует проверять для каждой поддерживаемой версии браузера.

---

# J.26. Browser-specific Code

Не распространяйте browser-specific assumptions по всему приложению.

Плохо:

```javascript
if (browser === "...") {
    // logic
}
```

во множестве файлов.

Лучше:

```text
Application
     ↓
Browser Adapter
     ↓
Chrome / Firefox / Edge
```

Например:

```text
src/
├── platform/
│   ├── chrome.js
│   ├── firefox.js
│   └── index.js
```

Это уменьшает стоимость дальнейшей поддержки.

---

# J.27. Error Handling

Production extension не должен предполагать, что API всегда успешно выполняется.

Проверяйте:

* [ ] permissions могут отсутствовать;
* [ ] tab может быть закрыт;
* [ ] frame может исчезнуть;
* [ ] page может navigate;
* [ ] Service Worker может restart;
* [ ] storage operation может завершиться ошибкой;
* [ ] network request может fail;
* [ ] message receiver может исчезнуть.

---

# J.28. Graceful Degradation

Если capability недоступна, extension должен вести себя предсказуемо.

Например:

```text
Permission available
      ↓
feature enabled
```

и:

```text
Permission unavailable
      ↓
feature disabled
      ↓
explain why
```

а не:

```text
permission error
      ↓
application crash
```

---

# J.29. Retry Policy

Не используйте бесконечный retry:

```text
error
 ↓
retry
 ↓
error
 ↓
retry
 ↓
...
```

Лучше:

```text
attempt 1
   ↓
failure
   ↓
attempt 2
   ↓
failure
   ↓
attempt 3
   ↓
stop
```

Для network operations может использоваться exponential backoff.

---

# J.30. Idempotency

Особенно важна для Service Worker.

Операция:

```text
processEvent()
```

может быть вызвана повторно.

Поэтому желательно проектировать операции так:

```text
same input
    ↓
same logical result
```

или использовать operation IDs:

```javascript
{
    operationId: "abc123"
}
```

чтобы повторная обработка не приводила к двойному эффекту.

---

# J.31. Race Conditions

Проверьте сценарии:

```text
Event A
Event B
```

при которых:

```text
A reads state
B reads state
A writes state
B writes state
```

может привести к потере изменений.

Особенно внимательно проверяйте:

* storage;
* tab state;
* network operations;
* message handling;
* Port connections;
* simultaneous UI operations.

---

# J.32. Cleanup Checklist

Для каждого ресурса должен существовать lifecycle.

Проверьте:

```text
listener
observer
timer
port
cache
DOM node
subscription
request
```

Для каждого ответьте:

> Кто создаёт ресурс и кто его уничтожает?

Например:

```text
create observer
      ↓
page active
      ↓
page context destroyed
      ↓
disconnect observer
```

---

# J.33. Build Checklist

Production build должен отличаться от development build.

Проверьте:

* [ ] minification;
* [ ] tree shaking;
* [ ] dead code elimination;
* [ ] source maps не публикуются без необходимости;
* [ ] debug logging отключён или контролируется;
* [ ] development endpoints удалены;
* [ ] test data удалены;
* [ ] development permissions удалены.

---

# J.34. Environment Configuration

Не смешивайте:

```text
development
staging
production
```

Например:

```text
.env.development
.env.staging
.env.production
```

Однако секреты нельзя считать безопасными только потому, что они находятся в environment variables во время build.

Если значение попадает в extension bundle, оно потенциально доступно пользователю.

---

# J.35. Logging

Production logging должен быть контролируемым.

Вместо:

```javascript
console.log(...)
```

во всех местах используйте logging abstraction:

```javascript
logger.debug(...)
logger.info(...)
logger.warn(...)
logger.error(...)
```

И определите policy:

```text
development
    ↓
verbose logs

production
    ↓
important logs only
```

Не записывайте в logs:

* tokens;
* passwords;
* private data;
* sensitive URLs;
* personal information.

---

# J.36. Observability

Для production полезно иметь возможность ответить:

```text
Что произошло?
Где произошло?
Когда произошло?
В каком context?
Для какой tab?
Почему операция завершилась ошибкой?
```

Например:

```text
ERROR
context: service-worker
operation: syncSettings
tabId: 123
reason: network_timeout
```

Это значительно облегчает debugging.

---

# J.37. Update Safety

Обновление extension не должно ломать существующее состояние.

Проверьте:

* [ ] manifest version обновляется;
* [ ] storage migration работает;
* [ ] старые settings поддерживаются;
* [ ] новые permissions корректно обрабатываются;
* [ ] removed permissions не оставляют broken state;
* [ ] cached data совместимы;
* [ ] Service Worker после update запускается корректно.

---

# J.38. Backward Compatibility

Перед выпуском новой версии проверьте:

```text
old state
    ↓
new code
```

а не только:

```text
new state
    ↓
new code
```

Production users могут обновляться с любой предыдущей поддерживаемой версии.

---

# J.39. Rollback Strategy

Перед release определите:

> Что произойдёт, если новая версия окажется ошибочной?

Возможные меры:

```text
release
 ↓
monitor
 ↓
detect problem
 ↓
stop rollout / publish fix
```

Хорошая release process должна позволять быстро выпустить исправление.

---

# J.40. Store Submission Checklist

Перед публикацией проверьте:

* [ ] название;
* [ ] description;
* [ ] icons;
* [ ] screenshots;
* [ ] promotional materials;
* [ ] privacy information;
* [ ] permission justification;
* [ ] support URL;
* [ ] homepage;
* [ ] version;
* [ ] production package.

Описание должно соответствовать реальному поведению extension.

Не следует заявлять функциональность, которой приложение не имеет.

---

# J.41. Store Review Preparation

Проверьте:

```text
Every permission
      ↓
clear justification
```

и:

```text
Every external service
      ↓
clear purpose
```

Особенно важно, чтобы:

* permissions соответствовали functionality;
* extension не выполнял скрытую активность;
* privacy disclosure соответствовал реальному поведению;
* описание не вводило пользователя в заблуждение.

---

# J.42. Package Inspection

Перед загрузкой production package распакуйте его и проверьте содержимое.

Например:

```text
dist/
├── manifest.json
├── icons/
├── background/
├── content/
├── popup/
└── ...
```

Проверьте:

* [ ] нет `.env`;
* [ ] нет credentials;
* [ ] нет private keys;
* [ ] нет test files;
* [ ] нет screenshots;
* [ ] нет debug artifacts;
* [ ] нет source files, которые не должны распространяться;
* [ ] нет development dependencies.

---

# J.43. Final Security Review

Перед release ответьте на следующие вопросы.

### Permissions

> Есть ли permission, который можно удалить?

### Host access

> Есть ли domain, который можно исключить?

### Content Script

> Может ли page data попасть в privileged operation без validation?

### Messaging

> Может ли недоверенный sender вызвать privileged action?

### MAIN world

> Действительно ли он необходим?

### Remote content

> Не загружается ли executable code с сервера?

### Secrets

> Есть ли секрет в bundle?

### DOM

> Может ли attacker control HTML, который вставляет extension?

Если хотя бы на один вопрос ответ вызывает сомнение, release следует остановить до проведения review.

---

# J.44. Final Performance Review

Проверьте:

```text
CPU
Memory
Startup
DOM
Network
Storage
Messaging
Bundle
```

Особенно:

```text
one tab
10 tabs
50 tabs
100 tabs
```

если это соответствует реальным сценариям использования.

---

# J.45. Final Reliability Review

Сымитируйте:

```text
Service Worker restart
Tab close
Tab reload
Navigation
SPA navigation
Network failure
Storage failure
Permission denial
Permission removal
Browser restart
Extension update
```

После каждого сценария extension должен перейти в корректное состояние.

---

# J.46. Production Smoke Test

Перед публикацией выполните короткий smoke test.

### Installation

* [ ] extension устанавливается;
* [ ] icon отображается;
* [ ] popup открывается;
* [ ] options открываются;
* [ ] side panel открывается.

### Core functionality

* [ ] основная функция работает;
* [ ] content script работает;
* [ ] Service Worker получает events;
* [ ] messaging работает;
* [ ] storage работает.

### Navigation

* [ ] новая tab;
* [ ] reload;
* [ ] navigation;
* [ ] SPA navigation;
* [ ] закрытие tab.

### Restart

* [ ] browser restart;
* [ ] worker restart;
* [ ] extension reload.

### Errors

* [ ] network failure;
* [ ] permission denied;
* [ ] invalid page;
* [ ] unavailable tab.

---

# J.47. Release Checklist

Перед нажатием **Publish**:

```text
[ ] Version updated
[ ] Manifest reviewed
[ ] Permissions reviewed
[ ] Host permissions reviewed
[ ] Security review completed
[ ] Privacy review completed
[ ] Performance tested
[ ] Error handling tested
[ ] Storage migration tested
[ ] Multi-tab tested
[ ] Browser compatibility tested
[ ] Production build created
[ ] Package inspected
[ ] Documentation updated
[ ] Store metadata updated
[ ] Support information available
```

---

# J.48. Post-release Checklist

Работа не заканчивается после публикации.

После release:

```text
Publish
   ↓
Observe
   ↓
Collect errors
   ↓
Analyze feedback
   ↓
Fix
   ↓
Release
```

Проверьте:

* [ ] crashes/errors;
* [ ] user reports;
* [ ] permission complaints;
* [ ] performance complaints;
* [ ] compatibility issues;
* [ ] network failures;
* [ ] storage migration problems.

---

# J.49. Production Architecture Checklist

Итоговая архитектура должна выглядеть примерно так:

```text
                       Browser
                          │
          ┌───────────────┼────────────────┐
          │               │                │
          ↓               ↓                ↓
      Popup          Side Panel         Options
          │               │                │
          └───────────────┼────────────────┘
                          ↓
                   Service Worker
                          │
          ┌───────────────┼────────────────┐
          ↓               ↓                ↓
       Storage          Network         Browser APIs
          │
          ↓
      Persistent State

Content Scripts
       │
       ↓
      DOM
       │
       ↕
     Page
```

Каждая граница должна быть осознанной:

```text
Context
   ↓
Message
   ↓
Validation
   ↓
Operation
   ↓
Result
```

---

# J.50. Production Principles

В production Manifest V3 extension следует придерживаться нескольких фундаментальных принципов.

### 1. Least Privilege

```text
minimum permissions
```

### 2. Event Driven

```text
event → action
```

### 3. Ephemeral Runtime

```text
start → work → idle
```

### 4. Declarative First

```text
browser engine > unnecessary JavaScript
```

### 5. Platform First

```text
Web Platform
     ↓
Extension APIs
     ↓
Application
```

### 6. Explicit Communication

```text
context → message → context
```

### 7. Persistent State

```text
runtime state ≠ persistent state
```

### 8. Fail Gracefully

```text
failure ≠ application crash
```

### 9. Observable Runtime

```text
event → operation → result → diagnostics
```

### 10. Secure by Architecture

Безопасность не должна добавляться в конце проекта.

Она должна быть свойством архитектуры.

---

# J.51. Master Production Checklist

Ниже находится финальный checklist, который можно использовать непосредственно перед release.

## Manifest

* [ ] Manifest V3.
* [ ] Valid JSON.
* [ ] Correct version.
* [ ] Correct metadata.
* [ ] Correct icons.
* [ ] Correct action.
* [ ] Correct background.
* [ ] Correct content scripts.
* [ ] Correct options.
* [ ] Correct side panel.
* [ ] Correct commands.
* [ ] Correct CSP.
* [ ] Correct web accessible resources.

## Permissions

* [ ] Every permission justified.
* [ ] No unnecessary permission.
* [ ] Host permissions minimized.
* [ ] Optional permissions considered.
* [ ] Runtime permission requests tested.
* [ ] Permission-denied path implemented.

## Security

* [ ] No `eval()`.
* [ ] No dynamic executable code.
* [ ] No remote executable JavaScript.
* [ ] No embedded secrets.
* [ ] XSS reviewed.
* [ ] DOM input validated.
* [ ] Messages validated.
* [ ] Sender/context checked.
* [ ] Page treated as untrusted.
* [ ] MAIN world minimized.
* [ ] Bridge secured.

## Runtime

* [ ] Service Worker is event-driven.
* [ ] No permanent background assumptions.
* [ ] Cold start tested.
* [ ] Worker restart tested.
* [ ] State persistence tested.
* [ ] Async operations tested.
* [ ] Errors handled.
* [ ] Retry policy defined.
* [ ] Operations idempotent where necessary.

## Content Scripts

* [ ] Host scope minimized.
* [ ] Injection tested.
* [ ] Dynamic pages tested.
* [ ] SPA tested.
* [ ] iframe behavior tested.
* [ ] DOM observer optimized.
* [ ] No unnecessary polling.
* [ ] Event handlers optimized.

## Communication

* [ ] Message protocol documented.
* [ ] Schemas validated.
* [ ] Errors standardized.
* [ ] Ports cleaned up.
* [ ] Reconnection tested.
* [ ] No message storms.
* [ ] Payloads minimized.

## Storage

* [ ] Storage model documented.
* [ ] Persistent state identified.
* [ ] Ephemeral state identified.
* [ ] Quotas tested.
* [ ] Migration implemented.
* [ ] Corrupt state handled.
* [ ] Writes optimized.

## Network

* [ ] Production endpoints.
* [ ] HTTPS.
* [ ] Authentication tested.
* [ ] Timeout implemented.
* [ ] Retry policy implemented.
* [ ] Caching considered.
* [ ] Errors handled.
* [ ] No secrets in client.

## Performance

* [ ] Bundle inspected.
* [ ] Startup measured.
* [ ] Worker cold start measured.
* [ ] Content Script overhead measured.
* [ ] Memory tested.
* [ ] CPU tested.
* [ ] DOM performance tested.
* [ ] Network usage tested.
* [ ] Storage operations tested.
* [ ] Multi-tab performance tested.

## Compatibility

* [ ] Supported Chrome versions tested.
* [ ] Supported Firefox versions tested.
* [ ] Supported Edge versions tested.
* [ ] Browser-specific differences documented.
* [ ] Unsupported environments handled.

## Distribution

* [ ] Production package generated.
* [ ] Package inspected.
* [ ] Debug code removed.
* [ ] Test files removed.
* [ ] Store metadata completed.
* [ ] Screenshots prepared.
* [ ] Privacy information completed.
* [ ] Support channel available.

## Release

* [ ] Version tagged.
* [ ] Release notes prepared.
* [ ] Migration tested.
* [ ] Smoke test completed.
* [ ] Rollback/fix strategy prepared.
* [ ] Post-release monitoring ready.

---

# J.52. The Final Test

Перед публикацией задайте себе десять вопросов:

**1. Что произойдёт, если Service Worker будет остановлен прямо сейчас?**

**2. Что произойдёт, если пользователь закроет активную вкладку?**

**3. Что произойдёт, если страница перейдёт на другой URL?**

**4. Что произойдёт, если permission будет отклонён?**

**5. Что произойдёт, если network request завершится ошибкой?**

**6. Что произойдёт, если storage содержит старую версию schema?**

**7. Что произойдёт, если пользователь откроет 50 вкладок?**

**8. Может ли веб-страница заставить extension выполнить privileged operation?**

**9. Какие данные extension собирает и действительно ли они необходимы?**

**10. Можно ли удалить ещё один permission, context, dependency или JavaScript execution?**

Если на все десять вопросов есть чёткий ответ, extension находится значительно ближе к production-ready состоянию.

---

# J.53. Итог

Production Manifest V3 extension — это не просто:

```text
manifest.json
+
JavaScript
```

Это система:

```text
                 Production Extension
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
      Security       Reliability      Performance
        │                │                │
        ↓                ↓                ↓
    Permissions       Lifecycle       Runtime
        │                │                │
        └────────────────┼────────────────┘
                         ↓
                    Architecture
                         │
          ┌──────────────┼──────────────┐
          ↓              ↓              ↓
       Contexts       Messaging       Storage
          │              │              │
          └──────────────┼──────────────┘
                         ↓
                   Web Platform
```

Главный принцип production-разработки можно сформулировать так:

> **Production extension должен быть минимально привилегированным, событийным, устойчивым к перезапускам, безопасным при работе с недоверенными страницами, экономным по ресурсам и полностью контролируемым с точки зрения lifecycle.**

И ещё важнее — production quality должна быть **следствием архитектуры**, а не последним этапом перед публикацией:

```text
Platform
   ↓
Architecture
   ↓
Security
   ↓
Lifecycle
   ↓
Performance
   ↓
Testing
   ↓
Distribution
   ↓
Production
```

Именно такой подход превращает Manifest V3 из набора API в **инженерную платформу для создания надёжных browser extensions**.
