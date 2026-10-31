# Kuadri - Documento de análisis

Autor: Roycer Stevan Cervantes Ropero
Programa: Tecnólogo en Análisis y Desarrollo de Software (SENA)
Versión: 3.0 (Fases 1, 2 y 3)

## 1. Descripción general

Kuadri es una aplicación web personal para organizar en un solo lugar el estudio, las metas, los recursos creativos y el ocio. La Fase 1 se concentra en el módulo de **Organización y estudio**: tareas, calendario, recordatorios automáticos, sesiones de enfoque, estadísticas, rachas y logros.

### 1.1 Problema

Una persona que estudia en varias instituciones, trabaja y tiene proyectos propios suele tener sus pendientes repartidos entre mensajes, correos, notas y la memoria. Esto produce:

- Fechas de entrega olvidadas o recordadas a última hora.
- Falta de visibilidad sobre cuánto tiempo se dedica realmente al estudio.
- Poca motivación para mantener la constancia.

### 1.2 Objetivo general

Desarrollar una aplicación web que permita a una persona registrar y organizar sus pendientes, recibir recordatorios automáticos y medir su constancia y tiempo de estudio.

### 1.3 Objetivos específicos

1. Permitir el registro y autenticación segura de usuarios.
2. Gestionar tareas clasificadas por categorías con fecha límite y prioridad.
3. Enviar recordatorios automáticos por correo y dentro de la aplicación.
4. Registrar sesiones de enfoque y mostrar estadísticas semanales.
5. Motivar la constancia mediante rachas y logros.

### 1.4 Alcance de la Fase 1

| Incluido | Fases posteriores |
|---|---|
| Autenticación con JWT | Metas y lista de deseos (Fase 2) |
| Categorías personalizables | Seguimiento automático de precios (Fase 2) |
| Tareas (lista y calendario) | Estudio creativo (Fase 3) |
| Recordatorios automáticos (correo y app) | Registro de ocio (Fase 3) |
| Temporizador de enfoque | |
| Estadísticas semanales | |
| Rachas y logros | |

## 2. Actores

| Actor | Descripción |
|---|---|
| Usuario | Persona registrada que gestiona sus tareas y su tiempo de estudio. |
| Sistema (planificador) | Proceso automático del servidor que revisa fechas y genera recordatorios. |

## 3. Requisitos funcionales

| Código | Requisito | Prioridad |
|---|---|---|
| RF01 | El usuario puede registrarse con nombre, correo y contraseña. | Alta |
| RF02 | El usuario puede iniciar y cerrar sesión. | Alta |
| RF03 | El sistema crea categorías por defecto (Universidad, SENA, Personal) al registrarse. | Media |
| RF04 | El usuario puede crear, editar y eliminar categorías con nombre y color. | Media |
| RF05 | El usuario puede crear tareas con título, descripción, categoría, fecha límite y prioridad. | Alta |
| RF06 | El usuario puede editar, eliminar y marcar tareas como completadas. | Alta |
| RF07 | El usuario puede filtrar tareas por estado, categoría y prioridad. | Media |
| RF08 | El usuario puede ver sus tareas en un calendario mensual. | Media |
| RF09 | El sistema genera recordatorios automáticos 24 horas antes de la fecha límite de cada tarea pendiente. | Alta |
| RF10 | El sistema envía el recordatorio por correo si el usuario lo tiene activado. | Media |
| RF11 | El usuario ve sus notificaciones dentro de la aplicación y puede marcarlas como leídas. | Media |
| RF12 | El usuario puede iniciar un temporizador de enfoque asociado (opcionalmente) a una tarea o categoría. | Alta |
| RF13 | El sistema registra la duración de cada sesión de enfoque terminada. | Alta |
| RF14 | El usuario ve estadísticas de los últimos 7 días: minutos de enfoque por día y tareas completadas. | Alta |
| RF15 | El sistema calcula la racha de días consecutivos con actividad (tarea completada o sesión de enfoque). | Media |
| RF16 | El sistema otorga logros automáticamente al cumplir condiciones definidas. | Media |
| RF17 | El usuario puede actualizar su perfil y sus preferencias de notificación. | Baja |
| RF18 | El usuario puede crear, editar y eliminar metas con nombre, descripción, categoría y fecha objetivo. | Alta |
| RF19 | El usuario puede agregar, marcar y quitar pasos de una meta; el avance se calcula con los pasos hechos. | Alta |
| RF20 | El sistema marca la meta como cumplida cuando todos sus pasos están hechos; una meta sin pasos se cumple a mano. | Media |
| RF21 | El usuario puede crear, editar y eliminar deseos con nombre, enlace, foto, prioridad y precio objetivo. | Alta |
| RF22 | El usuario puede anotar el precio de un deseo cuando lo ve; el sistema guarda el historial y muestra si bajó o subió. | Alta |
| RF23 | El sistema avisa en las notificaciones cuando un deseo llega al precio objetivo. | Media |
| RF24 | El usuario puede marcar un deseo como comprado. | Baja |
| RF25 | El usuario puede crear, editar y eliminar paletas de 2 a 6 colores y copiar el código de cada color. | Media |
| RF26 | El usuario puede guardar tipografías de Google Fonts con su uso (títulos, texto o ambos) y verlas en una vista previa. | Media |
| RF27 | El usuario puede crear plantillas que juntan una paleta, una fuente para títulos y otra para texto, con una tarjeta de ejemplo. | Media |
| RF28 | El usuario puede registrar actividades de ocio (videojuego, serie, película, libro, música u otro) con estado, nota de 1 a 5 y plataforma. | Media |
| RF29 | El usuario puede anotar los minutos que dedica a cada actividad de ocio y borrar un rato mal anotado. | Media |
| RF30 | El usuario ve en Progreso qué parte del tiempo de la semana fue estudio y qué parte fue ocio. | Baja |

## 4. Requisitos no funcionales

| Código | Categoría | Requisito |
|---|---|---|
| RNF01 | Seguridad | Las contraseñas se almacenan cifradas con bcrypt. |
| RNF02 | Seguridad | Las rutas privadas exigen un token JWT válido. |
| RNF03 | Seguridad | Todas las consultas SQL son parametrizadas para evitar inyección SQL. |
| RNF04 | Seguridad | Los datos de entrada se validan en el cliente y en el servidor. |
| RNF05 | Seguridad | Un usuario solo puede ver y modificar sus propios datos. |
| RNF06 | Rendimiento | Las respuestas de la API en operaciones comunes tardan menos de 500 ms. |
| RNF07 | Usabilidad | La interfaz es adaptable a celular, tableta y escritorio. |
| RNF08 | Accesibilidad | Contraste suficiente, foco visible y navegación con teclado. |
| RNF09 | Mantenibilidad | El código está organizado por capas y documentado. |
| RNF10 | Calidad | Existen pruebas automáticas que se ejecutan en integración continua. |
| RNF11 | Portabilidad | La configuración sensible se maneja con variables de entorno. |

## 5. Historias de usuario

**HU01 - Registro**
Como persona nueva, quiero crear una cuenta, para guardar mis tareas de forma privada.
Criterios de aceptación:
- El correo debe ser válido y no estar registrado.
- La contraseña debe tener mínimo 8 caracteres.
- Al registrarme se crean mis categorías por defecto y quedo con sesión iniciada.

**HU02 - Crear tarea**
Como estudiante, quiero registrar una entrega con su fecha y categoría, para no olvidarla.
Criterios de aceptación:
- El título es obligatorio (máximo 150 caracteres).
- La prioridad puede ser baja, media o alta.
- La tarea aparece en la lista y en el calendario.

**HU03 - Recordatorio automático**
Como estudiante, quiero recibir un aviso un día antes de una entrega, para prepararme a tiempo.
Criterios de aceptación:
- El aviso se genera una sola vez por tarea.
- No se genera si la tarea ya está completada.
- Llega como notificación en la app y por correo si lo tengo activado.

**HU04 - Sesión de enfoque**
Como estudiante, quiero usar un temporizador mientras estudio, para medir mi tiempo real de estudio.
Criterios de aceptación:
- Puedo elegir la duración (por ejemplo 25 o 50 minutos).
- Al terminar, la sesión se guarda con su duración.
- Puedo asociarla a una tarea.

**HU05 - Estadísticas**
Como estudiante, quiero ver cuántos minutos estudié y cuántas tareas completé cada día de la semana, para saber si voy bien.

**HU06 - Racha y logros**
Como usuario, quiero ver mi racha de días activos y los logros que he ganado, para mantenerme motivado.

## 6. Casos de uso

| Código | Caso de uso | Actor | Requisitos |
|---|---|---|---|
| CU01 | Registrarse | Usuario | RF01, RF03 |
| CU02 | Iniciar sesión | Usuario | RF02 |
| CU03 | Gestionar categorías | Usuario | RF04 |
| CU04 | Gestionar tareas | Usuario | RF05, RF06, RF07 |
| CU05 | Consultar calendario | Usuario | RF08 |
| CU06 | Generar recordatorios | Sistema | RF09, RF10 |
| CU07 | Consultar notificaciones | Usuario | RF11 |
| CU08 | Registrar sesión de enfoque | Usuario | RF12, RF13 |
| CU09 | Consultar estadísticas | Usuario | RF14, RF15 |
| CU10 | Otorgar logros | Sistema | RF16 |

### CU04 - Gestionar tareas (descripción extendida)

- **Precondición:** el usuario ha iniciado sesión.
- **Flujo principal:**
  1. El usuario abre la sección Tareas.
  2. El sistema muestra las tareas pendientes ordenadas por fecha límite.
  3. El usuario pulsa "Nueva tarea" y completa el formulario.
  4. El sistema valida los datos y guarda la tarea.
  5. El sistema muestra la tarea en la lista.
- **Flujos alternos:**
  - 4a. Datos inválidos: el sistema muestra el error junto al campo.
  - El usuario marca una tarea como completada: el sistema registra la fecha de cumplimiento, actualiza la racha y revisa logros.
- **Postcondición:** la tarea queda guardada y asociada al usuario.

### CU06 - Generar recordatorios (descripción extendida)

- **Disparador:** el planificador se ejecuta cada 15 minutos.
- **Flujo principal:**
  1. El sistema busca tareas pendientes con fecha límite dentro de las próximas 24 horas y sin recordatorio enviado.
  2. Por cada tarea crea una notificación en la app.
  3. Si el usuario tiene activado el correo, envía el aviso por email.
  4. Marca la tarea como recordada para no repetir el aviso.

## 7. Reglas de negocio

- **RN01:** Un día cuenta como "activo" si el usuario completó al menos una tarea o terminó al menos una sesión de enfoque.
- **RN02:** La racha actual es la cantidad de días activos consecutivos que terminan hoy o ayer.
- **RN03:** Una sesión de enfoque dura entre 1 y 180 minutos.
- **RN04:** Los logros se otorgan una sola vez por usuario.
- **RN05:** El avance de una meta es el porcentaje de pasos hechos; una meta cumplida siempre está al 100 %. Si se agrega o desmarca un paso de una meta cumplida, vuelve a quedar en curso.
- **RN06:** El aviso de precio objetivo se envía una sola vez; si el precio vuelve a subir por encima del objetivo, el aviso queda listo para la siguiente bajada.
- **RN07:** El precio se anota a mano. No se lee automáticamente de las tiendas, porque las tiendas grandes bloquean esas lecturas y el servidor gratuito se duerme.
- **RN08:** Los colores se guardan en formato #RRGGBB y en mayúscula. Si se borra una paleta o una fuente, las plantillas que la usaban se conservan sin ella.
- **RN09:** Un rato de ocio dura entre 1 y 720 minutos y no puede ser de un día futuro. Anotar un rato en algo pendiente lo pasa a "en curso".
- **RN10:** Los ratos de ocio no cuentan para la racha: la racha sigue midiendo solo el estudio (tareas y enfoque).

| Logro | Condición |
|---|---|
| Primer paso | Completar la primera tarea |
| Constante | Racha de 3 días |
| Imparable | Racha de 7 días |
| Productivo | 10 tareas completadas |
| Concentrado | 5 horas de enfoque acumuladas |
| Madrugador | Completar una tarea antes de las 8:00 a. m. |
| Soñador | Cumplir la primera meta |
| Paciente | Un deseo llega al precio objetivo |
| Creativo | Guardar la primera paleta de colores |
| Equilibrado | Terminar algo de la lista de ocio |

## 8. Metodología

Scrum adaptado para un desarrollador, con sprints de una semana y tablero en GitHub Projects (Pendiente, En progreso, En pruebas, Terminado).
