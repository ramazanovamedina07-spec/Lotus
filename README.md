# Lotus Website

MVP интернет-магазина с:
- SQLite базой данных
- регистрацией и входом (JWT)
- серверной корзиной
- личным кабинетом и историей заказов
- оформлением заказа

## Запуск

1. Установить зависимости:
   `npm install`
2. Запустить сервер:
   `npm start`
3. Открыть:
   `http://localhost:3000`

## API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/cart`
- `POST /api/cart/items`
- `PATCH /api/cart/items/:productId`
- `DELETE /api/cart/items/:productId`
- `POST /api/orders/checkout`
- `GET /api/orders`
