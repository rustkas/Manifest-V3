# Приложение E. Chrome Extension APIs

Chrome Extension APIs — это специальный программный слой браузера, который расширяет возможности обычной Web Platform.

Если Web Platform предоставляет:

```text
HTML
CSS
DOM
JavaScript
Fetch
Web Crypto
IndexedDB
Web Workers
Web Components
```

то Extension Platform добавляет:

```text
chrome.runtime
chrome.storage
chrome.tabs
chrome.scripting
chrome.permissions
chrome.commands
chrome.alarms
chrome.windows
chrome.sidePanel
chrome.action
chrome.declarativeNetRequest
...
```

Главная идея:

> **Chrome Extension API — это capability layer, через который расширение получает контролируемый доступ к возможностям браузера.**

При этом наличие API ещё не означает, что конкретный context может его использовать. Доступ зависит от **execution context**, permissions и других ограничений.

---

# E.1. Web Platform vs Extension Platform

Полезно разделять две группы API.

## Web Platform

```text
Browser
   │
   └── Web Platform
        ├── DOM
        ├── Fetch
        ├── Web Crypto
        ├── IndexedDB
        ├── Web Components
        └── Workers
```

## Extension Platform

```text
Browser
   │
   └── Extension Platform
        ├── runtime
        ├── storage
        ├── tabs
        ├── scripting
        ├── permissions
        ├── commands
        ├── alarms
        ├── action
        ├── sidePanel
        └── declarativeNetRequest
```

Extension development возникает на пересечении этих двух платформ.

---

# E.2. `chrome.*` и `browser.*`

В Chrome основным namespace является:

```javascript
chrome.*
```

Например:

```javascript
chrome.storage.local.get();
```

```javascript
chrome.tabs.query();
```

```javascript
chrome.runtime.sendMessage();
```

В некоторых других браузерах используется WebExtensions API с namespace:

```javascript
browser.*
```

Например:

```javascript
browser.storage.local.get();
```

Концептуально:

```text
WebExtensions API
       │
       ├── Chrome → chrome.*
       │
       └── Firefox → browser.*
```

Однако конкретные API и их поведение могут отличаться между браузерами.

---

# E.3. Основные категории API

Chrome Extension APIs удобно разделить на несколько больших групп:

```text
chrome.*
│
├── Runtime
├── Storage
├── Tabs
├── Windows
├── Scripting
├── Permissions
├── Action
├── Commands
├── Alarms
├── Side Panel
├── Context Menus
├── Notifications
├── Cookies
├── Web Navigation
├── Web Request
├── Declarative Net Request
├── Declarative Content
├── Bookmarks
├── History
├── Downloads
├── Sessions
├── Management
├── Identity
├── Offscreen
└── Debugger
```

Не все API одинаково важны.

Для большинства современных MV3 extensions ядро выглядит примерно так:

```text
runtime
storage
tabs
scripting
permissions
action
commands
alarms
```

а затем добавляются специализированные API.

---

# E.4. API Context Matrix

Нельзя использовать следующую модель:

```text
chrome API
    ↓
доступно везде
```

Правильная модель:

```text
API
 │
 ├── Context availability
 ├── Permission requirements
 ├── Host permissions
 ├── Browser restrictions
 └── Lifecycle restrictions
```

Упрощённо:

| API                     | SW | Popup | Options | Side Panel | Content Script |
| ----------------------- | -: | ----: | ------: | ---------: | -------------: |
| `runtime`               |  ✅ |     ✅ |       ✅ |          ✅ |              ✅ |
| `storage`               |  ✅ |     ✅ |       ✅ |          ✅ |              ✅ |
| `tabs`                  |  ✅ |     ✅ |       ✅ |          ✅ |              ❌ |
| `scripting`             |  ✅ |     ✅ |       ✅ |          ✅ |              ❌ |
| `alarms`                |  ✅ |     ✅ |       ✅ |          ✅ |              ❌ |
| `commands`              |  ✅ |     — |       — |          — |              — |
| `action`                |  ✅ |     — |       — |          — |              — |
| `sidePanel`             |  ✅ |     — |       — |          — |              — |
| `permissions`           |  ✅ |     ✅ |       ✅ |          ✅ |              — |
| `declarativeNetRequest` |  ✅ |     — |       — |          — |              — |

`—` означает, что API обычно не является API, который непосредственно вызывается из данного context.

Точную доступность всегда необходимо проверять в документации конкретного API.

---

# E.5. `chrome.runtime`

`chrome.runtime` — один из фундаментальных API всего extension runtime.

Он отвечает за:

* messaging;
* получение extension ID;
* lifecycle events;
* runtime information;
* URL ресурсов extension;
* установку/обновление;
* long-lived connections.

Пример:

```javascript
const id = chrome.runtime.id;

console.log(id);
```

---

# E.6. `runtime.sendMessage()`

Одно из наиболее часто используемых API:

```javascript
await chrome.runtime.sendMessage({
  type: "GET_SETTINGS"
});
```

Получатель:

```javascript
chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    if (message.type === "GET_SETTINGS") {
      sendResponse({
        theme: "dark"
      });
    }
  }
);
```

Архитектурная модель:

```text
Client Context
      │
      │ message
      ▼
Service Worker
      │
      │ result
      ▼
Client Context
```

---

# E.7. `runtime.connect()`

Для long-lived communication используется:

```javascript
const port = chrome.runtime.connect({
  name: "analysis"
});
```

После этого можно отправлять несколько сообщений:

```javascript
port.postMessage({
  type: "START"
});
```

и:

```javascript
port.postMessage({
  type: "PROGRESS",
  value: 50
});
```

Это особенно полезно для:

* streaming;
* progress updates;
* interactive sessions;
* long-lived communication.

---

# E.8. `runtime.getURL()`

Позволяет получить URL ресурса extension:

```javascript
const url = chrome.runtime.getURL(
  "assets/icon.png"
);
```

Например:

```text
chrome-extension://<id>/assets/icon.png
```

Это предпочтительнее ручного построения extension URLs.

---

# E.9. `chrome.storage`

`chrome.storage` — основной механизм хранения данных extension.

Основные storage areas:

```text
storage.local
storage.sync
storage.session
storage.managed
```

Пример:

```javascript
await chrome.storage.local.set({
  enabled: true
});
```

Получение:

```javascript
const result =
  await chrome.storage.local.get("enabled");
```

---

# E.10. `storage.local`

Используется для локального persistent state:

```text
Extension
   │
   ▼
storage.local
```

Подходит для:

* application settings;
* cache;
* user preferences;
* local application state.

Пример:

```javascript
await chrome.storage.local.set({
  settings: {
    theme: "dark",
    enabled: true
  }
});
```

---

# E.11. `storage.sync`

`storage.sync` предназначен для синхронизации небольших пользовательских настроек между browser profiles, где такая синхронизация поддерживается.

Например:

```javascript
await chrome.storage.sync.set({
  theme: "dark"
});
```

Не следует использовать его как:

```text
database
```

или:

```text
large application storage
```

У storage areas есть quotas и ограничения.

---

# E.12. `storage.session`

`storage.session` предназначен для временного состояния, которое должно быть доступно нескольким contexts extension, но не является обычным persistent storage.

Архитектурно:

```text
Application
     │
     ├── persistent state
     │       ↓
     │   storage.local
     │
     └── ephemeral shared state
             ↓
         storage.session
```

Это особенно интересно для MV3, поскольку Service Worker сам по себе не предоставляет надёжную долгоживущую память.

---

# E.13. `storage.managed`

`storage.managed` предназначен прежде всего для политик, управляемых администраторами.

Например:

```text
Enterprise Administrator
          │
          ▼
   Managed Settings
          │
          ▼
       Extension
```

Это позволяет enterprise deployment централизованно задавать настройки.

---

# E.14. `chrome.tabs`

`chrome.tabs` предоставляет доступ к browser tabs.

Типичные операции:

```javascript
chrome.tabs.query()
```

```javascript
chrome.tabs.get()
```

```javascript
chrome.tabs.update()
```

```javascript
chrome.tabs.create()
```

```javascript
chrome.tabs.remove()
```

Например:

```javascript
const tabs = await chrome.tabs.query({
  active: true,
  currentWindow: true
});
```

---

# E.15. Active Tab

Один из наиболее распространённых сценариев:

```javascript
const [tab] = await chrome.tabs.query({
  active: true,
  currentWindow: true
});
```

После этого можно получить:

```javascript
tab.id
tab.url
tab.title
```

Однако доступ к URL и возможность взаимодействия со страницей зависят от permissions и конкретного API.

---

# E.16. Tab Lifecycle

`tabs` API используется совместно с events.

Например:

```javascript
chrome.tabs.onCreated.addListener(tab => {
  console.log("Created:", tab.id);
});
```

или:

```javascript
chrome.tabs.onUpdated.addListener(
  (tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete") {
      // ...
    }
  }
);
```

Архитектурно:

```text
Browser
   │
   ├── tab created
   ├── navigation
   ├── loading
   ├── activated
   └── removed
          │
          ▼
    Service Worker
```

---

# E.17. `chrome.windows`

`chrome.windows` работает с browser windows.

Например:

```javascript
const windows =
  await chrome.windows.getAll();
```

Можно получать:

* window ID;
* tabs;
* focused state;
* window type;
* dimensions;
* position.

Это особенно важно для extensions, управляющих browser workspace.

---

# E.18. `chrome.scripting`

`chrome.scripting` — основной современный API для programmatic injection.

Например:

```javascript
await chrome.scripting.executeScript({
  target: {
    tabId
  },
  files: ["content.js"]
});
```

Или function injection:

```javascript
await chrome.scripting.executeScript({
  target: {
    tabId
  },
  func: () => {
    document.body.dataset.extension = "active";
  }
});
```

---

# E.19. Почему `scripting` важен

В MV3 программная инъекция строится вокруг:

```text
chrome.scripting
```

а не вокруг старых подходов MV2.

Архитектура:

```text
Service Worker
      │
      │ executeScript()
      ▼
Target Tab
      │
      ▼
Content execution
```

---

# E.20. `chrome.permissions`

Permissions API позволяет extension проверять и динамически запрашивать разрешения.

Например:

```javascript
const granted =
  await chrome.permissions.contains({
    permissions: ["tabs"]
  });
```

Можно запросить:

```javascript
const granted =
  await chrome.permissions.request({
    permissions: ["tabs"]
  });
```

Это позволяет реализовать capability-based UX:

```text
Feature
   │
   ▼
Need capability?
   │
   ▼
Request permission
   │
   ├── granted
   └── denied
```

---

# E.21. Permissions как capabilities

В современной архитектуре permission следует рассматривать не просто как настройку manifest.

Это:

```text
Capability
```

Например:

```text
tabs
 ↓
ability to use specific tabs-related capabilities
```

или:

```text
host permission
 ↓
ability to interact with specific web origins
```

Следовательно:

```text
Feature
  ↓
Capability
  ↓
Permission
  ↓
API
```

---

# E.22. `chrome.action`

`chrome.action` управляет toolbar action extension.

Возможности включают:

* icon;
* title;
* badge;
* popup;
* enabled/disabled state;
* tab-specific state.

Например:

```javascript
await chrome.action.setBadgeText({
  text: "3"
});
```

---

# E.23. Badge

Badge позволяет показать небольшое состояние непосредственно на toolbar icon.

Например:

```text
┌──────┐
│  🔧  │
│   3  │
└──────┘
```

Пример:

```javascript
chrome.action.setBadgeText({
  text: "3"
});
```

Badge хорошо подходит для:

* counters;
* notifications;
* status;
* number of detected items.

---

# E.24. `chrome.commands`

Commands позволяет связывать keyboard shortcuts с extension actions.

Manifest:

```json
{
  "commands": {
    "analyze-page": {
      "suggested_key": {
        "default": "Ctrl+Shift+A"
      },
      "description": "Analyze current page"
    }
  }
}
```

Handler:

```javascript
chrome.commands.onCommand.addListener(
  async command => {
    if (command === "analyze-page") {
      // ...
    }
  }
);
```

---

# E.25. `chrome.alarms`

`chrome.alarms` предназначен для scheduling событий.

Например:

```javascript
chrome.alarms.create("sync", {
  periodInMinutes: 30
});
```

Handler:

```javascript
chrome.alarms.onAlarm.addListener(
  alarm => {
    if (alarm.name === "sync") {
      // synchronization
    }
  }
);
```

Это предпочтительнее попыток держать Service Worker постоянно активным.

---

# E.26. Почему нельзя использовать обычный timer как scheduler

Неправильная архитектура:

```javascript
setInterval(sync, 30 * 60 * 1000);
```

в Service Worker как единственный механизм scheduling.

Service Worker может быть suspended.

Поэтому:

```text
Timer
  ↓
depends on runtime lifetime
```

а:

```text
chrome.alarms
  ↓
browser-managed scheduling
```

соответствует модели MV3 значительно лучше.

---

# E.27. `chrome.sidePanel`

Side Panel API управляет Side Panel.

Основные задачи:

* определить panel;
* открыть/закрыть panel;
* связать panel с tab;
* управлять поведением panel.

Manifest:

```json
{
  "side_panel": {
    "default_path": "sidepanel.html"
  }
}
```

---

# E.28. `chrome.contextMenus`

Context Menus позволяет добавлять команды в browser context menu.

Например:

```text
Right click
    │
    ▼
┌──────────────────────────┐
│ Analyze with Extension   │
│ Save selection           │
│ Search...                │
└──────────────────────────┘
```

Создание:

```javascript
chrome.contextMenus.create({
  id: "analyze",
  title: "Analyze selection",
  contexts: ["selection"]
});
```

Handler:

```javascript
chrome.contextMenus.onClicked.addListener(
  (info, tab) => {
    if (info.menuItemId === "analyze") {
      // ...
    }
  }
);
```

---

# E.29. `chrome.notifications`

Notifications API позволяет создавать browser notifications.

Например:

```javascript
chrome.notifications.create({
  type: "basic",
  iconUrl: "icon.png",
  title: "Analysis complete",
  message: "The page has been analyzed."
});
```

Используйте notifications только тогда, когда уведомление действительно необходимо.

---

# E.30. `chrome.cookies`

Cookies API предоставляет extension контролируемый доступ к cookies.

Это чувствительный API.

Его использование должно рассматриваться с точки зрения:

```text
Privacy
Security
Permissions
Host permissions
User expectations
```

Нельзя относиться к cookies как к обычному application state.

---

# E.31. `chrome.webNavigation`

`webNavigation` предоставляет события навигации browser.

Например:

```text
navigation started
       ↓
navigation committed
       ↓
DOMContentLoaded
       ↓
completed
```

Это может быть полезно для extensions, которым необходимо понимать lifecycle page navigation.

---

# E.32. `chrome.webRequest`

`webRequest` предоставляет наблюдение за network requests и некоторые возможности работы с ними.

В Manifest V3 его роль существенно изменилась по сравнению с MV2, особенно для blocking сценариев.

Для большого числа новых network-control задач следует рассматривать:

```text
declarativeNetRequest
```

---

# E.33. `chrome.declarativeNetRequest`

DNR позволяет описывать network behavior декларативно.

Вместо:

```text
Request
 ↓
JavaScript
 ↓
Decision
 ↓
Action
```

используется:

```text
Request
 ↓
Browser Rule Engine
 ↓
Match rule
 ↓
Action
```

Например:

```json
{
  "id": 1,
  "priority": 1,
  "action": {
    "type": "block"
  },
  "condition": {
    "urlFilter": "ads.example.com"
  }
}
```

---

# E.34. Declarative Architecture

Это одна из фундаментальных идей MV3:

```text
JavaScript
    ↓
generate rules
    ↓
Browser
    ↓
execute rules
```

Вместо:

```text
Browser event
    ↓
JavaScript runtime
    ↓
decision
```

Это снижает зависимость от постоянно работающего background JavaScript.

---

# E.35. `chrome.offscreen`

Некоторые Web APIs требуют document environment.

Service Worker DOM не имеет.

Для отдельных сценариев Chrome предоставляет Offscreen Documents.

Архитектура:

```text
Service Worker
      │
      │ create offscreen document
      ▼
Offscreen Document
      │
      ├── DOM-dependent operation
      └── Web API
```

Это специальный bridge между:

```text
ephemeral background runtime
```

и:

```text
document environment
```

---

# E.36. `chrome.identity`

Identity API используется для identity/authentication-related workflows.

Например:

```text
Extension
    │
    ▼
Browser identity APIs
    │
    ▼
OAuth / account workflow
```

При проектировании authentication необходимо отдельно учитывать:

* OAuth;
* tokens;
* storage;
* redirects;
* account lifecycle;
* privacy.

---

# E.37. `chrome.bookmarks`

Bookmarks API позволяет работать с browser bookmarks.

Например:

```javascript
const tree =
  await chrome.bookmarks.getTree();
```

Можно:

* читать bookmarks;
* создавать;
* изменять;
* удалять;
* наблюдать изменения.

Это хороший пример API, требующего явно определённой capability.

---

# E.38. `chrome.history`

History API позволяет работать с browser history.

Например:

```javascript
const results =
  await chrome.history.search({
    text: "example"
  });
```

Это чувствительные пользовательские данные.

Следовательно:

```text
API capability
      +
permission
      +
privacy model
```

должны рассматриваться вместе.

---

# E.39. `chrome.downloads`

Downloads API позволяет управлять browser downloads.

Типичный workflow:

```text
Extension
    │
    ▼
downloads.download()
    │
    ▼
Browser Download Manager
```

Можно получать информацию о downloads и реагировать на события.

---

# E.40. `chrome.sessions`

Sessions API связан с browser sessions и recently closed tabs/windows.

Он может использоваться для:

* восстановления workspace;
* session management;
* productivity extensions.

---

# E.41. `chrome.management`

Management API позволяет получать информацию об установленных extensions/apps и управлять некоторыми аспектами их состояния в зависимости от permissions и browser policy.

Это мощный административный API.

Его следует применять только там, где функциональность действительно требует такой capability.

---

# E.42. `chrome.debugger`

Debugger API предоставляет очень мощный доступ к Chrome DevTools Protocol.

Концептуально:

```text
Extension
    │
    ▼
chrome.debugger
    │
    ▼
Chrome DevTools Protocol
    │
    ▼
Browser internals
```

Это существенно более привилегированный сценарий, чем обычная DOM manipulation.

---

# E.43. Specialized APIs

Chrome имеет множество специализированных API.

Например:

```text
bookmarks
browsingData
commands
contextMenus
cookies
debugger
declarativeContent
declarativeNetRequest
downloads
history
idle
management
notifications
sessions
tabs
topSites
webNavigation
webRequest
windows
```

Не следует изучать их как изолированный список.

Лучше классифицировать:

```text
Browser control
Page integration
Network
Storage
UI
Scheduling
Identity
Productivity
Administration
```

---

# E.44. Browser Control APIs

К этой группе относятся:

```text
tabs
windows
sessions
bookmarks
history
downloads
```

Они позволяют extension воздействовать на browser state.

Например:

```text
Browser
 ├── Tabs
 ├── Windows
 ├── History
 ├── Bookmarks
 └── Downloads
```

---

# E.45. Page Integration APIs

Основные:

```text
scripting
tabs
runtime
```

Вместе они образуют pipeline:

```text
Service Worker
      │
      ▼
tabs.query()
      │
      ▼
scripting.executeScript()
      │
      ▼
Content Script
      │
      ▼
DOM
```

---

# E.46. Runtime APIs

Основные:

```text
runtime
storage
permissions
```

Они образуют фундамент application runtime:

```text
Runtime
  │
  ├── communication
  ├── state
  └── capabilities
```

---

# E.47. UI APIs

Основные:

```text
action
sidePanel
contextMenus
notifications
```

Они позволяют extension интегрироваться с browser UI.

---

# E.48. Scheduling APIs

Основной API:

```text
alarms
```

Модель:

```text
Browser Scheduler
       │
       ▼
    Alarm Event
       │
       ▼
 Service Worker
```

Это полностью соответствует event-driven модели MV3.

---

# E.49. Declarative APIs

Ключевые:

```text
declarativeNetRequest
declarativeContent
```

Архитектурно:

```text
Traditional:

Event → JS → Decision → Action


Declarative:

Rules → Browser Engine → Action
```

Это важнейшее направление развития extension platform.

---

# E.50. API + Permission

Наличие API не означает автоматически наличие доступа.

Можно представить:

```text
Application
     │
     ▼
API call
     │
     ▼
Permission check
     │
     ├── allowed
     │
     └── denied
```

Поэтому feature design следует начинать не с:

> «Какой API использовать?»

а с:

> «Какую capability требует feature?»

---

# E.51. Capability Model

Например:

### Feature

```text
Analyze current page
```

### Required capabilities

```text
Read page
Inject code
Communicate with page
```

### APIs

```text
tabs
scripting
runtime
```

### Permissions

```text
activeTab
```

или необходимые host permissions в зависимости от архитектуры.

Таким образом:

```text
Feature
 ↓
Capability
 ↓
Permission
 ↓
API
 ↓
Context
```

Это одна из лучших моделей проектирования MV3.

---

# E.52. API Lifecycle

Каждый API следует рассматривать вместе с lifecycle.

Например:

```text
chrome.alarms
     ↓
event
     ↓
Service Worker starts
     ↓
handler executes
     ↓
Service Worker may stop
```

или:

```text
Popup
  ↓
chrome.storage.get()
  ↓
render
  ↓
popup closes
```

API не отменяет lifecycle context.

---

# E.53. API Events

Большая часть Extension API построена вокруг events.

Например:

```javascript
chrome.tabs.onUpdated.addListener(...)
```

```javascript
chrome.runtime.onMessage.addListener(...)
```

```javascript
chrome.commands.onCommand.addListener(...)
```

```javascript
chrome.alarms.onAlarm.addListener(...)
```

Общая модель:

```text
Browser Event
      │
      ▼
Extension Event Listener
      │
      ▼
Application Logic
```

---

# E.54. API Promise Model

Современные Chrome APIs во многих случаях поддерживают Promise-based usage.

Например:

```javascript
const tabs = await chrome.tabs.query({
  active: true,
  currentWindow: true
});
```

Это делает код значительно проще, чем callback-only style:

```javascript
chrome.tabs.query(
  {
    active: true,
    currentWindow: true
  },
  tabs => {
    // ...
  }
);
```

Однако конкретная Promise support зависит от API и browser version.

---

# E.55. Error Handling

Extension API calls могут завершиться ошибкой.

Поэтому:

```javascript
try {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });
} catch (error) {
  console.error(error);
}
```

Но production architecture должна учитывать не только exception.

Возможны:

```text
Permission denied
Tab disappeared
Page navigated
Frame disappeared
Context destroyed
Service Worker restarted
User denied request
API unavailable
```

---

# E.56. API Boundary

Хорошая архитектура не должна разбрасывать:

```javascript
chrome.tabs.*
chrome.storage.*
chrome.scripting.*
```

по всему приложению.

Вместо этого можно создать abstraction layer:

```text
Application
    │
    ▼
Browser Services
    │
    ├── TabsService
    ├── StorageService
    ├── ScriptingService
    └── PermissionsService
           │
           ▼
       chrome.*
```

Например:

```typescript
interface TabsService {
  getActiveTab(): Promise<Tab | undefined>;
}
```

реализация:

```typescript
class ChromeTabsService
  implements TabsService {

  async getActiveTab() {
    const [tab] =
      await chrome.tabs.query({
        active: true,
        currentWindow: true
      });

    return tab;
  }
}
```

---

# E.57. Почему API abstraction полезен

Это даёт:

```text
Application
    ↓
Stable interface
    ↓
Browser adapter
    ↓
Chrome APIs
```

Преимущества:

* тестируемость;
* browser portability;
* изоляция platform-specific code;
* более чистая бизнес-логика;
* возможность mock API.

---

# E.58. Chrome APIs как Hardware-like capabilities

Очень полезная архитектурная аналогия:

```text
Application
     │
     ▼
Capabilities
     │
     ├── storage
     ├── tabs
     ├── scripting
     ├── network
     └── notifications
```

Это напоминает capability-based system.

Extension получает не «полный доступ к браузеру», а набор отдельных возможностей.

---

# E.59. Минимальная архитектура API

Для небольшого extension достаточно:

```text
runtime
storage
action
```

Например:

```text
Action
  ↓
Service Worker
  ↓
Storage
```

---

# E.60. Средний extension

Для более сложного приложения:

```text
runtime
storage
tabs
scripting
permissions
alarms
action
```

Архитектура:

```text
UI
 │
 ▼
Runtime Messaging
 │
 ▼
Service Worker
 ├── Tabs
 ├── Scripting
 ├── Storage
 ├── Permissions
 └── Alarms
```

---

# E.61. Большое extension

Для production platform-like extension может понадобиться:

```text
runtime
storage
tabs
windows
scripting
permissions
alarms
action
sidePanel
contextMenus
notifications
declarativeNetRequest
webNavigation
identity
```

Но это не означает:

> Чем больше API используется, тем лучше extension.

Наоборот.

Хорошая архитектура стремится к:

```text
Maximum capability
        /
Minimum privilege
```

---

# E.62. API Selection Matrix

Перед добавлением API полезно задать четыре вопроса:

| Вопрос                      | Пример                       |
| --------------------------- | ---------------------------- |
| Что нужно сделать?          | изменить страницу            |
| Где это должно выполняться? | Content Script               |
| Какой capability нужен?     | DOM access                   |
| Какой API нужен?            | `scripting` / Content Script |

Например:

```text
Need:
Analyze current page

Context:
Content Script

Communication:
runtime

Background:
Service Worker

State:
storage.local
```

---

# E.63. Не путать API и Context

Очень распространённая ошибка:

> «У меня есть `chrome.tabs`, значит я могу использовать его в Content Script».

Нет.

Правильная модель:

```text
API
 │
 ├── available in context?
 │
 ├── permission?
 │
 ├── host permission?
 │
 └── lifecycle?
```

Поэтому документацию API необходимо читать вместе с разделами:

```text
Availability
Permissions
Context
```

---

# E.64. Не путать API и Permission

Например:

```text
chrome.scripting
```

— это API.

А:

```text
"scripting"
```

— permission.

Это разные понятия:

```text
Permission
    ↓
authorizes capability

API
    ↓
provides programming interface
```

---

# E.65. Не путать Host Permission и API Permission

Например:

```text
"scripting"
```

и:

```text
"https://example.com/*"
```

решают разные задачи.

Первое:

```text
API capability
```

Второе:

```text
host capability
```

Поэтому architecture:

```text
Feature
 ├── API permission
 └── Host permission
```

---

# E.66. API и Declarative Runtime

Одно из важнейших архитектурных направлений:

```text
Imperative APIs
       │
       ▼
JavaScript runtime


Declarative APIs
       │
       ▼
Browser engine
```

Например:

```text
chrome.scripting
```

может потребовать выполнения JavaScript.

А:

```text
chrome.declarativeNetRequest
```

передаёт правила browser engine.

Поэтому MV3 architecture всё чаще строится вокруг:

```text
Declarative
      +
Event-driven
      +
Minimal JavaScript
```

---

# E.67. API Security Model

Каждый API следует рассматривать через три уровня:

```text
1. Who can call it?
2. What permission is required?
3. What data/capability does it expose?
```

Например:

```text
cookies
```

может дать доступ к чувствительным данным.

Следовательно:

```text
API
 ↓
Permission
 ↓
Security boundary
 ↓
Data protection
```

---

# E.68. API Observability

Для production extension полезно логировать не просто ошибки, а операции высокого уровня.

Плохо:

```javascript
console.log("chrome.tabs.query called");
```

Лучше:

```text
[TabsService]
Getting active tab

[PageAnalyzer]
Starting analysis

[ScriptingService]
Injecting analyzer

[StorageService]
Persisting result
```

Так API abstraction превращается также в observability layer.

---

# E.69. Рекомендуемый Application API Layer

Для большого проекта:

```text
src/
├── application/
│   ├── commands/
│   ├── services/
│   └── state/
│
├── platform/
│   └── chrome/
│       ├── tabs.ts
│       ├── storage.ts
│       ├── scripting.ts
│       ├── permissions.ts
│       ├── alarms.ts
│       └── runtime.ts
│
├── contexts/
│   ├── background/
│   ├── content/
│   ├── popup/
│   ├── sidepanel/
│   └── options/
│
└── shared/
    ├── messages/
    ├── types/
    └── schemas/
```

Получается:

```text
Application
      ↓
Platform abstraction
      ↓
Chrome Extension APIs
```

---

# E.70. Полная карта Chrome Extension API

Для учебных целей можно запомнить API по уровням:

```text
                 Chrome Extension APIs
                          │
      ┌───────────────────┼───────────────────┐
      │                   │                   │
      ▼                   ▼                   ▼
    Runtime             Browser             Page
      │                 Control           Integration
      │                   │                   │
 runtime               tabs               scripting
 storage               windows            runtime
 permissions            history            tabs
 alarms                bookmarks
                       downloads
      │
      ├─────────────────────────────────────┐
      │                                     │
      ▼                                     ▼
     UI                                  Network
      │                                     │
    action                            declarativeNetRequest
    sidePanel                         webRequest
    commands                           cookies
    contextMenus
    notifications
```

---

# E.71. Главная архитектурная формула

В Manifest V3 extension API нельзя изучать как просто список функций.

Правильная модель:

```text
             Feature
                │
                ▼
           Capability
                │
                ▼
            Permission
                │
                ▼
              API
                │
                ▼
             Context
                │
                ▼
             Lifecycle
```

Например:

```text
"Analyze current page"
          │
          ▼
      Page access
          │
          ▼
 activeTab / host access
          │
          ▼
     tabs + scripting
          │
          ▼
 Content Script + Service Worker
          │
          ▼
 event-driven lifecycle
```

Это и есть правильный способ проектирования Chrome Extension.

---

# E.72. Итог

Chrome Extension APIs являются не отдельным набором удобных функций, а **операционной платформой для расширений браузера**.

Она предоставляет:

```text
Runtime
   ↓
Messaging
   ↓
Storage
   ↓
Browser Control
   ↓
Page Integration
   ↓
UI
   ↓
Scheduling
   ↓
Network Control
   ↓
Declarative Execution
```

Но архитектура Manifest V3 требует помнить о четырёх фундаментальных ограничениях:

```text
1. Contexts изолированы.
2. Permissions ограничивают capabilities.
3. Service Worker является ephemeral runtime.
4. Browser engine контролирует значительную часть lifecycle.
```

Поэтому зрелое MV3-приложение строится не вокруг отдельных `chrome.*` вызовов, а вокруг архитектуры:

```text
                 Application
                      │
                ┌─────┴─────┐
                │           │
              State       Events
                │           │
                └─────┬─────┘
                      │
                Context Layer
                      │
       ┌──────────────┼──────────────┐
       │              │              │
      UI          Service Worker   Content
       │              │              │
       └──────────────┼──────────────┘
                      │
               Chrome Platform
                      │
        ┌─────────────┼─────────────┐
        │             │             │
      Storage        Tabs        Scripting
        │             │             │
        └─────────────┼─────────────┘
                      │
               Browser Engine
```

**Главный принцип этой главы:**

> **Chrome Extension API — это не замена Web Platform, а capability layer поверх Web Platform.**

Именно поэтому современный Manifest V3 developer должен хорошо знать **обе платформы одновременно**: стандартную Web Platform и Extension Platform. Это становится особенно важным при создании собственного extension framework: хороший framework должен не скрывать эти capabilities от разработчика, а организовывать их вокруг contexts, lifecycle, permissions, messaging и declarative execution.
