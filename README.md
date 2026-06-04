# Front POS Boutique

Frontend del sistema de inventario y punto de venta para boutique.

Stack:

- React 19
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui / Base UI
- TanStack Query

## Requisitos

- Node.js 20 o superior
- npm
- Backend del proyecto ejecutandose con base URL `/api/v1`

En desarrollo local, el frontend espera que el backend este disponible en:

```txt
http://localhost:3000/api/v1
```

## Instalacion

Desde la carpeta del frontend:

```bash
npm install
```

## Configuracion

Crea o edita el archivo `.env` en la raiz del proyecto:

```env
VITE_API_URL=/api/v1
VITE_API_TARGET=http://localhost:3000
```

Notas:

- `VITE_API_URL` debe mantenerse como ruta relativa para que Vite y Electron puedan usar proxy.
- `VITE_API_TARGET` debe apuntar al origen del backend, sin `/api/v1`.
- El backend debe permitir CORS con credenciales.
- El frontend envia cookies de sesion con `credentials: "include"`.

## Levantar en desarrollo

Primero levanta el backend. Luego ejecuta:

```bash
npm run dev
```

Vite mostrara una URL similar a:

```txt
http://localhost:5173/
```

Abre esa URL en el navegador.

## Comandos utiles

Compilar para produccion:

```bash
npm run build
```

Ejecutar lint:

```bash
npm run lint
```

Validar TypeScript:

```bash
npm run typecheck
```

Formatear codigo:

```bash
npm run format
```

Previsualizar build:

```bash
npm run preview
```

Empaquetar aplicacion de escritorio sin instalador:

```bash
npm run package
```

Generar instalador y portable para Windows:

```bash
npm run dist:win
```

## Flujo recomendado

1. Instalar dependencias:

```bash
npm install
```

2. Configurar `.env`:

```env
VITE_API_URL=/api/v1
VITE_API_TARGET=http://localhost:3000
```

3. Levantar backend.

4. Levantar frontend:

```bash
npm run dev
```

5. Entrar a la URL de Vite.

## Problemas comunes

### No inicia sesion o no se mantiene la sesion

Verifica que:

- `VITE_API_URL` apunte al backend correcto.
- `VITE_API_TARGET` apunte al origen correcto del backend cuando uses proxy local.
- El backend este corriendo.
- El backend tenga CORS con `credentials: true`.
- La cookie JWT sea enviada por el navegador.

### Las peticiones aparecen como 401

La sesion no esta activa o la cookie no llego al backend. Inicia sesion de nuevo y revisa la configuracion de CORS/cookies del backend.

### Las peticiones aparecen como 400

El backend puede estar rechazando parametros de consulta. Revisa la consola del navegador y la pestana Network para ver el endpoint exacto.

### No aparecen productos, ventas o cobros

Verifica:

- Que el backend tenga datos.
- Que el usuario tenga permisos para consultar el modulo.
- Que los filtros de la tabla no esten ocultando registros.

## Estructura principal

```txt
src/
  components/        Componentes reutilizables y UI
  features/          Modulos funcionales
    admin/
    ajustes/
    auth/
    caja/
    cajero/
    compras/
    dashboard/
    inventario/
    reporteria/
    usuarios/
    ventas/
  layouts/           Layout principal y sidebar
  providers/         Providers globales
  routes.tsx         Configuracion de rutas
```

## Backend esperado

Este frontend consume endpoints bajo:

```txt
/api/v1
```

Modulos usados por el frontend:

- `auth`
- `usuarios`
- `productos`
- `variantes`
- `compras`
- `ventas`
- `pagos`
- `caja`
- `movimientos-inventarios`
- `dashboard`

## Build de produccion

Para generar los archivos estaticos:

```bash
npm run build
```

El resultado queda en:

```txt
dist/
```

Sirve esa carpeta con el servidor o hosting que corresponda.

## Distribuible de escritorio

La aplicacion de Electron se empaqueta con `electron-builder`.

Para generar una carpeta ejecutable sin instalador:

```bash
npm run package
```

Salida:

```txt
release/win-unpacked/POS Boutique.exe
```

Para generar el instalador y la version portable de Windows:

```bash
npm run dist:win
```

Salidas principales:

```txt
release/POS Boutique-Setup-0.0.1-x64.exe
release/POS Boutique-Portable-0.0.1-x64.exe
```

Notas:

- El instalador generado no esta firmado con certificado de codigo.
- La app espera que el backend este disponible en `http://localhost:3000` por defecto.
- Para apuntar a otro backend, configura la variable de entorno `VITE_API_TARGET` antes de abrir la app.
