# Приложение B. Permissions Reference

`permissions` — один из центральных механизмов безопасности Manifest V3. Permission определяет, какие **дополнительные capabilities** получает расширение от браузера.

При проектировании extension важно различать три вещи:

```text
API permission
      │
      ├── доступ к определённому Extension API
      │
      └── иногда дополнительные browser capabilities


Host permission
      │
      └── доступ к определённым web origins


Optional permission
      │
      └── capability, которую можно запросить позже
```

Официальная документация Chrome разделяет permissions на обычные API permissions, host permissions и optional permissions. Некоторые API вообще не требуют отдельного permission.

---

# B.1. Что такое permission

В простейшем случае permission выглядит так:

```json
{
  "permissions": [
    "storage"
  ]
}
```

Это означает:

> Extension объявляет необходимость использовать соответствующую capability.

Например:

```json
{
  "permissions": [
    "storage",
    "tabs",
    "scripting"
  ]
}
```

Manifest становится декларацией:

```text
Extension
   │
   ├── Storage capability
   ├── Tabs capability
   └── Scripting capability
```

Но permission **не означает автоматически**, что extension должен использовать API постоянно.

Например:

```json
"permissions": ["tabs"]
```

не означает:

```text
Extension постоянно наблюдает за всеми tabs.
```

Это означает:

```text
Extension разрешено использовать capability,
для которой требуется tabs permission.
```

---

# B.2. Три категории доступа

Для архитектуры Manifest V3 полезно разделять:

```text
                 Permissions
                     │
          ┌──────────┼──────────┐
          │          │          │
          ▼          ▼          ▼
        API       Host       Optional
     permissions permissions permissions
```

### API permissions

```json
{
  "permissions": [
    "storage",
    "tabs",
    "scripting"
  ]
}
```

### Host permissions

```json
{
  "host_permissions": [
    "https://example.com/*"
  ]
}
```

### Optional permissions

```json
{
  "optional_permissions": [
    "tabs"
  ],
  "optional_host_permissions": [
    "https://example.com/*"
  ]
}
```

Эти механизмы не следует смешивать.

---

# B.3. `permissions`

Основной массив:

```json
{
  "permissions": [
    "storage",
    "alarms",
    "notifications"
  ]
}
```

Permissions обычно добавляются тогда, когда соответствующий API является фундаментальной частью работы extension.

Например:

```text
storage
   ↓
настройки приложения

alarms
   ↓
планирование фоновых операций

notifications
   ↓
browser notifications
```

---

# B.4. `host_permissions`

Host permissions имеют другую семантику.

```json
{
  "host_permissions": [
    "https://example.com/*"
  ]
}
```

Здесь extension получает capability, связанную с определённым web origin.

То есть:

```text
API permission
      ↓
WHAT extension can do

Host permission
      ↓
WHERE extension can operate
```

Это фундаментальное различие.

---

# B.5. Permission ≠ API

Не каждый API требует permission.

Например, стандартные Web Platform APIs:

```javascript
fetch()
document.querySelector()
localStorage
indexedDB
crypto.subtle
```

не являются Chrome Extension APIs.

Поэтому нельзя делать вывод:

```text
"Я использую Web API"
        ↓
"Мне нужен Chrome permission"
```

Это неверно.

Правильный вопрос:

> Использую ли я Extension API или browser capability, для которой требуется permission?

---

# B.6. `storage`

```json
{
  "permissions": [
    "storage"
  ]
}
```

Используется для:

```javascript
chrome.storage.local
chrome.storage.sync
chrome.storage.session
chrome.storage.managed
```

Типичный пример:

```javascript
await chrome.storage.local.set({
  theme: "dark"
});
```

и:

```javascript
const data = await chrome.storage.local.get("theme");
```

### Архитектурное назначение

`storage` особенно важен в MV3 потому, что Service Worker не является постоянным процессом.

Поэтому:

```text
Global JavaScript state
        ↓
ненадёжно

chrome.storage
        ↓
persistent state
```

---

# B.7. `unlimitedStorage`

```json
{
  "permissions": [
    "unlimitedStorage"
  ]
}
```

Разрешение связано с увеличенными квотами хранения для extension.

Однако его нельзя рассматривать как:

```text
"storage без ограничений"
```

Это не означает отсутствие физических или платформенных ограничений.

Использовать permission следует только тогда, когда стандартной storage quota действительно недостаточно.

---

# B.8. `activeTab`

```json
{
  "permissions": [
    "activeTab"
  ]
}
```

`activeTab` — одна из наиболее важных permissions для user-triggered extensions.

Она позволяет получить временный доступ к активной вкладке после определённых действий пользователя, например взаимодействия с extension action.

Архитектурная идея:

```text
Install extension
       ↓
No broad host access
       ↓
User clicks extension
       ↓
Temporary access to active tab
       ↓
Run feature
```

Это часто позволяет избежать:

```json
{
  "host_permissions": [
    "<all_urls>"
  ]
}
```

и тем самым существенно уменьшить permission surface.

---

# B.9. `scripting`

```json
{
  "permissions": [
    "scripting"
  ]
}
```

Используется для `chrome.scripting`, например:

```javascript
await chrome.scripting.executeScript({
  target: {
    tabId
  },
  func: () => {
    document.body.style.background = "yellow";
  }
});
```

Обычно `scripting` используется вместе с:

```text
host_permissions
```

или:

```text
activeTab
```

в зависимости от сценария.

---

# B.10. `tabs`

```json
{
  "permissions": [
    "tabs"
  ]
}
```

`tabs` связан с дополнительными возможностями `chrome.tabs`, в частности доступом к определённым tab properties.

Важно:

> Использование `chrome.tabs` само по себе не означает, что всегда нужен `"tabs"` permission.

Некоторые методы `chrome.tabs` доступны без него.

Например, extension может работать с `tabId`, `windowId` и некоторыми другими данными без получения полного tabs permission.

Поэтому перед добавлением:

```json
"tabs"
```

нужно проверить конкретный API и конкретное поле, которое требуется приложению.

Это хороший пример принципа Least Privilege.

---

# B.11. `alarms`

```json
{
  "permissions": [
    "alarms"
  ]
}
```

Используется:

```javascript
chrome.alarms.create(...)
```

для планирования событий.

Архитектура:

```text
Alarm
  ↓
Browser
  ↓
Service Worker event
  ↓
Task
```

Это предпочтительнее, чем рассчитывать на:

```javascript
setInterval(...)
```

в Service Worker.

---

# B.12. `notifications`

```json
{
  "permissions": [
    "notifications"
  ]
}
```

Используется для browser notifications:

```javascript
chrome.notifications.create(...)
```

Типичная архитектура:

```text
Background event
      ↓
Business logic
      ↓
Notification
      ↓
User
```

---

# B.13. `contextMenus`

```json
{
  "permissions": [
    "contextMenus"
  ]
}
```

Позволяет создавать пункты контекстного меню:

```text
Right click
     ↓
Browser context menu
     ↓
"Analyze selection"
```

Например:

```javascript
chrome.contextMenus.create({
  id: "analyze",
  title: "Analyze selection",
  contexts: ["selection"]
});
```

---

# B.14. `commands`

Для объявления keyboard commands используется manifest:

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

Сам `"commands"` обычно не является permission в массиве:

```json
"permissions": []
```

Это важный пример различия:

```text
Manifest capability declaration
          ≠
Permission
```

---

# B.15. `sidePanel`

Для Side Panel API используется:

```json
{
  "permissions": [
    "sidePanel"
  ]
}
```

После этого:

```json
{
  "side_panel": {
    "default_path": "sidepanel.html"
  }
}
```

определяет UI.

То есть:

```text
permissions
     ↓
sidePanel capability

side_panel
     ↓
side panel configuration
```

---

# B.16. `webNavigation`

```json
{
  "permissions": [
    "webNavigation"
  ]
}
```

Используется для доступа к navigation events API.

Например, extension может реагировать на:

```text
navigation started
navigation committed
navigation completed
history state updated
reference fragment updated
```

Это особенно полезно для:

```text
SPA detection
navigation tracking
page lifecycle integration
```

Но для простой работы content script эта permission обычно не нужна.

---

# B.17. `webRequest`

```json
{
  "permissions": [
    "webRequest"
  ]
}
```

Используется WebRequest API для наблюдения за network requests в поддерживаемых сценариях.

В Manifest V3 важно понимать архитектурный сдвиг:

```text
Manifest V2
    ↓
webRequest-heavy architecture

Manifest V3
    ↓
Declarative Net Request
```

Для блокировки, перенаправления и некоторых модификаций запросов следует прежде всего рассматривать:

```text
declarativeNetRequest
```

а не строить новую архитектуру вокруг imperative request interception.

---

# B.18. `webRequestBlocking`

Исторически существовавшая модель:

```json
"permissions": [
  "webRequest",
  "webRequestBlocking"
]
```

в MV3 существенно ограничена.

Для обычных Chrome Web Store extensions нельзя проектировать современную архитектуру так, будто `webRequestBlocking` предоставляет прежнюю MV2-модель блокировки произвольным JavaScript.

Вместо этого следует изучать:

```text
declarativeNetRequest
```

и соответствующие правила.

---

# B.19. `declarativeNetRequest`

```json
{
  "permissions": [
    "declarativeNetRequest"
  ]
}
```

Используется для declarative network request processing.

Архитектура:

```text
Network request
       ↓
Browser engine
       ↓
DNR rules
       ↓
Allow / Block / Redirect / Modify
```

Вместо:

```text
Network request
       ↓
JavaScript
       ↓
decision
```

браузер получает заранее объявленные правила.

---

# B.20. `declarativeNetRequestWithHostAccess`

Для сценариев, где DNR должен работать с host access, существует:

```json
{
  "permissions": [
    "declarativeNetRequestWithHostAccess"
  ]
}
```

Его следует рассматривать отдельно от:

```text
declarativeNetRequest
```

поскольку модель доступа и требования к host permissions различаются.

При проектировании network extension необходимо проверять конкретный тип правил и требуемую модель host access в актуальной документации.

---

# B.21. `cookies`

```json
{
  "permissions": [
    "cookies"
  ],
  "host_permissions": [
    "https://example.com/*"
  ]
}
```

`cookies` позволяет использовать `chrome.cookies`.

Важный момент:

```text
cookies permission
       +
host permission
```

обычно рассматриваются совместно.

Например:

```javascript
chrome.cookies.get({
  url: "https://example.com/",
  name: "session"
});
```

Но наличие permission не означает, что cookies становятся автоматически доступными для любого сайта.

---

# B.22. `history`

```json
{
  "permissions": [
    "history"
  ]
}
```

Даёт доступ к browsing history через соответствующий API.

Это чувствительная capability.

Если extension делает:

```text
search history
analyze history
export history
```

permission должен рассматриваться как серьёзная privacy capability.

---

# B.23. `bookmarks`

```json
{
  "permissions": [
    "bookmarks"
  ]
}
```

Используется для работы с bookmarks API.

Например:

```text
read bookmarks
create bookmark
update bookmark
remove bookmark
```

Поскольку bookmarks являются пользовательскими данными, permission должен быть обоснован функциональностью приложения.

---

# B.24. `downloads`

```json
{
  "permissions": [
    "downloads"
  ]
}
```

Используется для `chrome.downloads`.

Типичный сценарий:

```text
User action
    ↓
Generate data
    ↓
Create download
    ↓
Browser download manager
```

---

# B.25. `geolocation`

В контексте extensions доступ к location может зависеть от Web Platform permission model и конкретного API.

Нельзя автоматически считать любую работу с:

```javascript
navigator.geolocation
```

эквивалентом Chrome Extension permission.

Это хороший пример правила:

> Сначала определите API, затем определяйте permission.

---

# B.26. `idle`

```json
{
  "permissions": [
    "idle"
  ]
}
```

Позволяет использовать `chrome.idle` для определения состояния активности пользователя.

Например:

```text
active
idle
locked
```

Это может быть полезно для productivity extensions и background automation.

---

# B.27. `management`

```json
{
  "permissions": [
    "management"
  ]
}
```

Позволяет использовать `chrome.management` для получения информации и управления extension/app ecosystem в пределах доступных возможностей.

Это мощная permission и должна использоваться только при реальной необходимости.

---

# B.28. `privacy`

```json
{
  "permissions": [
    "privacy"
  ]
}
```

Используется для определённых privacy-related browser settings.

Это высокочувствительная capability.

Extension, который просит:

```text
privacy
```

должен иметь очень ясное объяснение пользователю, зачем это необходимо.

---

# B.29. `sessions`

```json
{
  "permissions": [
    "sessions"
  ]
}
```

Используется для доступа к session-related API, например недавно закрытым tabs/windows в рамках предоставленных возможностей.

---

# B.30. `topSites`

```json
{
  "permissions": [
    "topSites"
  ]
}
```

Позволяет использовать Top Sites API.

Это также пользовательские browsing data, поэтому permission требует осознанного privacy design.

---

# B.31. `tts`

```json
{
  "permissions": [
    "tts"
  ]
}
```

Используется для Text-to-Speech API:

```javascript
chrome.tts.speak("Hello");
```

---

# B.32. `tabCapture`

```json
{
  "permissions": [
    "tabCapture"
  ]
}
```

Используется для соответствующих сценариев tab capture.

Это чувствительная capability, связанная с содержимым/медиа вкладки.

Архитектура:

```text
Browser Tab
     ↓
Capture capability
     ↓
Extension
```

---

# B.33. `desktopCapture`

Для desktop/media capture существует соответствующий API:

```text
chrome.desktopCapture
```

Но современная web platform также предоставляет media capture APIs.

Поэтому перед добавлением extension-specific permission нужно определить, действительно ли нужен именно Extension API.

---

# B.34. `nativeMessaging`

```json
{
  "permissions": [
    "nativeMessaging"
  ]
}
```

Позволяет extension взаимодействовать с native application через Native Messaging.

Архитектура:

```text
Browser Extension
       │
       │ Native Messaging
       ▼
Native Host
       │
       ▼
Operating System
```

Это огромный переход через security boundary.

Native Messaging должен использоваться только при необходимости взаимодействия с локальной системой.

---

# B.35. `identity`

```json
{
  "permissions": [
    "identity"
  ]
}
```

Используется соответствующими Identity APIs.

Частый сценарий:

```text
Extension
   ↓
Authentication
   ↓
OAuth / identity provider
   ↓
Token
   ↓
Backend API
```

Нужно чётко отделять authentication capability от хранения секретов.

---

# B.36. `geolocation` и Web Platform

Важно не создавать ложный список permissions.

Например:

```javascript
navigator.geolocation.getCurrentPosition(...)
```

— это Web Platform API.

То же относится к:

```javascript
fetch()
navigator.clipboard
indexedDB
crypto.subtle
```

Не каждый browser capability объявляется через:

```json
"permissions": []
```

Manifest V3 permission model специфична именно для Extension Platform.

---

# B.37. `clipboardRead`

Для некоторых сценариев clipboard API используются соответствующие permissions.

Но современная архитектура должна сначала рассмотреть стандартный:

```javascript
navigator.clipboard
```

и его собственную permission/user-activation model.

Нельзя автоматически добавлять extension permission только потому, что приложение работает с clipboard.

---

# B.38. `clipboardWrite`

Аналогично, запись в clipboard может выполняться через Web Platform API в соответствующих contexts.

Всегда различайте:

```text
Web permission model
```

и:

```text
Extension permission model
```

---

# B.39. `ttsEngine`

`ttsEngine` связан не с обычным использованием Text-to-Speech, а с созданием собственного TTS engine.

Это принципиально разные сценарии:

```text
tts
 ↓
использовать TTS

ttsEngine
 ↓
реализовать TTS engine
```

---

# B.40. `unlimitedStorage` — не default

Никогда не следует делать:

```json
{
  "permissions": [
    "storage",
    "unlimitedStorage"
  ]
}
```

только потому, что:

> «Больше storage никогда не повредит».

Правильная архитектура:

```text
Need large storage?
       │
      YES
       │
       ▼
Measure actual requirements
       │
       ▼
Check standard quota
       │
       ▼
Still insufficient?
       │
      YES
       │
       ▼
unlimitedStorage
```

---

# B.41. Permission warnings

Некоторые permissions могут приводить к предупреждениям пользователю при установке или обновлении extension.

Поэтому изменение:

```json
"permissions": [
  "storage"
]
```

на:

```json
"permissions": [
  "storage",
  "history"
]
```

может быть не просто техническим изменением.

Это изменение:

```text
API surface
+
privacy surface
+
user trust
+
store review implications
```

Chrome Web Store также анализирует использование permissions при публикации extension.

---

# B.42. Permission surface

Полезно ввести понятие:

> **Permission Surface**

Это совокупность всех capabilities, которые extension запрашивает.

Например:

```text
Extension A

permissions:
    storage
    alarms

host_permissions:
    https://example.com/*
```

имеет относительно небольшой permission surface.

А:

```text
Extension B

permissions:
    tabs
    history
    bookmarks
    cookies
    downloads
    management
    nativeMessaging

host_permissions:
    <all_urls>
```

имеет огромную permission surface.

Чем больше surface:

```text
больше capabilities
        ↓
больше attack surface
        ↓
больше privacy implications
        ↓
больше user distrust
```

---

# B.43. Principle of Least Privilege

Главный принцип:

> Extension должен иметь минимальный набор capabilities, достаточный для выполнения своей функции.

Например, если extension работает только с:

```text
https://example.com/*
```

не нужно писать:

```json
"host_permissions": [
  "<all_urls>"
]
```

Вместо этого:

```json
"host_permissions": [
  "https://example.com/*"
]
```

---

# B.44. `activeTab` вместо широкого host access

Рассмотрим extension:

> Нажмите кнопку → изменить текущую страницу.

Вместо:

```json
{
  "permissions": [
    "scripting"
  ],
  "host_permissions": [
    "<all_urls>"
  ]
}
```

часто можно использовать:

```json
{
  "permissions": [
    "activeTab",
    "scripting"
  ]
}
```

Это принципиально другая security model:

```text
Global access
       ↓
replaced by
       ↓
User-triggered temporary access
```

---

# B.45. Optional permissions

Если feature используется редко:

```text
Core application
       │
       ├── storage
       └── action

Advanced feature
       │
       └── history
```

можно сделать:

```json
{
  "permissions": [
    "storage"
  ],
  "optional_permissions": [
    "history"
  ]
}
```

Тогда пользователь сначала получает минимальную версию приложения.

---

# B.46. Runtime permission requests

Для optional permissions используется:

```javascript
chrome.permissions.request(...)
```

Например, концептуально:

```javascript
const granted = await chrome.permissions.request({
  permissions: ["history"]
});
```

После этого:

```text
granted === true
```

означает, что capability была предоставлена.

Если:

```text
granted === false
```

feature должна корректно продолжать работать без неё.

Это важный архитектурный принцип:

```text
Optional capability
       ↓
Feature degradation
```

а не:

```text
Permission denied
       ↓
Application crashes
```

---

# B.47. Проверка permission

Extension может проверять наличие permissions через:

```javascript
chrome.permissions.contains(...)
```

Например:

```javascript
const hasPermission =
  await chrome.permissions.contains({
    permissions: ["history"]
  });
```

Это полезно для feature gating:

```text
if permission exists
    enable feature
else
    show "Enable feature"
```

---

# B.48. Удаление permission

Optional permissions могут также удаляться через:

```javascript
chrome.permissions.remove(...)
```

Это позволяет строить более динамическую permission architecture.

Например:

```text
User enabled integration
       ↓
permission granted
       ↓
feature active

Later:
       ↓
User disables integration
       ↓
permission removed
```

Это особенно полезно для privacy-oriented extensions.

---

# B.49. Permission-driven architecture

Permission можно рассматривать как часть application state:

```text
Application State

user settings
       +
feature state
       +
permission state
```

Например:

```text
Feature: Page Analyzer

permission:
    activeTab = true

state:
    analyzerEnabled = true
```

Тогда UI может вычислять:

```text
Feature available?
    ↓
permission && configuration
```

---

# B.50. Permissions и contexts

Permission не следует связывать только с одним context.

Архитектура может выглядеть так:

```text
                 Permissions
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
 Service Worker   Content Script  Side Panel
        │            │            │
        └────────────┼────────────┘
                     ▼
                 Browser APIs
```

Но фактическая доступность API зависит от конкретного context.

Поэтому всегда нужно задавать два вопроса:

```text
1. Есть ли permission?

2. Доступен ли этот API в данном execution context?
```

Наличие permission не означает, что любой API можно вызвать из любого места.

---

# B.51. Permissions и Service Worker

Service Worker часто является главным orchestrator.

Например:

```text
Popup
   │
   │ message
   ▼
Service Worker
   │
   ├── storage
   ├── tabs
   ├── alarms
   └── scripting
```

Поэтому permissions часто используются именно background layer.

Но архитектурно не следует считать Service Worker единственным местом, где существует permission boundary.

---

# B.52. Permissions и Content Scripts

Content Script имеет доступ к определённым extension APIs, но его основной интерфейс с extension architecture:

```text
Content Script
      │
      ▼
runtime messaging
      │
      ▼
Service Worker
```

Например:

```javascript
chrome.runtime.sendMessage({
  type: "GET_SETTINGS"
});
```

Вместо того чтобы давать content script избыточные capabilities, лучше:

```text
Content Script
    ↓
request
    ↓
Service Worker
    ↓
privileged operation
    ↓
response
```

Это уменьшает количество мест, где sensitive logic выполняется непосредственно.

---

# B.53. Permissions и Side Panel

Side Panel — privileged extension page.

Типичная архитектура:

```text
Side Panel
    │
    ├── UI
    │
    └── message
          ↓
      Service Worker
          │
          ├── tabs
          ├── storage
          └── scripting
```

Side Panel не должен автоматически получать все permissions, которые есть у всего приложения.

Нужно проектировать capability flow явно.

---

# B.54. Permissions и Web Platform

Современное extension architecture обычно состоит из двух уровней:

```text
Web Platform
    │
    ├── DOM
    ├── Fetch
    ├── IndexedDB
    ├── Web Crypto
    ├── Web Components
    └── Web Workers

Extension Platform
    │
    ├── tabs
    ├── storage
    ├── scripting
    ├── alarms
    ├── commands
    └── sidePanel
```

Хороший разработчик сначала использует Web Platform там, где её достаточно, и только затем добавляет Extension API capability.

---

# B.55. Permission escalation

Не следует делать:

```text
Install
 ↓
Request everything
 ↓
Hope user accepts
```

Лучше:

```text
Install
 ↓
Minimal capability
 ↓
User uses application
 ↓
User requests advanced feature
 ↓
Explain why permission is needed
 ↓
Request optional permission
```

Это одновременно:

* security improvement;
* UX improvement;
* privacy improvement;
* reduction of permission warnings.

---

# B.56. Permission abstraction

В крупном extension permission management стоит вынести в отдельный слой:

```text
src/
├── permissions/
│   ├── permissions.ts
│   ├── permission-service.ts
│   └── permission-types.ts
```

Например:

```typescript
export interface PermissionService {
  has(permission: string): Promise<boolean>;
  request(permission: string): Promise<boolean>;
  remove(permission: string): Promise<boolean>;
}
```

Тогда UI не должен напрямую заниматься всеми деталями:

```text
Popup
  ↓
PermissionService
  ↓
chrome.permissions
```

---

# B.57. Typed permissions

Для TypeScript можно описать permissions как типизированные capabilities:

```typescript
type ExtensionCapability =
  | "storage"
  | "tabs"
  | "scripting"
  | "history"
  | "notifications";
```

И построить:

```typescript
interface CapabilityState {
  storage: boolean;
  tabs: boolean;
  scripting: boolean;
  history: boolean;
  notifications: boolean;
}
```

Тогда приложение может работать с permission state как с обычной частью domain model.

---

# B.58. Capability-based architecture

Более глубокая модель:

```text
Extension
   │
   ├── Capability: Storage
   ├── Capability: Tabs
   ├── Capability: Scripting
   ├── Capability: Notifications
   └── Capability: Host(example.com)
```

Каждая capability должна иметь:

```text
declaration
     ↓
verification
     ↓
runtime use
     ↓
error handling
```

Например:

```text
Scripting capability
       ↓
permission exists?
       ↓
target host allowed?
       ↓
tab exists?
       ↓
executeScript()
```

---

# B.59. Permission matrix

Для сложного приложения удобно создать таблицу:

| Capability       | Manifest          | Context        | Optional?  | Sensitivity |
| ---------------- | ----------------- | -------------- | ---------- | ----------- |
| Storage          | `storage`         | SW / pages     | Usually no | Low         |
| Active tab       | `activeTab`       | SW / injection | Usually no | Medium      |
| Script injection | `scripting`       | SW             | Usually no | High        |
| Tabs             | `tabs`            | SW             | Sometimes  | Medium      |
| History          | `history`         | SW             | Often      | High        |
| Cookies          | `cookies` + hosts | SW             | Sometimes  | High        |
| Notifications    | `notifications`   | SW             | Usually no | Medium      |
| Side Panel       | `sidePanel`       | SW / UI        | Usually no | Low         |
| Alarms           | `alarms`          | SW             | Usually no | Low         |
| Native Messaging | `nativeMessaging` | SW             | Rare       | Very high   |

Это не универсальная таблица API requirements: конкретные требования зависят от используемого метода и браузера. Для production-разработки необходимо сверять конкретный API с актуальной документацией.

---

# B.60. Permission audit

Перед release полезно провести отдельный permission audit.

### Шаг 1

Найти все manifest permissions:

```bash
grep -n '"permissions"' manifest.json
```

### Шаг 2

Найти host permissions:

```bash
grep -n '"host_permissions"' manifest.json
```

### Шаг 3

Для каждой permission ответить:

```text
Why do we need it?
Where is it used?
Which feature needs it?
Can it become optional?
Can it be replaced by Web Platform API?
Can activeTab replace broad host access?
```

---

# B.61. Permission dependency graph

В production extension полезно иметь граф:

```text
Feature
   │
   ├── requires storage
   │
   ├── requires scripting
   │
   └── requires example.com host access
```

Например:

```text
Page Analyzer
      │
      ├── storage
      ├── scripting
      └── activeTab

History Analyzer
      │
      └── history

Site Integration
      │
      └── https://example.com/*
```

Теперь permission model становится следствием product architecture.

---

# B.62. Плохая permission architecture

Плохой пример:

```json
{
  "permissions": [
    "tabs",
    "history",
    "bookmarks",
    "cookies",
    "downloads",
    "management",
    "nativeMessaging",
    "unlimitedStorage"
  ],
  "host_permissions": [
    "<all_urls>"
  ]
}
```

если extension фактически делает только:

```text
изменить цвет страницы
```

Такой manifest нарушает Principle of Least Privilege.

---

# B.63. Хорошая permission architecture

Если приложение делает:

> Пользователь нажимает кнопку и изменяет текущую страницу.

можно стремиться к:

```json
{
  "permissions": [
    "activeTab",
    "scripting"
  ]
}
```

И вообще отказаться от:

```json
"host_permissions": [
  "<all_urls>"
]
```

если конкретный use case это позволяет.

---

# B.64. Permissions как часть API design

Permission model необходимо проектировать одновременно с API design.

Плохой подход:

```text
Написали приложение
      ↓
Добавили permissions пока не заработало
```

Хороший:

```text
Feature requirements
      ↓
Browser capabilities
      ↓
Required APIs
      ↓
Required permissions
      ↓
Manifest
      ↓
Runtime architecture
```

---

# B.65. Permissions и архитектура Emerge

Для framework-level архитектуры, которую мы рассматривали в книге, особенно интересна следующая модель:

```text
Application
     ↓
Capability declarations
     ↓
Permission compiler
     ↓
manifest.json
```

Например:

```typescript
extension.capability("storage");

extension.capability("activeTab");

extension.capability("scripting");

extension.host("https://example.com/*");
```

Framework может автоматически генерировать:

```json
{
  "permissions": [
    "storage",
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "https://example.com/*"
  ]
}
```

Это превращает permissions из ручной конфигурации в **часть application architecture**.

---

# B.66. Permission Reference — краткая карта

Удобно держать следующую mental map:

```text
                         Permissions
                              │
       ┌──────────────────────┼──────────────────────┐
       │                      │                      │
       ▼                      ▼                      ▼
     API                  Host Access            Optional
       │                      │                      │
       │                      │                      │
       ├── storage            ├── example.com       ├── API
       ├── tabs               ├── *.example.com     └── hosts
       ├── scripting          └── <all_urls>
       ├── alarms
       ├── notifications
       ├── history
       ├── bookmarks
       ├── cookies
       ├── downloads
       ├── webNavigation
       ├── webRequest
       ├── declarativeNetRequest
       ├── sidePanel
       ├── nativeMessaging
       └── identity
```

---

# B.67. Главный принцип

При разработке Manifest V3 extension следует постоянно задавать четыре вопроса:

```text
1. Что делает приложение?

2. Какой browser capability для этого требуется?

3. Какая permission предоставляет эту capability?

4. Можно ли выполнить задачу с меньшими privileges?
```

Последний вопрос особенно важен.

Например:

```text
Need page access
       │
       ├── <all_urls> ?
       │
       ├── specific host?
       │
       ├── optional host?
       │
       └── activeTab?
```

Это уже архитектурное решение, а не просто синтаксис `manifest.json`.

---

# B.68. Итоговая модель Permissions

Manifest V3 permission system можно представить формулой:

```text
                  Extension Capability
                           │
              ┌────────────┴────────────┐
              │                         │
          API access                Host access
              │                         │
       permissions              host_permissions
              │                         │
              └────────────┬────────────┘
                           │
                    Least Privilege
                           │
              ┌────────────┴────────────┐
              │                         │
         Required now              Optional later
              │                         │
      permissions[]          optional_permissions[]
                             
                     + 
                     
              optional_host_permissions[]
```

Главная идея Manifest V3:

> **Permission — это не формальность manifest-файла, а capability, определяющая границу доверия между extension, browser и web.**

Поэтому профессиональная permission architecture должна быть:

```text
Minimal
Explicit
Auditable
Context-aware
User-understandable
Capability-driven
```

Именно из этой модели естественно вытекает следующий уровень архитектуры: **permission model → capability model → extension runtime**. Это особенно важно для больших multi-context extensions и для framework, который генерирует Manifest V3 автоматически.
