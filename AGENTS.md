# AGENTS.md

## Propósito
Este archivo define las reglas obligatorias para cualquier agente/colaborador que modifique este frontend de **gestión de inventario + punto de venta (POS) Boutique**.

Stack actual:
- React 19 (react-jsx)
- Vite 8
- TypeScript 6 (strict)
- tailwindcss 4 + shadcn/ui (base-nova, stone)
- react-router-dom v7 (createBrowserRouter)
- Zustand 5 (auth store)
- @tanstack/react-query 5 (server state)
- recharts 3 (gráficos)
- react-hook-form 7 + zod (formularios)
- @tanstack/react-table 8 (tablas)
- sonner (toasts)
- next-themes 0.4 (tema claro/oscuro)
- lucide-react (íconos)
- Electron 33 + electron-builder (desktop)

Base URL del API:
- `/api/v1` (proxy de Vite a `VITE_API_TARGET` en `.env`)

---

## 1) Principios obligatorios

1. Seguridad primero:
   - Todo fetch al API debe incluir `credentials: "include"`.
   - Nunca exponer secretos, tokens o contraseñas en el cliente.
   - Sanitizar inputs de usuario con las utilidades de `@/shared/utils/security`.
   - Sanitizar mensajes de error del API con `readSafeApiError()` (quita HTML, stack traces, caracteres de control).

2. Consistencia con el backend:
   - Payloads enviados al API en **snake_case** (ej. `user_name`, `precio_venta`).
   - Respuestas del API normalizadas a **camelCase** en el frontend (ej. `userName`, `precioVenta`).
   - Idempotencia en ventas y compras: generar `idempotency_key` con `crypto.randomUUID()`.

3. Tipos estrictos:
   - TypeScript strict mode (`tsconfig.app.json`: strict, noUnusedLocals, noUnusedParameters).
   - No usar `any`. Si la forma de un dato del API es desconocida, usar `unknown` y validar con las funciones de normalización.
   - Cada feature define sus tipos en `types/` localmente.

4. Móvil primero (responsive):
   - Sidebar colapsa a iconos en viewports < 768px.
   - Tablas usan `min-w-[...]` con scroll horizontal.
   - Usar `useIsMobile()` de `@/hooks/use-mobile` para condicionales responsivos.

---

## 2) Arquitectura y estilo de código

### Estructura por feature

Cada feature bajo `src/features/<nombre>/` sigue esta organización:

```
features/<nombre>/
├── pages/         → Componentes de página (export default)
├── components/    → Componentes específicos de la feature
├── services/      → Funciones fetch al API
├── hooks/         → Wrappers de react-query
├── routes/        → FeatureRoute[] (definición de ruta + roles + ícono)
├── types/         → Tipos TypeScript locales
├── schemas/       → Schemas de zod (si se usan formularios con validación)
└── helpers/       → Utilidades específicas de la feature
```

### Servicios (capa API)

- Archivo único por dominio (ej. `authService.ts`, `adminService.ts`, `productsService.ts`, `posService.ts`).
- Cada archivo define una función helper `request<T>(path, init?)` que:
  - Usa `fetch` con `credentials: "include"`.
  - Agrega `Content-Type: application/json`.
  - Llama `readSafeApiError(response)` ante error y lanza `Error`.
  - Retorna `response.json()` o `undefined` para 204.
- Las funciones exportadas NO deben disparar llamadas al API directamente; siempre deben ser envueltas por hooks de react-query.
- Payloads siempre en snake_case. Usar funciones normalizadoras internas (`normalizeProduct`, `normalizeVariant`, `normalizeUser`, `normalizePayment`, `readArray`, `readRecord`, `readMeta`, `fullName`, etc.) para mapear respuestas del API a tipos camelCase internos.

### Hooks (capa de estado servidor)

- Wrappers de `@tanstack/react-query` (`useQuery` / `useMutation`).
- Naming consistente:
  - `use<Feature>` para queries de listado.
  - `use<Feature>Detail` para query de detalle por ID.
  - `useCreate<Feature>`, `useUpdate<Feature>`, `useDelete<Feature>`, `useCancel<Feature>` para mutaciones.
- Todas las mutaciones deben invalidar los queries relacionados en `onSuccess` para mantener datos frescos entre features.
- Las claves de query (query keys) deben exportarse como constantes (ej. `productsQueryKey`, `variantsQueryKey`, `adminKeys.*`).

### Páginas

- Componente principal exportado por defecto (`export default`).
- Importan hooks de la feature (`useProducts`, `useCreateSale`, etc.).
- Manejan estado local: filtros, paginación, diálogos, formularios.
- Componen UI exclusivamente con componentes de `@/components/ui/` (shadcn/ui) y de la feature.
- Cada página debe mostrar un estado de carga (skeleton) mientras las queries están en `isLoading`.

### Componentes UI

- Los componentes base están en `@/components/ui/` (44 componentes shadcn/ui).
- No crear wrappers innecesarios alrededor de componentes shadcn/ui.
- Usar `cn()` de `@/lib/utils` para combinar clases condicionales.
- Los data-slot attributes (ej. `[data-slot="card"]`) reciben estilos por Tailwind; no sobrescribirlos sin justificación.

### Convenciones de código

- Path alias: `@/` mapea a `src/`.
- Módulos ESM: `import`/`export`, `verbatimModuleSyntax` activo.
- No usar `export default` para servicios, hooks o tipos; solo para páginas.
- Las funciones async que se llaman en eventos deben usar `void` en lugar de ignorar la promesa (ej. `onClick={() => void logout()}`).
- Nombres de archivo: PascalCase para componentes, camelCase para servicios/hooks/utilidades.

---

## 3) Routing, auth y roles

### Configuración de rutas

- `createBrowserRouter` definido en `@/routes.tsx`.
- Rutas públicas: `/login`.
- Rutas protegidas: todo bajo `<ProtectedRoute />` (anida `@/route-guards`).
- Rutas por rol: cada feature define `FeatureRoute[]` en `routes/`; se agregan en `@/features/featureRoutes.ts`.

### Guards

- **`ProtectedRoute`**: Verifica sesión llamando `initializeSession()` (GET /auth/me).
  - Status `checking`: muestra skeleton de carga.
  - No autenticado: redirige a `/login`.
  - `firstLogin === true` y ruta no es `/reset-password`: redirige a `/reset-password`.
  - Autenticado: renderiza `<Outlet />`.
- **`RoleProtectedRoute`**: Verifica `allowedRoles` del route contra el rol del usuario.
  - No autorizado: redirige a la ruta home según rol.
- **`HomeRedirect`**: Redirige a la ruta home según rol:
  - `admin` → `/dashboard`
  - `cashier` → `/cajero`
  - `warehouse` → `/inventario`

### Definición de nuevas rutas

```ts
// src/features/mi-feature/routes/miFeatureRoutes.tsx
import type { FeatureRoute } from "@/shared/types/navigation"
import { MiFeaturePage } from "@/features/mi-feature/pages/MiFeaturePage"
import { MiIcono } from "lucide-react"

export const miFeatureRoutes: FeatureRoute[] = [
  {
    path: "mi-feature",
    title: "Mi Feature",
    element: <MiFeaturePage />,
    allowedRoles: ["admin", "cashier"],
    icon: MiIcono,
    showInSidebar: true,
  },
]
```

Luego importar en `@/features/featureRoutes.ts`:

```ts
import { miFeatureRoutes } from "@/features/mi-feature/routes/miFeatureRoutes"

export const featureRoutes = [
  // ...existing...
  ...miFeatureRoutes,
]
```

### Sidebar

- `@/layouts/Sidebar.tsx` filtra `featureRoutes` por `showInSidebar=true` y `allowedRoles` del usuario.
- Se renderiza con componentes `Sidebar*` de `@/components/ui/sidebar.tsx`.

---

## 4) Matriz de permisos frontend

| Rol | Rutas visibles |
|---|---|
| **admin** | `dashboard`, `ventas`, `inventario`, `compras`, `ajustes-inventario`, `reportes`, `usuarios` |
| **cashier** | `cajero`, `dashboard`, `ventas`, `inventario` |
| **warehouse** | `inventario`, `compras`, `ajustes-inventario` |

Si se agrega un rol nuevo, actualizar:
1. `Role` en `@/shared/types/domain.ts`.
2. `mapRole()` en `@/features/auth/services/authService.ts`.
3. `ROLE_LABELS` en `@/components/layout/RoleSwitcher.tsx`.
4. `getHomePath()` en `@/route-guards.tsx`.
5. `allowedRoles` de todas las rutas que apliquen.

---

## 5) Comunicación con API

### Base URL y proxy

- `.env` define `VITE_API_URL=/api/v1` y `VITE_API_TARGET=http://localhost:3000`.
- En desarrollo, Vite proxy reenvía `/api` al target.
- En producción (Electron), el backend debe estar corriendo en `localhost:3000`.

### Autenticación

- Cookie HttpOnly de sesión (gestionada por el navegador).
- `credentials: "include"` en todos los fetch.
- Login: `POST /auth/login` con `{ user_name, password }`. Lee `response.usuario`.
- Sesión: `GET /auth/me` verifica sesión activa al iniciar.
- Logout: `POST /auth/logout` limpia la cookie.
- Cambio de contraseña: `PATCH /usuarios/change-password` con `{ password_actual, password_nuevo }`.
- Si `primer_login === true`, el backend re-emite la cookie y actualiza el flag. El frontend debe refrescar el usuario con `getMe()`.

### Idempotencia

- `POST /ventas` y `POST /compras` deben incluir `idempotency_key` generado con `crypto.randomUUID()`.
- Si el backend retorna un recurso ya existente (P2002), el frontend lo trata como éxito.

### Manejo de errores

- `readSafeApiError(response)` en `@/shared/utils/apiErrors`:
  - Lee el body como texto.
  - Intenta parsear JSON → extrae `message`, `error` o `detail`.
  - Sanitiza con `safeErrorMessage()` (quita HTML, stack traces, caracteres bidi, limita a 180 chars).
  - Si falla, usa el fallback.
- Los servicios lanzan `Error` con el mensaje sanitizado.
- Los hooks de react-query capturan el error y las páginas lo muestran con UI de error (alerta coloreada, toast).

### Normalización de datos

Funciones comunes en servicios que normalizan respuestas del API (snake_case → camelCase):
- `readArray(response, keys)` – extrae array de `data`, `items`, `movimientos`, etc.
- `readRecord(response, keys)` – extrae objeto anidado.
- `readMeta(response)` – extrae metadata de paginación.
- `normalizeVariant(apiVariant)` – mapea `id_variante` → `id`, `precio_venta` → `precioVenta`, etc.
- `normalizeProduct(apiProduct)` – similar para productos.
- `normalizeUser(apiUser)` – similar para usuarios.
- `normalizePayment(apiPayment)` – similar para pagos.
- `fullName(user)` – concatena `nombre` + `apellido`.
- `readActiveState(item)` – determina si un item está activo (soporta múltiples formatos: booleano, string, número).
- `toPaginated(response, data, params)` – construye `PaginatedData<T>` con metadata.

---

## 6) Estado global y server state

### Zustand (auth store)

`@/store.ts` – `useAuthStore`:
- `user: AuthUser | null`
- `role: Role | null`
- `status: "idle" | "checking" | "authenticated" | "unauthenticated"`
- Acciones: `login`, `changePassword`, `initializeSession`, `logout`

Reglas:
- Solo usar Zustand para auth. Todo otro estado de servidor va en react-query.
- No mutar el store directamente; usar las acciones definidas.

### React Query (server state)

Configuración en `@/providers/AppProviders.tsx`:
- `QueryClient` con `staleTime: 30_000`.
- `Toaster` de sonner en `top-right` con `closeButton` y `richColors`.

Claves de query:
- Definidas como constantes exportadas en cada módulo de hooks.
- Ejemplo: `productsQueryKey = ["productos"]`, `variantsQueryKey = ["variantes"]`.
- Para queries paginadas: `[...productsQueryKey, { page, limit }]`.

Invalidaciones:
- Cada mutación debe invalidar todos los queries que dependan de los datos modificados.
- Ejemplo: crear una venta invalida `adminKeys.sales`, `adminKeys.payments`, `adminKeys.cash`, `adminKeys.activeCash`, `adminKeys.dashboard`, `variantsQueryKey`.
- Usar `Promise.all` para invalidaciones múltiples cuando sea posible.

---

## 7) Estilos y tema

### Tailwind CSS 4

- `@import "tailwindcss"` en `index.css`.
- Variables CSS de diseño en `:root` y `.dark`.
- Paleta base: stone con acentos en azul (primary), verde (accent).
- Radio base: `0.5rem`.

### Clases utilitarias

Definidas en `@layer components` en `index.css`:
- `page-heading` – títulos de página (2xl/3xl).
- `page-subtitle` – subtítulos.
- `surface-panel` – paneles con borde y sombra.
- `icon-surface` – contenedor de íconos (cuadrado, centrado).
- `page-accent` – banner con gradiente.
- `page-shell` – contenedor de página con animaciones de entrada.
- `content-enter` – animación de entrada para contenido dinámico.
- `auth-route-enter` – animación de entrada para rutas de auth.

### Animaciones

- `page-enter`: fadeIn + slideUp (6px), 180ms.
- `card-enter`: fadeIn + slideUp (8px), 220ms, stagger en cards.
- `content-enter`: fadeIn + slideUp (4px), 180ms.
- `auth-route-enter`: fadeIn + slideUp (10px) + blur, 260ms.
- Respetar `prefers-reduced-motion: reduce` (reduce todas las animaciones a 1ms).

### Tema

- `ThemeProvider` en `@/components/theme-provider.tsx` (next-themes).
- Soporta `light`, `dark`, `system`.
- Selector de tema en `@/components/layout/ThemeMenu.tsx`.

---

## 8) Electron (desktop)

- `electron/main.cjs` – proceso principal de Electron.
- `scripts/electron-dev.cjs` – script de desarrollo.
- `scripts/electron-start.cjs` – script de inicio.
- Build: `electron-builder` configurado para Windows (NSIS + portable).
- No modificar `electron/main.cjs` sin verificar compatibilidad con Vite dev server.
- La app en producción espera el backend en `http://localhost:3000`.

---

## 9) Inputs y seguridad en el cliente

### Sanitización de inputs

Funciones en `@/shared/utils/security.ts`:
- `normalizeTextInput(value, options)` – NFC normalize, quita caracteres de control y bidi, colapsa espacios, trim.
- `normalizeCodeInput(value, maxLength)` – uppercase + solo alfanumérico, punto, guiones.
- `normalizeUsername(value)` – lowercase + solo alfanumérico, punto, guiones.
- `finiteNumber(value, fallback)` – número finito o fallback.
- `positiveInteger(value, fallback)` – entero >= 0.
- `moneyValue(value, fallback)` – número positivo redondeado a 2 decimales.
- `safeErrorMessage(message, fallback)` – sanitiza mensajes de error (max 180 chars, quita HTML y marcadores técnicos).

### Validación

- Usar HTML5 validation attributes en formularios (`required`, `type="number"`, `min`, `max`, `pattern`).
- Para validaciones complejas, usar zod + react-hook-form.
- Validar en el cliente ANTES de enviar al API.
- Mostrar errores de validación inline (no solo con toast).

---

## 10) Plantilla obligatoria para nuevas features

Toda feature nueva debe incluir:

1. **Tipos** (`types/`): interfaces TypeScript para el dominio.
2. **Servicio** (`services/`): funciones fetch al API con snake_case.
3. **Hooks** (`hooks/`): wrappers de react-query con claves de query exportadas.
4. **Páginas** (`pages/`): componente principal con manejo de estados (loading, error, empty, success).
5. **Rutas** (`routes/`): `FeatureRoute[]` con `allowedRoles` correctos.
6. **Integración en menú**: importar rutas en `featureRoutes.ts`.
7. **Invalidaciones**: hooks de mutación con `onSuccess` que invaliden queries relacionados.

---

## 11) Checklist de Definition of Done (DoD)

Antes de dar por terminado un cambio:

1. `npm run build` sin errores.
2. TypeScript sin errores de compilación.
3. Payloads al API en snake_case.
4. Respuestas del API normalizadas a camelCase.
5. Todas las mutaciones invalidan queries relacionados.
6. `allowedRoles` correctos en toda ruta nueva/modificada.
7. Sin `any` en el código nuevo.
8. Sin `console.log` en producción (usar sonner toasts para notificaciones).
9. Estados de UI cubiertos: loading (skeleton), error (alerta), empty (mensaje), success (datos).
10. Si se agregó un módulo de catálogo con create, replicar patrón de listado + formulario + mutación.

---

## 12) Criterios de rechazo automático

Un cambio se rechaza si:

1. Servicio sin `credentials: "include"`.
2. Payload al API en camelCase (debe ser snake_case).
3. Ruta definida sin `allowedRoles` o con roles incorrectos.
4. Mutación sin `onSuccess` que invalide queries dependientes.
5. Uso de `any` en servicios, hooks o tipos de dominio.
6. Exposición de datos sensibles en el cliente (tokens, hashes, contraseñas).
7. Fetch al API directo desde un componente (debe pasar por service → hook).
8. Componente nuevo que duplica uno existente de shadcn/ui sin justificación.
9. Error del API no sanitizado con `readSafeApiError()`.

---

## 13) Glosario de dominio (frontend)

- **Role**: `admin` | `cashier` | `warehouse` (mapeo interno; backend usa `administrador` | `vendedor` | `bodeguero`).
- **AuthUser**: usuario autenticado con `id`, `name`, `userName`, `role`, `firstLogin`.
- **FeatureRoute**: definición de ruta con `path`, `title`, `element`, `allowedRoles`, `icon`, `showInSidebar`.
- **Variant**: producto + talla + color con SKU, código de barras, precios y stock.
- **Product**: prenda con nombre, característica distintiva y marca.
- **Sale**: venta registrada con cliente, NIT, total, detalles y pagos.
- **SaleDetail**: venta con detalles expandidos (variantes, cantidades, precios) y pagos.
- **Purchase**: compra registrada con fecha, total, usuario y cantidad de ítems.
- **Payment**: pago asociado a una venta con método, monto, referencia y estado.
- **CashRegister**: sesión de caja con saldo inicial, saldo final, fechas y estado activo.
- **InventoryMovement**: movimiento de inventario con tipo, origen, cantidad, motivo y stock resultante.
- **InventoryAdjustment**: ajuste manual de stock con variante, tipo, cantidad y motivo.
- **CatalogOption**: opción de catálogo genérica (`{ id, nombre }`) para marcas, tallas, colores.
- **PaginatedData<T>**: respuesta paginada genérica (`{ data, page, limit, total, totalPages }`).
- **Idempotency Key**: UUID generado por el frontend para evitar operaciones duplicadas en ventas y compras.

---

## 14) Alcance actual y futuro

### Features activas

| Feature | Ruta | Página |
|---|---|---|
| auth | `/login`, `/reset-password` | LoginPage, ResetPasswordPage |
| dashboard | `/dashboard` | DashboardPage |
| cajero | `/cajero` | CajeroPage |
| ventas | `/ventas` | VentasPage |
| inventario | `/inventario` | InventarioPage |
| compras | `/compras` | ComprasPage |
| ajustes | `/ajustes-inventario` | InventoryAdjustmentsPage |
| reporteria | `/reportes` | ReporteriaPage |
| usuarios | `/usuarios` | UsuariosPage |

### Features pendientes

| Feature | Estado |
|---|---|
| caja | Rutas definidas (vacías), sin página dedicada. Apertura/cierre integrado en otras vistas. |
| devoluciones | Endpoint backend existe (`POST /ventas/:id/devolucion`), sin UI en frontend. |
| roles | Endpoint backend existe (CRUD /roles), solo se usa para dropdown en creación de usuarios, sin página de gestión. |
| reportes avanzados | Módulo planeado en backend, sin implementar aún. |

Estas reglas aplican a todos los módulos actuales y futuros.
