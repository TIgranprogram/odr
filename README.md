# kppdf — Система автоматизации снабжения и учета

Система для управления поставками, счетами, складскими остатками и аналитикой доходов/расходов (ОДР).

## 🚀 Быстрый старт

1. **Установка зависимостей:**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Запуск в Docker:**
   ```bash
   docker-compose up -d
   ```

3. **Локальный запуск:**
   ```bash
   # Backend
   cd backend && npm run dev
   # Frontend
   cd ../frontend && npm start
   ```

## 📂 Структура проекта
- `backend/`: Node.js + Express + Mongoose
- `frontend/`: Angular 17+ + TailwindCSS
- `docs/`: Документация, Roadmap, ОДР Logic
- `docker-compose.yml`: Инфраструктура (MongoDB, Backend, Frontend)
