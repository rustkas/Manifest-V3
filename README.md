# 📘 Manifest V3 — архитектура и разработка современных браузерных расширений

> Полное руководство по созданию браузерных расширений на Manifest V3. От первого `manifest.json` до production-приложений с многоконтекстной архитектурой.

---

## 📖 О книге

Эта книга — не справочник по полям `manifest.json`. Это **систематическое погружение в архитектуру Manifest V3**, которое проведёт вас от минимального расширения до полноценного multi-context приложения.

Manifest V3 — это не просто обновление формата. Это смена парадигмы разработки браузерных расширений. Service Worker вместо persistent background, declarative APIs вместо императивного кода, изолированные контексты выполнения. Книга построена так, чтобы вы не просто выучили API, а **поняли архитектурные принципы**, лежащие в основе современной платформы расширений.

### Для кого эта книга

- **Разработчики расширений**, переходящие с Manifest V2 на V3
- **Frontend-разработчики**, желающие освоить новую область
- **Архитекторы**, проектирующие сложные расширения с множеством контекстов
- **Студенты**, изучающие browser extension platform как модель распределённого приложения

### Что вы узнаете

- Как устроен жизненный цикл расширения в Manifest V3
- Почему Service Worker эфемерен и как проектировать устойчивую архитектуру
- Как работают изолированные миры и почему это критически важно
- Как строить коммуникацию между popup, content script, side panel и Service Worker
- Как использовать declarative APIs для производительных и безопасных расширений
- Как проектировать расширение как распределённую систему

---

## 🗂️ Структура книги

### Часть I. Архитектура браузерных расширений
- **Глава 1** — Что такое Browser Extension. Расширение как отдельное приложение, контексты, модель безопасности.
- **Глава 2** — Manifest V3. Структура, поля, разрешения.
- **Глава 3** — Первое расширение. От минимального до production-like.

### Часть II. Permissions и модель безопасности
- **Главы 4–6** — Permissions, Host Permissions, безопасность Manifest V3. Принцип наименьших привилегий, CSP, запрет `eval()`.

### Часть III. Extension Contexts
- **Главы 7–10** — Контексты выполнения. Extension pages, Content Scripts, Isolated World. Что доступно в каждом контексте и что нельзя передавать напрямую.

### Часть IV. Service Worker
- **Главы 11–13** — Background Service Worker. Жизненный цикл, event-driven архитектура, управление состоянием, устойчивый background runtime.

### Часть V. Communication
- **Главы 14–16** — Message Passing. `sendMessage`, `connect`, Port, архитектура коммуникации, typed message protocol.

### Часть VI–VII. Пользовательский интерфейс
- **Главы 17–20** — Action, Popup, Options Page, Side Panel. Жизненные циклы, ограничения, архитектурные паттерны.

### Часть VIII. Commands и управление
- **Главы 21–22** — Keyboard shortcuts, Tabs API, Windows API. Оркестрация вкладок и управление расширением.

### Часть IX. Declarative APIs
- **Главы 23–26** — Философия declarative подхода. `declarativeContent`, `declarativeNetRequest`. Перенос логики в браузерный движок.

### Часть X. Storage и состояние
- **Главы 27–28** — `chrome.storage` (local, sync, session, managed). State synchronization, event-driven updates.

### Часть XI–XII. Network и инъекция
- **Главы 29–33** — Network requests, Web Platform APIs, programmatic injection, DOM integration, Page ↔ Extension Bridge.

### Часть XIII. Extension Architecture
- **Главы 34–36** — Архитектурные паттерны, проектирование extension runtime, расширение как распределённое приложение.

### Часть XIV. Production Development
- **Главы 37–40** — Debugging, Testing, Performance, Packaging & Distribution.

### Часть XV. Практические проекты
- **Главы 41–48** — 8 проектов от Hello Extension до Full Multi-context Application.

### Часть XVI. Manifest V3 как платформа
- **Главы 49–52** — Extension Platform API, Design Principles, MV3 vs Web App, будущее browser extensions.

### Приложения
- Полный Manifest V3 Reference
- Permissions Reference
- Host Match Patterns
- Extension Context Matrix
- Chrome Extension APIs
- Message Architecture Reference
- Declarative Net Request Rules
- Extension Security Checklist
- Extension Performance Checklist
- Production Checklist
- Manifest V3 Glossary

---

## 🎯 Ключевые концепции, которые вы освоите

### Extension Contexts
Книга делает особый акцент на **архитектурных границах между контекстами**. Вы поймёте, почему `window` в content script не равен `window` в popup, почему `localStorage` недоступен в Service Worker, и как строить безопасную коммуникацию.

### Service Worker Lifecycle
Эфемерный background runtime — главная архитектурная сложность MV3. Вы научитесь проектировать систему, которая корректно работает при частых запусках и остановках Service Worker.

### Declarative Model
Вместо императивного кода — декларативные правила, которые выполняются браузером. Производительность, безопасность, независимость от жизненного цикла.

### Message Passing как нервная система
Расширение — это распределённая система. Message passing — основной способ коммуникации. Вы освоите typed message protocol, управление соединениями и архитектуру event bus.

### Безопасность как архитектура
CSP, изолированные миры, валидация сообщений, работа с недоверенным контентом. Безопасность встроена в каждый архитектурный слой.

---

## 📁 Репозиторий

В этом репозитории находятся:

### Исходный текст книги
Главы в формате Markdown, готовые к публикации.

### Код проектов
Примеры из глав 41–48 — рабочие расширения, демонстрирующие каждую архитектурную концепцию.

### Схемы и диаграммы
Визуализация архитектуры контекстов, жизненных циклов, потоков сообщений.

### Чеклисты и справочники
Материалы из приложений для быстрого доступа к ключевой информации.

---

## 🚀 Быстрый старт

```bash
# Клонируйте репозиторий
git clone https://github.com/rustkas/manifest-v3-book.git
cd manifest-v3-book

# Установите зависимости для примеров (при необходимости)
npm install

# Откройте книгу
open book/README.md  # или смотрите главы в /chapters
```

### Примеры расширений

Каждый проект из Части XV находится в отдельной директории:

```
/projects/
├── 41-hello-extension/         # Минимальное расширение
├── 42-page-modifier/           # Content Script + DOM
├── 43-background-extension/    # Service Worker + Action
├── 44-productivity-extension/  # Popup + Storage
├── 45-side-panel-application/  # Side Panel + Tabs
├── 46-keyboard-extension/      # Commands + Content Scripts
├── 47-network-extension/       # Declarative Net Request
└── 48-full-application/        # Все контексты вместе
```

---

## 🛠️ Требования

- Браузер с поддержкой Manifest V3 (Chrome 88+, Edge 88+, Firefox 109+)
- Базовое знание JavaScript, HTML, CSS
- Понимание асинхронного программирования (Promises, async/await)
- Желание мыслить архитектурно

---

## 🤝 Вклад в книгу

Мы приветствуем ваши предложения:

- **Архитектурные инсайты** — если у вас есть опыт в сложных расширениях
- **Исправления** — опечатки, неточности, устаревшая информация
- **Дополнительные проекты** — примеры, которых не хватает
- **Переводы** — помощь в локализации

Создавайте Issue или Pull Request. Для серьёзных изменений сначала обсудите идею в Issue.

---

## 📜 Лицензия

Книга доступна под лицензией **Creative Commons Attribution-NonCommercial 4.0 International**.

- Вы можете свободно читать, распространять и адаптировать материал
- Вы **не можете** использовать его в коммерческих целях без разрешения
- Вы **обязаны** указывать авторство

Код примеров распространяется под лицензией **MIT**.

---

## 📚 Дополнительные ресурсы

- [Официальная документация Chrome Extensions](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/)
- [Declarative Net Request API](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest)
- [Chrome Extension Samples](https://github.com/GoogleChrome/chrome-extensions-samples)

---

## 📝 Контакты и обратная связь

Если у вас есть вопросы по содержанию книги, архитектурные дилеммы или вы хотите поделиться своим опытом разработки расширений на Manifest V3 — пишите!

---

*Последнее обновление: 2026*

---

> *"Расширение Manifest V3 — это не скрипт на странице. Это распределённое приложение, где каждый контекст знает свою роль, а сообщения заменяют общую память."*