# Guía de Despliegue en Vercel para SGP-App

Esta guía te ayudará a desplegar la aplicación `sgp-app` en Vercel.

## Paso 1: Conectar tu Repositorio a Vercel

1.  **Regístrate o Inicia Sesión:** Ve a [vercel.com](https://vercel.com/) y crea una cuenta o inicia sesión. Es recomendable usar tu cuenta de GitHub, GitLab o Bitbucket para facilitar la integración.
2.  **Importa tu Proyecto:**
    *   Desde tu dashboard de Vercel, haz clic en **"Add New..."** y selecciona **"Project"**.
    *   Busca el repositorio de tu proyecto y haz clic en **"Import"**.

## Paso 2: Configurar el Proyecto

Una vez que Vercel haya importado tu repositorio, te pedirá que configures el proyecto. Asegúrate de usar los siguientes ajustes:

*   **Framework Preset:** Vercel debería detectar automáticamente que es un proyecto **Next.js**. Si no lo hace, selecciónalo manualmente.
*   **Root Directory:** Es muy importante que especifiques el directorio raíz correcto. En la configuración del proyecto, busca la opción "Root Directory" y establécela en `sgp-app`.
*   **Build and Output Settings:** Puedes dejar los comandos por defecto que Vercel sugiere para un proyecto Next.js (`next build`). No necesitas hacer cambios aquí.

![Configuración de Vercel](https://i.imgur.com/Tuw2Y9E.png)

## Paso 3: Añadir las Variables de Entorno

Antes de hacer el despliegue final, necesitas configurar las variables de entorno para que la aplicación pueda conectarse a Supabase y al servicio de renderizado.

En la configuración de tu proyecto en Vercel, ve a la sección **"Settings"** y luego a **"Environment Variables"**. Añade las siguientes variables:

| Nombre de la Variable              | Valor                                    | Descripción                                                                 |
| ---------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`         | `TU_SUPABASE_URL`                        | La URL de tu proyecto de Supabase.                                          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`    | `TU_SUPABASE_ANON_KEY`                   | La clave anónima (public) de tu proyecto de Supabase.                       |
| `RENDERER_BASE_URL`                | `LA_URL_DE_TU_RENDERIZADOR`              | La URL donde tu servicio de renderizado (el del directorio `renderer`) está desplegado. |

**Importante:**
*   Reemplaza `TU_SUPABASE_URL` y `TU_SUPABASE_ANON_KEY` con tus credenciales reales de Supabase.
*   Para `RENDERER_BASE_URL`, necesitarás desplegar el servicio del directorio `renderer` por separado (por ejemplo, en Render, Fly.io o un servicio similar para Node.js) y usar esa URL aquí.

## Paso 4: Desplegar

Una vez que hayas configurado todo, haz clic en el botón **"Deploy"**. Vercel comenzará el proceso de build y despliegue.

¡Y eso es todo! Una vez que el despliegue termine, Vercel te dará una URL donde podrás ver tu aplicación en vivo.
