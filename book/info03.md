# Приложение C. Host Match Patterns

Host match patterns — это язык описания web-адресов, к которым Manifest V3 extension может получить доступ.

Они используются прежде всего в:

- `host_permissions`;
- `content_scripts.matches`;
- `content_scripts.exclude_matches`;
- `chrome.scripting` в сценариях, где требуется host access;
- некоторых других механизмах расширений.

Host pattern отвечает на вопрос:

> **На каких URL extension должен иметь возможность работать?**

Это не обычный URL-шаблон и не glob в общем смысле. Это специальный формат Chrome Extension Match Pattern.

---

# C.1. Общая структура

Базовая форма:

```text
scheme://host/path
```

Например:

```text
https://example.com/*
```

Разберём:

```text
https://example.com/*
│      │           │
│      │           └── path
│      └────────────── host
└───────────────────── scheme
```

Другие примеры:

```text
http://example.com/*
https://example.com/*
https://*.example.com/*
http://*/*
https://*/*
<all_urls>
```

---

# C.2. Match Pattern — это не URL

Важно различать:

```text
URL
```

и:

```text
Match Pattern
```

URL:

```text
https://example.com/products?id=42
```

Match pattern:

```text
https://example.com/*
```

Первый описывает конкретный ресурс.

Второй описывает множество URL.

То есть:

```text
Pattern
   ↓
set of URLs
```

---

# C.3. Три компонента pattern

Host match pattern концептуально состоит из:

```text
scheme://host/path
```

Например:

```text
https://*.example.com/products/*
```

можно представить как:

```text
scheme = https
host   = *.example.com
path   = /products/*
```

---

# C.4. Scheme

В большинстве обычных сценариев используются:

```text
http
https
```

Например:

```text
http://example.com/*
https://example.com/*
```

Для расширений также существует специальная комбинация:

```text
<all_urls>
```

которая соответствует поддерживаемым URL schemes.

---

# C.5. `http://`

Pattern:

```text
http://example.com/*
```

соответствует HTTP URL:

```text
http://example.com/
http://example.com/index.html
http://example.com/products
http://example.com/products/42
```

Но не соответствует:

```text
https://example.com/
```

Потому что:

```text
http ≠ https
```

---

# C.6. `https://`

Pattern:

```text
https://example.com/*
```

соответствует:

```text
https://example.com/
https://example.com/about
https://example.com/products/42
```

Но не:

```text
http://example.com/
```

---

# C.7. `*` в scheme

В некоторых match pattern используется:

```text
*://example.com/*
```

Это означает HTTP и HTTPS.

То есть концептуально:

```text
*://example.com/*
      │
      ├── http://example.com/*
      └── https://example.com/*
```

Для большинства обычных web extensions это удобнее, чем перечислять обе схемы отдельно.

Однако принцип Least Privilege говорит:

> Если HTTPS достаточно, не расширяйте pattern до HTTP без необходимости.

---

# C.8. Host

Host — доменная часть pattern:

```text
https://example.com/*
       └───────────┘
```

Можно указать конкретный hostname:

```text
https://example.com/*
```

или wildcard:

```text
https://*.example.com/*
```

---

# C.9. Конкретный домен

Самый ограниченный вариант:

```text
https://example.com/*
```

Он предназначен для конкретного host.

Например:

```text
https://example.com/
https://example.com/products
https://example.com/account/settings
```

---

# C.10. Subdomains

Для доступа к subdomains используется:

```text
https://*.example.com/*
```

Например:

```text
https://www.example.com/
https://api.example.com/
https://admin.example.com/
https://foo.bar.example.com/
```

Важная идея:

```text
*.example.com
```

означает host hierarchy под `example.com`.

---

# C.11. Wildcard host

В некоторых patterns можно использовать wildcard host:

```text
http://*/*
```

или:

```text
https://*/*
```

Это означает очень широкий набор hosts.

Например:

```text
https://example.com/*
https://google.com/*
https://github.com/*
https://foo.example.org/*
```

и т. д.

Поэтому:

```text
https://*/*
```

следует считать широким host permission.

---

# C.12. `<all_urls>`

Специальный pattern:

```text
<all_urls>
```

означает доступ ко всем URL, которые соответствуют поддерживаемым схемам match patterns.

Например:

```json
{
  "host_permissions": ["<all_urls>"]
}
```

Это один из самых широких вариантов.

Использовать его следует только тогда, когда функциональность действительно требует работы с широким множеством сайтов.

---

# C.13. Почему `<all_urls>` опасен

Сравним:

```json
{
  "host_permissions": ["<all_urls>"]
}
```

и:

```json
{
  "host_permissions": ["https://example.com/*"]
}
```

В первом случае:

```text
Extension
   ↓
almost entire Web
```

Во втором:

```text
Extension
   ↓
example.com
```

Разница огромна с точки зрения:

- security;
- privacy;
- permission warnings;
- user trust;
- attack surface.

---

# C.14. Path

Последняя часть:

```text
https://example.com/*
                   ↑
                 path
```

описывает путь URL.

Например:

```text
https://example.com/products/*
```

означает URLs внутри соответствующего path.

Концептуально:

```text
https://example.com/products/
https://example.com/products/1
https://example.com/products/books
```

---

# C.15. Path wildcard

Чаще всего используется:

```text
/*
```

Например:

```text
https://example.com/*
```

Это означает:

> Все подходящие URL paths данного host.

---

# C.16. Только корень сайта

Важно понимать различие между:

```text
https://example.com/*
```

и попытками описать конкретный URL.

Match patterns имеют специальную семантику и не являются произвольным glob language.

Поэтому не следует проектировать pattern как:

```text
https://example.com/*.html
```

в надежде получить полноценный filename glob.

Для сложной фильтрации URL лучше использовать дополнительную runtime logic.

---

# C.17. Query string

Match patterns работают прежде всего с:

```text
scheme
host
path
```

а не с query parameters.

Например:

```text
https://example.com/products?id=42
```

не следует пытаться описать через:

```text
https://example.com/*?id=42
```

как обычный URL matcher.

Если нужно анализировать:

```text
?id=42
```

это обычно выполняется программно:

```javascript
const url = new URL(location.href);

const id = url.searchParams.get('id');
```

Таким образом:

```text
Match Pattern
      ↓
coarse URL scope

JavaScript
      ↓
fine-grained URL logic
```

---

# C.18. Fragment

Аналогично fragment:

```text
https://example.com/page#section
```

не следует рассматривать как отдельный match-pattern component.

Например:

```text
#section
```

обычно анализируется уже внутри страницы:

```javascript
location.hash;
```

---

# C.19. Примеры pattern

### Конкретный сайт

```text
https://example.com/*
```

### Все HTTPS сайты

```text
https://*/*
```

### Все HTTP сайты

```text
http://*/*
```

### HTTP + HTTPS конкретного сайта

```text
*://example.com/*
```

### Все subdomains

```text
https://*.example.com/*
```

### Конкретный раздел сайта

```text
https://example.com/app/*
```

### Все поддерживаемые URL

```text
<all_urls>
```

---

# C.20. Match patterns и `host_permissions`

Например:

```json
{
  "host_permissions": ["https://example.com/*"]
}
```

Это означает:

```text
Extension
   │
   └── Host capability
          │
          └── https://example.com/*
```

Host permission не означает:

> Extension автоматически выполняет JavaScript на сайте.

Он предоставляет host access, который может быть необходим для определённых extension capabilities.

---

# C.21. Match patterns и content scripts

В `content_scripts`:

```json
{
  "content_scripts": [
    {
      "matches": ["https://example.com/*"],
      "js": ["content.js"]
    }
  ]
}
```

означает:

```text
Navigate to matching URL
          ↓
Browser evaluates pattern
          ↓
Match
          ↓
Inject content.js
```

---

# C.22. `matches`

Основное поле:

```json
{
  "content_scripts": [
    {
      "matches": ["https://example.com/*"],
      "js": ["content.js"]
    }
  ]
}
```

`matches` определяет URLs, на которых content script **может быть автоматически инъецирован**.

---

# C.23. Несколько patterns

Можно указать несколько patterns:

```json
{
  "content_scripts": [
    {
      "matches": [
        "https://example.com/*",
        "https://github.com/*",
        "https://stackoverflow.com/*"
      ],
      "js": ["content.js"]
    }
  ]
}
```

Логически:

```text
matches =
    example.com
    OR github.com
    OR stackoverflow.com
```

---

# C.24. Один script — несколько сайтов

Это позволяет создавать единый integration layer:

```text
content.js
   │
   ├── example.com
   ├── github.com
   └── stackoverflow.com
```

Но внутри script необходимо учитывать различия DOM:

```javascript
if (location.hostname === 'github.com') {
  // GitHub integration
}
```

Лучше архитектурно разделять adapters:

```text
content/
├── content.js
├── sites/
│   ├── github.js
│   ├── example.js
│   └── stackoverflow.js
```

---

# C.25. `exclude_matches`

Можно исключить URLs:

```json
{
  "content_scripts": [
    {
      "matches": ["https://*.example.com/*"],
      "exclude_matches": ["https://admin.example.com/*"],
      "js": ["content.js"]
    }
  ]
}
```

Логика:

```text
matches
    ↓
include

exclude_matches
    ↓
remove exceptions
```

То есть:

```text
*.example.com
     │
     ├── www.example.com ✓
     ├── app.example.com ✓
     └── admin.example.com ✗
```

---

# C.26. `include_globs`

В некоторых сценариях content scripts можно дополнительно ограничивать через:

```json
{
  "include_globs": ["*://example.com/products/*"]
}
```

Это дополнительный механизм фильтрации.

Важно понимать архитектурную последовательность:

```text
matches
   ↓
include_globs
   ↓
exclude_matches
   ↓
exclude_globs
```

Не следует воспринимать эти поля как четыре независимых permission systems.

---

# C.27. `exclude_globs`

Например:

```json
{
  "matches": ["https://example.com/*"],
  "exclude_globs": ["https://example.com/private/*"]
}
```

Тогда:

```text
example.com/*
      │
      ├── /products/ ✓
      ├── /docs/ ✓
      └── /private/ ✗
```

---

# C.28. Match pattern и glob — разные понятия

Очень распространённая ошибка:

```text
Match Pattern = обычный glob
```

Это неверно.

Например:

```text
https://*.example.com/*
```

выглядит как glob, но имеет специальную семантику Chrome Extension platform.

Поэтому нельзя переносить правила:

```text
bash glob
npm glob
regex
URL pattern
```

друг на друга.

---

# C.29. Match pattern ≠ Regular Expression

Нельзя написать:

```text
https://(www|api)\.example\.com/.*
```

как обычный regex.

Match patterns не являются регулярными выражениями.

Правильный подход:

```text
Manifest
   ↓
coarse host matching

Runtime
   ↓
URL / regex / business rules
```

---

# C.30. Более сложная фильтрация

Допустим, нужно работать только с:

```text
https://example.com/products/123
```

где `123` — число.

Match pattern может определить:

```text
https://example.com/products/*
```

а затем JavaScript проверяет:

```javascript
const match = location.pathname.match(/^\/products\/\d+$/);

if (!match) {
  return;
}
```

Таким образом:

```text
Manifest pattern
       ↓
broad enough scope
       ↓
runtime matcher
       ↓
precise business condition
```

---

# C.31. Host permission и security boundary

Рассмотрим:

```json
{
  "host_permissions": ["https://bank.example/*"]
}
```

Теперь extension обладает capability, относящейся к этому origin.

Если extension получает:

```text
cookies
+
host access
```

это особенно чувствительная комбинация.

Поэтому host patterns должны рассматриваться как security boundary.

---

# C.32. Host permissions и user trust

Сравним два extension:

### Extension A

```text
https://example.com/*
```

### Extension B

```text
<all_urls>
```

Пользователь может воспринимать их совершенно по-разному.

Даже если Extension B технически использует доступ только к одному сайту, его manifest сообщает браузеру:

```text
I may operate broadly across the Web.
```

Поэтому минимизация patterns — часть UX.

---

# C.33. Host permissions и `activeTab`

Одна из самых полезных архитектурных техник:

```text
User action
    ↓
activeTab
    ↓
temporary access
    ↓
operate on current page
```

Вместо:

```text
<all_urls>
```

Это особенно хорошо подходит для:

- page formatters;
- screenshot tools;
- analyzers;
- accessibility tools;
- page transformers;
- developer utilities.

---

# C.34. Host patterns и `chrome.scripting`

Рассмотрим:

```javascript
await chrome.scripting.executeScript({
  target: {
    tabId,
  },
  func: () => {
    document.body.style.background = 'yellow';
  },
});
```

В зависимости от сценария extension должен иметь соответствующий access к target page.

Например:

```text
scripting
+
host access
```

или:

```text
scripting
+
activeTab
```

Это снова показывает:

```text
API capability
       +
Host capability
       =
Permission model
```

---

# C.35. Dynamic host access

Современный extension может не знать заранее все сайты, которые пользователь захочет подключить.

Тогда вместо:

```json
{
  "host_permissions": ["<all_urls>"]
}
```

может использоваться optional host access.

Например:

```json
{
  "optional_host_permissions": ["https://*/*"]
}
```

а затем запрашивать доступ к нужному host в runtime.

Идея:

```text
Install
   ↓
No broad access
   ↓
User chooses site
   ↓
Request permission
   ↓
Site enabled
```

---

# C.36. Dynamic host access — более безопасная модель

Представим приложение:

> Универсальный web analyzer.

Плохая модель:

```text
Install
 ↓
<all_urls>
```

Более осторожная:

```text
Install
 ↓
No host access
 ↓
User opens example.com
 ↓
Clicks "Enable analyzer"
 ↓
Request host access
 ↓
Analyzer enabled
```

Это называется permission-on-demand architecture.

---

# C.37. Host patterns и `optional_host_permissions`

Manifest:

```json
{
  "optional_host_permissions": ["https://*/*"]
}
```

Runtime:

```javascript
await chrome.permissions.request({
  origins: ['https://example.com/*'],
});
```

После разрешения:

```text
example.com
     ↓
granted
     ↓
extension can use permitted capability
```

---

# C.38. Проверка host permission

Можно проверять:

```javascript
const granted = await chrome.permissions.contains({
  origins: ['https://example.com/*'],
});
```

Это позволяет строить UI:

```text
Site Integration

example.com
   ✓ Enabled

github.com
   ✗ Not enabled
```

---

# C.39. Host permission revocation

Пользователь или browser state может изменить permission state.

Поэтому extension не должен предполагать:

```text
Once granted = forever guaranteed
```

Архитектура должна быть:

```text
Before operation
      ↓
Check capability
      ↓
Execute
      ↓
Handle denial/failure
```

---

# C.40. `http` и `https`

Если приложение работает только с HTTPS:

```text
https://example.com/*
```

не нужно автоматически писать:

```text
*://example.com/*
```

Потому что:

```text
*://
```

расширяет scope.

Principle of Least Privilege:

```text
Required
   ↓
https
```

лучше, чем:

```text
Possibly useful
   ↓
http + https
```

---

# C.41. `www` и apex domain

Рассмотрим:

```text
example.com
www.example.com
```

Это разные hosts.

Pattern:

```text
https://example.com/*
```

не следует автоматически воспринимать как:

```text
https://www.example.com/*
```

Если приложение должно работать на обоих, архитектура должна явно это учитывать.

Например:

```json
{
  "host_permissions": ["https://example.com/*", "https://www.example.com/*"]
}
```

---

# C.42. Subdomain wildcard

Pattern:

```text
https://*.example.com/*
```

нужно использовать осознанно.

Он расширяет scope:

```text
www.example.com
api.example.com
admin.example.com
dev.example.com
...
```

Особенно опасен случай:

```text
https://*.example.com/*
```

если один из subdomains содержит административные или sensitive interfaces.

---

# C.43. Third-party domains

Представим приложение:

```text
example.com
```

которое использует:

```text
api.example.net
```

Если content script работает только на:

```text
example.com
```

это не означает автоматически, что ему нужен host permission для:

```text
api.example.net
```

Network access и page injection — разные задачи.

Не следует добавлять:

```text
api.example.net
```

только потому, что приложение делает API requests.

Сначала нужно определить:

```text
Where is request executed?
Which API is used?
Does CORS apply?
Does extension host access apply?
```

---

# C.44. Host permissions и network layer

Для extension architecture полезно разделять:

```text
Page access
     │
     └── content script / injection

Network access
     │
     └── fetch / extension APIs
```

Они могут требовать разные capabilities.

Например:

```text
Content Script
      ↓
example.com DOM

Service Worker
      ↓
api.example.net
```

Это две разные security boundaries.

---

# C.45. Host pattern для content script

Типичный production manifest:

```json
{
  "manifest_version": 3,
  "name": "Site Assistant",
  "version": "1.0.0",

  "content_scripts": [
    {
      "matches": ["https://app.example.com/*"],
      "js": ["content.js"]
    }
  ]
}
```

Здесь extension интегрируется только:

```text
app.example.com
```

а не:

```text
*.example.com
```

---

# C.46. Host pattern с несколькими приложениями

Например:

```json
{
  "content_scripts": [
    {
      "matches": ["https://app.example.com/*", "https://admin.example.com/*"],
      "js": ["content.js"]
    }
  ]
}
```

Можно разделить поведение:

```javascript
switch (location.hostname) {
  case 'app.example.com':
    initApp();
    break;

  case 'admin.example.com':
    initAdmin();
    break;
}
```

---

# C.47. SPA и match patterns

Host match pattern определяет URL scope, но не понимает application routing так, как SPA framework.

Например:

```text
https://app.example.com/
https://app.example.com/dashboard
https://app.example.com/settings
```

могут быть одной SPA.

Pattern:

```text
https://app.example.com/*
```

покрывает их URL scope.

Но переход:

```text
/dashboard
        ↓
/settings
```

может происходить без полноценной page navigation.

Поэтому для SPA extension часто нужна дополнительная логика:

```text
Match Pattern
      ↓
Initial injection
      ↓
SPA navigation detection
      ↓
Application integration
```

---

# C.48. Match patterns и iframes

Если content script должен работать во всех frames:

```json
{
  "content_scripts": [
    {
      "matches": ["https://example.com/*"],
      "all_frames": true,
      "js": ["content.js"]
    }
  ]
}
```

Match pattern определяет URL frame, а:

```text
all_frames
```

определяет scope injection относительно frame hierarchy.

Это два разных измерения.

---

# C.49. `match_about_blank`

Некоторые страницы используют:

```text
about:blank
```

или другие special frame URLs.

Для таких сценариев существует:

```json
{
  "match_about_blank": true
}
```

Это особенно важно при работе с embedded frames.

Архитектурно:

```text
Top-level page
      │
      └── iframe
             │
             └── about:blank
```

Обычный host match самого `about:blank` не всегда отражает origin, который extension ожидает.

---

# C.50. Ограничения Match Patterns

Host Match Patterns не являются универсальным URL routing language.

Они не предназначены для:

```text
regex matching
query parameter matching
arbitrary business rules
DOM conditions
authentication state
user role
```

Их задача значительно проще:

```text
Define URL scope
```

---

# C.51. Match Pattern → Runtime Condition

Хорошая архитектура использует два уровня:

```text
                    URL
                     │
                     ▼
              Match Pattern
                     │
                     ▼
              Content Script
                     │
                     ▼
             Runtime conditions
                     │
          ┌──────────┼──────────┐
          │          │          │
       pathname    query      DOM
```

Например:

```javascript
if (!location.pathname.startsWith('/products/')) {
  return;
}

if (!document.querySelector('[data-product]')) {
  return;
}

initProductAnalyzer();
```

---

# C.52. Широкий pattern + узкая runtime logic

Иногда это правильнее:

```text
https://app.example.com/*
```

а внутри:

```javascript
if (!isSupportedRoute()) {
  return;
}

if (!isSupportedPageType()) {
  return;
}

start();
```

чем создавать десятки сложных manifest patterns.

Это улучшает поддерживаемость.

---

# C.53. Но слишком широкий pattern тоже плох

Нельзя использовать:

```text
https://app.example.com/*
```

если приложение реально работает только на:

```text
https://app.example.com/editor/*
```

и при этом content script тяжёлый.

Потому что:

```text
Broad match
     ↓
More injections
     ↓
More startup cost
     ↓
More DOM work
     ↓
More performance cost
```

Поэтому security и performance здесь совпадают:

> Более узкий match pattern часто одновременно является более безопасным и более быстрым.

---

# C.54. Match Patterns и performance

Предположим:

```text
content.js = 500 KB
```

и pattern:

```text
<all_urls>
```

Тогда потенциально огромное количество страниц может запускать ваш код.

Если вместо этого:

```text
https://app.example.com/*
```

то runtime scope намного меньше.

Таким образом:

```text
Narrow scope
   ↓
fewer executions
   ↓
lower CPU usage
   ↓
lower memory pressure
```

---

# C.55. Match Patterns как compile-time declaration

Для framework архитектуры особенно интересна следующая идея:

```text
Developer declares

extension.host("https://example.com/*")
```

Framework анализирует:

```text
features
   ↓
required hosts
   ↓
match patterns
```

и генерирует:

```json
{
  "host_permissions": ["https://example.com/*"]
}
```

То есть Match Patterns могут стать частью:

```text
Extension IR
```

---

# C.56. Host Pattern normalization

Framework или build system может нормализовать patterns.

Например:

```text
https://example.com/*
https://example.com/*
```

не должны приводить к:

```json
["https://example.com/*", "https://example.com/*"]
```

а должны быть сведены к:

```json
["https://example.com/*"]
```

---

# C.57. Host Pattern analysis

Build tool может проверять:

```text
Does this pattern duplicate another?
Is it broader than another?
Is <all_urls> really necessary?
Can two patterns be merged?
Are HTTP and HTTPS both required?
Are subdomains required?
```

Например:

```text
https://example.com/*
https://example.com/products/*
```

Второй pattern уже покрывается первым.

Если оба нужны для разных features, framework может сохранить их на уровне source model, но generated manifest должен избегать бессмысленного дублирования.

---

# C.58. Permission minimization algorithm

Для framework можно представить алгоритм:

```text
Feature declarations
       ↓
Collect required hosts
       ↓
Normalize patterns
       ↓
Remove duplicates
       ↓
Detect broader patterns
       ↓
Suggest narrower patterns
       ↓
Generate manifest
```

Например:

```text
Input:

https://example.com/*
https://example.com/*
https://example.com/products/*

Output:

https://example.com/*
```

и warning:

```text
/products/* is redundant because
example.com/* already covers it.
```

---

# C.59. Host Pattern security audit

Production CI может проверять:

```text
<all_urls>
http://*/*
https://*/*
*://*/*
```

и требовать explicit justification.

Например:

```text
ERROR:
Broad host permission detected.

Pattern:
<all_urls>

Reason required:
WHY_DOES_EXTENSION_NEED_ALL_URLS
```

Это очень полезный security gate.

---

# C.60. Host Pattern checklist

Перед release проверьте:

### Scheme

```text
□ http действительно нужен?
□ https достаточно?
□ нужен ли *://?
```

### Host

```text
□ нужен ли конкретный domain?
□ нужны ли subdomains?
□ нужен ли wildcard host?
```

### Path

```text
□ нужен ли весь site?
□ можно ли ограничить /app/*?
□ можно ли ограничить /editor/*?
```

### Scope

```text
□ нужен ли <all_urls>?
□ можно ли использовать activeTab?
□ можно ли использовать optional host permissions?
```

### Runtime

```text
□ нужен ли match на всех routes?
□ нужен ли content script на всех frames?
□ можно ли сузить injection?
```

---

# C.61. Типичные ошибки

## Ошибка 1. Использовать `<all_urls>` без необходимости

```json
{
  "host_permissions": ["<all_urls>"]
}
```

### Исправление

```json
{
  "host_permissions": ["https://example.com/*"]
}
```

---

## Ошибка 2. Путать `*` и regex

Неверное мышление:

```text
https://example.com/.*
```

как regex.

Правильнее:

```text
https://example.com/*
```

а regex применять уже в runtime.

---

## Ошибка 3. Забывать про HTTPS

```text
http://example.com/*
```

не покрывает:

```text
https://example.com/*
```

---

## Ошибка 4. Забывать subdomains

```text
https://example.com/*
```

и:

```text
https://api.example.com/*
```

— разные hosts.

---

## Ошибка 5. Использовать wildcard вместо конкретного host

Вместо:

```text
https://*.example.com/*
```

иногда достаточно:

```text
https://app.example.com/*
```

---

## Ошибка 6. Пытаться матчить query parameters

Вместо:

```text
...?id=123
```

лучше:

```text
https://example.com/products/*
```

а затем:

```javascript
new URL(location.href);
```

---

# C.62. Практическая таблица

| Pattern                   | Идея                   | Scope               |
| ------------------------- | ---------------------- | ------------------- |
| `https://example.com/*`   | Один HTTPS host        | Узкий               |
| `http://example.com/*`    | Один HTTP host         | Узкий               |
| `*://example.com/*`       | HTTP + HTTPS           | Средний             |
| `https://*.example.com/*` | Subdomains             | Средний             |
| `https://*/*`             | Все HTTPS hosts        | Очень широкий       |
| `http://*/*`              | Все HTTP hosts         | Очень широкий       |
| `<all_urls>`              | Все поддерживаемые URL | Максимально широкий |

---

# C.63. Практический пример: Page Modifier

Допустим, extension изменяет только GitHub.

Плохой вариант:

```json
{
  "host_permissions": ["<all_urls>"]
}
```

Хороший:

```json
{
  "host_permissions": ["https://github.com/*"]
}
```

Content script:

```json
{
  "content_scripts": [
    {
      "matches": ["https://github.com/*"],
      "js": ["content.js"]
    }
  ]
}
```

Architecture:

```text
Browser
   │
   ▼
github.com
   │
   ▼
Match Pattern
   │
   ▼
content.js
   │
   ▼
DOM integration
```

---

# C.64. Практический пример: SaaS integration

Допустим, extension работает только в:

```text
https://app.example.com/
```

Manifest:

```json
{
  "host_permissions": ["https://app.example.com/*"],
  "content_scripts": [
    {
      "matches": ["https://app.example.com/*"],
      "js": ["content.js"]
    }
  ]
}
```

Это намного лучше:

```json
{
  "host_permissions": ["<all_urls>"]
}
```

если функциональность действительно ограничена одним SaaS.

---

# C.65. Практический пример: Universal Page Tool

Допустим, extension:

> По нажатию кнопки анализирует текущую страницу.

Тогда стоит сначала рассмотреть:

```json
{
  "permissions": ["activeTab", "scripting"]
}
```

вместо:

```json
{
  "permissions": ["scripting"],
  "host_permissions": ["<all_urls>"]
}
```

Это один из лучших примеров того, как пользовательское действие может заменить постоянный широкий host access.

---

# C.66. Host Match Patterns как security language

В конечном счёте Match Patterns следует воспринимать не как неудобный синтаксис Manifest, а как небольшой **security language**:

```text
Developer
    │
    │ declares
    ▼
Host Pattern
    │
    ▼
Browser capability boundary
    │
    ▼
Extension access
```

Например:

```text
https://app.example.com/*
```

говорит браузеру:

> Extension должен иметь возможность работать в этом web scope.

А:

```text
<all_urls>
```

говорит:

> Extension потенциально работает с очень широким множеством web resources.

---

# C.67. Главная архитектурная модель

Для Manifest V3 полезно держать в голове:

```text
                Host Access
                    │
          ┌─────────┴─────────┐
          │                   │
     Static access       Dynamic access
          │                   │
          ▼                   ▼
 host_permissions     optional_host_permissions
          │                   │
          └─────────┬─────────┘
                    │
                    ▼
              Match Patterns
                    │
                    ▼
             URL scope
                    │
                    ▼
          Content / Scripting /
          Network capabilities
```

---

# C.68. Итог

Host Match Pattern — это декларация **URL scope**, а не универсальный matcher.

Основные формы, которые необходимо знать:

```text
https://example.com/*
```

```text
http://example.com/*
```

```text
*://example.com/*
```

```text
https://*.example.com/*
```

```text
https://*/*
```

```text
http://*/*
```

```text
<all_urls>
```

Главные правила:

1. **Используйте максимально узкий host scope.**
2. **Не путайте Match Patterns с regex.**
3. **Не пытайтесь использовать patterns для query/DOM/business logic.**
4. **Разделяйте host access и API permissions.**
5. **Рассматривайте `activeTab` как альтернативу широкому постоянному access для user-triggered функций.**
6. **Для динамических интеграций рассматривайте `optional_host_permissions`.**
7. **Помните, что `example.com` и `www.example.com` — разные hosts.**
8. **`*.example.com` существенно шире конкретного subdomain.**
9. **`<all_urls>` должен быть осознанным архитектурным решением.**
10. **Сужение Match Pattern одновременно улучшает security, privacy и performance.**

И наиболее важная формула для разработчика Manifest V3:

```text
Feature
   ↓
Required capability
   ↓
Required host scope
   ↓
Minimal Match Pattern
   ↓
Manifest
   ↓
Browser-enforced security boundary
```

Именно поэтому в хорошо спроектированном extension **host patterns должны выводиться из архитектуры приложения, а не подбираться методом "поставим `<all_urls>` и посмотрим, заработает ли"**.
