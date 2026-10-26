# Приложение H. Extension Security Checklist

Безопасность browser extension нельзя свести к одному пункту вроде «не используй `eval()`».

Extension работает на границе нескольких доверенных и недоверенных сред:

```text
┌───────────────────────────────────────┐
│ Browser                               │
│                                       │
│  Extension                            │
│  ├── Service Worker                   │
│  ├── Popup                            │
│  ├── Options                          │
│  ├── Side Panel                       │
│  └── Extension Pages                  │
│                                       │
│  Content Scripts                      │
│       ↕                               │
│  Web Page                             │
│       ↕                               │
│  Remote Internet                      │
└───────────────────────────────────────┘
```

Каждая граница является потенциальной **trust boundary**.

Поэтому security checklist должен проверять не только код, но и:

* Manifest;
* permissions;
* host permissions;
* contexts;
* messaging;
* DOM;
* network;
* storage;
* injected code;
* dependencies;
* build pipeline;
* distribution;
* updates.

---

# H.1. Основной принцип

Главное правило безопасности extension:

> **Никогда не считайте данные, пришедшие из web page, content script, network или storage, автоматически доверенными.**

Данные могут поступать из:

```text
Page
Content Script
Message
URL
DOM
Query Parameters
HTTP
WebSocket
Storage
External API
User Input
```

Поэтому архитектура должна исходить из модели:

```text
Input
  ↓
Untrusted
  ↓
Validate
  ↓
Normalize
  ↓
Authorize
  ↓
Process
```

а не:

```text
Input
  ↓
Execute
```

---

# H.2. Manifest Security Checklist

Проверьте `manifest.json`.

### Базовые вопросы

* [ ] Используется `manifest_version: 3`.
* [ ] `name` и `description` не содержат небезопасных динамических данных.
* [ ] `permissions` минимальны.
* [ ] `host_permissions` минимальны.
* [ ] Не используется `<all_urls>` без необходимости.
* [ ] `content_scripts.matches` максимально ограничены.
* [ ] `web_accessible_resources` ограничены.
* [ ] CSP соответствует требованиям безопасности.
* [ ] Не разрешено выполнение удалённого кода.
* [ ] Нет ненужных privileged APIs.

---

# H.3. Principle of Least Privilege

Расширение должно иметь только те права, которые ему действительно необходимы.

Плохой подход:

```json
{
  "permissions": [
    "tabs",
    "cookies",
    "history",
    "storage",
    "scripting"
  ],
  "host_permissions": [
    "<all_urls>"
  ]
}
```

если расширению реально требуется только:

```json
{
  "permissions": [
    "storage"
  ]
}
```

и доступ к одному домену.

Правило:

> **Каждое permission должно иметь конкретное архитектурное обоснование.**

---

# H.4. Permission Audit

Для каждого permission создайте таблицу:

| Permission  | Зачем нужен           | Где используется | Можно удалить? |
| ----------- | --------------------- | ---------------- | -------------- |
| `storage`   | Настройки             | SW/UI            | Нет            |
| `scripting` | Injection             | SW               | Нет            |
| `tabs`      | Информация о вкладках | SW               | Возможно       |
| `cookies`   | Работа с cookies      | SW               | Возможно       |

Если разработчик не может объяснить, зачем нужен permission:

```text
REMOVE
```

---

# H.5. Host Permission Checklist

Проверьте:

* [ ] Нужен ли вообще host permission?
* [ ] Можно ли ограничить домен?
* [ ] Можно ли ограничить protocol?
* [ ] Можно ли использовать optional permissions?
* [ ] Можно ли заменить host permission другой архитектурой?
* [ ] Нужен ли доступ ко всем страницам?
* [ ] Нужна ли инъекция во все frames?

Например, вместо:

```json
{
  "host_permissions": [
    "<all_urls>"
  ]
}
```

может быть достаточно:

```json
{
  "host_permissions": [
    "https://example.com/*"
  ]
}
```

---

# H.6. `<all_urls>` Audit

`<all_urls>` — один из наиболее чувствительных permission patterns.

Перед использованием задайте четыре вопроса:

```text
1. Действительно нужен любой сайт?
2. Почему?
3. Можно ли ограничить domains?
4. Можно ли запросить permission только при необходимости?
```

Если ответ на третий или четвёртый вопрос положительный, архитектуру следует пересмотреть.

---

# H.7. Content Script Security

Content Script работает непосредственно рядом с содержимым web page.

Поэтому:

```text
Page DOM
   ↓
Content Script
```

не означает:

```text
Page = Trusted
```

Напротив:

> **Страница считается потенциально недоверенной средой.**

---

# H.8. Не доверяйте DOM

Например:

```javascript
const username =
  document.querySelector(".username").textContent;
```

Полученное значение нельзя автоматически считать безопасным.

Если затем:

```javascript
element.innerHTML = username;
```

может возникнуть XSS.

Безопаснее:

```javascript
element.textContent = username;
```

---

# H.9. `innerHTML`

Следует избегать:

```javascript
element.innerHTML = userInput;
```

если содержимое не прошло строгую sanitization.

Предпочтительно:

```javascript
element.textContent = userInput;
```

или создание DOM через:

```javascript
document.createElement()
```

и:

```javascript
appendChild()
```

---

# H.10. Dangerous DOM APIs

Особого внимания требуют:

```text
innerHTML
outerHTML
insertAdjacentHTML
document.write
eval
new Function
setTimeout(string)
setInterval(string)
```

Security checklist:

* [ ] Нет `eval()`.
* [ ] Нет `new Function()`.
* [ ] Нет выполнения строк как JavaScript.
* [ ] Нет необработанного `innerHTML`.
* [ ] HTML sanitization используется там, где HTML действительно необходим.

---

# H.11. Content Script Is Not a Security Boundary

Изолированный мир защищает JavaScript environment:

```text
Page JS
   │
   ├── Environment A
   │
Content Script
   │
   └── Environment B
```

Но DOM остаётся общей точкой взаимодействия.

Поэтому:

```text
isolated world
```

не означает:

```text
trusted DOM
```

---

# H.12. MAIN World Checklist

Использование:

```text
world: "MAIN"
```

должно рассматриваться как повышенный риск.

В MAIN world extension code находится в JavaScript environment страницы.

Это означает:

```text
Extension code
      ↓
Page JavaScript environment
```

Поэтому:

* [ ] MAIN world действительно необходим?
* [ ] Можно ли решить задачу в isolated world?
* [ ] Все входные данные валидируются?
* [ ] Нет доверия к page globals?
* [ ] Нет передачи секретов в MAIN world?

---

# H.13. Page ↔ Extension Bridge

Если используется:

```javascript
window.postMessage(...)
```

необходимо считать сообщения недоверенными.

Плохая модель:

```text
message
   ↓
execute
```

Правильная:

```text
message
   ↓
validate schema
   ↓
authorize operation
   ↓
execute
```

---

# H.14. Message Schema

Каждое сообщение должно иметь определённую структуру.

Например:

```typescript
type Message =
  | {
      type: "GET_SETTINGS";
    }
  | {
      type: "SET_SETTING";
      key: string;
      value: unknown;
    };
```

Нежелательно принимать:

```javascript
if (message.action) {
  doAnything(message);
}
```

без проверки остальных полей.

---

# H.15. Message Validation

Проверяйте:

```text
type
required fields
field types
allowed values
field length
nested structures
```

Например:

```javascript
function isValidMessage(message) {
  return (
    message &&
    typeof message === "object" &&
    message.type === "GET_SETTINGS"
  );
}
```

Для сложных протоколов желательно использовать schema validation.

---

# H.16. Message Authorization

Validation и authorization — разные вещи.

Сообщение может быть синтаксически корректным:

```json
{
  "type": "DELETE_DATA"
}
```

но это ещё не означает, что отправитель имеет право выполнить операцию.

Архитектура:

```text
Message
   ↓
Validate
   ↓
Identify sender/context
   ↓
Authorize
   ↓
Execute
```

---

# H.17. Не доверяйте `sender`

В message handler следует учитывать контекст отправителя.

Например:

```javascript
chrome.runtime.onMessage.addListener(
  (message, sender) => {
    // validate message
    // validate sender
  }
);
```

Нельзя строить security model только на:

```javascript
message.type
```

---

# H.18. Message Allowlist

Лучше явно определить допустимые операции:

```text
GET_SETTINGS
SET_SETTINGS
ENABLE_FEATURE
DISABLE_FEATURE
```

чем создавать универсальный RPC:

```text
CALL_ANYTHING
```

Чем шире API:

```text
RPC
  ↓
many operations
```

тем больше attack surface.

---

# H.19. Storage Security

`chrome.storage` — это средство хранения данных, а не секретный vault.

Не следует без необходимости хранить там:

```text
Passwords
Private keys
Long-lived authentication secrets
Sensitive credentials
```

Архитектура должна исходить из принципа:

```text
Storage ≠ Secret Manager
```

---

# H.20. Storage Validation

Данные из storage тоже следует считать потенциально изменяемыми.

Например:

```javascript
const settings =
  await chrome.storage.local.get("settings");
```

Не следует предполагать, что структура всегда корректна.

Нужно:

```text
Read
 ↓
Validate
 ↓
Normalize
 ↓
Use
```

---

# H.21. Storage Migration

После обновления extension старые данные могут иметь старую структуру:

```text
v1 data
   ↓
migration
   ↓
v2 data
   ↓
validation
```

Migration code также является частью security boundary.

---

# H.22. Network Security

Все внешние данные должны рассматриваться как untrusted.

Например:

```javascript
const response =
  await fetch("https://api.example.com/config");

const data =
  await response.json();
```

Нельзя сразу делать:

```javascript
applyConfiguration(data);
```

Нужно:

```text
HTTP
 ↓
Parse
 ↓
Validate
 ↓
Authenticate / verify integrity where needed
 ↓
Normalize
 ↓
Apply
```

---

# H.23. HTTPS

Для внешних сервисов:

```text
HTTPS
```

должен быть стандартом.

Следует избегать:

```text
http://
```

если это не абсолютно необходимый сценарий.

---

# H.24. Remote Code

Manifest V3 значительно ограничивает модель удалённого кода.

Небезопасная архитектура:

```text
Extension
   ↓
download JavaScript
   ↓
execute JavaScript
```

Правильнее:

```text
Extension
   ↓
download DATA
   ↓
validate
   ↓
process using packaged code
```

То есть:

```text
Remote DATA → допустимый сценарий
Remote CODE → опасный/ограниченный сценарий
```

---

# H.25. Remote Configuration

Удалённый JSON может содержать:

```json
{
  "enabled": true,
  "blockedDomains": [
    "example.com"
  ]
}
```

Но extension должен рассматривать его как **data**, а не executable code.

Нельзя превращать его в:

```javascript
eval(remoteConfig.code);
```

---

# H.26. CSP Checklist

Проверьте Content Security Policy:

* [ ] Нет `unsafe-eval`.
* [ ] Нет необходимости в inline JavaScript.
* [ ] JavaScript загружается из контролируемых ресурсов.
* [ ] Нет ненужных внешних script sources.
* [ ] CSP соответствует архитектуре extension.

Типичная модель:

```text
HTML
 ↓
module script
 ↓
packaged JS
```

а не:

```text
HTML
 ↓
inline JS
 ↓
dynamic code
```

---

# H.27. Dependencies

Third-party dependencies являются частью attack surface.

Проверьте:

* [ ] Какие npm packages используются?
* [ ] Нужен ли каждый package?
* [ ] Есть ли transitive dependencies?
* [ ] Есть ли известные vulnerabilities?
* [ ] Кто поддерживает package?
* [ ] Можно ли уменьшить dependency tree?
* [ ] Используется ли lockfile?

---

# H.28. Dependency Tree

Например:

```text
extension
   │
   ├── library A
   │      ├── package X
   │      └── package Y
   │
   └── library B
          └── package Z
```

Каждый дополнительный dependency увеличивает:

```text
Attack Surface
```

Поэтому для browser extensions особенно ценна небольшая dependency tree.

---

# H.29. Supply Chain Security

Проверьте:

* [ ] Lockfile committed.
* [ ] Dependencies регулярно обновляются.
* [ ] Используется dependency audit.
* [ ] Build выполняется из контролируемых исходников.
* [ ] CI environment защищён.
* [ ] Release artifacts воспроизводимы или проверяемы.

---

# H.30. Build Security

Security должна распространяться на build pipeline.

```text
Source
 ↓
Dependencies
 ↓
Build
 ↓
Bundle
 ↓
Package
 ↓
Store
```

Уязвимость может находиться не только в runtime code.

Например:

```text
malicious dependency
        ↓
build
        ↓
extension
```

---

# H.31. Source Maps

Production extension может раскрывать source maps.

Проверьте:

* [ ] Нужны ли production source maps?
* [ ] Не раскрывают ли они внутреннюю структуру?
* [ ] Не содержат ли секреты?
* [ ] Не попадают ли credentials в bundled files?

---

# H.32. Secrets

Никогда не помещайте секреты непосредственно в extension:

```javascript
const API_KEY = "secret";
```

Потому что extension package можно исследовать.

Любой пользовательский extension является клиентским программным обеспечением.

Следовательно:

```text
Extension code
=
publicly inspectable code
```

---

# H.33. API Keys

Если API требует секретного credential:

```text
Extension
   ↓
Backend
   ↓
Secret API
```

вместо:

```text
Extension
   ↓
Secret API key
   ↓
Third-party API
```

Если credential должен находиться на клиенте, необходимо оценивать его как потенциально раскрываемый.

---

# H.34. Authentication Tokens

Особое внимание:

```text
access token
refresh token
session token
```

Следует минимизировать:

* срок жизни;
* permissions;
* область действия;
* места хранения.

И никогда не отправлять токены в:

```text
DOM
window
URL
query string
page context
MAIN world
```

без крайней необходимости.

---

# H.35. URL Security

URL часто является недоверенным input.

Например:

```text
?redirect=https://evil.example
```

Нельзя без проверки делать:

```javascript
location.href = redirect;
```

Необходимо проверять:

```text
scheme
origin
hostname
path
allowed destinations
```

---

# H.36. Open Redirect

Если extension поддерживает:

```text
redirect=<URL>
```

необходимо определить allowlist.

Например:

```text
https://example.com/*
```

вместо:

```text
*
```

---

# H.37. `web_accessible_resources`

Проверьте:

* [ ] Каждый exposed resource действительно нужен.
* [ ] Нет широкого доступа без необходимости.
* [ ] `matches` ограничены.
* [ ] Нельзя ли убрать resource из web-accessible списка?

Помните:

> `web_accessible_resources` расширяет поверхность взаимодействия между web pages и extension resources.

---

# H.38. Extension Resource Exposure

Плохо:

```text
Expose everything
```

Лучше:

```text
Expose:
icon.svg
bridge.js
specific-resource.json
```

только там, где это необходимо.

---

# H.39. `externally_connectable`

Если extension принимает внешние сообщения:

```text
Web page
   ↓
Extension
```

необходимо особенно внимательно проверить:

* [ ] Кто может подключаться?
* [ ] Какие origins разрешены?
* [ ] Какие messages принимаются?
* [ ] Какие операции разрешены?
* [ ] Как выполняется authorization?

---

# H.40. External Messaging

Никогда не проектируйте внешний API как:

```text
send arbitrary command
```

Лучше:

```text
Public API
├── GET_STATUS
├── GET_VERSION
└── REQUEST_FEATURE
```

с минимальным набором возможностей.

---

# H.41. Tab Security

`chrome.tabs` предоставляет доступ к информации о вкладках.

Проверяйте:

* [ ] Нужен ли `tabs` permission?
* [ ] Можно ли использовать `activeTab`?
* [ ] Нужно ли получать URL?
* [ ] Нужно ли получать title?
* [ ] Можно ли ограничить host permissions?

---

# H.42. `activeTab`

Если extension работает только после пользовательского действия, `activeTab` может быть более безопасной моделью, чем постоянный доступ ко всем сайтам.

Концептуально:

```text
User action
   ↓
temporary access
   ↓
current tab
```

вместо:

```text
permanent access
   ↓
all sites
```

---

# H.43. Dynamic Permissions

Для необязательных возможностей:

```text
Feature
   ↓
User requests feature
   ↓
Request permission
   ↓
Grant
   ↓
Enable feature
```

Это лучше, чем:

```text
Install
   ↓
request everything
```

---

# H.44. Service Worker Security

Service Worker является privileged context.

Проверьте:

* [ ] Нет выполнения недоверенного JavaScript.
* [ ] Все messages валидируются.
* [ ] Storage данные валидируются.
* [ ] Network responses валидируются.
* [ ] Permissions минимальны.
* [ ] Ошибки не раскрывают секреты.
* [ ] Логирование не содержит credentials.

---

# H.45. Service Worker как Security Boundary

Не следует считать:

```text
Content Script
    ↓
Service Worker
```

доверенным соединением только потому, что оба принадлежат extension.

Content Script взаимодействует с web page и может обработать недоверенные данные.

Поэтому:

```text
Content Script
   ↓
untrusted input
   ↓
Service Worker
```

требует validation.

---

# H.46. Error Handling

Ошибки не должны раскрывать:

```text
API keys
Tokens
Passwords
Internal paths
Private configuration
User data
```

Плохо:

```javascript
console.error("Request failed:", {
  token,
  password,
  response
});
```

Лучше:

```javascript
console.error("Request failed");
```

а чувствительные детали логировать только в контролируемой development environment.

---

# H.47. Logging

Проверьте production logs:

* [ ] Нет access tokens.
* [ ] Нет refresh tokens.
* [ ] Нет cookies.
* [ ] Нет passwords.
* [ ] Нет персональных данных без необходимости.
* [ ] Нет полных network responses.
* [ ] Нет внутренних secrets.

---

# H.48. Console Security

Помните, что:

```text
console.log()
```

не является безопасным storage.

Не помещайте туда секреты.

Особенно опасно:

```javascript
console.log("Token:", token);
```

---

# H.49. Race Conditions

Multi-context extension может иметь:

```text
Popup
Side Panel
Options
Content Script
Service Worker
```

одновременно.

Поэтому возможны:

```text
Race conditions
Lost updates
Stale state
Duplicate operations
```

Security-sensitive операции должны быть idempotent и корректно синхронизированы.

---

# H.50. TOCTOU

Классическая проблема:

```text
Check
 ↓
Wait
 ↓
Use
```

Если состояние может измениться между проверкой и использованием, проверка может устареть.

Например:

```text
permission/state
   ↓
check
   ↓
context changes
   ↓
execute
```

Критические условия следует проверять максимально близко к операции.

---

# H.51. Idempotency

Особенно важна для message-driven architecture.

Например:

```text
ENABLE_FEATURE
```

должно быть безопасно выполнить дважды:

```text
ENABLE
ENABLE
```

а не:

```text
ENABLE
ENABLE
→ corrupted state
```

---

# H.52. Replay Protection

Если операция чувствительна:

```text
DELETE_DATA
TRANSFER
CHANGE_PERMISSION
```

не следует бездумно принимать повтор одного и того же сообщения.

Можно использовать:

```text
requestId
timestamp
nonce
state/version
```

в зависимости от сценария.

---

# H.53. CSRF-like Risks

Extension UI может взаимодействовать с web content, поэтому нельзя предполагать, что любое действие инициировано пользователем.

Особенно осторожно относитесь к:

```text
URL parameters
DOM events
postMessage
content script messages
external messages
```

---

# H.54. Clickjacking и UI

Extension pages имеют другую модель происхождения, но пользовательские UI всё равно должны:

* ясно показывать происхождение операции;
* избегать скрытых destructive actions;
* не выполнять sensitive operations только по факту открытия страницы.

---

# H.55. Destructive Operations

Операции:

```text
DELETE
RESET
CLEAR
DISABLE SECURITY
EXPORT DATA
```

должны иметь:

```text
explicit intent
```

а не выполняться автоматически на основании недоверенного сообщения.

---

# H.56. Navigation Security

Проверьте navigation из extension pages:

```javascript
location.href = url;
```

Перед navigation:

```text
URL
 ↓
Validate scheme
 ↓
Validate origin
 ↓
Allowlist
 ↓
Navigate
```

---

# H.57. Dangerous Schemes

Особое внимание:

```text
javascript:
data:
file:
blob:
chrome:
chrome-extension:
```

Не следует автоматически разрешать произвольные schemes.

Для navigation обычно полезно явно разрешать только ожидаемые:

```text
https:
http:
```

если именно они необходимы.

---

# H.58. DOM Injection Checklist

Для каждого места, где данные попадают в DOM:

```text
Source
 ↓
Is it trusted?
 ↓
If not → sanitize/encode
 ↓
DOM
```

Проверьте:

* [ ] `innerHTML`.
* [ ] `insertAdjacentHTML`.
* [ ] dynamic attributes.
* [ ] dynamic URLs.
* [ ] iframe `src`.
* [ ] links.
* [ ] CSS injection.

---

# H.59. Attribute Injection

Опасность существует не только для HTML:

```javascript
element.setAttribute("href", userInput);
```

Если `userInput` содержит опасную схему:

```text
javascript:
```

может возникнуть security issue в зависимости от контекста.

Поэтому URL attributes требуют отдельной validation.

---

# H.60. CSS Injection

Не следует бездумно использовать:

```javascript
element.style.cssText = userInput;
```

Лучше задавать конкретные свойства:

```javascript
element.style.width = `${width}px`;
```

после validation.

---

# H.61. Shadow DOM

Shadow DOM не является security boundary.

Не следует считать:

```text
Shadow DOM
=
secure DOM
```

Это механизм encapsulation, а не защита от недоверенных данных.

---

# H.62. Web Components

Если extension использует Web Components:

```text
Component
 ↓
Shadow DOM
 ↓
Extension UI
```

данные всё равно должны проходить validation.

---

# H.63. IndexedDB

IndexedDB также не является secret storage.

Проверьте:

* [ ] Какие данные хранятся?
* [ ] Нужна ли persistence?
* [ ] Можно ли минимизировать данные?
* [ ] Есть ли migration?
* [ ] Проверяется ли integrity данных?

---

# H.64. Data Minimization

Очень важный принцип:

> **Не храните данные, которые вам не нужны.**

Вместо:

```text
store entire page
```

лучше:

```text
store only required fields
```

Это уменьшает последствия компрометации.

---

# H.65. Data Retention

Определите:

```text
How long?
```

Например:

```text
temporary data
   ↓
session

cache
   ↓
expiration

user settings
   ↓
persistent
```

---

# H.66. Privacy Checklist

Проверьте:

* [ ] Какие данные собирает extension?
* [ ] Какие данные отправляются на сервер?
* [ ] Какие данные сохраняются локально?
* [ ] Какие данные доступны content scripts?
* [ ] Какие данные доступны Service Worker?
* [ ] Можно ли уменьшить collection?
* [ ] Есть ли понятная privacy policy?

---

# H.67. Third-party Services

Если extension использует:

```text
Analytics
Error tracking
Remote API
AI API
CDN
Telemetry
```

необходимо определить:

```text
What data leaves the browser?
```

Особенно для content-heavy extensions.

---

# H.68. Content Script Data Leakage

Опасная архитектура:

```text
Page
 ↓
Content Script
 ↓
send entire DOM
 ↓
Service Worker
 ↓
Server
```

Лучше:

```text
Page
 ↓
extract required fields
 ↓
validate
 ↓
send minimal data
 ↓
Service Worker
```

---

# H.69. Network Response Validation

Никогда не предполагайте:

```text
HTTP 200
=
trusted response
```

Проверяйте:

```text
status
content type
schema
expected fields
size
```

---

# H.70. JSON Schema

Для сложных API полезна схема:

```typescript
type ServerConfig = {
  version: number;
  enabled: boolean;
  rules: Rule[];
};
```

И runtime validation:

```text
JSON
 ↓
schema validator
 ↓
ServerConfig
```

---

# H.71. Size Limits

Недоверенные данные должны иметь ограничения.

Например:

```text
message size
URL length
DOM text length
network response size
storage value size
rule count
```

Это помогает против:

```text
memory exhaustion
storage exhaustion
CPU abuse
```

---

# H.72. Denial of Service внутри Extension

Даже локальное extension может быть перегружено.

Например:

```text
MutationObserver
 ↓
DOM changes
 ↓
100,000 events
 ↓
100,000 messages
```

Поэтому используйте:

```text
debouncing
throttling
batching
deduplication
```

где это необходимо.

---

# H.73. MutationObserver Security

Не следует делать:

```javascript
observer = new MutationObserver(() => {
  expensiveOperation();
});
```

для каждого изменения DOM на огромной странице.

Лучше:

```text
Mutation
 ↓
collect
 ↓
debounce
 ↓
process batch
```

---

# H.74. Event Listener Abuse

Проверьте:

* [ ] Listeners удаляются, когда больше не нужны.
* [ ] Нет бесконечного добавления listeners.
* [ ] Нет duplicate handlers.
* [ ] Нет listeners на ненужных глобальных объектах.

---

# H.75. Memory Safety

Для long-running contexts:

```text
Side Panel
Options
Content Script
```

проверяйте:

```text
event listeners
MutationObservers
Timers
Ports
DOM references
Caches
```

и выполняйте cleanup.

---

# H.76. Port Security

`runtime.connect()` создаёт долгожившее соединение.

Проверьте:

* [ ] Кто может открыть Port?
* [ ] Какие сообщения допустимы?
* [ ] Есть ли disconnect handling?
* [ ] Есть ли timeout?
* [ ] Есть ли reconnect policy?
* [ ] Проверяется ли состояние отправителя?

---

# H.77. Port Flooding

Не следует принимать бесконечный поток сообщений:

```text
Port
 ↓
message
message
message
...
```

без контроля.

В зависимости от задачи могут понадобиться:

```text
rate limiting
batching
backpressure
message size limits
```

---

# H.78. Command Security

Keyboard commands обычно являются trusted user actions, но handler всё равно не должен обходить security checks.

Например:

```text
Ctrl+Shift+X
   ↓
delete all data
```

не означает, что можно игнорировать:

```text
state
permissions
confirmation
```

если операция критическая.

---

# H.79. Popup Security

Popup может быть маленьким, но имеет privileged capabilities через messaging.

Проверьте:

* [ ] Popup не выполняет непроверенные данные.
* [ ] Popup не передаёт произвольные commands.
* [ ] Sensitive actions требуют explicit user intent.
* [ ] Popup корректно закрывает ресурсы.

---

# H.80. Side Panel Security

Side Panel живёт дольше popup и поэтому может содержать больше state.

Проверьте:

```text
state synchronization
message validation
active tab validation
cleanup
navigation
external data
```

---

# H.81. Options Security

Options page часто работает с настройками, поэтому:

* [ ] валидируйте input;
* [ ] не используйте `innerHTML`;
* [ ] не храните secrets без необходимости;
* [ ] проверяйте значения перед сохранением;
* [ ] version settings;
* [ ] выполняйте migration.

---

# H.82. Service Worker Restart

Service Worker может завершаться и запускаться снова.

Нельзя полагаться на:

```javascript
let authenticated = true;
```

как на единственный security state.

После restart:

```text
Worker
 ↓
cold start
 ↓
restore state
 ↓
validate state
```

---

# H.83. Global Variables

Нельзя считать:

```javascript
let state = {};
```

надёжным persistent state.

Для критического состояния используйте соответствующий storage/backend.

Но storage тоже должен проходить validation.

---

# H.84. Alarms Security

Если extension использует:

```text
chrome.alarms
```

проверьте:

* [ ] Какие операции запускаются?
* [ ] Требуется ли повторная authorization?
* [ ] Не является ли alarm entry point для опасной операции?
* [ ] Проверяется ли актуальное состояние?

---

# H.85. Tabs Events

Navigation может приводить к неожиданным состояниям:

```text
Tab
 ↓
navigation
 ↓
new document
```

Старый content script state больше не должен автоматически считаться действительным.

Проверьте:

* [ ] tab ID;
* [ ] frame ID;
* [ ] document lifecycle;
* [ ] URL;
* [ ] state version.

---

# H.86. Frame Security

Особенно осторожно относитесь к:

```text
all_frames
```

Потому что extension может оказаться в разных frame contexts.

Не предполагайте:

```text
frame 0
=
only context
```

---

# H.87. Cross-Origin Frames

Страница может содержать:

```text
example.com
 ├── iframe A
 └── iframe B
```

где iframe принадлежат другим origins.

Поэтому content script architecture должна явно учитывать:

```text
origin
frameId
documentId
```

где это применимо.

---

# H.88. Supply Chain Checklist

Перед release:

* [ ] `npm audit` или аналогичный security audit.
* [ ] Dependency lockfile.
* [ ] Проверка подозрительных packages.
* [ ] Проверка postinstall scripts.
* [ ] Проверка bundled output.
* [ ] Проверка новых dependencies в PR.
* [ ] Review third-party code.

---

# H.89. Static Analysis

Используйте automated checks для обнаружения:

```text
eval
new Function
dangerous DOM APIs
hardcoded secrets
unsafe URLs
known vulnerabilities
```

Например:

```text
Source
 ↓
Lint
 ↓
Security scanner
 ↓
Dependency audit
 ↓
Tests
 ↓
Build
```

---

# H.90. Manifest Linting

Автоматически проверяйте:

```text
permissions
host_permissions
content_scripts
web_accessible_resources
CSP
background
externally_connectable
```

Цель:

```text
CI
 ↓
security policy
 ↓
fail build if violated
```

---

# H.91. Permission Regression

Очень полезная CI-проверка:

```text
Previous manifest
       ↓
Current manifest
       ↓
Permission diff
```

Например:

```text
+ <all_urls>
+ cookies
```

CI должна остановить release и потребовать review.

---

# H.92. Host Permission Regression

То же самое относится к hosts:

```text
Old:
https://example.com/*

New:
<all_urls>
```

Это должно быть заметным security event.

---

# H.93. Bundle Inspection

После production build необходимо проверить результат:

```text
dist/
 ├── manifest.json
 ├── service-worker.js
 ├── popup.js
 ├── content.js
 └── ...
```

И искать:

```text
API keys
tokens
passwords
debug code
remote code
unexpected dependencies
```

---

# H.94. Secret Scanning

CI должен проверять:

```text
API_KEY=
SECRET=
TOKEN=
PRIVATE_KEY=
PASSWORD=
```

и другие patterns.

Но автоматический scanner не заменяет manual review.

---

# H.95. Release Signing and Integrity

Distribution pipeline должен контролировать:

```text
Source
 ↓
Build
 ↓
Artifact
 ↓
Review
 ↓
Publish
```

Release artifact не должен неожиданно отличаться от проверенного build.

---

# H.96. Store Security

Перед публикацией extension:

* [ ] Проверен manifest.
* [ ] Проверены permissions.
* [ ] Проверены host permissions.
* [ ] Удалены debug artifacts.
* [ ] Проверен production bundle.
* [ ] Проверена privacy policy.
* [ ] Проверены external services.
* [ ] Проверены screenshots/descriptions на отсутствие sensitive information.

---

# H.97. Update Security

Обновление extension должно рассматриваться как security-sensitive operation.

Проверяйте:

```text
new version
 ↓
manifest diff
 ↓
permission diff
 ↓
dependency diff
 ↓
code review
 ↓
security tests
 ↓
release
```

---

# H.98. Incident Response

Нужно заранее определить:

```text
Что делать, если dependency compromised?
Что делать, если API key leaked?
Что делать, если опубликована уязвимая версия?
Что делать, если server compromised?
Что делать, если пользовательские данные раскрыты?
```

---

# H.99. Emergency Release

Production extension должен иметь возможность быстро выпустить исправление.

Минимальный pipeline:

```text
Issue
 ↓
Patch
 ↓
Security tests
 ↓
Build
 ↓
Release
 ↓
Store update
```

---

# H.100. Security Review перед Release

Перед каждым release:

```text
[ ] Manifest
[ ] Permissions
[ ] Host permissions
[ ] CSP
[ ] Content scripts
[ ] MAIN world
[ ] Messaging
[ ] Storage
[ ] Network
[ ] DOM
[ ] Dependencies
[ ] Secrets
[ ] Build
[ ] Distribution
```

---

# H.101. Architecture Security Review

Кроме code review необходимо проводить architecture review.

Задайте вопросы:

### Trust

```text
Кому мы доверяем?
Кому не доверяем?
```

### Data

```text
Какие данные проходят между contexts?
```

### Privilege

```text
Какой context имеет максимальные права?
```

### Entry Points

```text
Какие существуют входы в систему?
```

### Execution

```text
Где может выполняться код?
```

---

# H.102. Attack Surface Map

Полезно нарисовать карту:

```text
                  Internet
                     │
                     ▼
                  Network
                     │
                     ▼
              ┌──────────────┐
              │ Service      │
              │ Worker       │
              └──────┬───────┘
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       Popup      SidePanel   Options
          │          │          │
          └──────────┼──────────┘
                     │
                     ▼
                Content Script
                     │
                     ▼
                  Web Page
                     │
                     ▼
                   DOM
```

Для каждой стрелки задайте:

```text
Trusted?
Authenticated?
Validated?
Authorized?
```

---

# H.103. Security Boundary Matrix

| Boundary              | Trust level     | Основная защита        |
| --------------------- | --------------- | ---------------------- |
| Network → Extension   | Untrusted       | Validation             |
| Page → Content Script | Untrusted       | Sanitization           |
| Content Script → SW   | Untrusted input | Schema + authorization |
| Popup → SW            | Semi-trusted    | Validation             |
| Side Panel → SW       | Semi-trusted    | Validation             |
| Options → SW          | Semi-trusted    | Validation             |
| Storage → Runtime     | Untrusted state | Validation             |
| SW → DNR              | Controlled      | Rule validation        |
| Extension → Server    | External        | TLS + auth             |

---

# H.104. Security Layers

Безопасность extension лучше строить слоями:

```text
Layer 1
Manifest
    ↓
Layer 2
Permissions
    ↓
Layer 3
Context isolation
    ↓
Layer 4
CSP
    ↓
Layer 5
Input validation
    ↓
Layer 6
Authorization
    ↓
Layer 7
Data protection
    ↓
Layer 8
Monitoring
    ↓
Layer 9
Secure updates
```

Ни один отдельный механизм не должен считаться достаточным.

---

# H.105. Defense in Depth

Правильная security architecture:

```text
Attacker
   ↓
Permission boundary
   ↓
Context boundary
   ↓
Message validation
   ↓
Authorization
   ↓
Input validation
   ↓
Safe DOM/API
   ↓
Minimal data
```

Если один слой ошибся, следующие слои должны ограничить последствия.

---

# H.106. Secure Extension Architecture

Хорошая архитектура может выглядеть следующим образом:

```text
                 ┌──────────────┐
                 │ Web Page     │
                 └──────┬───────┘
                        │
                 untrusted input
                        │
                        ▼
                 ┌──────────────┐
                 │Content Script│
                 └──────┬───────┘
                        │
                   validated
                    message
                        │
                        ▼
              ┌───────────────────┐
              │  Service Worker   │
              │                   │
              │ Authorization     │
              │ State             │
              │ Policy            │
              └───────┬───────────┘
                      │
             ┌────────┼────────┐
             ▼        ▼        ▼
          Storage    DNR     Network
```

---

# H.107. Security Invariants

Полезно определить несколько invariant'ов.

Например:

### Invariant 1

```text
No untrusted input is executed as code.
```

### Invariant 2

```text
No unnecessary permission is granted.
```

### Invariant 3

```text
Every external message is validated.
```

### Invariant 4

```text
Sensitive operations require authorization.
```

### Invariant 5

```text
Secrets never enter page context.
```

### Invariant 6

```text
Remote data is never treated as executable code.
```

---

# H.108. Security Checklist для Content Script

```text
[ ] Page считается untrusted
[ ] DOM считается untrusted
[ ] Input validated
[ ] innerHTML минимизирован
[ ] URLs validated
[ ] postMessage validated
[ ] Messages to SW validated
[ ] MAIN world avoided where possible
[ ] No secrets exposed
[ ] MutationObserver controlled
[ ] Event listeners cleaned up
```

---

# H.109. Security Checklist для Service Worker

```text
[ ] Minimal permissions
[ ] Minimal host permissions
[ ] Messages validated
[ ] Sender/context checked
[ ] Authorization performed
[ ] Storage validated
[ ] Network responses validated
[ ] No remote code
[ ] No secrets in logs
[ ] State survives restart correctly
[ ] DNR rules validated
```

---

# H.110. Security Checklist для Popup

```text
[ ] User input validated
[ ] DOM safe
[ ] Messages typed
[ ] Sensitive operations explicit
[ ] No secrets rendered unnecessarily
[ ] No arbitrary navigation
```

---

# H.111. Security Checklist для Side Panel

```text
[ ] State validated
[ ] Active tab verified
[ ] Messages validated
[ ] External data validated
[ ] Long-lived resources cleaned
[ ] No unnecessary privileged operations
```

---

# H.112. Security Checklist для Options

```text
[ ] Form input validated
[ ] Settings schema enforced
[ ] Storage validated
[ ] Migration tested
[ ] No secrets in UI
[ ] No arbitrary HTML injection
```

---

# H.113. Security Checklist для Network Layer

```text
[ ] HTTPS
[ ] Host permissions minimal
[ ] Response schema validated
[ ] Authentication correct
[ ] Tokens protected
[ ] No credentials in URLs
[ ] Redirects validated
[ ] Remote configuration treated as data
```

---

# H.114. Security Checklist для DNR

```text
[ ] Rules validated
[ ] Rule IDs unique
[ ] Rules optimized
[ ] Rule limits respected
[ ] Dynamic rules controlled
[ ] Session rules cleaned
[ ] Allow/block conflicts tested
[ ] Redirect destinations validated
[ ] Header modifications reviewed
```

---

# H.115. Security Checklist для Build

```text
[ ] Dependencies audited
[ ] Lockfile committed
[ ] Secrets scanned
[ ] Manifest validated
[ ] Permissions diff checked
[ ] Host diff checked
[ ] Bundle inspected
[ ] Debug code removed
[ ] Source maps reviewed
```

---

# H.116. Security Checklist для Release

```text
[ ] Security review completed
[ ] Privacy review completed
[ ] Manifest reviewed
[ ] Permissions reviewed
[ ] Dependencies reviewed
[ ] E2E tests passed
[ ] Production artifact inspected
[ ] Release version verified
[ ] Rollback/emergency plan available
```

---

# H.117. Полный Pre-Release Checklist

Перед публикацией:

```text
MANIFEST
[ ] Manifest V3
[ ] Minimal permissions
[ ] Minimal host permissions
[ ] Restricted content scripts
[ ] Restricted web resources
[ ] Secure CSP

RUNTIME
[ ] Service Worker secure
[ ] Context boundaries understood
[ ] No unnecessary MAIN world
[ ] Lifecycle handled

MESSAGING
[ ] Schemas defined
[ ] Inputs validated
[ ] Sender validated
[ ] Authorization implemented
[ ] Errors handled

DOM
[ ] No unsafe HTML injection
[ ] URLs validated
[ ] Page considered untrusted
[ ] MutationObserver controlled

NETWORK
[ ] HTTPS
[ ] Responses validated
[ ] Tokens protected
[ ] Remote data treated as data
[ ] Redirects validated

STORAGE
[ ] Minimal data
[ ] Schema validation
[ ] Migration
[ ] No unnecessary secrets

DNR
[ ] Rules validated
[ ] IDs unique
[ ] Limits checked
[ ] Conflicts tested

DEPENDENCIES
[ ] Lockfile
[ ] Audit
[ ] Dependency review
[ ] Supply chain review

BUILD
[ ] Secret scan
[ ] Bundle inspection
[ ] Manifest diff
[ ] Permission diff

RELEASE
[ ] Security tests
[ ] Privacy review
[ ] Production artifact verified
[ ] Incident plan
```

---

# H.118. Security Maturity Levels

Security можно развивать постепенно.

### Level 1 — Basic

```text
MV3
Minimal permissions
No eval
Basic validation
```

### Level 2 — Structured

```text
Typed messaging
Schema validation
Dependency audit
Secure storage model
```

### Level 3 — Production

```text
Threat model
CI security checks
Permission regression
E2E security tests
Secret scanning
```

### Level 4 — Mature

```text
Security architecture
Supply-chain controls
Automated policy enforcement
Incident response
Continuous dependency monitoring
```

---

# H.119. Threat Model

Для серьёзного extension полезно составить собственную threat model.

Минимальная структура:

```text
Assets
   ↓
Threats
   ↓
Attack Surface
   ↓
Trust Boundaries
   ↓
Mitigations
   ↓
Residual Risk
```

Например:

```text
Asset:
Authentication token

Threat:
Page attempts to obtain token

Boundary:
Content Script ↔ Page

Mitigation:
Never expose token to page context
```

---

# H.120. STRIDE-подобный анализ

Для каждого communication channel можно спросить:

```text
Spoofing?
Tampering?
Repudiation?
Information Disclosure?
Denial of Service?
Elevation of Privilege?
```

Например:

```text
Content Script → Service Worker
```

### Spoofing

Может ли другой источник выдавать себя за допустимый sender?

### Tampering

Можно ли изменить message?

### Information Disclosure

Не возвращает ли SW слишком много данных?

### DoS

Можно ли отправить тысячи messages?

### Elevation of Privilege

Можно ли через content script получить privileged operation?

---

# H.121. Самая важная security boundary

Для большинства сложных extensions одной из главных границ является:

```text
WEB PAGE
   ↕
CONTENT SCRIPT
   ↕
SERVICE WORKER
```

Здесь одновременно пересекаются:

```text
Untrusted Web
        +
Extension Privileges
```

Поэтому особенно важно:

```text
Page input
   ↓
Content Script validation
   ↓
Message schema
   ↓
Service Worker validation
   ↓
Authorization
   ↓
Privileged API
```

---

# H.122. Не полагайтесь на один механизм

Неправильно:

> «У нас есть isolated world, поэтому extension безопасно».

Или:

> «У нас есть CSP, поэтому XSS невозможен».

Или:

> «У нас Manifest V3, поэтому remote code невозможен».

Безопасность должна быть многослойной:

```text
Manifest
 +
Permissions
 +
CSP
 +
Isolation
 +
Validation
 +
Authorization
 +
Safe DOM
 +
Secure Network
 +
Dependency Security
 +
Secure Build
 +
Secure Distribution
```

---

# H.123. Golden Rules

Для практической разработки можно свести весь checklist к следующим правилам.

### Rule 1

> **Минимизируй permissions.**

### Rule 2

> **Считай web page недоверенной.**

### Rule 3

> **Считай все внешние данные недоверенными.**

### Rule 4

> **Никогда не превращай данные в код.**

### Rule 5

> **Валидируй каждое сообщение.**

### Rule 6

> **Разделяй validation и authorization.**

### Rule 7

> **Не помещай secrets в page context.**

### Rule 8

> **Не используй DOM API как будто они безопасны сами по себе.**

### Rule 9

> **Не превращай Service Worker в универсальный privileged RPC endpoint.**

### Rule 10

> **Используй declarative APIs там, где они подходят.**

### Rule 11

> **Минимизируй хранимые данные.**

### Rule 12

> **Проверяй dependencies и build pipeline.**

### Rule 13

> **Проверяй permission и host permission diff при каждом release.**

### Rule 14

> **Проектируй security как часть архитектуры, а не как последний этап.**

---

# H.124. Итоговая Security Architecture

Безопасное Manifest V3 extension можно представить следующим образом:

```text
                         INTERNET
                            │
                            ▼
                    ┌───────────────┐
                    │    Network    │
                    └───────┬───────┘
                            │
                       Validate
                            │
                            ▼
                 ┌─────────────────────┐
                 │   Service Worker    │
                 │                     │
                 │  Authorization      │
                 │  State              │
                 │  Policy             │
                 └───────┬───────┬─────┘
                         │       │
                    Storage      DNR
                         │       │
                         │       ▼
                         │   Browser Engine
                         │
        ┌────────────────┼──────────────────┐
        │                │                  │
        ▼                ▼                  ▼
     Popup           Side Panel          Options
        │                │                  │
        └────────────────┼──────────────────┘
                         │
                    Typed Messages
                         │
                         ▼
                  ┌───────────────┐
                  │ Content Script│
                  └───────┬───────┘
                          │
                     Untrusted DOM
                          │
                          ▼
                     WEB PAGE
```

Здесь каждая граница имеет собственную security policy.

---

# H.125. Финальный принцип

Manifest V3 следует рассматривать не просто как новый формат `manifest.json`.

Это модель:

```text
Least Privilege
        +
Isolation
        +
Event-driven Runtime
        +
Declarative Execution
        +
Browser-managed Lifecycle
        +
Explicit Communication
        +
Validated Data
```

Именно поэтому security extension начинается не с вопроса:

> «Как защитить этот JavaScript-файл?»

а с вопроса:

> **«Какие capabilities получает каждый context, кому он доверяет, какие данные принимает и какие действия может выполнить?»**

Если эти границы спроектированы правильно, то безопасность становится свойством всей архитектуры:

```text
                SECURITY
                    │
       ┌────────────┼────────────┐
       ▼            ▼            ▼
   Manifest      Runtime       Code
       │            │            │
 Permissions    Isolation     Validation
       │            │            │
   Host access   Messaging      CSP
       │            │            │
       └────────────┼────────────┘
                    ▼
             Secure Extension
```

**Главный принцип приложения H:**

> **Secure Extension = минимальные capabilities + изоляция contexts + явные trust boundaries + строгая валидация данных + контролируемое выполнение.**

Именно такая модель позволяет строить Manifest V3 extensions, которые являются не просто работающими браузерными дополнениями, а **production-grade программными системами**.
