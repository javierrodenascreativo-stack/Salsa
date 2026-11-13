# Clase del Viernes · Salsa

Página donde los alumnos confirman si vienen a la clase del viernes y con qué rol (líder o follower).
Tú ves al momento cuántos líderes o followers faltan.

- `index.html`: la página (se publica en GitHub Pages).
- `apps-script/Code.gs`: el "servidor", que guarda los datos en una hoja de Google.

Los alumnos no necesitan ninguna cuenta. Tú necesitas una cuenta de Google y otra de GitHub.

---

## Paso 1 · Crear la hoja y el script de Google (unos 10 minutos)

> Los nombres de los menús de Google pueden cambiar con el tiempo. Si alguno no coincide, busca el más parecido.

1. Crea una hoja de cálculo nueva en Google Sheets (por ejemplo "Asistencia salsa").
2. En la hoja, abre **Extensiones → Apps Script**.
3. Borra lo que haya en `Código.gs` y pega todo el contenido de `apps-script/Code.gs`. Guarda.
4. Crea tu PIN de profe: en el menú izquierdo, abre **Configuración del proyecto** (el engranaje) → **Propiedades del script** → **Añadir propiedad del script**.
   - Propiedad: `PIN_PROFE`
   - Valor: el PIN que quieras (por ejemplo `4821`). No uses uno obvio.
5. Arriba a la derecha, pulsa **Implementar → Nueva implementación**.
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario** (sin esto, los alumnos no podrían apuntarse)
6. Google te pedirá permisos para acceder a tu hoja de cálculo. Acéptalos. Puede avisarte de que la app "no está verificada": es tu propio script, así que pulsa "Configuración avanzada" y continúa.
7. Copia la **URL de la aplicación web** (termina en `/exec`).

## Paso 2 · Conectar la página

Abre `index.html`, busca esta línea y pega tu URL entre las comillas:

```js
const API_URL = "PEGA_AQUI_LA_URL_DE_APPS_SCRIPT";
```

## Paso 3 · Publicar en GitHub Pages

1. Sube `index.html` a tu repositorio.
2. En el repositorio abre **Settings → Pages**. En "Branch" elige `main` y la carpeta `/ (root)`, y guarda.
3. En uno o dos minutos tendrás una dirección del tipo `https://TU-USUARIO.github.io/NOMBRE-REPO/`. Esa es la que mandas a tus alumnos.

---

## Cómo se usa

- **Alumnos:** escriben nombre y apellido, eligen rol y pulsan "¡Me apunto!". Si vuelven a entrar desde el mismo móvil, pueden cambiar el rol o pulsar "Ya no puedo ir".
- **Profe:** abajo del todo, pulsa "Soy el profe" y escribe tu PIN. En la pantalla 3 verás el botón para copiar el mensaje de "nos faltan X" y un apartado para apuntar a gente a mano. En "Ver nombres" puedes quitar a alguien con la ×.
- La lista completa también está en la pestaña **Asistencia** de tu hoja de Google.
- La página siempre muestra el próximo viernes (o el mismo día, si es viernes).

## Limitaciones a tener en cuenta

- **No hay contraseñas para los alumnos.** Alguien con el enlace podría apuntar a otra persona o cancelar su plaza escribiendo exactamente su nombre. Para una clase de baile suele ser suficiente; si alguna vez pasa, como profe puedes quitar entradas.
- Si un alumno se apunta dos veces con el **mismo nombre**, se actualiza su entrada; con un nombre escrito distinto, aparecería dos veces.
- **Si cambias `Code.gs`** después de implementarlo, tienes que hacer **Implementar → Gestionar implementaciones → Editar → Nueva versión** para que el cambio se aplique, manteniendo la misma URL.
- Google Apps Script tiene cuotas de uso diarias. Para una clase son más que suficientes, pero no tengo la cifra exacta: consulta la documentación oficial de cuotas de Apps Script si lo necesitas.
