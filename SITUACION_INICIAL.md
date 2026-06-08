# Situación Inicial del Proyecto Nectary

Este documento explica el estado actual del proyecto (qué ya está hecho) y qué pasos debe seguir el equipo para empezar a trabajar **inmediatamente** sin bloqueos.

---

## ¿Qué tenemos hasta ahora?

El proyecto ya cuenta con todo el **scaffolding (andamiaje) inicial** para que las 5 personas del equipo trabajen en paralelo.

1. **Estructura de Rutas (25+ páginas)**: Todas las páginas de la aplicación ya existen como "stubs" (plantillas vacías con títulos). Esto incluye las rutas públicas (Landing), las de autenticación (Login, Registro) y las protegidas (Feed, Creación de Sparks/WIPs, Perfil, etc.).
2. **Endpoints de API (14+ rutas)**: Ya están creados los archivos `route.ts` básicos para el CRUD de todos los módulos.
3. **Sistema de Diseño (Light Mode)**: Ya está configurado Tailwind CSS 4 en el archivo `src/app/globals.css` con la paleta de colores de la marca, los colores por disciplina y las utilidades compartidas (animaciones, glassmorphism).
4. **Tipado Centralizado**: El archivo `src/types/index.ts` ya contiene todas las interfaces base de TypeScript para los usuarios, Sparks, WIPs y Post-Mortems.
5. **Configuración de Supabase**: Los clientes de Supabase (browser y server) ya están configurados. 
6. **Middleware Inteligente**: El `middleware.ts` está configurado para proteger rutas, pero actualmente tiene un *fallback* (plan de contingencia) que le permite funcionar aunque no exista una base de datos conectada.

---

## ¿Cómo correr el proyecto AHORITA MISMO?

Para facilitar el trabajo inicial de Maquetación y UI, el proyecto está configurado para correr **SIN NECESIDAD DE BASE DE DATOS NI VARIABLES DE ENTORNO**.

Pasos exactos para tu equipo:

1. Clonar el repositorio.
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Levantar el servidor:
   ```bash
   npm run dev
   ```

### MUY IMPORTANTE: Sobre el archivo `.env`
**NO configuren el archivo `.env.local` ni conecten Supabase todavía.** 

El middleware está programado para detectar que no hay credenciales y saltarse la verificación de seguridad temporalmente. Esto les permitirá navegar por todas las páginas (incluso las protegidas como `/feed` o `/spark/new`) para poder construir y visualizar la Interfaz de Usuario (UI) sin que la base de datos sea un bloqueo.

