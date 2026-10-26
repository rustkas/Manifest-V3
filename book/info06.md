# Приложение G. Declarative Net Request Rules

`chrome.declarativeNetRequest` (DNR) — один из наиболее важных механизмов Manifest V3 для управления сетевыми запросами.

Его основная идея заключается в том, что расширение **не перехватывает каждый сетевой запрос собственным JavaScript-кодом**, а заранее описывает правила, которые затем применяет сам браузер.

Это принципиально меняет архитектуру:

```text
MV2 / imperative model

Network Request
      ↓
Extension JavaScript
      ↓
Decision
      ↓
Action
```

против:

```text
MV3 / declarative model

Rules
   ↓
Browser Rule Engine
   ↓
Network Request
   ↓
Match
   ↓
Action
```

Именно поэтому DNR следует рассматривать не просто как ещё один Extension API, а как **декларативный runtime для сетевой логики расширения**.

---

# G.1. Что такое DNR

DNR расшифровывается как:

```text
Declarative Net Request
```

Основной API:

```javascript
chrome.declarativeNetRequest
```

Расширение предоставляет браузеру набор правил:

```text
Rule
Rule
Rule
Rule
...
```

Каждое правило описывает:

1. какие запросы должны быть сопоставлены;
2. при каких условиях;
3. какое действие необходимо выполнить.

Упрощённо:

```text
Request
   │
   ▼
Condition
   │
   ├── no match → continue
   │
   └── match
        │
        ▼
      Action
```

---

# G.2. Базовая структура правила

Типичное DNR-правило выглядит следующим образом:

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

У него есть три основных компонента:

```text
Rule
├── id
├── priority
├── action
└── condition
```

Не все поля обязательны во всех сценариях, но концептуально именно эта структура является фундаментальной.

---

# G.3. `id`

Каждое правило должно иметь уникальный идентификатор внутри соответствующего ruleset.

Например:

```json
{
  "id": 1001,
  "action": {
    "type": "block"
  },
  "condition": {
    "urlFilter": "tracker.example"
  }
}
```

`id` позволяет:

* идентифицировать правило;
* удалять dynamic/session rules;
* обновлять конкретные правила;
* диагностировать поведение ruleset.

Например:

```javascript
await chrome.declarativeNetRequest.updateDynamicRules({
  removeRuleIds: [1001]
});
```

---

# G.4. `priority`

При наличии нескольких совпадающих правил может иметь значение их priority.

Например:

```json
{
  "id": 1,
  "priority": 1,
  "action": {
    "type": "block"
  },
  "condition": {
    "urlFilter": "example.com"
  }
}
```

и:

```json
{
  "id": 2,
  "priority": 10,
  "action": {
    "type": "allow"
  },
  "condition": {
    "urlFilter": "example.com/safe"
  }
}
```

В сложных rulesets priority становится частью логики принятия решения.

Поэтому priority следует проектировать явно, а не назначать произвольные значения.

---

# G.5. `condition`

`condition` определяет, **какие сетевые запросы подходят под правило**.

Например:

```json
{
  "condition": {
    "urlFilter": "tracker"
  }
}
```

Более сложные условия могут учитывать различные характеристики запроса.

Концептуально:

```text
condition
├── URL
├── resource type
├── initiator
├── request method
├── domain
└── tab/frame context
```

Набор поддерживаемых условий определяется Chrome DNR API и его текущей версией.

---

# G.6. `action`

`action` определяет, что произойдёт после совпадения.

Наиболее важные типы:

```text
block
allow
allowAllRequests
redirect
upgradeScheme
modifyHeaders
```

Таким образом:

```text
condition
     ↓
match
     ↓
action
```

является фундаментальной моделью DNR.

---

# G.7. `block`

Самое простое действие:

```json
{
  "id": 1,
  "action": {
    "type": "block"
  },
  "condition": {
    "urlFilter": "tracker.example"
  }
}
```

Если запрос соответствует условию, браузер блокирует его.

Архитектура:

```text
Request
   │
   ▼
tracker.example
   │
   ▼
DNR rule
   │
   ▼
BLOCK
```

Это фундаментальная операция ad blockers.

---

# G.8. `allow`

`allow` используется для разрешения запроса, который иначе мог бы быть обработан другим правилом.

Например:

```json
{
  "id": 10,
  "priority": 100,
  "action": {
    "type": "allow"
  },
  "condition": {
    "urlFilter": "trusted.example"
  }
}
```

Здесь особенно важны:

```text
priority
```

и взаимодействие нескольких правил.

---

# G.9. `allowAllRequests`

`allowAllRequests` имеет более широкий смысл: при совпадении правило может разрешить запросы в соответствующем контексте, с учётом правил и ограничений DNR.

Такой механизм особенно полезен при создании исключений:

```text
Block many requests
       │
       ▼
Trusted site
       │
       ▼
allowAllRequests
```

Но его необходимо применять осторожно, поскольку область действия шире, чем у обычного `allow`.

---

# G.10. `redirect`

DNR может не только блокировать запросы, но и перенаправлять их.

Например:

```json
{
  "id": 20,
  "action": {
    "type": "redirect",
    "redirect": {
      "url": "https://example.com/replacement"
    }
  },
  "condition": {
    "urlFilter": "old.example.com"
  }
}
```

Архитектура:

```text
Request
   │
   ▼
old.example.com
   │
   ▼
DNR
   │
   ▼
Redirect
   │
   ▼
replacement URL
```

---

# G.11. Redirect к extension resource

В некоторых сценариях redirect может использовать ресурс самого расширения.

Например:

```text
Network Request
      ↓
DNR
      ↓
chrome-extension://...
```

Но ресурс должен быть корректно доступен в соответствии с правилами `web_accessible_resources`.

Это связывает:

```text
DNR
+
Extension Resources
+
Manifest
```

в одну архитектурную систему.

---

# G.12. `upgradeScheme`

`upgradeScheme` используется для повышения схемы:

```text
http://
   ↓
https://
```

Например:

```json
{
  "id": 30,
  "action": {
    "type": "upgradeScheme"
  },
  "condition": {
    "urlFilter": "example.com"
  }
}
```

Это декларативный способ выражения политики:

> если запрос соответствует условию, использовать более безопасную схему.

---

# G.13. `modifyHeaders`

DNR может модифицировать некоторые request/response headers.

Например концептуально:

```json
{
  "id": 40,
  "action": {
    "type": "modifyHeaders",
    "requestHeaders": [
      {
        "header": "Example-Header",
        "operation": "set",
        "value": "example"
      }
    ]
  },
  "condition": {
    "urlFilter": "api.example.com"
  }
}
```

Это мощная возможность, но она имеет существенные ограничения и правила конфликтов.

Нельзя воспринимать `modifyHeaders` как универсальный механизм произвольного изменения HTTP.

---

# G.14. URL matching

Одним из центральных элементов DNR является сопоставление URL.

Например:

```json
{
  "condition": {
    "urlFilter": "analytics"
  }
}
```

Это означает:

```text
URL
 │
 ├── contains "analytics" → match
 └── otherwise            → no match
```

Для сложных правил необходимо хорошо понимать синтаксис `urlFilter`.

---

# G.15. `urlFilter`

`urlFilter` — строковый фильтр URL.

Например:

```json
{
  "condition": {
    "urlFilter": "tracker"
  }
}
```

Он может совпасть с URL, содержащим соответствующую последовательность.

При разработке production rules необходимо помнить:

> `urlFilter` — это не обычное регулярное выражение.

Это отдельный механизм сопоставления DNR.

---

# G.16. `regexFilter`

Для более сложных случаев существует `regexFilter`.

Например концептуально:

```json
{
  "condition": {
    "regexFilter": "https://.*\\.example\\.com/.*"
  }
}
```

Regex даёт большую выразительность, но одновременно:

* усложняет ruleset;
* может увеличивать стоимость matching;
* имеет собственные ограничения.

Поэтому:

```text
simple matching
      ↓
urlFilter
```

предпочтительнее там, где его достаточно.

---

# G.17. `isUrlFilterCaseSensitive`

Для URL filtering можно управлять чувствительностью к регистру в тех сценариях, где это поддерживается API.

Например:

```json
{
  "condition": {
    "urlFilter": "Tracker",
    "isUrlFilterCaseSensitive": true
  }
}
```

В production rules следует явно понимать, как браузер интерпретирует соответствующее условие.

---

# G.18. Resource Types

Правило может ограничиваться типом ресурса.

Например:

```json
{
  "condition": {
    "urlFilter": "ads",
    "resourceTypes": [
      "script",
      "image"
    ]
  }
}
```

Теперь правило применяется не ко всем запросам, а только к указанным типам ресурсов.

Это позволяет значительно уменьшить область действия правила.

---

# G.19. Почему Resource Types важны

Без ограничения:

```text
URL match
   ↓
many request types
```

С ограничением:

```text
URL match
   +
resourceTypes
   ↓
specific requests
```

Это:

* уменьшает побочные эффекты;
* упрощает debugging;
* делает ruleset точнее;
* улучшает безопасность.

---

# G.20. Request Methods

Некоторые условия позволяют ограничивать HTTP methods.

Например:

```text
GET
POST
PUT
DELETE
PATCH
```

Концептуально:

```json
{
  "condition": {
    "urlFilter": "/api/",
    "requestMethods": [
      "post"
    ]
  }
}
```

Теперь правило предназначено именно для POST-запросов.

---

# G.21. Domains

DNR позволяет строить правила с учётом доменов.

Концептуально:

```text
initiator domain
      +
request domain
      +
URL
```

Это важно, потому что:

```text
https://tracker.example
```

может быть загружен:

```text
from site-a.com
```

или:

```text
from site-b.com
```

И эти ситуации могут требовать разных правил.

---

# G.22. Initiator

Initiator — важная часть сетевой модели.

Например:

```text
Page A
  │
  └── request → API B
```

DNR может учитывать связь между:

```text
initiating page
```

и:

```text
requested resource
```

Это позволяет строить более точные правила.

---

# G.23. First-party и third-party сценарии

Для privacy-oriented extensions может быть важно различать:

```text
First-party

example.com
    ↓
example.com/resource
```

и:

```text
Third-party

example.com
    ↓
tracker.example
```

DNR предоставляет условия и механизмы, позволяющие строить подобную сетевую логику в пределах поддерживаемой модели API.

---

# G.24. Static Rules

Static rules находятся в packaged extension.

Например:

```text
extension/
├── manifest.json
└── rules/
    └── rules.json
```

Manifest:

```json
{
  "declarative_net_request": {
    "rule_resources": [
      {
        "id": "rules",
        "enabled": true,
        "path": "rules/rules.json"
      }
    ]
  }
}
```

Правила поставляются вместе с extension.

---

# G.25. Static Ruleset

Файл:

```json
[
  {
    "id": 1,
    "priority": 1,
    "action": {
      "type": "block"
    },
    "condition": {
      "urlFilter": "tracker.example"
    }
  }
]
```

Это позволяет хранить rules как обычный version-controlled artifact.

Например:

```text
Git
 │
 ├── source code
 ├── manifest.json
 └── rules.json
```

---

# G.26. Dynamic Rules

Dynamic rules можно изменять во время работы extension.

Например:

```javascript
await chrome.declarativeNetRequest.updateDynamicRules({
  addRules: [
    {
      id: 100,
      priority: 1,
      action: {
        type: "block"
      },
      condition: {
        urlFilter: "example-tracker"
      }
    }
  ]
});
```

Это полезно, когда rules зависят от пользовательских настроек или runtime configuration.

---

# G.27. Удаление Dynamic Rules

Например:

```javascript
await chrome.declarativeNetRequest.updateDynamicRules({
  removeRuleIds: [100]
});
```

Архитектурно:

```text
Application state
      │
      ▼
Rule compiler
      │
      ▼
Dynamic rules
      │
      ▼
Browser engine
```

---

# G.28. Session Rules

Session rules предназначены для временных правил.

Концептуально:

```text
Static
   = packaged policy

Dynamic
   = persistent runtime policy

Session
   = temporary runtime policy
```

Это очень полезное разделение:

```text
Rules
├── Static
├── Dynamic
└── Session
```

---

# G.29. Когда использовать Static Rules

Используйте static rules, если правило:

* является частью продукта;
* поставляется с extension;
* редко изменяется;
* должно быть version-controlled.

Например:

```text
block known tracker
```

---

# G.30. Когда использовать Dynamic Rules

Dynamic rules подходят для:

* пользовательских фильтров;
* runtime configuration;
* custom block lists;
* правил, создаваемых UI.

Например:

```text
User
 │
 ▼
Add domain to block list
 │
 ▼
Extension
 │
 ▼
Dynamic Rule
```

---

# G.31. Когда использовать Session Rules

Session rules подходят для временных состояний:

```text
Temporary mode ON
      ↓
Session rules
      ↓
Temporary mode OFF
      ↓
Remove rules
```

Например:

```text
"Block analytics for this browser session"
```

---

# G.32. Rule Limits

DNR имеет ограничения на количество правил и размер rulesets.

Это фундаментально важно для больших extensions.

Нельзя проектировать систему:

```text
10 million arbitrary rules
```

без учёта browser limits.

Следовательно, при создании rule engine необходимо учитывать:

```text
Rule count
Ruleset limits
Dynamic rule limits
Regex limitations
Memory
Performance
```

Точные значения лимитов зависят от типа rules и актуальной версии Chrome.

---

# G.33. Почему нельзя игнорировать limits

Предположим:

```text
User filters
   ↓
100,000 rules
```

Если extension пытается просто передать их browser engine, операция может быть ограничена API.

Поэтому production architecture должна иметь:

```text
Input Rules
     ↓
Normalization
     ↓
Deduplication
     ↓
Optimization
     ↓
Rule compilation
     ↓
DNR
```

---

# G.34. Rule Compiler

Это особенно важная архитектурная идея для современного extension framework.

Пользователь может описать:

```json
{
  "domain": "example.com",
  "action": "block"
}
```

а framework преобразует это в DNR rule:

```json
{
  "id": 1001,
  "action": {
    "type": "block"
  },
  "condition": {
    "urlFilter": "||example.com^"
  }
}
```

Получаем:

```text
High-level policy
       ↓
Rule Compiler
       ↓
DNR IR
       ↓
Chrome
```

---

# G.35. DNR как Intermediate Representation

DNR rules можно рассматривать как **intermediate representation** сетевой политики.

Например:

```text
Application Policy
       ↓
      AST
       ↓
Rule Compiler
       ↓
DNR Rules
       ↓
Browser Rule Engine
```

Это очень близко к compiler architecture.

Именно здесь появляется интересная связь с архитектурой Platform-first frameworks:

```text
Developer code
       ↓
Intermediate representation
       ↓
Browser-native execution
```

---

# G.36. Rule Generation

Например, пользователь хочет:

```text
Block:
*.tracker.com/*
```

Вместо выполнения JavaScript на каждом request framework генерирует:

```json
{
  "id": 2001,
  "action": {
    "type": "block"
  },
  "condition": {
    "urlFilter": "tracker.com"
  }
}
```

После этого browser engine выполняет matching.

---

# G.37. DNR и Service Worker

Очень важное отличие:

```text
DNR
   ↓
browser engine
```

не:

```text
Network Request
   ↓
Service Worker
   ↓
DNR
```

Service Worker может **управлять rulesets**, но он не обязан участвовать в каждом запросе.

Например:

```text
Service Worker
      │
      │ update rules
      ▼
DNR Engine
      │
      │
      ▼
Network Requests
```

Это одна из главных причин производительности DNR.

---

# G.38. DNR и Ephemeral Runtime

Предположим, Service Worker был остановлен:

```text
Service Worker
     ↓
terminated
```

DNR rules всё равно могут продолжать применяться, поскольку сетевое решение выполняется browser-managed engine.

Это принципиально отличается от архитектуры:

```text
request
 ↓
JavaScript
```

---

# G.39. DNR и Performance

DNR позволяет перенести matching из JavaScript runtime в browser engine.

Вместо:

```text
Request
 ↓
Wake JS
 ↓
Parse
 ↓
Execute
 ↓
Decision
```

получается:

```text
Request
 ↓
Browser rule engine
 ↓
Match
 ↓
Action
```

Следовательно, DNR может уменьшать:

* количество JavaScript execution;
* Service Worker wakeups;
* communication overhead;
* application-level latency.

---

# G.40. DNR и Security

Declarative execution также создаёт более контролируемую security model.

Вместо возможности выполнять произвольный JavaScript на каждом network event:

```text
Network
 ↓
arbitrary JS
```

расширение предоставляет ограниченное описание:

```text
Rule
 ↓
Condition
 ↓
Allowed Action
```

То есть:

```text
Expressiveness
       ↓
constrained
       ↓
Security
```

Это одна из фундаментальных идей Manifest V3.

---

# G.41. DNR и `webRequest`

Важно понимать концептуальное различие.

### Imperative

```text
Network
   ↓
webRequest event
   ↓
JavaScript
   ↓
decision
```

### Declarative

```text
Rules
   ↓
Browser
   ↓
Network
   ↓
decision
```

Manifest V3 делает декларативный подход особенно важным для blocking network logic.

---

# G.42. Когда нужен `webRequest`

`webRequest` может оставаться полезным для сценариев, где необходимо:

* наблюдать сетевые события;
* анализировать requests;
* получать информацию, которую DNR не предоставляет;
* реализовывать non-blocking network observation.

Но следует очень внимательно проверять конкретные возможности Chrome MV3 и требования permissions.

---

# G.43. Когда нужен DNR

DNR особенно подходит для:

```text
Blocking
Redirecting
Header modification
Allow lists
Block lists
Privacy filters
Tracking protection
URL policies
```

---

# G.44. Архитектура Ad Blocker

Типичный MV3 ad blocker можно представить так:

```text
                 Ad Blocker
                     │
          ┌──────────┴──────────┐
          │                     │
       Rule Source           Settings
          │                     │
          ▼                     ▼
      Rule Compiler        Storage
          │
          ▼
      DNR Rules
          │
          ▼
   Browser Rule Engine
          │
          ▼
     Network Requests
```

Главное:

> **Ad blocker не обязан запускать JavaScript для каждого request.**

---

# G.45. Blocklist

Например:

```text
tracker1.example
tracker2.example
tracker3.example
```

может быть преобразован:

```text
Blocklist
   ↓
Normalized domains
   ↓
Generated DNR rules
   ↓
Static/Dynamic rules
```

---

# G.46. Allowlist

Production blocker почти всегда требует исключений.

Например:

```text
Block:
tracker.example

Allow:
trusted.example
```

Архитектура:

```text
General block rule
       │
       ▼
Exception rule
       │
       ▼
Priority / rule interaction
```

Поэтому allowlist следует проектировать одновременно с blocklist.

---

# G.47. Rule IDs как Database Primary Keys

В сложном extension можно рассматривать:

```text
rule.id
```

аналогично primary key.

Например:

```text
100001 → user rule
100002 → user rule
100003 → system rule
```

Тогда framework может вести mapping:

```text
Application Rule
      │
      └── DNR Rule ID
```

Например:

```typescript
type RuleRecord = {
  applicationId: string;
  dnrId: number;
};
```

---

# G.48. Namespace для Rule IDs

Полезно разделять диапазоны:

```text
1–9999
    system rules

10000–19999
    user rules

20000–29999
    temporary rules
```

Это не требование Chrome, а архитектурный convention.

Он упрощает:

* debugging;
* migration;
* cleanup;
* rule ownership.

---

# G.49. Versioning Rules

Rules должны версионироваться вместе с extension.

Например:

```text
Extension 1.4.0
   ↓
rules v14
```

При обновлении:

```text
Extension 1.5.0
   ↓
rules v15
```

Можно проверить:

```text
current rules schema
       ↓
migration
       ↓
new rules
```

---

# G.50. Rule Migration

Если структура application-level rules меняется:

```text
v1
 ↓
migration
 ↓
v2
 ↓
compiler
 ↓
DNR
```

Это особенно важно для dynamic rules.

Не следует считать DNR rules единственным источником истины.

Лучше:

```text
Application State
      ↓
Canonical Rules
      ↓
Compiler
      ↓
DNR Rules
```

---

# G.51. Canonical Rule Model

Например:

```typescript
type BlockRule = {
  id: string;
  domain: string;
  enabled: boolean;
};
```

Это **application-level model**.

А DNR:

```json
{
  "id": 1001,
  "action": {
    "type": "block"
  },
  "condition": {
    "urlFilter": "example.com"
  }
}
```

— это **platform-level representation**.

Это важное разделение.

---

# G.52. DNR как Backend Runtime

Можно провести аналогию:

```text
Application
    ↓
Policy
    ↓
Compiler
    ↓
DNR
    ↓
Browser
```

Получается:

```text
DNR ≈ browser-native execution backend
```

а Service Worker становится:

```text
orchestrator
```

---

# G.53. Не хранить бизнес-логику только в DNR

DNR — это runtime representation.

Не следует превращать его в database.

Плохо:

```text
DNR rules
    ↓
source of truth
```

Лучше:

```text
Application Database
       ↓
Policy
       ↓
DNR compiler
       ↓
DNR
```

Так можно:

* менять формат;
* мигрировать;
* валидировать;
* тестировать;
* восстанавливать rules.

---

# G.54. Validation

Перед установкой правил полезно выполнить validation:

```text
Input
  ↓
Schema validation
  ↓
Semantic validation
  ↓
Conflict detection
  ↓
Optimization
  ↓
DNR
```

Например:

```text
Rule A: block example.com
Rule B: block example.com
```

может быть обнаружено как duplicate.

---

# G.55. Deduplication

Перед загрузкой большого ruleset:

```text
100,000 input rules
        ↓
deduplication
        ↓
72,000 rules
        ↓
optimization
        ↓
DNR
```

Это особенно важно при генерации правил из:

* пользовательских фильтров;
* внешних lists;
* subscriptions;
* AI-generated policies.

---

# G.56. DNR и внешние filter lists

Ad blocker может получать:

```text
Remote Filter List
       ↓
Parser
       ↓
Normalizer
       ↓
Compiler
       ↓
DNR
```

Но Manifest V3 security model не означает, что расширение может просто загрузить удалённый JavaScript и выполнить его.

Безопасная архитектура:

```text
Remote DATA
   ↓
parse as data
   ↓
generate declarative rules
   ↓
browser engine
```

а не:

```text
Remote CODE
   ↓
execute
```

---

# G.57. DNR и Remote Configuration

Удалённые данные могут использоваться для обновления policy:

```text
Server
  ↓
JSON configuration
  ↓
Extension
  ↓
validate
  ↓
compile
  ↓
DNR
```

Это принципиально отличается от:

```text
Server
  ↓
JavaScript
  ↓
execute
```

Последняя модель противоречит ключевым ограничениям MV3.

---

# G.58. DNR как Security Policy Engine

DNR можно использовать не только для рекламы.

Например:

```text
Security Policy
      ↓
Rules
      ↓
DNR
```

Возможные сценарии:

* block dangerous domains;
* enforce HTTPS;
* redirect known unsafe URLs;
* restrict resources;
* modify selected headers;
* enterprise network policy.

---

# G.59. Enterprise Extension

В enterprise-сценарии архитектура может выглядеть так:

```text
Enterprise Policy
       ↓
Extension Configuration
       ↓
Rule Compiler
       ↓
DNR
       ↓
Browser
```

Таким образом extension становится локальным policy enforcement layer.

---

# G.60. DNR и Multi-context Architecture

DNR хорошо вписывается в multi-context extension:

```text
Popup
  │
  ▼
Service Worker
  │
  ├── Storage
  │
  ├── Permissions
  │
  └── DNR
          │
          ▼
    Browser Network Engine
```

Popup и Side Panel могут изменять policy.

Service Worker управляет rules.

DNR выполняет policy.

---

# G.61. Пример: пользовательский Block Domain

Пользователь вводит:

```text
ads.example.com
```

UI:

```text
Popup
   │
   ▼
Add domain
```

Service Worker:

```text
Validate
   ↓
Normalize
   ↓
Create rule
```

DNR:

```text
Rule:
block ads.example.com
```

Network:

```text
Request
   ↓
DNR
   ↓
BLOCK
```

JavaScript не требуется на каждый request.

---

# G.62. Пример: Temporary Block

Пользователь включает:

```text
"Block tracking for this session"
```

Архитектура:

```text
UI
 ↓
Service Worker
 ↓
Session Rules
 ↓
DNR
```

После завершения session временная policy исчезает.

---

# G.63. Пример: Site-specific Policy

Пользователь открывает:

```text
example.com
```

Extension применяет:

```text
example.com
 ├── allow analytics
 ├── block ads
 └── block third-party trackers
```

Это может быть реализовано комбинацией условий и actions.

---

# G.64. Debugging DNR

При debugging необходимо проверять:

```text
1. Ruleset loaded?
2. Rule enabled?
3. Rule ID valid?
4. Condition matches?
5. Resource type correct?
6. Priority correct?
7. Another rule overrides it?
8. Permission sufficient?
9. Browser policy allows action?
```

Нельзя ограничиваться:

```javascript
console.log("rule added");
```

Это говорит только о том, что API call был выполнен, но не доказывает, что ожидаемый network behavior произошёл.

---

# G.65. Testing DNR

Тест должен выглядеть примерно так:

```text
Given:
URL X

When:
request Y is generated

Then:
request is blocked
```

или:

```text
Given:
URL X

When:
request Y occurs

Then:
request redirects to Z
```

То есть DNR следует тестировать как **policy engine**, а не как обычную JavaScript function.

---

# G.66. Unit Testing Rule Compiler

Если существует compiler:

```text
Policy
   ↓
compile()
   ↓
DNR Rule
```

его можно тестировать независимо:

```typescript
expect(
  compile({
    domain: "example.com",
    action: "block"
  })
).toEqual({
  // expected DNR rule
});
```

Это позволяет отделить:

```text
Business logic
```

от:

```text
Browser runtime
```

---

# G.67. Integration Testing

Следующий уровень:

```text
Compiler
   ↓
Chrome
   ↓
Real request
   ↓
Expected behavior
```

Это уже integration/E2E test.

---

# G.68. Performance Testing

Для большого ruleset необходимо измерять:

```text
Rule generation time
Rules update time
Rule count
Memory
Network behavior
Browser impact
```

Особенно важно избегать архитектуры:

```text
Every user action
      ↓
rebuild 100,000 rules
```

Лучше:

```text
Change
 ↓
incremental update
 ↓
affected rules only
```

---

# G.69. Incremental Rules

Например:

```text
Existing:
1000 rules

User adds:
1 rule

Bad:
rebuild 1001 rules

Better:
add 1 dynamic rule
```

Это уменьшает runtime work.

---

# G.70. Declarative Cache

DNR rules можно рассматривать как browser-side compiled cache:

```text
Canonical Policy
       ↓
Compiler
       ↓
DNR Rules
       ↓
Browser
```

Если policy не изменилась:

```text
do nothing
```

Это важный принцип для производительности.

---

# G.71. DNR и Event-Driven Architecture

Вместо:

```text
Network
 ↓
Service Worker
 ↓
JavaScript
```

получаем:

```text
Network
 ↓
DNR
```

А Service Worker реагирует только на события уровня приложения:

```text
User changed settings
      ↓
Service Worker
      ↓
Update rules
```

Это делает архитектуру:

```text
event-driven
+
declarative
```

---

# G.72. DNR и Platform-first Architecture

DNR прекрасно демонстрирует философию Platform-first:

```text
Application
      ↓
Describe intent
      ↓
Browser-native representation
      ↓
Browser engine
```

Вместо создания собственного JavaScript network runtime extension использует уже существующий механизм браузера.

---

# G.73. DNR как часть Extension Compiler

Для framework уровня Emerge/Platform-first можно представить:

```text
Developer API
      ↓
Policy DSL
      ↓
Compiler
      ↓
DNR Rules
      ↓
Chrome
```

Например:

```typescript
network.block({
  domain: "tracker.example"
});
```

framework преобразует это в:

```text
DNR Rule
```

Разработчик работает с высокоуровневой моделью.

---

# G.74. DNR Intermediate Representation

Ещё более интересный вариант:

```text
Application DSL
      ↓
Universal Extension IR
      ↓
       ├── Chrome DNR
       ├── Firefox equivalent
       └── Other browser backend
```

Тогда DNR становится не API, которое разработчик должен знать напрямую, а backend target.

Это особенно интересно для cross-browser extension frameworks.

---

# G.75. Что должно оставаться в JavaScript

DNR не заменяет весь extension runtime.

JavaScript всё ещё нужен для:

```text
UI
State
Business Logic
Messaging
User interaction
Storage
Rule generation
API orchestration
Complex computation
```

Но network matching, если он выражается через DNR, лучше отдавать browser engine.

---

# G.76. Что должно быть Declarative

Хорошее правило:

> Если поведение можно выразить как набор заранее известных условий и действий, следует рассмотреть декларативную модель.

Например:

```text
if URL matches X
then block
```

идеально подходит для DNR.

Но:

```text
if request A
then calculate complex ML model
then query database
then inspect application state
then decide
```

уже не является естественной задачей для DNR.

---

# G.77. Imperative vs Declarative Decision

Можно использовать следующую таблицу:

| Задача                            | Подход              |
| --------------------------------- | ------------------- |
| Block URL                         | DNR                 |
| Redirect URL                      | DNR                 |
| Modify supported headers          | DNR                 |
| Allow exception                   | DNR                 |
| Analyze complex application state | JavaScript          |
| Update rules                      | Service Worker      |
| User configuration                | UI + Storage        |
| Generate rules                    | JavaScript/compiler |
| Execute arbitrary computation     | JavaScript/WASM     |

---

# G.78. Архитектурное правило

Не следует выбирать:

```text
DNR
```

только потому, что это «новый API».

Нужно выбирать его потому, что:

```text
Problem
   ↓
can be expressed declaratively
   ↓
browser can execute it
```

Тогда DNR действительно является правильным runtime.

---

# G.79. Полный Pipeline

Для production DNR extension можно использовать следующий pipeline:

```text
                 User / Server Policy
                         │
                         ▼
                   Policy Parser
                         │
                         ▼
                    Validator
                         │
                         ▼
                   Normalizer
                         │
                         ▼
                  Deduplicator
                         │
                         ▼
                   Optimizer
                         │
                         ▼
                  Rule Compiler
                         │
                         ▼
                   DNR Rules
                         │
                ┌────────┴────────┐
                │                 │
             Static            Dynamic
                │                 │
                └────────┬────────┘
                         ▼
                 Chrome DNR Engine
                         │
                         ▼
                  Network Requests
```

Это уже полноценная **compiler pipeline architecture**.

---

# G.80. Итоговая модель DNR

DNR следует понимать не как:

> «API для блокировки рекламы».

Это слишком узкое определение.

Более точное определение:

> **Declarative Net Request — это browser-managed rule engine для декларативного управления частью сетевого поведения extension.**

Его архитектура:

```text
                 Application
                      │
                      ▼
                 Network Policy
                      │
                      ▼
                Rule Compiler
                      │
                      ▼
                 DNR Rules
                      │
                      ▼
             Browser Rule Engine
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
        BLOCK      REDIRECT    MODIFY
          │           │           │
          └───────────┼───────────┘
                      ▼
                   Network
```

Именно эта модель делает DNR одним из ключевых элементов современной Manifest V3 архитектуры.

**Главный принцип:**

> **Не запускай JavaScript для каждого сетевого события, если браузер уже умеет выполнить необходимую policy декларативно.**

В зрелом MV3-приложении Service Worker должен прежде всего **управлять политикой**, а browser engine — **исполнять её**.

Это приводит к архитектуре:

```text
Developer Intent
      ↓
Policy
      ↓
Compiler
      ↓
Declarative Rules
      ↓
Browser Engine
      ↓
Native Execution
```

Именно переход от **JavaScript-driven execution** к **browser-managed declarative execution** является одной из наиболее важных архитектурных идей Manifest V3.
