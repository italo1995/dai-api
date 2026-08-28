# Dai API

Backend de **Dai**: una plataforma que combina un servicio de traslados tipo taxi/app de viajes
(pasajeros, conductores, viajes, cobranzas) con un **Marketplace** (Dai Food / Dai Market) donde
comercios afiliados venden productos que se entregan usando la misma red de conductores.

## Stack tecnológico

- Node.js + TypeScript
- Express
- Sequelize (ORM) + PostgreSQL
- Autenticación por JWT
- Socket.io (ubicación de conductores en tiempo real, notificaciones)
- Documentación de API con OpenAPI (swagger-jsdoc + swagger-ui-express)
- Firebase Admin (push notifications)
- Twilio (SMS — opcional, gateado por `TWILIO_ENABLED`)

## Cómo correr el proyecto localmente

### Requisitos

- Node.js
- PostgreSQL

### Variables de entorno

El repo no incluye un `.env.example` — pedir los valores reales al equipo. Las que lee el
código:

```
PORT=
API_PREFIX=/api
SECRET_KEY=
JWT_EXPIRES=
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=
SQL_DIALECT=postgres
SQL_POOL_LIMIT=
SOCKET_PORT=
NODE_ENV=development
TWILIO_ENABLED=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_T=
TWILIO_PHONE_NUMBER=
```

### Instalación

```bash
npm install
npm run migrate      # corre todas las migraciones
npm run seed         # datos base: roles, tipos de vehículo, parámetros de la empresa, etc.
npm run dev           # levanta con nodemon sobre src/index.ts
```

Otros scripts útiles: `npm run mi:g --name <nombre>` (nueva migración), `npm run build` (compila
a `dist/`), `npm run lint` / `npm run format`.

## Documentación de la API (OpenAPI / Swagger)

Con el servidor corriendo:

- **Swagger UI** (interactivo, para probar endpoints): `http://localhost:{PORT}/doc`
- **JSON crudo**: `http://localhost:{PORT}/api/docs.json`

Cada recurso tiene su propio archivo en [src/documentation/*.yaml](src/documentation).

> ⚠️ **`nodemon` no observa archivos `.yaml`** (solo `.ts`/`.js`). Si editás un archivo de
> documentación y no lo ves reflejado en `/doc`, hay que reiniciar el server a mano — o forzarlo
> tocando un `.ts` (ej. `touch src/server.ts`).

## Arquitectura

Patrón consistente en todo el proyecto para cada recurso: **Modelo → Servicio → Controlador →
Ruta**.

```
src/
├── models/          # Definiciones Sequelize + asociaciones, agrupadas por dominio
├── services/        # Lógica de negocio y acceso a datos (lo que hace el trabajo real)
├── controller/       # Maneja request/response, delega todo al servicio
├── routes/           # Define endpoints y sus middlewares de auth; todo se monta en routes/index.ts
├── documentation/     # Specs OpenAPI, un .yaml por recurso
├── database/
│   ├── migrations/   # Migraciones Sequelize
│   └── seeders/      # Datos iniciales (roles, tipos de vehículo, etc.)
├── middlewares/       # auth, upload (multer), validación
└── utils/             # Helpers compartidos: respuestas estándar, queries, paginación
```

### Módulos / dominios principales

- **Traslados (Trip)** — viajes, ofertas de conductores, rutas, pagos de viaje, cancelaciones,
  solicitudes especiales, botón de pánico.
- **Usuarios** — pasajeros, conductores (detalle de vehículo, verificación), staff/administradores,
  calificaciones, suspensiones.
- **Marketplace (Dai Food / Dai Market)** — tiendas, productos (categorías, departamentos,
  modificadores, imágenes, promociones), carrito de compra, cupones, favoritos, calificaciones de
  tienda, horarios (con zona horaria por país), monedas y métodos de pago aceptados por cada
  tienda.
- **Pagos / Billetera** — recargas, bancos, monedas, métodos de pago, transacciones.
- **Back-office / contenido web** — banners, popups, términos, ayuda, parámetros de la empresa,
  staff y permisos (módulos/vistas).

### Roles y permisos

La tabla `rols` define 4 roles fijos, referenciados **por id** en el código (no por nombre) — ver
[src/middlewares/auth.ts](src/middlewares/auth.ts):

| id | rol | descripción |
|----|-----|-------------|
| 1 | `admin` | Acceso total |
| 2 | `operator` | Equivalente a admin para operaciones internas |
| 3 | `client` | Pasajero o conductor — un `client` con un `DriverDetail` asociado es conductor |
| 4 | `store` | Dueño/operador de una tienda del Marketplace |

Dentro de `admin`/`operator`, el panel tiene un sistema más granular de **Asignaciones** (sección
Staff): cada Asignación define a qué Módulos tiene acceso ese miembro del staff. Ver
[ViewModel](src/models/web/ViewModel.ts) / [StaffModel](src/models/web/StaffModel.ts). El catálogo
de Módulos se bootstrapea una única vez con `POST /view/createMany` (ya corrido en producción).

## Convenciones importantes

- **Borrado lógico (`paranoid: true`)** en casi todos los modelos (`deletedAt`). Un `unique: true`
  simple en una columna de un modelo paranoid **no excluye filas borradas** — si un valor debe ser
  único solo entre registros activos, usar un índice único parcial
  (`CREATE UNIQUE INDEX ... WHERE "deletedAt" IS NULL`); ver
  `database/migrations/*coupons_code_unique_active*` como ejemplo ya aplicado.
- **Respuestas estándar**: la mayoría de los endpoints responde `{status, code, data, message}` vía
  `fxSuccessResponse`/`fxErrorResponse` ([src/utils/helpers.ts](src/utils/helpers.ts)). Excepción:
  los errores de validación armados a mano (ej. email/teléfono duplicado) devuelven
  `{success, type:'validation', message:[...]}` — un shape distinto; cualquier consumidor
  (frontend o app) tiene que contemplar los dos casos.
- **Paginación**: los endpoints `.../all` paginan si reciben `pag`/`limit` (patrón viejo, admin) o
  `page`/`limit` (patrón más nuevo, Marketplace) — no es 100% uniforme; revisar el `.yaml` de cada
  recurso para el detalle exacto.

## Estado del proyecto / pendientes conocidos

- **Sprint 3 (no arrancado)**: aplicar cupones al convertir el carrito en Orden (hoy los cupones
  solo se validan/muestran en el carrito), filtro de conductores por Dai Food/Dai Market al asignar
  un pedido, endpoint que convierta el Carrito en Orden, descuento automático de inventario al
  vender + estado "agotado" + contador de ventas por producto.
- **Sucursales (`Branch`)**: el modelo y el CRUD existen, pero no hay ninguna sucursal cargada
  todavía en ningún ambiente — es una funcionalidad ligada a Recargas, no al Marketplace.

## Repositorios relacionados

- **`payaWeb`** — panel de administración y panel de tienda (Angular). Ver su propio README.
- **App móvil** (pasajeros/conductores/clientes del Marketplace) — repo aparte, integra contra
  esta API.
