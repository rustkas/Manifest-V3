# Приложение A. Полный Manifest V3 Reference

`manifest.json` — это декларативное описание browser extension. Он находится в корне пакета расширения и определяет его идентичность, capabilities, permissions, execution contexts, UI, declarative rules и другие характеристики. Для Chrome Extensions актуальной моделью является Manifest V3; в текущей документации Chrome указано, что поддерживаемое значение `manifest_version` — `3`. ([Chrome for Developers][1])

Эта глава предназначена не для последовательного изучения Manifest V3, а как **справочник**, к которому можно возвращаться во время разработки.

> Важно: Manifest V3 — это не только `manifest.json`. Многие возможности extension platform реализуются комбинацией manifest declarations и соответствующих Extension APIs. Например, `"action"` активирует соответствующую часть модели, а фактическое управление toolbar action выполняется через `chrome.action`. ([Chrome for Developers][2])

---

# A.1. Базовая структура

Минимальная структура Manifest V3:

```json
{
  "manifest_version": 3,
  "name": "My Extension",
  "version": "1.0.0"
}
```

Для публикации в Chrome Web Store используются также `description` и `icons`; официальная документация Chrome относит их к ключам, требуемым Web Store. ([Chrome for Developers][1])

Практический production-oriented вариант:

```json
{
  "manifest_version": 3,

  "name": "My Extension",
  "version": "1.0.0",
  "description": "A useful browser extension.",

  "icons": {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  }
}
```

---

# A.2. Полный список основных Manifest V3 keys

В актуальном Chrome Manifest reference перечисляются следующие основные manifest keys: ([Chrome for Developers][1])

```text
manifest_version
name
version
description
icons

short_name
version_name
default_locale

action
background
commands
content_scripts

permissions
optional_permissions
host_permissions
optional_host_permissions

options_page
options_ui
side_panel

web_accessible_resources
content_security_policy

declarative_net_request

devtools_page

externally_connectable

chrome_settings_overrides
chrome_url_overrides

cross_origin_embedder_policy
cross_origin_opener_policy

homepage_url
minimum_chrome_version

incognito
sandbox

storage

omnibox
oauth2

requirements

tts_engine

update_url

key
export
import
```

Некоторые ключи предназначены для специализированных сценариев и используются значительно реже.

---

# A.3. `manifest_version`

```json
{
  "manifest_version": 3
}
```

`manifest_version` — целое число, определяющее формат manifest.

Для современных Chrome Extensions используется:

```json
"manifest_version": 3
```

Это не версия вашего приложения.

Не следует писать:

```json
"manifest_version": "3"
```

и нельзя путать:

```json
"manifest_version": 3
```

с:

```json
"version": "3.0.0"
```

Первое означает **формат платформы**, второе — **версию вашего extension**.

---

# A.4. `name`

```json
{
  "name": "Page Analyzer"
}
```

`name` — основное имя extension.

Оно используется в интерфейсе браузера и в Chrome Web Store. Chrome указывает максимальную длину `name` в 75 символов. ([Chrome for Developers][1])

Практически:

```json
"name": "Page Analyzer"
```

лучше, чем:

```json
"name": "My Amazing Browser Extension That Does Many Things"
```

Название должно описывать продукт, а не техническую реализацию.

---

# A.5. `short_name`

```json
{
  "name": "Universal Page Analyzer",
  "short_name": "Analyzer"
}
```

`short_name` предназначен для мест, где недостаточно пространства.

Если он не задан, браузер может использовать `name` с усечением. Chrome указывает максимум 12 символов для `short_name`. ([Chrome for Developers][1])

---

# A.6. `version`

```json
{
  "version": "1.0.0"
}
```

`version` — версия extension.

Она используется, в частности, системой обновлений.

Chrome поддерживает от одного до четырёх числовых компонентов:

```text
1
1.0
1.2.3
1.2.3.4
```

Компоненты должны находиться в допустимом диапазоне, а сравнение версий производится по компонентам слева направо. ([Chrome for Developers][3])

Для большинства проектов удобно:

```json
"version": "1.0.0"
```

или:

```json
"version": "1.4.2"
```

---

# A.7. `version_name`

```json
{
  "version": "2.0.0",
  "version_name": "2.0 — Beta"
}
```

`version` используется системой версий и обновлений.

`version_name` предназначен прежде всего для отображения человеку.

Например:

```json
"version": "2.0.0",
"version_name": "Next Generation"
```

Chrome позволяет использовать описательную строку в `version_name`. ([Chrome for Developers][3])

---

# A.8. `description`

```json
{
  "description": "Analyze and modify web pages."
}
```

`description` — текстовое описание extension.

Chrome указывает ограничение в 132 символа. HTML и другое форматирование здесь не используются. ([Chrome for Developers][4])

Хорошее описание отвечает на вопрос:

> Что делает extension?

Например:

```json
"description": "Extract structured data from web pages."
```

---

# A.9. `icons`

```json
{
  "icons": {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  }
}
```

`icons` определяет изображения extension.

Типичная структура:

```text
icons/
├── icon-16.png
├── icon-32.png
├── icon-48.png
└── icon-128.png
```

Важно не путать:

```text
icons
```

с:

```text
action.default_icon
```

Первое описывает icon assets extension в целом.

Второе может определять icon toolbar action.

---

# A.10. `action`

```json
{
  "action": {
    "default_title": "Open Analyzer",
    "default_popup": "popup.html"
  }
}
```

`action` определяет toolbar action extension.

Он может использоваться для:

* toolbar icon;
* popup;
* title;
* badge;
* динамического состояния.

Пример:

```json
{
  "action": {
    "default_title": "Analyze page",
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png"
    }
  }
}
```

Фактическое управление action во время выполнения выполняется через `chrome.action`. ([Chrome for Developers][2])

---

# A.11. `background`

В Manifest V3 background execution реализуется через Service Worker.

```json
{
  "background": {
    "service_worker": "service-worker.js"
  }
}
```

Например:

```text
extension/
├── manifest.json
├── service-worker.js
└── popup.html
```

`service_worker` указывает файл background worker.

Важное отличие от старой модели Manifest V2:

```text
MV2
persistent background page
```

против:

```text
MV3
event-driven Service Worker
```

Поэтому нельзя проектировать MV3 Service Worker как постоянно работающий серверный процесс.

---

# A.12. `permissions`

```json
{
  "permissions": [
    "storage",
    "tabs",
    "scripting"
  ]
}
```

`permissions` объявляет extension API capabilities, которые extension хочет использовать.

Примеры:

```text
storage
tabs
scripting
alarms
notifications
sidePanel
webNavigation
cookies
```

Конкретная permission зависит от используемого API. Официальный API reference связывает API с необходимыми permissions. ([Chrome for Developers][2])

Правило:

> Запрашивайте только те permissions, которые действительно необходимы.

---

# A.13. `optional_permissions`

```json
{
  "optional_permissions": [
    "tabs"
  ]
}
```

Optional permissions позволяют отложить получение определённых API permissions до момента, когда они действительно понадобятся.

Обычно архитектура выглядит так:

```text
Install
   ↓
Minimal permissions
   ↓
User activates feature
   ↓
Request optional permission
   ↓
Feature becomes available
```

Для runtime permission management используется `chrome.permissions`. ([Chrome for Developers][5])

---

# A.14. `host_permissions`

```json
{
  "host_permissions": [
    "https://example.com/*"
  ]
}
```

`host_permissions` определяет сайты, с которыми extension получает соответствующий host access.

Примеры:

```json
"host_permissions": [
  "https://example.com/*"
]
```

или:

```json
"host_permissions": [
  "https://*.example.com/*"
]
```

Более широкое:

```json
"host_permissions": [
  "https://*/*"
]
```

Следует избегать широких host permissions без необходимости.

---

# A.15. `optional_host_permissions`

```json
{
  "optional_host_permissions": [
    "https://*.example.com/*"
  ]
}
```

Это аналог `optional_permissions`, но для host access.

Полезно, если extension должен получить доступ к сайту только после явного действия пользователя.

Архитектура:

```text
Installed
   ↓
No host access
   ↓
User enables integration
   ↓
Request host permission
   ↓
Access granted
```

---

# A.16. `content_scripts`

Пример:

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

Можно также подключать CSS:

```json
{
  "content_scripts": [
    {
      "matches": [
        "https://example.com/*"
      ],
      "js": [
        "content.js"
      ],
      "css": [
        "content.css"
      ]
    }
  ]
}
```

Дополнительные параметры:

```json
{
  "matches": [
    "https://example.com/*"
  ],
  "exclude_matches": [
    "https://example.com/private/*"
  ],
  "include_globs": [
    "*example*"
  ],
  "exclude_globs": [
    "*admin*"
  ],
  "js": [
    "content.js"
  ],
  "css": [
    "content.css"
  ],
  "run_at": "document_idle",
  "all_frames": false,
  "match_about_blank": false
}
```

Content scripts являются отдельным execution context и работают в isolated world по умолчанию.

---

# A.17. `run_at`

Основные значения:

```text
document_start
document_end
document_idle
```

Например:

```json
{
  "content_scripts": [
    {
      "matches": ["https://example.com/*"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ]
}
```

Обычно `document_idle` является хорошим default choice.

Используйте более ранний запуск только тогда, когда архитектура действительно требует его.

---

# A.18. `all_frames`

```json
{
  "all_frames": true
}
```

По умолчанию content script применяется к основному frame.

`all_frames: true` позволяет инъекцию в подходящие frames.

Это особенно важно для страниц с:

```text
iframe
iframe
iframe
```

Но включение `all_frames` увеличивает количество execution contexts.

Поэтому:

```text
all_frames = true
```

не должно использоваться автоматически.

---

# A.19. `match_about_blank`

```json
{
  "match_about_blank": true
}
```

Позволяет учитывать определённые `about:blank` frames при сопоставлении content scripts.

Используйте это только при понимании frame architecture конкретного сайта.

---

# A.20. `exclude_matches`

```json
{
  "matches": [
    "https://example.com/*"
  ],
  "exclude_matches": [
    "https://example.com/admin/*"
  ]
}
```

Позволяет исключить URL из автоматической инъекции.

---

# A.21. `include_globs`

```json
{
  "include_globs": [
    "*example.com/products/*"
  ]
}
```

Дополнительное ограничение URL через glob matching.

---

# A.22. `exclude_globs`

```json
{
  "exclude_globs": [
    "*example.com/admin/*"
  ]
}
```

Позволяет дополнительно исключать страницы.

---

# A.23. `options_page`

```json
{
  "options_page": "options.html"
}
```

Определяет страницу настроек extension.

Структура:

```text
extension/
├── manifest.json
├── options.html
└── options.js
```

---

# A.24. `options_ui`

```json
{
  "options_ui": {
    "page": "options.html",
    "open_in_tab": true
  }
}
```

`options_ui` предоставляет более современную модель options page.

Например:

```json
{
  "options_ui": {
    "page": "options.html",
    "open_in_tab": true
  }
}
```

Для современных extensions обычно предпочтительнее рассматривать `options_ui`, если подходит соответствующая модель.

---

# A.25. `side_panel`

```json
{
  "side_panel": {
    "default_path": "sidepanel.html"
  }
}
```

Для использования Side Panel также требуется соответствующая permission:

```json
{
  "permissions": [
    "sidePanel"
  ]
}
```

Полный пример:

```json
{
  "manifest_version": 3,
  "name": "Analyzer",
  "version": "1.0.0",

  "permissions": [
    "sidePanel"
  ],

  "side_panel": {
    "default_path": "sidepanel.html"
  }
}
```

Chrome указывает Side Panel API как MV3 API и документирует его начиная с Chrome 114. ([Chrome for Developers][5])

---

# A.26. `commands`

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

Затем Service Worker может обрабатывать команду:

```javascript
chrome.commands.onCommand.addListener((command) => {
  if (command === "analyze-page") {
    // ...
  }
});
```

Manifest отвечает за декларацию command.

Runtime API отвечает за обработку события.

---

# A.27. `web_accessible_resources`

В MV3 используется объектная форма:

```json
{
  "web_accessible_resources": [
    {
      "resources": [
        "images/*"
      ],
      "matches": [
        "https://example.com/*"
      ]
    }
  ]
}
```

Это определяет ресурсы extension, которые могут быть доступны web pages.

Важно понимать security model:

```text
Extension resource
       ↓
НЕ автоматически доступен
       ↓
Web page
```

Если странице действительно требуется resource, он должен быть явно объявлен.

---

# A.28. `content_security_policy`

В MV3 CSP задаётся объектом для extension pages:

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

Основная идея:

```text
Extension
   ↓
CSP
   ↓
Allowed execution model
```

CSP ограничивает допустимые способы загрузки и выполнения ресурсов.

Особенно важно:

```text
eval()
new Function()
remote executable code
```

не должны использоваться как часть стандартной MV3 architecture.

---

# A.29. `declarative_net_request`

Пример:

```json
{
  "declarative_net_request": {
    "rule_resources": [
      {
        "id": "ruleset_1",
        "enabled": true,
        "path": "rules/rules.json"
      }
    ]
  }
}
```

Структура проекта:

```text
extension/
├── manifest.json
└── rules/
    └── rules.json
```

DNR позволяет браузеру выполнять network rules без необходимости передавать каждый request через собственную imperative JavaScript logic.

---

# A.30. `devtools_page`

```json
{
  "devtools_page": "devtools.html"
}
```

Создаёт DevTools page для extension.

Структура:

```text
extension/
├── manifest.json
├── devtools.html
└── devtools.js
```

Это специализированная возможность для extensions, интегрирующихся с DevTools.

---

# A.31. `externally_connectable`

Позволяет контролировать, какие внешние страницы или extensions могут устанавливать connections с вашим extension.

Например:

```json
{
  "externally_connectable": {
    "matches": [
      "https://example.com/*"
    ]
  }
}
```

Это особенно важно при проектировании:

```text
Web Page
    ↕
Extension
```

communications.

Нельзя считать внешние messages доверенными только потому, что они пришли через Extension API.

---

# A.32. `chrome_url_overrides`

Этот механизм позволяет заменить некоторые стандартные страницы Chrome.

Использование зависит от конкретного поддерживаемого override.

Архитектурно:

```text
Browser built-in page
        ↓
Extension page
```

Это мощная capability и потому должна применяться осознанно.

---

# A.33. `chrome_settings_overrides`

Позволяет extension объявлять overrides для поддерживаемых настроек Chrome.

Это специализированный manifest capability.

Не следует включать его в обычный extension без необходимости.

---

# A.34. `homepage_url`

```json
{
  "homepage_url": "https://example.com/"
}
```

Указывает домашнюю страницу extension.

Полезно для:

```text
documentation
support
project website
privacy policy
source code
```

---

# A.35. `minimum_chrome_version`

```json
{
  "minimum_chrome_version": "120"
}
```

Указывает минимальную версию Chrome, необходимую extension.

Это особенно полезно, если extension использует API, появившийся в более новой версии.

Например:

```text
Feature X
   ↓
Chrome 120+
```

тогда:

```json
"minimum_chrome_version": "120"
```

может сделать compatibility requirement явным.

Chrome указывает, что пользователи более старой версии не смогут установить extension, если она ниже указанного minimum version. ([Chrome for Developers][1])

---

# A.36. `default_locale`

Для локализованных extensions:

```json
{
  "default_locale": "en"
}
```

Структура:

```text
extension/
├── _locales/
│   ├── en/
│   │   └── messages.json
│   └── pl/
│       └── messages.json
│
└── manifest.json
```

`default_locale` является частью i18n architecture.

---

# A.37. `incognito`

```json
{
  "incognito": "spanning"
}
```

Возможные модели включают:

```text
spanning
split
not_allowed
```

Они определяют поведение extension в Incognito.

Это уже не просто UI feature — это часть security and lifecycle model.

---

# A.38. `sandbox`

`Sandbox` позволяет определять sandboxed extension pages.

Концептуально:

```text
Normal extension page
        │
        ├── Extension APIs
        └── privileged capabilities

Sandbox page
        │
        └── restricted execution environment
```

Sandbox следует использовать только тогда, когда вы понимаете, какие capabilities теряются.

---

# A.39. `storage`

Этот manifest key используется для managed storage schema.

Например:

```json
{
  "storage": {
    "managed_schema": "schema.json"
  }
}
```

Это связано с enterprise-managed configuration.

Обычное пользовательское storage при этом используется через:

```javascript
chrome.storage.local
chrome.storage.sync
chrome.storage.session
```

---

# A.40. `omnibox`

Позволяет интегрировать extension с адресной строкой Chrome.

Концептуально:

```text
User
 ↓
Address bar
 ↓
Extension keyword
 ↓
Extension logic
```

Это специализированная UI capability.

---

# A.41. `oauth2`

Для определённых OAuth 2.0 сценариев manifest может содержать:

```json
{
  "oauth2": {
    "client_id": "...",
    "scopes": [
      "..."
    ]
  }
}
```

OAuth credentials и tokens требуют отдельного security design.

Нельзя рассматривать manifest как безопасное место для хранения секретов.

---

# A.42. `tts_engine`

Позволяет регистрировать extension как Text-to-Speech engine.

Это специализированный capability и нужен только extensions, реализующим соответствующий API.

---

# A.43. `requirements`

Исторически manifest мог описывать требования к платформе.

В современных extension проектах это используется значительно реже.

При проектировании нового extension следует проверять актуальную документацию конкретного браузера перед использованием специализированных manifest keys.

---

# A.44. `key`

`key` связан с extension ID и специализированными development/deployment scenarios.

Обычно вручную задавать его не требуется.

Chrome прямо отмечает, что в большинстве случаев разработчику не нужно использовать этот ключ; предпочтительно писать код с относительными путями и `extension.getURL()`. ([Chrome for Developers][6])

Не следует строить архитектуру extension вокруг вручную заданного `key`.

---

# A.45. `export`

Специализированный механизм для определённых сценариев распространения ресурсов extension.

Не является обычной частью большинства Manifest V3 проектов.

---

# A.46. `import`

Используется для специализированных сценариев импорта ресурсов/extension functionality.

Для стандартного application architecture обычно не требуется.

---

# A.47. `update_url`

```json
{
  "update_url": "https://example.com/updates.xml"
}
```

Исторически используется для определённых внешних update scenarios.

При публикации через Chrome Web Store обычному extension разработчику, как правило, не требуется самостоятельно строить такую систему обновления.

---

# A.48. Специализированные manifest capabilities

Помимо основных application keys существуют специализированные возможности, например:

```text
chrome_settings_overrides
chrome_url_overrides
devtools_page
omnibox
oauth2
tts_engine
sandbox
storage
```

Они не должны восприниматься как обязательная часть каждого extension.

Правильный принцип:

```text
Feature
   ↓
Required capability
   ↓
Required manifest key
```

а не:

```text
New project
   ↓
Copy giant manifest
```

---

# A.49. Полный production-oriented пример

Рассмотрим extension, которое содержит:

* toolbar action;
* popup;
* Service Worker;
* content script;
* storage;
* Side Panel;
* keyboard command;
* DNR rules;
* host permission.

```json
{
  "manifest_version": 3,

  "name": "Web Analyzer",
  "short_name": "Analyzer",
  "version": "1.0.0",
  "version_name": "1.0",
  "description": "Analyze and transform web pages.",

  "icons": {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },

  "action": {
    "default_title": "Analyze page",
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png"
    }
  },

  "background": {
    "service_worker": "service-worker.js"
  },

  "permissions": [
    "storage",
    "scripting",
    "activeTab",
    "sidePanel"
  ],

  "host_permissions": [
    "https://example.com/*"
  ],

  "content_scripts": [
    {
      "matches": [
        "https://example.com/*"
      ],
      "js": [
        "content.js"
      ],
      "css": [
        "content.css"
      ],
      "run_at": "document_idle"
    }
  ],

  "options_ui": {
    "page": "options.html",
    "open_in_tab": true
  },

  "side_panel": {
    "default_path": "sidepanel.html"
  },

  "commands": {
    "analyze-page": {
      "suggested_key": {
        "default": "Ctrl+Shift+A"
      },
      "description": "Analyze current page"
    }
  },

  "declarative_net_request": {
    "rule_resources": [
      {
        "id": "ruleset_1",
        "enabled": true,
        "path": "rules/rules.json"
      }
    ]
  },

  "web_accessible_resources": [
    {
      "resources": [
        "assets/*"
      ],
      "matches": [
        "https://example.com/*"
      ]
    }
  ],

  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  },

  "minimum_chrome_version": "120"
}
```

Это уже полноценный manifest для достаточно сложного multi-context extension.

---

# A.50. Как читать Manifest сверху вниз

При code review удобно анализировать manifest в следующем порядке:

```text
1. Identity
   ↓
2. Version
   ↓
3. Capabilities
   ↓
4. Permissions
   ↓
5. Host access
   ↓
6. Execution contexts
   ↓
7. UI
   ↓
8. Declarative rules
   ↓
9. Security
   ↓
10. Compatibility
```

Например:

```text
name/version
      ↓
permissions
      ↓
host_permissions
      ↓
background
      ↓
content_scripts
      ↓
action
      ↓
side_panel
      ↓
declarative_net_request
      ↓
CSP
```

Такой порядок гораздо полезнее, чем просто запоминание названий manifest fields.

---

# A.51. Manifest как Capability Declaration

Очень важно изменить ментальную модель.

Не следует воспринимать:

```json
"permissions": [...]
```

как случайный список строк.

Manifest можно рассматривать как:

```text
Extension Capability Declaration
```

Например:

```json
{
  "permissions": [
    "storage",
    "scripting"
  ],
  "host_permissions": [
    "https://example.com/*"
  ]
}
```

можно прочитать как:

```text
This application requires:

CAPABILITY
    storage

CAPABILITY
    scripting

HOST CAPABILITY
    example.com
```

---

# A.52. Manifest как архитектурный контракт

Manifest одновременно является контрактом между:

```text
Developer
    │
    ▼
Extension Platform
    │
    ▼
Browser
```

Он описывает:

```text
identity
capabilities
permissions
contexts
UI
resources
security
compatibility
```

Поэтому manifest должен проектироваться **до**, а не после архитектуры приложения.

---

# A.53. Manifest и execution contexts

Большинство серьёзных extensions можно представить как граф:

```text
                     Extension
                         │
          ┌──────────────┼───────────────┐
          │              │               │
          ▼              ▼               ▼
      Service Worker    Popup        Side Panel
          │                              │
          │                              │
          ▼                              ▼
    Content Script  ◄──────────────► Extension Page
          │
          ▼
       Web Page
```

Manifest определяет значительную часть этого графа:

```text
background
content_scripts
action
options_ui
side_panel
devtools_page
```

А permissions определяют capabilities, доступные этим contexts.

---

# A.54. Manifest и security boundary

Manifest также формирует security model:

```text
permissions
host_permissions
CSP
web_accessible_resources
sandbox
externally_connectable
```

Поэтому изменение одной строки может изменить security boundary всего приложения.

Например:

```diff
"host_permissions": [
-  "https://example.com/*"
+  "<all_urls>"
]
```

Это не косметическое изменение.

Это существенное расширение доверенной области extension.

---

# A.55. Manifest и performance

Manifest влияет и на runtime cost.

Например:

```text
content_scripts
+
all_frames
+
broad matches
```

могут привести к большому числу content-script contexts.

С другой стороны:

```text
declarative_net_request
```

может позволить браузеру выполнять определённую network logic без запуска собственного JavaScript runtime.

Поэтому manifest — это также часть performance architecture.

---

# A.56. Manifest и compiler

Для современного framework особенно интересно рассматривать manifest как **build artifact**.

Вместо:

```text
Developer
   ↓
manually writes manifest.json
```

может использоваться:

```text
Developer
   ↓
Application definition
   ↓
Capability analysis
   ↓
Compiler
   ↓
manifest.json
```

Например:

```text
Application uses:
    storage
    sidePanel
    scripting
    example.com

Compiler generates:

permissions:
    storage
    sidePanel
    scripting

host_permissions:
    https://example.com/*
```

---

# A.57. Manifest validation checklist

Перед публикацией extension полезно проверить:

### Identity

```text
[ ] manifest_version = 3
[ ] name задан
[ ] version задан
[ ] description задан
[ ] icons подготовлены
```

### Runtime

```text
[ ] background корректен
[ ] service worker существует
[ ] content scripts существуют
[ ] extension pages существуют
```

### Permissions

```text
[ ] permissions минимальны
[ ] host_permissions минимальны
[ ] optional permissions используются там, где возможно
[ ] нет случайного <all_urls>
```

### UI

```text
[ ] action корректен
[ ] popup существует
[ ] options page существует
[ ] side panel существует
```

### Declarative

```text
[ ] DNR rules валидны
[ ] rulesets объявлены корректно
```

### Security

```text
[ ] CSP проверена
[ ] web_accessible_resources минимальны
[ ] external connections ограничены
[ ] remote code не используется
```

### Compatibility

```text
[ ] minimum_chrome_version обоснован
[ ] используемые API доступны в целевой версии
```

---

# A.58. Минимальный Manifest

Для самого простого extension:

```json
{
  "manifest_version": 3,
  "name": "Hello Extension",
  "version": "1.0.0"
}
```

---

# A.59. Минимальный Action Extension

```json
{
  "manifest_version": 3,

  "name": "Hello Action",
  "version": "1.0.0",

  "action": {
    "default_title": "Hello"
  }
}
```

---

# A.60. Extension с Popup

```json
{
  "manifest_version": 3,

  "name": "Popup Extension",
  "version": "1.0.0",

  "action": {
    "default_popup": "popup.html"
  }
}
```

---

# A.61. Extension с Service Worker

```json
{
  "manifest_version": 3,

  "name": "Background Extension",
  "version": "1.0.0",

  "background": {
    "service_worker": "service-worker.js"
  }
}
```

---

# A.62. Extension с Content Script

```json
{
  "manifest_version": 3,

  "name": "Page Modifier",
  "version": "1.0.0",

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

# A.63. Extension с Side Panel

```json
{
  "manifest_version": 3,

  "name": "Side Panel Extension",
  "version": "1.0.0",

  "permissions": [
    "sidePanel"
  ],

  "side_panel": {
    "default_path": "sidepanel.html"
  }
}
```

---

# A.64. Extension с DNR

```json
{
  "manifest_version": 3,

  "name": "Network Extension",
  "version": "1.0.0",

  "permissions": [
    "declarativeNetRequest"
  ],

  "declarative_net_request": {
    "rule_resources": [
      {
        "id": "rules",
        "enabled": true,
        "path": "rules.json"
      }
    ]
  }
}
```

Конкретные DNR permissions и возможности следует сверять с актуальной документацией API и выбранным типом ruleset. ([Chrome for Developers][2])

---

# A.65. Полная архитектурная карта Manifest V3

В итоге Manifest V3 можно представить следующим образом:

```text
                         manifest.json
                              │
       ┌──────────────────────┼──────────────────────┐
       │                      │                      │
       ▼                      ▼                      ▼
   Identity              Capabilities             Runtime
       │                      │                      │
       │                      ├── permissions        ├── background
       │                      ├── host_permissions  ├── content_scripts
       │                      └── optional_*        └── devtools_page
       │
       ├── name
       ├── version
       ├── description
       └── icons

                              │
             ┌────────────────┼────────────────┐
             ▼                ▼                ▼
             UI          Declarative        Security
             │                │                │
             ├── action       └── DNR          ├── CSP
             ├── options                       ├── WAR
             ├── side_panel                    ├── sandbox
             └── commands                      └── external access
```

---

# A.66. Главная формула Manifest V3

Manifest V3 удобно запомнить не как список JSON keys, а как пять уровней:

```text
1. WHO
   Identity

2. WHAT
   Capabilities

3. WHERE
   Host permissions

4. WHERE/WHEN
   Execution contexts

5. HOW
   Runtime + Declarative APIs
```

То есть:

```text
             Extension
                 │
       ┌─────────┴─────────┐
       │                   │
    Identity           Capabilities
       │                   │
       ▼                   ▼
      WHO                 WHAT
                           │
                           ▼
                    Host Permissions
                           │
                           ▼
                       WHERE
                           │
                           ▼
                     Contexts
                           │
                           ▼
                        HOW
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
       Imperative Runtime        Declarative Engine
```

Именно эта модель позволяет правильно проектировать Manifest V3: **manifest не является конфигурационным файлом в обычном смысле; это декларативный архитектурный контракт между extension и браузером**.

Официальный Chrome Manifest Reference содержит актуальный перечень поддерживаемых manifest keys, а Chrome Extensions API Reference связывает manifest declarations с соответствующими runtime APIs. При разработке production extension эти две части следует рассматривать совместно. ([Chrome for Developers][1])

[1]: https://developer.chrome.com/docs/extensions/reference/manifest?hl=en&utm_source=chatgpt.com "Manifest file format  |  Chrome for Developers"
[2]: https://developer.chrome.com/docs/extensions/reference?utm_source=chatgpt.com "Extensions / Reference  |  Chrome for Developers"
[3]: https://developer.chrome.com/docs/apps/manifest/version?utm_source=chatgpt.com "Manifest - Version  |  Apps  |  Chrome for Developers"
[4]: https://developer.chrome.com/docs/apps/manifest/description/?utm_source=chatgpt.com "Manifest - Description  |  Apps  |  Chrome for Developers"
[5]: https://developer.chrome.com/docs/extensions/reference/api?hl=en&utm_source=chatgpt.com "API reference  |  Chrome for Developers"
[6]: https://developer.chrome.com/docs/apps/manifest/key/?utm_source=chatgpt.com "Manifest - Key  |  Apps  |  Chrome for Developers"
