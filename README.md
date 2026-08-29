# Календарь звонков (продолжение)


[![hexlet-check](https://github.com/d3f38/ai-for-developers-project-387/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/d3f38/ai-for-developers-project-387/actions)

Интегрируйте работу агентов в GitHub проект

Учебный проект Хекслета: https://ru.hexlet.io/programs/ai-for-developers
Как это должно работать: https://files.hexlet.app/a/2ipc5m

Сервис записи на встречи: владелец календаря заводит типы событий, гость выбирает
свободный слот и бронирует его.

## Стек

Проект сделан в подходе Design First: сначала описан API-контракт, затем по нему
независимо реализованы фронтенд и бэкенд.

| Слой | Стек | Расположение |
| --- | --- | --- |
| Контракт | TypeSpec → OpenAPI 3 | `src/main.tsp`, `api-specs/openapi.yaml` |
| Бэкенд | Express + TypeScript, хранилище в памяти | `backend/` |
| Фронтенд | React 19 + Vite + Tailwind | `frontend/` |
| E2E-тесты | Playwright | `tests/e2e/` |

В продакшене это один контейнер: Express отдаёт API по `/api` и раздаёт собранный
фронтенд, включая SPA-fallback для маршрутов роутера.

## Установка

```bash
git clone https://github.com/d3f38/ai-for-developers-project-387.git
cd ai-for-developers-project-387
npm install && npm --prefix backend install && npm --prefix frontend install
```

## Использование

### Запуск в Docker

Приложение слушает порт из переменной окружения `PORT`.

```bash
docker build -t booking-app .
docker run --rm -e PORT=8080 -p 8080:8080 booking-app
# http://localhost:8080
```

Хранилище живёт в памяти процесса, поэтому на старте бэкенд создаёт демонстрационные
типы событий. Отключается через `SEED_DEMO_DATA=false`.

### Локальная разработка

```bash
npm run dev          # бэкенд :3000 + фронтенд :5173
npm run compile      # пересобрать OpenAPI из TypeSpec
```

### Тесты

Playwright покрывает основные пользовательские сценарии: полный путь бронирования,
недоступность занятого слота и сообщение о конфликте.

```bash
npx playwright install chromium
npm run test:e2e
```

По умолчанию тесты сами собирают и поднимают приложение на `:3100`. Чтобы прогнать
их против контейнера или задеплоенного стенда:

```bash
E2E_BASE_URL=http://localhost:8080 npm run test:e2e
```

---

<details>
<summary>Автоматические тесты Хекслета</summary>

Тесты запускаются на каждый коммит. За запуск отвечает файл `.github/workflows/hexlet-check.yml` — не удаляйте и не переименовывайте ни его, ни репозиторий.

</details>

## О Хекслете

[Хекслет](https://ru.hexlet.io/) — школа программирования: авторские программы обучения с практикой, поддержкой наставников и реальными проектами, которые остаются в резюме. Этот репозиторий — один из таких проектов.
