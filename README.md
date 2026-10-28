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

Copiar `.env.example` a `.env` y completar con los valores reales (pedirlos al equipo) — es la
fuente de verdad, pero por si acaso, esto es lo que realmente lee el código
([src/config/AppConfig.ts](src/config/AppConfig.ts)):

```
PORT=                     # puerto HTTP (Express)
SOCKET_PORT=              # puerto de Socket.io - SEPARADO del HTTP, mismo proceso (ver src/server.ts)
SECRET_KEY=               # firma los JWT - cualquier string largo en dev, uno real en prod
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=
SQL_DIALECT=postgres
NODE_ENV=development
TWILIO_ENABLED=false      # en false no se manda SMS real, el mensaje queda impreso en la terminal
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_Token=
TWILIO_PHONE_NUMBER=
# Server-side, NO es la key que usa payaWeb en el navegador (esa esta restringida por HTTP
# referrer). Solo para Google Distance Matrix (delivery fee de Marketplace, ver
# MarketplaceOrderService.getQuote). Sin esta key, las cotizaciones de delivery fallan.
GOOGLE_MAPS_SERVER_KEY=
```

> `API_PREFIX`, `JWT_EXPIRES` y `SQL_POOL_LIMIT` existen en `AppConfig.ts` pero **no los lee
> ningún otro lugar del código hoy** - no hace falta configurarlos, quedaron de alguna
> implementación anterior o pensados para más adelante.

### Archivos requeridos que no van en git

- **`src/dai-traslados-firebase-adminsdk-fbsvc-0cfa4d7e1e.json`** — credencial de Firebase Admin
  (cuenta de servicio), usada por [NotificationService](src/controller/fcmPushController.ts) para
  mandar push tanto a la app móvil como a payaWeb (Web Push, ver más abajo) - es el mismo canal
  para los dos. Sin este archivo, el servidor levanta igual pero **cualquier envío de push tira
  error** (se loguea, no tumba el proceso). Se consigue en
  [Firebase Console](https://console.firebase.google.com/project/dai-traslados/settings/serviceaccounts/adminsdk)
  → pestaña "Cuentas de servicio" → "Generar nueva clave privada". El nombre del archivo está
  hardcodeado en el código (`fcmPushController.ts`), así que tiene que llamarse exactamente así y
  vivir en `src/`.
- Vas a encontrar también `src/project-7e3dbec7-de49-4a74-8ae-20e33292d645.json` (otra cuenta de
  servicio de Google, gitignoreada). **Ningún archivo del código la referencia** — parece quedar de
  algo que se probó y no se terminó de conectar. Antes de asumir que hace falta, confirmar con el
  equipo si sigue siendo necesaria o se puede borrar.

### Instalación

```bash
npm install
npm run migrate      # corre todas las migraciones
npm run seed         # datos base: roles, tipos de vehículo, parámetros de la empresa, etc.
npm run dev           # levanta con nodemon sobre src/index.ts
```

Otros scripts útiles: `npm run mi:g --name <nombre>` (nueva migración), `npm run build` (compila
a `dist/`), `npm run lint` / `npm run format`.

### Cuentas demo para la revisión de Google Play

Google Play pide credenciales de prueba y el revisor no puede recibir SMS. Hay tres cuentas demo
(código fijo, sin Twilio), definidas en [src/constants/reviewAccounts.ts](src/constants/reviewAccounts.ts):

| Rol | Login | Código / clave |
|-----|-------|----------------|
| Pasajero | teléfono `4240000000` (cualquier código de país: `58`, `1`, `+1`…) | `1234` |
| Conductor | teléfono `4240000001` (cualquier código de país: `58`, `1`, `+1`…) | `1234` |
| Tienda | `store@demogoogle.com` | `1234567890` |

El código fijo solo aplica a esos dos teléfonos **y solo si la cuenta ya existe** (el código de país que mande la app se ignora: `users.phone_number` es único, así que se normaliza al de la fila existente) (si el seeder no
corrió, el login manda SMS real como siempre). Crear las cuentas en el **servidor** (idempotente,
se puede correr más de una vez) — no usar `npm run seed` porque re-corre todos los seeders:

```bash
npx sequelize-cli db:seed --seed 20261007120000-review_accounts.ts
```

Crea además una tienda demo aprobada y abierta (3 productos, horario 24/7, pago en efectivo USD).
Revertir: `npx sequelize-cli db:seed:undo --seed 20261007120000-review_accounts.ts`.

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

## Notificaciones push (app móvil + payaWeb)

Un solo canal para las dos plataformas: **Firebase Cloud Messaging** vía `firebase-admin`
([NotificationService](src/controller/fcmPushController.ts)). Un token FCM de la app móvil y uno
del navegador (Web Push, ver README de `payaWeb`) se envían exactamente igual —
`messaging().send({ token, notification, data })` no distingue de dónde vino el token.

- **Multi-dispositivo (admin/operador/tienda)**: `users.socketId`/`users.tokenPush` son un solo
  valor por cuenta (pisan el del dispositivo anterior). Como estas tres cuentas suelen compartirse
  entre varias personas/dispositivos a la vez, se agregó la tabla `user_devices`
  ([UserDeviceModel](src/models/User/UserDeviceModel.ts)) que guarda **N** sockets/tokens por
  usuario sin pisar nada. `UserDeviceService.mergeSocketIds`/`mergePushTokens` combina el valor
  legado + lo que haya en `user_devices`, y es lo que hay que usar en cualquier punto nuevo que
  notifique a un admin/operador/tienda — nunca leer `tokenPush`/`socketId` sueltos de `users` para
  estos tres roles si el envío tiene que llegarle a todos los dispositivos abiertos.
- **Alcance deliberado**: solo rolId 1/2/4 (admin/operator/tienda). Conductores no entran — ya
  tienen su propio mecanismo de sesión única (QA-03, "gana el último dispositivo"), y agregarles
  multi-dispositivo rompería esa garantía a propósito. Clientes tampoco, no hubo pedido para eso.
- **Web Push real (payaWeb)**: además del socket (que solo funciona con la pestaña abierta),
  payaWeb puede pedir permiso de notificación del navegador y registrar un token FCM de browser
  vía `POST /auth/webPushToken` (rolId 1/2/4 únicamente) — de ahí en más ese token entra al mismo
  `user_devices` y al mismo fan-out de arriba, sin lógica de envío nueva. Necesita la credencial de
  Firebase Admin de la sección anterior + una VAPID key configurada en `payaWeb` (ver su README).

## Estado del proyecto / pendientes conocidos

> Esta sección se revisó y actualizó el 2026-09-25 contra el código real — antes decía "Sprint 3
> no arrancado" para varias cosas que ya estaban hechas.

- **Carrito → Orden: hecho.** `MarketplaceOrderService.createFromCart` es el endpoint que convierte
  el carrito en una Orden real. Incluye:
  - **Cupón aplicado de verdad** (no solo mostrado en el carrito): se valida de nuevo al confirmar,
    se guarda `couponId` en la Orden y se lleva `usageCount` (se revierte si la orden se cancela).
  - **Descuento de inventario automático**: al confirmar se resta `stockQuantity` de cada producto
    con inventario controlado, y si llega a 0 se marca `isAvailable: false` ("agotado"). Cancelar la
    orden devuelve el stock y reactiva el producto si corresponde.
  - **Moneda "congelada" por pedido**: la decisión de diseño (moneda de la Orden = la del método de
    pago elegido, sin que un cambio posterior de tasa afecte pedidos viejos) está implementada —
    aunque no como un campo de tasa separado en la Orden, sino porque cada
    `MarketplaceOrderItem` guarda su `unitPrice` en el momento de la compra (snapshot), y la Orden
    guarda `currencyId`. Efecto práctico: igual, un pedido ya hecho no se mueve de precio.
  - **Filtro de conductores por Dai Food/Dai Market**: `MarketplaceDispatchService` ya busca
    conductores según el `type` de la tienda del pedido.
  - **Pendiente real, esto sí falta**: contador de ventas por producto (no hay ningún campo/columna
    para esto todavía).
- **Métodos de pago con moneda**: `StorePaymentMethod.currencyId` (opcional) ata un método a una
  moneda específica — ej. Zelle solo tiene sentido en USD, Pago Móvil a un banco venezolano solo en
  Bolívares. Un comercio que acepta el mismo `type` en más de una moneda (ej. efectivo en USD y en
  Bs) crea dos filas separadas — no hay restricción de unicidad por `type`.
- **Sucursales (`Branch`)**: el modelo y el CRUD existen, pero no hay ninguna sucursal cargada
  todavía en ningún ambiente — es una funcionalidad ligada a Recargas, no al Marketplace.

## Repositorios relacionados

- **`payaWeb`** — panel de administración y panel de tienda (Angular). Ver su propio README.
- **App móvil** (pasajeros/conductores/clientes del Marketplace) — repo aparte, integra contra
  esta API.
