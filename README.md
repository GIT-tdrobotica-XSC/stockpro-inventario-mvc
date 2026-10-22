# StockPro — Sistema de inventario MVC

Node.js + Express + EJS + SQLite (módulo nativo `node:sqlite`). Gestor de paquetes: **pnpm**. Desplegable en Vercel.

## Ejecutar

```bash
pnpm install
pnpm start        # http://localhost:3000
pnpm dev          # con recarga automática
```

La base de datos se crea sola en `data/inventario.db` con datos de demostración.
Para reiniciarla, borra la carpeta `data/`.

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@stockpro.com | admin123 |
| Usuario | user@stockpro.com | user123 |

## Arquitectura MVC

```
src/
├── models/        M — acceso a datos y reglas (User, Product, Category, Movement, db)
├── views/         V — plantillas EJS (auth, catalog, admin, partials)
├── controllers/   C — lógica de cada petición (auth, catalog, admin)
├── routes/        Mapa URL → controlador
├── middleware/    Protección por sesión y rol
├── seed.js        Datos de demostración
└── app.js         Configuración de Express
```

## Funcionalidades

**Usuario:** registro/login, catálogo con búsqueda, filtros, orden y paginación, detalle de producto,
retiro de unidades (descuenta stock) e historial personal.

**Administrador:** dashboard con métricas y gráficas, alertas de stock bajo con reposición rápida,
CRUD de productos y categorías, ajuste de stock, gestión de usuarios y roles, historial global de movimientos.

**Seguridad:** contraseñas con bcrypt, sesiones, rutas protegidas por rol, consultas parametrizadas
(sin inyección SQL), validación en servidor y transacciones al mover stock.

## Despliegue en Vercel (demo)

La app se expone como función serverless (`api/index.js` + `vercel.json`). La sesión va en una cookie firmada y la base de datos SQLite vive en `/tmp` con datos de ejemplo que se cargan al iniciar. **Los cambios no son permanentes**: se reinician cuando Vercel recicla la instancia. Para producción real habría que usar una base de datos externa (Turso, Neon, etc.).

