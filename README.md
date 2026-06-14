# Nectary — Plataforma de Escritura Creativa

Una plataforma exclusivamente para **escritores** donde se comparten **Sparks** (chispazos e ideas en texto), se documentan proyectos en curso mediante **WIPs** y se reflexiona sobre bloqueos superados en **Post-Mortems**. Cuenta con un sistema de *forking* para rastrear la evolución de ideas, **gamificación con XP y medallas**, y retroalimentación contextual adaptada al estado creativo del escritor.


---

## 📋 Tabla de Contenidos

- [Stack Tecnológico](#-stack-tecnológico)
- [Resumen de Arquitectura](#-resumen-de-arquitectura)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Para Empezar](#-para-empezar)
- [Rutas y Páginas](#-rutas-y-páginas)
- [Endpoints de API](#-endpoints-de-api)
- [Sistema de Diseño](#-sistema-de-diseño)
- [Módulos y Asignación de Equipo](#-módulos-y-asignación-de-equipo)
- [Flujo de Trabajo de Desarrollo](#-flujo-de-trabajo-de-desarrollo)
- [Variables de Entorno](#-variables-de-entorno)
- [Decisiones de Diseño Clave](#-decisiones-de-diseño-clave)

---

## 🛠 Stack Tecnológico

| Capa              | Tecnología                 | Propósito                                        |
|-------------------|----------------------------|--------------------------------------------------|
| **Framework**     | Next.js 16 (App Router)    | SSR/SSG/ISR, API Routes, enrutamiento por archivos|
| **Lenguaje**      | TypeScript                 | Tipado seguro de extremo a extremo               |
| **Estilos**       | Tailwind CSS 4             | CSS utilitario con tokens de diseño              |
| **Íconos**        | Lucide React               | Librería de íconos consistente                   |
| **Auth y BD**     | Supabase                   | PostgreSQL + Auth + Realtime                     |
| **SDK Supabase**  | `@supabase/ssr`            | Soporte para componentes de Servidor y Cliente   |
| **Despliegue**    | Vercel (recomendado)       | Optimizado para Next.js                          |

---

## 🏗 Resumen de Arquitectura

```
┌──────────────────────────────────────────────────────────┐
│                      NAVEGADOR                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │
│  │ Landing    │  │ Páginas Auth│  │ Shell Principal     │  │
│  │ (público)  │  │ (público)  │  │ (autenticado)       │  │
│  └────────────┘  └────────────┘  │  ┌───────────────┐  │  │
│                                   │  │ Feed          │  │  │
│                                   │  │ Detalle Spark │  │  │
│                                   │  │ Detalle WIP   │  │  │
│                                   │  │ Post-Mortem   │  │  │
│                                   │  │ Perfil        │  │  │
│                                   │  │ Leaderboard   │  │  │
│                                   │  │ Configuración │  │  │
│                                   │  └───────────────┘  │  │
│                                   └────────────────────┘  │
└──────────────────────────┬───────────────────────────────┘
                           │  HTTP (fetch / Server Actions)
┌──────────────────────────▼───────────────────────────────┐
│                   SERVIDOR NEXT.JS                        │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  API Route Handlers (/api/*)                        │  │
│  │  ┌──────────┐ ┌──────┐ ┌─────────────┐ ┌────────┐  │  │
│  │  │ /sparks  │ │/wips │ │/post-mortems│ │ /feed  │  │  │
│  │  └──────────┘ └──────┘ └─────────────┘ └────────┘  │  │
│  │  ┌──────────┐ ┌────────────┐ ┌──────┐               │  │
│  │  │ /forks   │ │ /reactions │ │ /xp  │               │  │
│  │  └──────────┘ └────────────┘ └──────┘               │  │
│  └─────────────────────────┬───────────────────────────┘  │
│                             │                              │
│  ┌─────────────────────────▼───────────────────────────┐  │
│  │  Cliente Supabase (Lado Servidor)                   │  │
│  │  @supabase/ssr                                      │  │
│  └─────────────────────────┬───────────────────────────┘  │
└──────────────────────────┬─┘─────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────┐
│                    SUPABASE                               │
│  ┌──────────────┐ ┌────────┐                              │
│  │ PostgreSQL   │ │  Auth  │                              │
│  │ (RLS + FTS)  │ │        │                              │
│  └──────────────┘ └────────┘                              │
└──────────────────────────────────────────────────────────┘
```

### Patrones Clave
- **Server Components por defecto** — la obtención de datos se hace en el servidor
- **Client Components** únicamente para elementos interactivos (formularios, reacciones, filtros)
- **API Route Handlers** para mutaciones y consultas complejas
- **Supabase RLS** (Row Level Security) para autorización a nivel de base de datos
- **Auth basado en cookies** mediante `@supabase/ssr` — funciona tanto en componentes de servidor como de cliente

---

## 📁 Estructura del Proyecto

```
nectary/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── globals.css               # Tokens del sistema de diseño (colores, espaciado, animaciones)
│   │   ├── layout.tsx                # Root layout (fuentes, metadata)
│   │   ├── page.tsx                  # Landing page (público)
│   │   │
│   │   ├── (auth)/                   # Grupo de rutas de Auth (sin navbar)
│   │   │   ├── layout.tsx            # Layout de tarjeta centrada
│   │   │   ├── login/page.tsx        # RN-01, RN-25
│   │   │   └── register/page.tsx     # RN-01, RN-02
│   │   │
│   │   ├── (main)/                   # Grupo de rutas principal (con navbar)
│   │   │   ├── layout.tsx            # Shell de aplicación con Navbar
│   │   │   ├── feed/page.tsx         # CU-FD-01 — RN-06, RN-20
│   │   │   ├── spark/
│   │   │   │   ├── new/page.tsx      # CU-SP-01 — RN-05, RN-08, RN-21, RN-22
│   │   │   │   └── [id]/page.tsx     # CU-SP-02 — RN-06, RN-09
│   │   │   ├── wip/
│   │   │   │   ├── new/page.tsx      # CU-WP-01 — RN-05, RN-08
│   │   │   │   └── [id]/page.tsx     # CU-WP-02, CU-WP-03 — RN-09, RN-11, RN-16
│   │   │   ├── post-mortem/
│   │   │   │   ├── new/page.tsx      # CU-PM-01 — RN-05
│   │   │   │   └── [id]/page.tsx     # CU-PM-01 (SSG/ISR) — RN-10
│   │   │   ├── profile/
│   │   │   │   └── [username]/page.tsx # RN-04
│   │   │   ├── leaderboard/page.tsx  # Ranking de XP por categoría
│   │   │   └── settings/page.tsx     # RN-04
│   │   │
│   │   └── api/                      # API Route Handlers
│   │       ├── feed/route.ts         # Endpoint unificado del feed
│   │       ├── sparks/
│   │       │   ├── route.ts          # GET (listar), POST (crear)
│   │       │   └── [id]/route.ts     # GET, PATCH, DELETE
│   │       ├── wips/
│   │       │   ├── route.ts          # GET (listar), POST (crear)
│   │       │   └── [id]/
│   │       │       ├── route.ts      # GET, PATCH, DELETE
│   │       │       └── comments/route.ts  # GET, POST
│   │       ├── post-mortems/
│   │       │   ├── route.ts          # GET (listar/buscar), POST
│   │       │   └── [id]/route.ts     # GET, PATCH, DELETE
│   │       ├── reactions/route.ts    # POST, DELETE
│   │       └── forks/route.ts        # GET (árbol), POST (forkear) — RN-13, RN-14
│   │
│   ├── components/                   # Componentes React
│   │   ├── layout/
│   │   │   └── navbar.tsx            # Navegación principal + selector de estado creativo
│   │   ├── feed/
│   │   │   ├── spark-card.tsx        # Card para feed de Spark
│   │   │   ├── wip-card.tsx          # Card para feed de WIP
│   │   │   ├── post-mortem-card.tsx  # Card para feed de Post-Mortem
│   │   │   └── feed-filters.tsx      # Filtros por categoría literaria — RN-20, RN-21
│   │   ├── fork/
│   │   │   └── fork-tree.tsx         # Árbol de trazabilidad de forks — RN-13, RN-14
│   │   ├── versions/
│   │   │   └── version-history.tsx   # Historial de versiones de un texto — RN-10
│   │   ├── gamification/
│   │   │   └── xp-badge.tsx          # Badge de XP y nivel del escritor
│   │   ├── editors/                  # TODO: Editores de texto plano por tipo de post
│   │   └── ui/                       # TODO: Primitivas base de UI (Botón, Input, etc.)
│   │
│   ├── hooks/                        # Custom React Hooks
│   │   ├── index.ts                  # Exportación unificada (Barrel)
│   │   └── use-auth.ts              # Hook de auth para Supabase
│   │
│   ├── lib/                          # Librerías Compartidas
│   │   ├── utils.ts                  # cn(), formatRelativeTime, generateXPIdempotencyKey, etc.
│   │   └── supabase/
│   │       ├── client.ts             # Cliente navegador (Client Components)
│   │       ├── server.ts             # Cliente servidor (Server Components, API Routes)
│   │       └── middleware.ts         # Middleware para refresco de sesión
│   │
│   ├── types/                        # Definiciones TypeScript
│   │   └── index.ts                  # Todos los tipos compartidos, enums, constantes
│   │
│   └── middleware.ts                 # Next.js middleware (refresco de sesión)
│
├── public/                           # Assets estáticos
├── .env.example                      # Plantilla de variables de entorno
├── next.config.ts                    # Configuración de Next.js
├── tsconfig.json                     # Configuración de TypeScript
├── postcss.config.mjs                # PostCSS (Tailwind)
├── eslint.config.mjs                 # Configuración de ESLint
└── package.json                      # Dependencias & scripts
```

---

## 🚀 Para Empezar

### Prerrequisitos
- **Node.js** 18+ (recomendado: 20+)
- **npm** 9+
- Un proyecto en **Supabase** ([crear uno aquí](https://supabase.com/dashboard))

### Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd nectary

# 2. Instalar dependencias
npm install

# 3. Configurar entorno
cp .env.example .env.local
# Editar .env.local con las credenciales de tu proyecto Supabase

# 4. Iniciar servidor de desarrollo
npm run dev

# 5. Abrir en el navegador
# → http://localhost:3000
```

### Comandos (Scripts)

| Comando         | Descripción                        |
|----------------|------------------------------------|
| `npm run dev`  | Inicia el servidor de desarrollo (Turbopack) |
| `npm run build`| Compilación de producción          |
| `npm run start`| Inicia servidor de producción      |
| `npm run lint` | Ejecuta validación con ESLint      |

---

## 🗺 Rutas y Páginas

### Rutas Públicas (sin auth)
| Ruta                 | Descripción                         | Reglas de Negocio |
|---------------------|-------------------------------------|-------------------|
| `/`                 | Landing page                        | —                 |
| `/login`            | Formulario de inicio de sesión      | RN-01, RN-25      |
| `/register`         | Formulario de registro              | RN-01, RN-02      |
| `/spark/[id]`       | Vista pública de Spark              | RN-06             |
| `/post-mortem/[id]` | Vista pública de Post-Mortem (SSG/ISR)| RN-06           |

### Rutas Protegidas (requieren auth)
| Ruta                   | Descripción                              | Reglas de Negocio          |
|-----------------------|------------------------------------------|----------------------------|
| `/feed`               | Feed principal filtrado por categoría    | RN-06, RN-20, RN-21        |
| `/spark/new`          | Crear Spark                              | RN-05, RN-08, RN-21, RN-22 |
| `/wip/new`            | Crear WIP                                | RN-05, RN-08               |
| `/wip/[id]`           | Detalle de WIP + comentarios + versiones | RN-09, RN-11, RN-16        |
| `/post-mortem/new`    | Crear Post-Mortem                        | RN-05                      |
| `/profile/[username]` | Perfil de usuario + XP acumulado         | RN-04                      |
| `/leaderboard`        | Ranking de escritores por XP y categoría | —                          |
| `/settings`           | Editar perfil e intereses literarios     | RN-04                      |

---

## 🔌 Endpoints de API

Todas las rutas de la API se encuentran en `/api/` y siguen las convenciones REST.

| Método   | Endpoint                        | Módulo | Descripción                      |
|----------|---------------------------------|--------|----------------------------------|
| `GET`    | `/api/feed`                     | FD     | Feed unificado y paginado        |
| `GET`    | `/api/sparks`                   | SP     | Listar sparks                    |
| `POST`   | `/api/sparks`                   | SP     | Crear spark                      |
| `GET`    | `/api/sparks/[id]`              | SP     | Obtener spark                    |
| `PATCH`  | `/api/sparks/[id]`              | SP     | Actualizar spark                 |
| `DELETE` | `/api/sparks/[id]`              | SP     | Eliminar spark                   |
| `GET`    | `/api/wips`                     | WP     | Listar WIPs                      |
| `POST`   | `/api/wips`                     | WP     | Crear WIP                        |
| `GET`    | `/api/wips/[id]`                | WP     | Obtener WIP                      |
| `PATCH`  | `/api/wips/[id]`                | WP     | Actualizar WIP (cambio estado)   |
| `DELETE` | `/api/wips/[id]`                | WP     | Eliminar WIP                     |
| `GET`    | `/api/wips/[id]/comments`       | WP     | Listar comentarios de WIP        |
| `POST`   | `/api/wips/[id]/comments`       | WP     | Agregar comentario               |
| `GET`    | `/api/post-mortems`             | PM     | Listar/buscar post-mortems       |
| `POST`   | `/api/post-mortems`             | PM     | Crear post-mortem                |
| `GET`    | `/api/post-mortems/[id]`        | PM     | Obtener post-mortem              |
| `PATCH`  | `/api/post-mortems/[id]`        | PM     | Actualizar (versionado)          |
| `DELETE` | `/api/post-mortems/[id]`        | PM     | Eliminar post-mortem             |
| `POST`   | `/api/reactions`                | SP/WP/PM | Agregar reacción                |
| `DELETE` | `/api/reactions`                | SP/WP/PM | Eliminar reacción               |
| `GET`    | `/api/xp`                       | KM       | Obtener XP y nivel del usuario  |
| `GET`    | `/api/leaderboard`              | KM       | Ranking de escritores por XP    |
| `GET`    | `/api/forks`                    | FK       | Obtener árbol de forks — RN-13, RN-14 |
| `POST`   | `/api/forks`                    | FK     | Hacer fork a un texto — RN-13, RN-15  |

---

## 🎨 Sistema de Diseño

El sistema de diseño está definido en `src/app/globals.css` utilizando custom properties de CSS integradas en Tailwind vía `@theme`.

### Tokens de Color

| Token                    | Uso                            | Color          |
|--------------------------|--------------------------------|----------------|
| `--primary`              | Marca principal, Botones (CTAs)| `#6d28d9`      |
| `--accent`               | Color secundario/Acento        | `#f59e0b`      |
| `--background`           | Fondo de página                | `#fafaf9`      |
| `--card`                 | Superficies de tarjetas        | `#ffffff`      |
| `--muted`                | Fondos apagados/suaves         | `#f5f5f4`      |

### Colores por Categoría Literaria

| Categoría | Variable CSS              | Color     |
|-----------|---------------------------|-----------|
| Cuento    | `--category-cuento`       | `#ec4899` |
| Poesía    | `--category-poesia`       | `#8b5cf6` |
| Novela    | `--category-novela`       | `#06b6d4` |
| Ensayo    | `--category-ensayo`       | `#10b981` |

### Colores por Tipo de Post

| Tipo         | Variable CSS       | Color     |
|-------------|-------------------|-----------|
| Spark       | `--spark`         | `#f59e0b` |
| WIP         | `--wip`           | `#3b82f6` |
| Post-Mortem | `--postmortem`    | `#8b5cf6` |

### Uso en Tailwind

```tsx
// Usa los tokens directamente en las clases de Tailwind:
<div className="bg-primary text-primary-foreground" />
<span className="text-category-poesia" />
<span className="text-category-cuento" />
<article className="border-spark/50" />
<p className="text-muted-foreground" />
```

### Clases Utilitarias Disponibles

| Clase                   | Descripción                              |
|------------------------|------------------------------------------|
| `.glass`               | Efecto glassmorphism (desenfoque + borde)|
| `.text-gradient-primary`| Texto con gradiente (primario → acento) |
| `.animate-fade-in`     | Aparecer y deslizar hacia arriba (0.3s) |
| `.animate-slide-up`    | Deslizamiento de entrada (0.4s)         |
| `.animate-pulse-glow`  | Resplandor pulsante circular (marca)    |

---

## 👥 Módulos y Asignación de Equipo

El proyecto está dividido en **5 módulos** que pueden trabajarse en paralelo. A continuación se presenta una distribución sugerida para un equipo de 5 miembros:

### Distribución Sugerida

| Miembro | Módulo(s)                       | Archivos Clave                                                                        | Prioridad |
|--------|---------------------------------|---------------------------------------------------------------------------------------|----------|
| **M1** | Auth + Middleware               | `(auth)/*`, `hooks/use-auth.ts`, `lib/supabase/*`                                    | 🔴 Alta  |
| **M2** | Sparks (SP) + Feed (FD)         | `spark/*`, `feed/*`, `api/sparks/*`, `api/feed/*`, `components/feed/*`               | 🔴 Alta  |
| **M3** | WIPs (WP) + Post-Mortems (PM)  | `wip/*`, `post-mortem/*`, `api/wips/*`, `api/post-mortems/*`, `components/versions/*`| 🔴 Alta  |
| **M4** | Forking (FK) + Reacciones       | `api/forks/*`, `api/reactions/*`, `components/fork/*`                                | 🟡 Media |
| **M5** | Gamificación (KM) + Perfil      | `leaderboard/*`, `profile/*`, `settings/*`, `api/xp/*`, `components/gamification/*` | 🟡 Media |

### Orden de Dependencias de los Módulos

```
M1 (Auth) ──────────────────────┐
                                │
M2 (Sparks + Feed) ────────────┤
                                ├──► M4 (Forking + Reacciones)
M3 (WIPs + Post-Mortems) ──────┤
                                │
                                └──► M5 (Gamificación + Perfil)
```

> **⚠️ M1 (Auth) debe completarse primero** — el resto de módulos dependen de la autenticación de usuarios. M2 y M3 pueden desarrollarse en paralelo. M4 y M5 dependen de que M2 y M3 tengan CRUDs básicos.

### Trazabilidad de Requerimientos

Cada página y ruta de la API incluye comentarios con los IDs de regla de negocio que implementan (por ejemplo, `RN-09`, `RN-16`). Puedes buscar estos IDs en el código:

```bash
# Encontrar todos los archivos relacionados a una regla de negocio
grep -r "RN-09" src/
```

---

## 🔄 Flujo de Trabajo de Desarrollo

### Estrategia de Ramas (Branching)

```
main
├── develop
│   ├── feature/auth-login          (M1)
│   ├── feature/auth-register       (M1)
│   ├── feature/spark-crud          (M2)
│   ├── feature/feed-page           (M2)
│   ├── feature/wip-crud            (M3)
│   ├── feature/postmortem-crud     (M3)
│   ├── feature/fork-system         (M4)
│   ├── feature/reactions           (M4)
│   ├── feature/gamification-xp     (M5)
│   └── feature/profile-leaderboard (M5)
```

### Convenciones

- **Commits**: Utilizar [Conventional Commits](https://www.conventionalcommits.org/)
  - `feat(sparks): add spark creation form — RN-05, RN-08`
  - `feat(wips): enforce version immutability — RN-12`
  - `fix(auth): implement writer/reviewer roles — RN-02`
- **Componentes**: Archivos en PascalCase, un componente por archivo
- **API Routes**: Usar la convención `route.ts`, siempre validar inputs
- **Tipos**: Definir en `src/types/index.ts`, importar con `@/types`
  - Usar `LiteraryCategory` (no `Discipline`) para categorías
- **Cliente Supabase**:
  - Server Components → `import { createClient } from "@/lib/supabase/server"`
  - Client Components → `import { createClient } from "@/lib/supabase/client"`

---

## 🔐 Variables de Entorno

| Variable                         | Requerida | Descripción                    |
|----------------------------------|----------|--------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`       | ✅       | URL del proyecto Supabase      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | ✅       | Llave pública/anónima de Supabase|
| `NEXT_PUBLIC_APP_URL`            | ❌       | URL de la app (default: localhost)|

Configuración:
```bash
cp .env.example .env.local
# Llena el archivo con tus credenciales de Supabase desde:
# https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
```

---

## 🧠 Decisiones de Diseño Clave

### 1. Solo texto plano (L-04, L-06)
Todas las publicaciones (Sparks, WIPs, Post-Mortems) aceptan **únicamente texto plano**. No hay editor enriquecido ni carga de imágenes o archivos. Simplifica el modelo de datos y centra la experiencia en el contenido literario.

### 2. Categorías literarias predefinidas (RN-21, RN-22)
El sistema usa cuatro categorías fijas: `cuento`, `poesia`, `novela`, `ensayo`. Cada texto pertenece a exactamente una categoría. Ver `src/types/index.ts`.

### 3. Versionado lineal de textos (RN-09 a RN-12)
Cada edición de un texto publicado genera automáticamente una nueva versión inmutable. Las versiones antiguas son de solo lectura (`RN-12`). Los comentarios se almacenan con referencia a la `version_id` específica (`RN-11`).

### 4. Árbol de forks con Materialized Paths (RN-13, RN-14)
El sistema de forking usa *Materialized Paths* en la base de datos. Permite consultar ancestros y descendientes de forma eficiente. Si el texto original es eliminado, el árbol muestra `[Contenido eliminado]` sin romper la cadena de trazabilidad (`RN-13`).

### 5. Filtro por categoría literaria sin algoritmo complejo (RN-20, L-05)
El feed no usa algoritmos de recomendación complejos. Filtra exclusivamente por las categorías de interés del usuario, complementado por el estado creativo declarado para ajustar la prioridad del contenido mostrado.

### 6. Autenticación por cookies con `@supabase/ssr` (RN-25)
En lugar de manejar tokens JWT manualmente en LocalStorage, se usa el paquete SSR de Supabase que gestiona sesiones con Cookies. Garantiza compatibilidad con React Server Components y que toda acción requiera autenticación.

### 7. Modal de sugerencia de Post-Mortem (CU-WP-03)
Cuando un autor cambia su WIP a "Resuelto", el sistema despliega automáticamente un modal invitando a redactar un Post-Mortem. El cambio de estado se valida a nivel de base de datos.

### 8. Gamificación con XP e idempotencia
Cada acción del escritor (publicar, comentar, hacer fork, resolver un WIP) otorga puntos de experiencia (XP). La función `generateXPIdempotencyKey()` en `src/lib/utils.ts` genera una clave única con formato `accion:actor:objetivo` que evita otorgar XP duplicado por la misma acción.

### 9. Leaderboard como vista materializada
La tabla de clasificación usa una `MATERIALIZED VIEW` en Supabase que cachea el ranking por XP total y por categoría literaria. Se refresca periódicamente sin afectar el rendimiento de las consultas del feed.

---

## 📄 Licencia

Este proyecto tiene propósitos académicos y de portfolio.

---

## 🤝 Equipo

| Rol | Nombre |
|------|------|
| Miembro 1 | [Nicolas Juarez] — Auth & Middleware      |
| Miembro 2 | [Sebastian Jara] — Sparks & Feed          |
| Miembro 3 | [Javier Reyna] — WIPs & Post-Mortems      |
| Miembro 4 | [Jimena Camacho] — Forking & Reacciones   |
| Miembro 5 | [Dylan Martinez] — Gamificación & Perfil  |
