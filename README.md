# Lecturas de paz

Guía interactiva de las lecturas del curso de construcción de paz y reconciliación. Reúne fichas por lectura, ejes comparativos, un mapa de conexiones, debates entre autores, talleres guiados y tarjetas de repaso.

Sitio publicado: https://jorgevillegasres.github.io/lecturas_paz/

## Qué contiene

| Sección | Para qué sirve |
| --- | --- |
| Módulos | Lecturas de cada módulo, taller asociado y debates en los que participan |
| Lectura | Tesis, estructura, conceptos con página, lo evidente y lo no evidente, citas, cruces, preguntas y ejes |
| Ejes transversales | Seis preguntas comparadas en todas las lecturas, con vista de matriz |
| Mapa de conexiones | Red de vínculos entre lecturas; la línea punteada marca conexiones interpretativas |
| Debates | Siete tensiones entre autores, con la página de cada posición |
| Talleres | Guías de los talleres 2, 4 y 6; las respuestas se guardan en el navegador y se descargan en Markdown |
| Repaso | Tarjetas con preguntas y pauta de respuesta, filtrables por módulo |
| Glosario | Todos los conceptos, con autor y página |
| Metodología | Cómo se construyó el contenido y de qué archivo sale cada ficha |

La búsqueda (Ctrl K o `/`) recorre lecturas, conceptos, preguntas, citas, debates y talleres, sin distinguir tildes. El interruptor "Inferencias" oculta lo que es interpretación y deja solo lo que dicen los textos.

## Origen del contenido

Todo sale de los documentos de la carpeta de lecturas del curso. Cada PDF se leyó completo en el rango asignado: los digitales a partir del texto extraído y los escaneados página por página como imagen. De esa lectura salieron unas notas analíticas con página para cada afirmación, y de ellas los archivos de datos de este sitio. El detalle está en la sección Metodología.

Los PDF no están en este repositorio porque son obras protegidas por derechos de autor. El sitio publica solo el análisis, con citas de 20 palabras o menos.

## Estructura del repositorio

```
index.html            página única
css/styles.css        estilos, tema claro y oscuro
js/app.js             aplicación sin dependencias (rutas con #)
data/curso.json       módulos, ejes, debates, talleres y errores frecuentes
data/metodologia.json pasos, trazabilidad por archivo y limitaciones
data/lecturas/*.json  una ficha por lectura, todas con el mismo esquema
```

## Añadir una lectura

1. Crear `data/lecturas/<id>.json` con el mismo esquema que las demás.
2. Agregar el `id` a la lista `ORDEN` al inicio de `js/app.js`.
3. Incluirla en el módulo que corresponda en `data/curso.json` y registrar su archivo fuente en `data/metodologia.json`.

## Ver en local

El navegador no carga los datos si se abre `index.html` directamente. Hay que servir la carpeta:

```
python -m http.server 8765
```

y abrir http://localhost:8765.

## Publicación

GitHub Pages publica la rama `main` desde la raíz. El archivo `.nojekyll` evita el procesamiento con Jekyll.
