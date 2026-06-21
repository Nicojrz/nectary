# Situación Inicial del Proyecto Nectary

Este documento explica el estado actual del proyecto y los pasos exactos que debe seguir cada miembro del equipo para trabajar desde el primer día.

---

## ¿Qué tenemos hasta ahora?

### Infraestructura y configuración
- **Next.js 16** con App Router y TypeScript configurado
- **Tailwind CSS 4** con sistema de diseño completo (colores por categoría literaria, tokens, animaciones)
- **Supabase** conectado — proyecto creado, credenciales en `.env.local`
- **Esquema de base de datos ejecutado** en Supabase (`supabase/schema.sql`)

### Base de datos (ya creada en Supabase)
Las siguientes tablas ya existen en tu proyecto de Supabase con RLS activo:

| Tabla | Qué guarda |
|-------|-----------|
| `profiles` | Perfil del escritor (XP, nivel, estado creativo) |
| `sparks` | Micro-posts de texto con soft delete y FTS |
| `wips` | Proyectos en progreso con borrador y estados |
| `wip_comments` | Comentarios de colaboradores |
| `post_mortems` | Reflexiones estructuradas de 4 secciones |
| `post_mortem_versions` | Historial inmutable de ediciones |
| `forks` | Árbol de bifurcaciones con `ltree` |
| `reactions` | Reacciones con emojis literarios predefinidos |
| `xp_events` | Log inmutable de XP con idempotencia |
| `xp_config` | Puntos por acción (configurable sin deploy) |
| `badges` + `user_badges` | Medallas desbloqueables |
| `notifications` | Notificaciones in-app |

### Código del proyecto
- **25+ rutas y páginas** scaffoldeadas con stubs y comentarios `TODO:`
- **14 API endpoints** en `/api/` listos para implementar
- **Tipos TypeScript** en `src/types/index.ts` alineados 1:1 con la BD
- **Componentes UI base** en `src/components/ui/` (`Button`, `Input`, `Textarea`, `Label`) listos para usar
- **Clientes Supabase** para servidor y cliente en `src/lib/supabase/`
- **Middleware** con protección de rutas (activado al tener credenciales)
- **Hook `useAuth`** para componentes cliente

---

## ¿Cómo correr el proyecto?

```bash
# 1. Clonar el repo
git clone <url-del-repo>
cd nectary

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Llenar con las credenciales de Supabase (Settings → Data API)

# 4. Levantar servidor de desarrollo
npm run dev

# 5. Abrir en el navegador
# → http://localhost:3000
```

> Si tienes acceso al `.env.local` compartido por el equipo, omite el paso 3 y úsalo directamente.

---

## Estado de cada módulo

| Módulo | Miembro | Estado | Siguiente paso |
|--------|---------|--------|----------------|
| Auth (GU) | M1 | Completado | Formulario, validación, PKCE Callback y UI lista |
| Sparks (SP) | M2 | Stub | Implementar creación + vista de detalle |
| Feed (FD) | M2 | En Progreso | Integración de tarjetas y navegación a perfiles lista |
| WIPs (WP) | M3 | Implementado | Aplicar migración `20260621150000_wip_versions.sql` en Supabase |
| Post-Mortems (PM) | M3 | Implementado | Aplicar migración `20260621160000_post_mortem_module.sql` en Supabase |
| Forking (FK) | M4 | Stub | Implementar modal de fork + árbol con `ltree` |
| Reacciones | M4 | Stub | Conectar `/api/reactions` con optimistic UI |
| Gamificación (KM) | M5 | Stub | Conectar XP events y vista materializada del leaderboard |
| Perfil | M5 | Parcial | Sub-rutas dinámicas para Sparks/WIPs listas. Faltan edición y medallas |

---

## Cosas que YA NO son bloqueantes

- La base de datos ya está creada y tiene RLS activo
- Las credenciales de Supabase ya están configuradas
- El middleware protege rutas automáticamente
- Los tipos TypeScript ya están definidos para toda la BD

## Cosas que TODAVÍA faltan

- La vista materializada del leaderboard hay que refrescarla periódicamente. Se puede activar como **cron job** en Supabase (Database → Cron Jobs): `SELECT refresh_leaderboard();` cada hora.
- Modal y Toast (las notificaciones) — aún no existen en `components/ui/`, hay que crearlos cuando se necesiten.
- Tests — ninguno por ahora, definir estrategia con el equipo
