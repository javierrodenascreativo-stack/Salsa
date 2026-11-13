# Clase del Viernes · Salsa

Página donde los alumnos confirman si vienen a la clase del viernes y con qué rol (líder o follower).
El profe ve al momento cuántos líderes o followers faltan.

Publicada en Vercel: https://clase-salsa.vercel.app

## Cómo está hecha

- `index.html`: la página (tres pasos: apuntarse → apuntados → cuántos faltan).
- `api/salsa.js`: función de servidor de Vercel que guarda y lee las inscripciones.
- Los datos se guardan como archivos **privados** en un almacén Vercel Blob (`clase-salsa-asistencia`, región París) conectado al proyecto.

Variables de entorno del proyecto en Vercel:

- `BLOB_READ_WRITE_TOKEN`: la creó Vercel al conectar el almacén. No la toques.
- `PIN_PROFE`: el PIN del modo profe. Para cambiarlo: Vercel → proyecto `clase-salsa` → Settings → Environment Variables → `PIN_PROFE`, y después vuelve a publicar el proyecto (Deployments → Redeploy) para que se aplique.

Cada cambio que se sube a la rama `main` de GitHub se publica solo en Vercel.

## Cómo se usa

- **Alumnos:** escriben nombre y apellido, eligen rol y pulsan "¡Me apunto!". Desde el mismo móvil pueden cambiar el rol o pulsar "Ya no puedo ir".
- **Profe:** abajo del todo, "Soy el profe" e introduce el PIN. En la pantalla 3 aparecen el mensaje para copiar ("nos faltan X") y el apartado para apuntar a alguien a mano. En "Ver nombres" puedes quitar a alguien con la ×.
- La página siempre muestra el próximo viernes (o el mismo día, si es viernes).

## Limitaciones conocidas

- No hay contraseñas para los alumnos: alguien con el enlace podría apuntar a otra persona o cancelar su plaza escribiendo exactamente su nombre. El profe puede quitar entradas.
- Los nombres de los apuntados son visibles para cualquiera que tenga el enlace.
- Si alguien escribe su nombre de dos formas distintas, aparecerá dos veces.
