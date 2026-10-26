# Приложение K. Manifest V3 Glossary

Это приложение содержит основные термины, используемые при разработке браузерных расширений на базе **Manifest V3**.

Glossary построен от фундаментальных понятий к архитектурным и production-level concepts.

---

# K.1. Browser Extension

**Browser Extension** — программный компонент, который расширяет возможности браузера.

Расширение может:

* изменять содержимое веб-страниц;
* добавлять пользовательский интерфейс;
* взаимодействовать с вкладками и окнами;
* выполнять background operations;
* перехватывать или декларативно изменять network requests;
* хранить настройки и состояние;
* взаимодействовать с Web Platform.

Упрощённая модель:

```text
Browser
   │
   ├── Web Pages
   │
   └── Extension
         ├── UI
         ├── Content Scripts
         ├── Service Worker
         ├── Storage
         └── Extension APIs
```

---

# K.2. Manifest

**Manifest** — JSON-файл, описывающий расширение для браузера.

Обычно файл называется:

```text
manifest.json
```

Он определяет:

* идентичность extension;
* версию;
* permissions;
* host permissions;
* execution contexts;
* background service worker;
* content scripts;
* UI;
* commands;
* security policy;
* declarative capabilities.

Manifest можно рассматривать как **декларативный контракт между extension и browser**.

---

# K.3. Manifest V3

**Manifest V3 (MV3)** — современная модель описания и выполнения browser extensions.

Ключевые характеристики:

```text
Manifest V3
    │
    ├── Service Worker
    ├── Declarative APIs
    ├── Explicit Permissions
    ├── Isolated Content Scripts
    ├── Browser-managed Lifecycle
    └── Restricted Dynamic Code
```

MV3 делает значительную часть поведения расширения декларативной и передаёт управление браузерному runtime.

---

# K.4. `manifest_version`

`manifest_version` — поле manifest, определяющее версию модели extension platform.

Для Manifest V3:

```json
{
  "manifest_version": 3
}
```

Это не версия самого расширения.

Например:

```json
{
  "manifest_version": 3,
  "version": "2.4.1"
}
```

Здесь:

```text
manifest_version = 3
version          = 2.4.1
```

---

# K.5. Extension ID

**Extension ID** — уникальный идентификатор установленного расширения.

Он используется браузером для идентификации extension.

Например:

```text
abcdefghijklmnopabcdefghijklmnop
```

Extension ID отличается от:

```text
name
version
package name
```

и обычно является стабильным идентификатором конкретного extension identity.

---

# K.6. Extension Origin

**Extension origin** — origin, принадлежащий расширению.

У расширения существует собственное пространство:

```text
chrome-extension://<extension-id>/
```

Например:

```text
chrome-extension://abcdefghijklmnop/
```

Это отличает extension resources от обычных веб-ресурсов.

---

# K.7. Extension Context

**Extension context** — отдельный execution environment, в котором выполняется часть extension code.

Основные contexts:

```text
Popup
Options Page
Side Panel
Service Worker
Content Script
DevTools
Extension Pages
```

Каждый context имеет:

* собственный lifecycle;
* собственное JavaScript environment;
* определённый набор APIs;
* собственную ответственность.

---

# K.8. Execution Context

**Execution context** — среда выполнения JavaScript.

Два скрипта могут работать на одной странице, но находиться в разных execution contexts.

Например:

```text
Web Page
   │
   ├── Page JavaScript
   │
   └── Content Script
```

Они могут видеть один DOM, но не обязаны иметь одинаковое JavaScript environment.

---

# K.9. Extension Page

**Extension Page** — HTML-документ, принадлежащий расширению.

Примеры:

* popup;
* options page;
* side panel;
* extension-specific HTML page.

Обычно такие страницы работают в extension origin:

```text
chrome-extension://<id>/...
```

---

# K.10. Service Worker

**Service Worker** — background execution context Manifest V3.

Он заменяет традиционную модель постоянно работающего background page.

Основная модель:

```text
event
  ↓
Service Worker starts
  ↓
handle event
  ↓
idle
  ↓
Service Worker may terminate
```

Поэтому Service Worker нельзя проектировать как постоянно работающий серверный процесс.

---

# K.11. Background Service Worker

**Background Service Worker** — Service Worker, определённый в manifest как background runtime.

Пример:

```json
{
  "background": {
    "service_worker": "background.js"
  }
}
```

Он обычно отвечает за:

* event handling;
* orchestration;
* messaging;
* alarms;
* tabs;
* windows;
* storage;
* network operations;
* coordination между contexts.

---

# K.12. Ephemeral Runtime

**Ephemeral Runtime** — runtime, который существует только пока браузер считает его необходимым.

Service Worker в MV3 является примером ephemeral runtime.

Следовательно:

```text
global variable
```

не является надёжным persistent storage.

Правильная архитектура:

```text
Service Worker
      │
      ↓
Persistent Storage
```

---

# K.13. Cold Start

**Cold Start** — запуск Service Worker после периода отсутствия активного worker instance.

Например:

```text
Worker terminated
      ↓
new event
      ↓
Worker starts
      ↓
listener handles event
```

Production architecture должна учитывать cold starts.

---

# K.14. Suspension

**Suspension** — прекращение активного выполнения runtime после периода бездействия.

Для MV3 важно не рассчитывать на постоянно активный background JavaScript.

---

# K.15. Termination

**Termination** — завершение текущего Service Worker instance браузером.

После termination:

```text
global state
```

может исчезнуть.

Поэтому важное состояние должно храниться вне worker memory.

---

# K.16. Restart

**Restart** — повторный запуск execution context после его завершения.

Service Worker должен быть способен корректно начать работу заново.

---

# K.17. Event-driven Architecture

**Event-driven architecture** — архитектура, в которой execution запускается событиями.

Например:

```text
Command
   ↓
Event
   ↓
Service Worker
   ↓
Action
```

или:

```text
Tab updated
   ↓
Event
   ↓
Handler
   ↓
Update state
```

Это одна из фундаментальных архитектурных моделей MV3.

---

# K.18. Event Listener

**Event Listener** — обработчик события.

Например:

```javascript
chrome.runtime.onMessage.addListener(
  (message) => {
    // handle message
  }
);
```

В MV3 event listeners особенно важны, поскольку Service Worker запускается вокруг событий.

---

# K.19. Content Script

**Content Script** — JavaScript, выполняемый в контексте веб-страницы от имени extension.

Он используется для:

* чтения DOM;
* изменения DOM;
* наблюдения за страницей;
* взаимодействия с page UI;
* обработки событий страницы.

Например:

```text
Extension
   ↓
Content Script
   ↓
Web Page DOM
```

---

# K.20. Content Script Injection

**Content Script Injection** — процесс добавления content script в web page.

Инъекция может быть:

* автоматически определённой через manifest;
* programmatic;
* dynamic.

---

# K.21. Static Content Script

**Static Content Script** — content script, указанный непосредственно в `manifest.json`.

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

---

# K.22. Dynamic Content Script

**Dynamic Content Script** — content script, управление которым осуществляется программно через extension API.

Он позволяет изменять registration без обязательного изменения manifest.

---

# K.23. Programmatic Injection

**Programmatic Injection** — программная инъекция JavaScript или CSS в конкретную tab/frame.

Основной API:

```text
chrome.scripting
```

Например:

```javascript
chrome.scripting.executeScript(...)
```

---

# K.24. Isolated World

**Isolated World** — JavaScript environment, используемый content scripts, изолированный от JavaScript environment самой страницы.

Упрощённо:

```text
                Same DOM
                   │
        ┌──────────┴──────────┐
        ↓                     ↓
 Page JavaScript       Content Script
        │                     │
   Page World          Isolated World
```

Это одна из ключевых security boundaries browser extensions.

---

# K.25. MAIN World

**MAIN world** — execution world самой веб-страницы.

В некоторых сценариях extension может выполнять код в MAIN world.

Но это существенно уменьшает изоляцию между extension code и page JavaScript.

Поэтому MAIN world следует использовать только при необходимости.

---

# K.26. World

**World** — JavaScript execution environment, связанный с конкретным контекстом страницы.

На практике особенно важно различать:

```text
ISOLATED
MAIN
```

---

# K.27. DOM

**DOM (Document Object Model)** — объектное представление HTML-документа.

Content Script может работать с DOM страницы:

```javascript
document.querySelector(...)
```

При этом JavaScript environment content script остаётся изолированным.

---

# K.28. Shadow DOM

**Shadow DOM** — механизм Web Platform для создания изолированного DOM subtree.

Он часто встречается в современных web applications и Web Components.

Для extension developer это означает, что обычный:

```javascript
document.querySelector(...)
```

может не найти элементы, находящиеся внутри Shadow Root.

---

# K.29. SPA

**SPA (Single Page Application)** — web application, которая меняет содержимое страницы без полной browser navigation.

Примеры архитектурных технологий:

```text
React
Vue
Angular
Svelte
```

Для extension это означает, что:

```text
URL change
```

не всегда сопровождается:

```text
document reload
```

---

# K.30. SPA Navigation

**SPA Navigation** — изменение состояния/маршрута приложения без полного создания нового document.

Content Script должен учитывать:

* dynamic rendering;
* route changes;
* DOM replacement;
* history API;
* delayed rendering.

---

# K.31. `action`

`action` — пользовательский entry point extension в browser toolbar.

Он может содержать:

* icon;
* title;
* badge;
* popup.

Например:

```json
{
  "action": {
    "default_popup": "popup.html"
  }
}
```

---

# K.32. Toolbar Button

**Toolbar Button** — визуальный элемент extension в browser toolbar.

Обычно связан с `action`.

---

# K.33. Badge

**Badge** — небольшой текстовый индикатор, отображаемый поверх extension icon.

Например:

```text
┌─────┐
│  12 │
│ EXT │
└─────┘
```

Может использоваться для:

* notification count;
* status;
* unread items;
* progress indicators.

---

# K.34. Popup

**Popup** — небольшой UI, открывающийся при взаимодействии пользователя с extension action.

Popup имеет короткий lifecycle:

```text
open
 ↓
interaction
 ↓
close
```

Поэтому popup не следует использовать как место для длительно выполняющейся background logic.

---

# K.35. Options Page

**Options Page** — UI для настройки extension.

Обычно используется для:

* preferences;
* configuration;
* account settings;
* feature toggles.

---

# K.36. `options_page`

`options_page` — manifest field, указывающий HTML-файл options page.

Пример:

```json
{
  "options_page": "options.html"
}
```

---

# K.37. `options_ui`

`options_ui` — более современный способ описания extension options interface.

Например:

```json
{
  "options_ui": {
    "page": "options.html"
  }
}
```

---

# K.38. Side Panel

**Side Panel** — постоянный или длительно используемый UI extension, расположенный в боковой панели браузера.

Он особенно полезен для приложений, которым требуется:

* постоянный UI;
* работа рядом с web page;
* context-aware interface;
* stateful interaction.

---

# K.39. Side Panel API

**Side Panel API** — API для управления side panel extension.

Конкретные возможности зависят от браузера и его версии.

---

# K.40. Commands

**Commands** — механизм определения keyboard shortcuts для extension.

Например:

```json
{
  "commands": {
    "toggle-feature": {
      "suggested_key": {
        "default": "Ctrl+Shift+Y"
      }
    }
  }
}
```

---

# K.41. Permission

**Permission** — capability, которую extension запрашивает у браузера.

Пример:

```json
{
  "permissions": [
    "storage"
  ]
}
```

Permission определяет доступ extension к определённым browser APIs или возможностям.

---

# K.42. Host Permission

**Host Permission** — разрешение на работу extension с определёнными web origins.

Например:

```json
{
  "host_permissions": [
    "https://example.com/*"
  ]
}
```

Host permission определяет, где extension может получить соответствующие возможности доступа.

---

# K.43. Optional Permission

**Optional Permission** — permission, который extension не требует обязательно при установке.

Он может быть запрошен позже, когда пользователь активирует определённую функцию.

---

# K.44. Runtime Permission

**Runtime Permission** — permission, запрашиваемый extension во время выполнения.

Архитектурно:

```text
User activates feature
        ↓
Extension requests capability
        ↓
Browser asks user
        ↓
Granted / Denied
```

---

# K.45. Least Privilege

**Principle of Least Privilege** — принцип предоставления extension только минимально необходимого набора capabilities.

Вместо:

```text
maximum access
```

следует стремиться к:

```text
minimum required access
```

Это одновременно security и architectural principle.

---

# K.46. Match Pattern

**Match Pattern** — специальный синтаксис для описания web URLs, к которым применяется extension functionality.

Например:

```text
https://example.com/*
```

Match patterns используются, среди прочего, в:

* content scripts;
* host permissions;
* programmatic injection.

---

# K.47. `<all_urls>`

`<all_urls>` — специальный host pattern, предоставляющий широкий доступ к URL.

Он является мощным разрешением и поэтому требует особого внимания при проектировании security model.

---

# K.48. `matches`

`matches` — поле `content_scripts`, определяющее URL patterns, на которых content script должен автоматически запускаться.

Пример:

```json
{
  "matches": [
    "https://example.com/*"
  ]
}
```

---

# K.49. `exclude_matches`

`exclude_matches` — URL patterns, исключающие страницы из автоматической injection.

---

# K.50. `include_globs`

`include_globs` — дополнительный механизм фильтрации URL для content scripts.

---

# K.51. `exclude_globs`

`exclude_globs` — дополнительный механизм исключения URL.

---

# K.52. `run_at`

`run_at` определяет момент запуска content script относительно загрузки страницы.

Типичные значения:

```text
document_start
document_end
document_idle
```

---

# K.53. `all_frames`

`all_frames` определяет, должен ли content script запускаться также во frames страницы.

---

# K.54. `match_about_blank`

`match_about_blank` позволяет content script работать в определённых `about:blank` и связанных сценариях, когда инициирующая страница соответствует match pattern.

---

# K.55. Messaging

**Messaging** — механизм передачи данных между extension contexts.

Основные APIs:

```text
chrome.runtime.sendMessage()
chrome.runtime.onMessage
```

Типичная схема:

```text
Popup
  ↓
Message
  ↓
Service Worker
```

---

# K.56. Message

**Message** — структурированные данные, передаваемые между contexts.

Пример:

```javascript
{
  type: "GET_SETTINGS"
}
```

Production application обычно использует formal message schema.

---

# K.57. Message Protocol

**Message Protocol** — формально определённый набор message types, payloads и правил взаимодействия.

Например:

```text
GET_SETTINGS
UPDATE_SETTINGS
GET_TAB_STATE
ENABLE_FEATURE
DISABLE_FEATURE
```

---

# K.58. Request/Response

**Request/Response** — communication model, в которой один context отправляет запрос, а другой возвращает результат.

```text
Request
   ↓
Receiver
   ↓
Response
```

---

# K.59. Port

**Port** — long-lived communication channel между contexts.

Основной API:

```javascript
chrome.runtime.connect()
```

Port полезен, когда требуется длительное взаимодействие.

---

# K.60. Long-lived Connection

**Long-lived Connection** — communication channel, который сохраняется между несколькими сообщениями.

В отличие от:

```text
sendMessage()
```

Port поддерживает:

```text
connect
  ↓
message
  ↓
message
  ↓
message
  ↓
disconnect
```

---

# K.61. Reconnection

**Reconnection** — восстановление long-lived communication после разрыва connection.

Особенно важно для architecture, взаимодействующей с ephemeral Service Worker.

---

# K.62. Event Bus

**Event Bus** — архитектурный слой для маршрутизации событий между несколькими contexts.

Например:

```text
Popup ─────┐
           │
Panel ─────┼──→ Event Bus → Service Worker
           │
Content ───┘
```

В небольших extension event bus может быть избыточным.

---

# K.63. State

**State** — данные, описывающие текущее состояние extension.

Например:

```javascript
{
  enabled: true,
  activeTab: 123,
  theme: "dark"
}
```

---

# K.64. Local State

**Local State** — состояние, принадлежащее одному execution context.

Например:

```text
Popup state
```

---

# K.65. Shared State

**Shared State** — состояние, используемое несколькими contexts.

Например:

```text
Popup
   ↕
Service Worker
   ↕
Side Panel
```

---

# K.66. Persistent State

**Persistent State** — состояние, которое должно переживать restart/termination runtime.

Обычно хранится через:

```text
chrome.storage
IndexedDB
```

в зависимости от требований.

---

# K.67. Ephemeral State

**Ephemeral State** — временное состояние, которое допустимо потерять после завершения runtime.

Например:

```text
temporary UI state
cache
in-flight state
```

---

# K.68. `chrome.storage`

**`chrome.storage`** — extension storage API.

Основные storage areas:

```text
storage.local
storage.sync
storage.session
storage.managed
```

---

# K.69. `storage.local`

**`storage.local`** — локальное persistent storage extension.

Подходит для:

* settings;
* application state;
* local cache;
* user configuration.

---

# K.70. `storage.sync`

**`storage.sync`** — storage area, предназначенная для синхронизации данных между браузерными профилями в поддерживаемых сценариях.

Она имеет ограничения по объёму и характеру данных.

---

# K.71. `storage.session`

**`storage.session`** — временное storage, связанное с текущей browser session.

Оно полезно для данных, которые не должны сохраняться постоянно.

---

# K.72. `storage.managed`

**`storage.managed`** — storage area для policy-controlled configuration, например в enterprise environments.

Обычно данные управляются администратором.

---

# K.73. Storage Quota

**Storage Quota** — ограничение объёма данных, которое можно хранить в конкретном storage area.

Production application должна учитывать quotas.

---

# K.74. Storage Migration

**Storage Migration** — процесс преобразования старой schema state в новую.

Например:

```text
v1 state
   ↓
migration
   ↓
v2 state
```

Это особенно важно после обновления extension.

---

# K.75. Declarative API

**Declarative API** — API, в котором extension описывает желаемое поведение, а browser выполняет его самостоятельно.

Вместо:

```text
event
 ↓
JavaScript
 ↓
inspect request
 ↓
decision
```

можно использовать:

```text
rules
 ↓
browser engine
 ↓
execution
```

---

# K.76. Imperative API

**Imperative API** — API, в котором extension code явно управляет последовательностью действий.

Например:

```javascript
if (condition) {
    doSomething();
}
```

---

# K.77. Declarative Execution

**Declarative Execution** — выполнение поведения на основе заранее определённых правил.

Это важная концепция MV3.

---

# K.78. Declarative Net Request

**Declarative Net Request (DNR)** — API для декларативного управления network requests.

Основной namespace:

```text
chrome.declarativeNetRequest
```

---

# K.79. Ruleset

**Ruleset** — набор правил DNR.

Условно:

```text
Ruleset
 ├── Rule 1
 ├── Rule 2
 ├── Rule 3
 └── Rule N
```

---

# K.80. Static Rules

**Static Rules** — правила, включённые в extension package.

Они определяются extension developer заранее.

---

# K.81. Dynamic Rules

**Dynamic Rules** — правила, которыми extension может управлять во время выполнения.

Они позволяют менять behaviour без изменения самого extension package.

---

# K.82. Session Rules

**Session Rules** — временные правила, действующие в рамках текущей browser session.

---

# K.83. Rule Matching

**Rule Matching** — процесс определения того, соответствует ли network request условиям конкретного declarative rule.

---

# K.84. Redirect Rule

**Redirect Rule** — DNR rule, изменяющее destination network request.

Условно:

```text
Request A
   ↓
DNR Rule
   ↓
Request B
```

---

# K.85. Blocking Rule

**Blocking Rule** — declarative rule, запрещающее соответствующий network request.

---

# K.86. Header Modification

**Header Modification** — изменение HTTP request/response headers в рамках разрешённых extension capabilities.

---

# K.87. `webRequest`

**`webRequest`** — API для наблюдения за network requests.

В MV3 его возможности в определённых сценариях ограничены по сравнению с прежними моделями расширений, а для многих блокирующих задач используется DNR.

---

# K.88. `declarativeContent`

**`declarativeContent`** — declarative mechanism для определения поведения extension на основании характеристик страницы.

Концептуально:

```text
Page condition
      ↓
Declarative rule
      ↓
Extension action
```

---

# K.89. Browser-controlled Execution

**Browser-controlled execution** — модель, при которой браузер сам управляет выполнением определённых extension capabilities.

Например:

```text
Extension
   ↓
declarative rules
   ↓
Browser engine
```

Это уменьшает необходимость постоянно работающего JavaScript.

---

# K.90. Compile-time Generation

**Compile-time generation** — создание runtime artifacts заранее во время build.

Например:

```text
Application logic
      ↓
Compiler
      ↓
DNR rules
      ↓
Extension
```

Такой подход может уменьшить runtime JavaScript.

---

# K.91. Intermediate Representation

**Intermediate Representation (IR)** — промежуточное представление application logic.

В контексте declarative extensions правила могут рассматриваться как IR между:

```text
Application intent
       ↓
IR / Rules
       ↓
Browser runtime
```

---

# K.92. Web Platform

**Web Platform** — набор стандартных технологий браузера.

В него входят:

* HTML;
* CSS;
* JavaScript;
* DOM;
* Fetch;
* Web Storage;
* IndexedDB;
* Web Workers;
* Web Crypto;
* Web Components;
* ESM;
* другие Web APIs.

Extension APIs дополняют Web Platform, а не заменяют её полностью.

---

# K.93. Extension API

**Extension API** — browser API, предоставляемый специально для extensions.

Примеры:

```text
chrome.tabs
chrome.runtime
chrome.storage
chrome.scripting
chrome.commands
chrome.sidePanel
chrome.declarativeNetRequest
```

---

# K.94. Browser API

**Browser API** — API браузера, доступный Web applications или другим browser contexts.

Например:

```text
fetch()
document
localStorage
IndexedDB
Web Crypto
```

---

# K.95. ESM

**ESM (ECMAScript Modules)** — стандартная система JavaScript modules.

Например:

```javascript
import { foo } from "./foo.js";
```

и:

```javascript
export function foo() {}
```

ESM позволяет строить extension как набор независимых модулей.

---

# K.96. Web Worker

**Web Worker** — Web Platform execution context для выполнения JavaScript вне основного UI thread.

Не следует путать:

```text
Web Worker
```

и:

```text
Extension Service Worker
```

Они имеют разные роли и API.

---

# K.97. Web Crypto

**Web Crypto API** — Web Platform API для криптографических операций.

Например:

```javascript
crypto.subtle
```

Его следует отличать от extension-specific security APIs.

---

# K.98. IndexedDB

**IndexedDB** — встроенное браузерное database API.

Подходит для:

* больших структурированных данных;
* local databases;
* offline state;
* complex caching.

---

# K.99. Fetch

**Fetch API** — Web Platform API для выполнения network requests.

Например:

```javascript
const response = await fetch(url);
```

В extension context его поведение связано с extension origin, permissions и browser security model.

---

# K.100. CORS

**CORS (Cross-Origin Resource Sharing)** — механизм Web Platform, регулирующий cross-origin requests.

Для extension необходимо различать:

```text
page security model
```

и:

```text
extension security model
```

---

# K.101. Cross-Origin Request

**Cross-Origin Request** — network request к origin, отличному от origin текущего execution context.

Например:

```text
Extension
   ↓
https://api.example.com
```

---

# K.102. Cookie

**Cookie** — HTTP state mechanism, используемый web applications.

Extension может взаимодействовать с cookies через соответствующие APIs и permissions, но такой доступ должен рассматриваться как sensitive capability.

---

# K.103. `web_accessible_resources`

`web_accessible_resources` — manifest field, определяющий extension resources, доступные web pages.

Это важная security boundary.

Не следует делать ресурсы публичными без необходимости.

---

# K.104. Content Security Policy

**Content Security Policy (CSP)** — security policy, ограничивающая способы выполнения и загрузки кода.

Для extension CSP является важной частью security architecture.

---

# K.105. `eval()`

`eval()` — JavaScript mechanism для динамического выполнения строки как кода.

В extension contexts MV3 его использование ограничено security model.

Архитектурно следует избегать:

```javascript
eval(code);
```

---

# K.106. Remote Code

**Remote Code** — executable code, загружаемый с внешнего сервера во время работы extension.

Например:

```text
Extension
   ↓
download JavaScript
   ↓
execute
```

Такая модель противоречит ограничениям MV3.

---

# K.107. XSS

**XSS (Cross-Site Scripting)** — класс атак, при котором attacker-controlled data превращаются в исполняемый HTML/JavaScript.

Для extensions особенно важно помнить:

```text
web page = untrusted input
```

---

# K.108. Trust Boundary

**Trust Boundary** — граница между execution environments с различным уровнем доверия.

Пример:

```text
Web Page
   │
   │ trust boundary
   ↓
Content Script
   │
   │ trust boundary
   ↓
Service Worker
```

Каждая граница должна иметь explicit validation.

---

# K.109. Untrusted Input

**Untrusted Input** — данные, которым нельзя автоматически доверять.

Источники:

* page DOM;
* URL;
* user input;
* network;
* messages;
* external APIs;
* storage.

---

# K.110. Bridge

**Bridge** — механизм communication между page JavaScript и extension contexts.

Типичная архитектура:

```text
Page
 ↓
postMessage
 ↓
Content Script
 ↓
runtime.sendMessage
 ↓
Service Worker
```

---

# K.111. `window.postMessage()`

**`window.postMessage()`** — Web Platform API для передачи сообщений между window contexts.

Он часто используется как часть page ↔ content-script bridge.

---

# K.112. Sender Validation

**Sender Validation** — проверка источника message.

Пример концепции:

```text
message
   ↓
who sent it?
   ↓
is sender allowed?
   ↓
validate payload
   ↓
execute
```

---

# K.113. Context Coordination

**Context Coordination** — организация взаимодействия между несколькими extension contexts.

Например:

```text
Popup
  ↕
Service Worker
  ↕
Content Script
  ↕
Page
```

---

# K.114. Distributed Extension

**Distributed Extension** — extension, архитектура которого напоминает distributed system.

Причина:

```text
multiple contexts
+
independent lifecycle
+
message passing
+
state synchronization
+
failure boundaries
```

---

# K.115. Failure Boundary

**Failure Boundary** — граница, за которой сбой одного компонента не должен разрушать остальные компоненты.

Например:

```text
Popup failure
     ↓
Service Worker continues
```

или:

```text
Content Script failure
     ↓
Other tabs continue
```

---

# K.116. Eventual Consistency

**Eventual Consistency** — модель, при которой разные contexts могут временно иметь различное состояние, но после обработки событий приходят к согласованному состоянию.

Например:

```text
Popup
 enabled = true

Side Panel
 enabled = false

        ↓ sync

Popup
 enabled = true

Side Panel
 enabled = true
```

---

# K.117. Idempotency

**Idempotency** — свойство операции, при котором повторное выполнение не создаёт нежелательный дополнительный эффект.

Особенно важно для:

* Service Worker;
* retries;
* message processing;
* network operations;
* state synchronization.

---

# K.118. Race Condition

**Race Condition** — ошибка, возникающая, когда результат зависит от порядка выполнения нескольких concurrent operations.

Например:

```text
A reads state
B reads state
A writes state
B writes state
```

B может случайно затереть изменения A.

---

# K.119. Distributed UI

**Distributed UI** — пользовательский интерфейс, состоящий из нескольких independent UI contexts.

Например:

```text
Popup
Side Panel
Options
Content UI
```

Все они могут представлять одно приложение, но имеют разные lifecycle.

---

# K.120. Runtime

**Runtime** — среда выполнения extension.

В MV3 runtime состоит не из одного постоянно работающего процесса, а из нескольких contexts.

```text
Extension Runtime
├── Service Worker
├── Content Scripts
├── Popup
├── Options
├── Side Panel
└── DevTools
```

---

# K.121. Runtime Lifecycle

**Runtime Lifecycle** — жизненный цикл execution context.

Для Service Worker:

```text
start
 ↓
event handling
 ↓
idle
 ↓
termination
 ↓
restart
```

---

# K.122. Browser-managed Lifecycle

**Browser-managed Lifecycle** — модель, при которой браузер контролирует создание, остановку и возобновление extension execution contexts.

Разработчик должен проектировать extension с учётом этого lifecycle.

---

# K.123. Storage Synchronization

**Storage Synchronization** — механизм согласования state между contexts через persistent storage.

Например:

```text
Options
   ↓
storage.local
   ↓
Service Worker
   ↓
Side Panel
```

---

# K.124. Permission Model

**Permission Model** — система capabilities, определяющая, к каким browser resources и APIs может получить доступ extension.

Основные элементы:

```text
permissions
host_permissions
optional permissions
runtime permissions
```

---

# K.125. Capability

**Capability** — конкретная возможность, предоставленная extension.

Например:

```text
storage
tabs
scripting
host access
notifications
```

Capability-based architecture строит приложение вокруг явно предоставленных возможностей.

---

# K.126. Capability-based Architecture

**Capability-based Architecture** — архитектура, в которой каждый компонент получает только необходимые ему capabilities.

Например:

```text
Content Script
    ↓
DOM access

Service Worker
    ↓
Storage + Tabs

Popup
    ↓
UI + Messaging
```

Вместо предоставления максимальных прав всем contexts.

---

# K.127. Platform-first

**Platform-first** — архитектурный принцип, согласно которому разработчик сначала использует возможности Web Platform и Extension Platform, а собственный runtime добавляет только необходимые abstractions.

Модель:

```text
Web Platform
      ↓
Extension Platform
      ↓
Application Framework
      ↓
Application
```

---

# K.128. Progressive Enhancement

**Progressive Enhancement** — принцип, при котором application использует базовые возможности платформы и добавляет дополнительные capabilities при их доступности.

Для extensions это может означать:

```text
Basic Web Functionality
        ↓
Extension Enhancement
        ↓
Advanced Browser Capabilities
```

---

# K.129. Browser Engine

**Browser Engine** — часть браузера, отвечающая за выполнение web platform и browser functionality.

В declarative architecture extension может передавать browser engine правила, вместо постоянного исполнения собственного JavaScript.

---

# K.130. Runtime JavaScript

**Runtime JavaScript** — JavaScript, который выполняется во время работы extension.

Одна из тенденций MV3:

```text
less runtime JavaScript
+
more browser-managed execution
```

---

# K.131. Compile-time Extension

**Compile-time Extension** — архитектурная модель, при которой значительная часть extension logic преобразуется в runtime artifacts во время build.

Например:

```text
Developer API
      ↓
Compiler
      ↓
Manifest
Rules
Scripts
Resources
      ↓
Browser
```

---

# K.132. Extension Framework

**Extension Framework** — программный framework, упрощающий создание browser extensions.

Он может предоставлять:

* routing;
* state management;
* typed messaging;
* build system;
* manifest generation;
* permission abstraction;
* storage abstraction;
* testing utilities;
* declarative rule generation.

---

# K.133. Runtime Abstraction

**Runtime Abstraction** — слой, скрывающий низкоуровневые browser APIs.

Например:

```text
Application
     ↓
Extension Runtime
     ↓
chrome.* APIs
```

---

# K.134. Browser API Abstraction

**Browser API Abstraction** — адаптер, скрывающий различия между браузерами.

Например:

```text
Application
     ↓
Browser Adapter
     ↓
Chrome / Firefox / Edge
```

---

# K.135. Storage Abstraction

**Storage Abstraction** — единый application-level интерфейс над конкретными storage APIs.

Например:

```javascript
await settings.get("theme");
await settings.set("theme", "dark");
```

вместо прямого использования storage API во всём приложении.

---

# K.136. Error Boundary

**Error Boundary** — архитектурная граница, внутри которой ошибка должна быть обработана и не распространяться дальше.

Например:

```text
Network Layer
      ↓
Error Boundary
      ↓
Application
```

---

# K.137. Observability

**Observability** — способность понять внутреннее состояние runtime по его внешним событиям, логам и диагностике.

Для extension особенно полезно наблюдать:

```text
context
event
message
operation
error
tab
timing
```

---

# K.138. Production Build

**Production Build** — оптимизированная версия extension, предназначенная для реальных пользователей.

Обычно включает:

* bundled code;
* minification;
* tree shaking;
* production configuration;
* отсутствие debug code;
* production endpoints.

---

# K.139. Development Mode

**Development Mode** — режим браузера, позволяющий устанавливать и тестировать extension локально.

Он используется во время разработки и debugging.

---

# K.140. Reload Extension

**Reload Extension** — повторная загрузка установленного unpacked extension после изменения файлов.

Используется в development workflow.

---

# K.141. Inspect

**Inspect** — открытие DevTools для конкретного extension context.

Например:

```text
Service Worker
Popup
Side Panel
Content Script
```

Каждый context может иметь собственную DevTools environment.

---

# K.142. Unpacked Extension

**Unpacked Extension** — extension, загруженный непосредственно из директории проекта без production packaging.

Основной сценарий:

```text
Development
   ↓
Load unpacked
   ↓
Browser
```

---

# K.143. Packaging

**Packaging** — подготовка extension к distribution.

Включает:

```text
source
 ↓
build
 ↓
package
 ↓
store / distribution
```

---

# K.144. Distribution

**Distribution** — доставка extension пользователям.

Возможные модели:

* browser stores;
* enterprise deployment;
* internal distribution;
* development installation.

---

# K.145. Extension Update

**Extension Update** — установка новой версии уже установленного extension.

При update необходимо учитывать:

```text
new code
+
old state
+
new permissions
+
migration
```

---

# K.146. Migration

**Migration** — изменение существующих данных или конфигурации для совместимости с новой версией extension.

Например:

```text
Extension v1
      ↓
Migration
      ↓
Extension v2
```

---

# K.147. Smoke Test

**Smoke Test** — минимальный набор тестов, подтверждающий, что основные функции extension работают после build/release.

Обычно проверяются:

* installation;
* startup;
* action;
* popup;
* content script;
* Service Worker;
* messaging;
* storage;
* основной пользовательский сценарий.

---

# K.148. End-to-End Test

**End-to-End Test (E2E)** — тест, проверяющий полный пользовательский сценарий.

Например:

```text
Install
 ↓
Open website
 ↓
Click extension
 ↓
Change setting
 ↓
Content Script reacts
 ↓
State persists
```

---

# K.149. Browser Automation

**Browser Automation** — управление браузером программно для автоматизированного тестирования.

Часто используется для проверки:

* extension installation;
* tabs;
* popup;
* content scripts;
* navigation;
* user interactions.

---

# K.150. Performance Budget

**Performance Budget** — заранее определённые ограничения на ресурсы extension.

Например:

```text
Startup < X ms
Memory < Y MB
Bundle < Z KB
```

Это позволяет сделать performance измеримым архитектурным требованием.

---

# K.151. Security Surface

**Security Surface** — совокупность всех возможностей, через которые extension может быть атакован или получить доступ к sensitive resources.

Она включает:

```text
Permissions
Host access
Messages
DOM
Network
Storage
MAIN world
Web accessible resources
```

Чем меньше ненужной security surface, тем проще защита extension.

---

# K.152. Attack Surface

**Attack Surface** — все точки входа, через которые attacker может взаимодействовать с системой.

Для extension это могут быть:

```text
Web Page
 ↓
Content Script
 ↓
Message
 ↓
Service Worker
 ↓
Privileged API
```

Каждая граница должна рассматриваться как потенциальная attack surface.

---

# K.153. Privileged Context

**Privileged Context** — execution context, обладающий capabilities, недоступными обычной web page.

Например:

```text
Service Worker
```

может выполнять операции, недоступные обычному page JavaScript.

---

# K.154. Unprivileged Context

**Unprivileged Context** — context с ограниченным набором возможностей.

Web page обычно обладает существенно меньшими extension privileges.

---

# K.155. Trust Model

**Trust Model** — формальное представление того, кому extension доверяет и какие данные считает недоверенными.

Пример:

```text
Browser
   ↓ trusted

Extension Service Worker
   ↓ trusted

Content Script
   ↓ partially trusted

Web Page
   ↓ untrusted
```

Это не означает, что все extension contexts автоматически безопасны. Каждый boundary должен быть проверен.

---

# K.156. Context Matrix

**Context Matrix** — таблица, показывающая:

* какие APIs доступны;
* какой lifecycle;
* какой DOM;
* какой world;
* какие permissions;
* как context взаимодействует с другими contexts.

Это один из наиболее полезных инструментов проектирования сложного extension.

---

# K.157. Extension Orchestrator

**Extension Orchestrator** — архитектурный компонент, координирующий выполнение различных extension contexts.

В MV3 эту роль часто выполняет Service Worker.

Например:

```text
Popup
   │
Side Panel
   │
Options
   │
Content Script
   │
   └──────→ Service Worker
               │
        ┌──────┼──────┐
        ↓      ↓      ↓
      State  Tabs   Network
```

---

# K.158. Extension Runtime Kernel

**Extension Runtime Kernel** — условное архитектурное название минимального слоя, объединяющего:

```text
Messaging
Storage
Lifecycle
Permissions
Events
Browser APIs
```

Такой слой особенно полезен при создании собственного extension framework.

---

# K.159. Application Context

**Application Context** — логическое состояние конкретной части extension application.

Например:

```text
Tab Context
User Context
UI Context
Session Context
```

Это application-level abstraction, а не обязательно отдельный browser execution context.

---

# K.160. Tab Context

**Tab Context** — состояние extension, связанное с конкретной browser tab.

Например:

```javascript
{
  tabId: 123,
  enabled: true,
  pageState: "ready"
}
```

При multi-tab architecture важно не смешивать состояния разных tabs.

---

# K.161. Context Lifecycle

**Context Lifecycle** — полный жизненный цикл конкретного execution context:

```text
create
 ↓
initialize
 ↓
active
 ↓
idle
 ↓
destroy
```

Разные contexts имеют разные lifecycle.

---

# K.162. Declarative Runtime

**Declarative Runtime** — runtime model, в которой значительная часть поведения представлена правилами, а не постоянно работающим JavaScript.

Например:

```text
Rules
 ↓
Browser
 ↓
Execution
```

---

# K.163. Imperative Runtime

**Imperative Runtime** — runtime, где JavaScript постоянно принимает решения и управляет execution.

Например:

```text
Event
 ↓
JavaScript
 ↓
Decision
 ↓
Action
```

---

# K.164. Browser-managed State

**Browser-managed State** — состояние или поведение, которое контролируется браузером вместо extension JavaScript.

Declarative APIs являются одним из механизмов передачи ответственности браузеру.

---

# K.165. Platform-first Architecture

**Platform-first Architecture** — архитектура, в которой собственный runtime минимален, а основная работа передаётся:

```text
Web Platform
+
Extension Platform
+
Browser Engine
```

Только отсутствующая функциональность реализуется собственным JavaScript.

---

# K.166. Manifest as Architecture

В MV3 `manifest.json` следует рассматривать не только как configuration file.

Он является частью архитектуры.

Например:

```text
manifest
   │
   ├── permissions
   ├── contexts
   ├── entry points
   ├── host access
   ├── security policy
   └── declarative capabilities
```

Поэтому изменение manifest может быть архитектурным изменением, а не просто configuration change.

---

# K.167. Extension Capability Graph

**Extension Capability Graph** — граф capabilities, доступных различным contexts.

Например:

```text
                 Extension
                     │
          ┌──────────┼──────────┐
          ↓          ↓          ↓
       Popup       Worker    Content
          │          │          │
          ↓          ↓          ↓
         UI      Storage      DOM
                    │
                    ↓
                  Tabs
```

Такой граф помогает определить, где должна выполняться каждая операция.

---

# K.168. Permission Surface

**Permission Surface** — совокупность всех permissions и host permissions extension.

Production architecture должна стремиться уменьшать permission surface.

---

# K.169. Runtime Surface

**Runtime Surface** — совокупность JavaScript execution contexts, которые extension использует во время работы.

Например:

```text
Popup
Content Script
Service Worker
Side Panel
Options
```

Чем больше contexts, тем сложнее:

* lifecycle;
* messaging;
* state synchronization;
* testing;
* debugging.

Поэтому каждый context должен иметь конкретную архитектурную причину существования.

---

# K.170. Final Mental Model

Весь Manifest V3 удобно свести к одной модели:

```text
                       Browser
                          │
              ┌───────────┴───────────┐
              │                       │
        Web Platform            Extension Platform
              │                       │
       ┌──────┼──────┐         ┌──────┼─────────┐
       ↓      ↓      ↓         ↓      ↓         ↓
      DOM    Fetch  ESM      APIs  Permissions  Events
       │                       │
       └───────────┬───────────┘
                   ↓
              Extension
                   │
       ┌───────────┼───────────┐
       ↓           ↓           ↓
    Contexts    Messaging    Storage
       │           │           │
       └───────────┼───────────┘
                   ↓
              Application
                   │
                   ↓
              User Experience
```

Главная идея Manifest V3 заключается не в том, что разработчик получает ещё один набор JavaScript API.

Более точная модель:

> **Manifest V3 — это capability-based, event-driven и increasingly declarative execution model поверх Web Platform, в которой браузер управляет значительной частью lifecycle и выполнения extension.**

Поэтому при проектировании современного extension полезно мыслить не так:

```text
"Какой JavaScript мне нужно запустить?"
```

а так:

```text
"Какую capability мне необходимо предоставить?"
            ↓
"Какой context должен её получить?"
            ↓
"Можно ли выразить поведение декларативно?"
            ↓
"Что должен делать browser?"
            ↓
"Какой минимальный JavaScript действительно остаётся?"
```

Это и есть наиболее полезная mental model для перехода от простых Manifest V3 examples к **production-grade extension architecture**.
