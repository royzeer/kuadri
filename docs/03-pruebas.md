# Kuadri - Plan de pruebas

Versión: 1.0 (Fase 1)

## 1. Estrategia

| Nivel | Herramienta | Qué se prueba |
|---|---|---|
| Unitarias (API) | Jest | Lógica pura: cálculo de rachas, reglas de logros, fechas y seguridad del correo. |
| Integración (API) | Jest + Supertest + MySQL | Servicios completos contra una base de datos real de pruebas. |
| Componentes (interfaz) | Vitest + Testing Library | Formulario de tareas y utilidades de fechas. |
| Integración continua | GitHub Actions | Ejecuta todas las pruebas y la compilación en cada cambio. |
| Manual / exploratoria | Navegador en escritorio y celular | Flujo completo del usuario y diseño adaptable. |

## 2. Casos de prueba automatizados

### API (41 pruebas)

| Código | Caso | Resultado esperado | Requisito |
|---|---|---|---|
| CP01 | Registro de usuario | 201, se crean 3 categorías iniciales | RF01, RF03 |
| CP02 | Registro con correo repetido | 409 | RF01 |
| CP03 | Registro con datos inválidos | 422 con error por campo | RNF04 |
| CP04 | Inicio de sesión correcto e incorrecto | 200 con token / 401; nunca se devuelve la contraseña | RF02, RNF01 |
| CP05 | Ruta privada sin token | 401 | RNF02 |
| CP06 | Crear tarea | 201 con categoría asociada | RF05 |
| CP07 | Crear tarea sin título | 422 | RF05 |
| CP08 | Completar la primera tarea | Se otorga el logro "Primer paso" | RF06, RF16 |
| CP09 | Registrar sesión de enfoque | Aparece en el resumen semanal y la racha es 1 | RF13, RF14, RF15 |
| CP10 | Sesión de 500 minutos | 422 | RN03 |
| CP11 | Ver tarea de otro usuario | 404 | RNF05 |
| CP12 | Recordatorios automáticos | Solo avisa tareas dentro de 24 h y una sola vez | RF09, RF11 |
| CP13 | Revisión de recordatorios al abrir notificaciones | Genera el aviso aunque el planificador no haya corrido (servidor dormido) | RF09 |
| CP14 y CP15 | Envío de correo por la API de Resend | Petición correcta y error claro si se rechaza | RF10 |
| CP16 a CP26 | Rachas (6 casos), logros (2), fechas (2), escape de HTML (1) | Cálculos correctos en bordes: cambio de mes, año bisiesto, racha rota, mejor racha | RN01, RN02, RN04 |
| CP27 | Crear meta con pasos | 201, avance 0 % y fecha objetivo sin cambios | RF18 |
| CP28 | Meta sin nombre o con fecha inválida | 422 con error por campo | RF18 |
| CP29 | Marcar todos los pasos | Avance 50 % y luego 100 %, la meta se cumple sola y da el logro "Soñador" | RF19, RF20, RN05 |
| CP30 | Agregar paso a una meta cumplida | Vuelve a quedar en curso (67 %) | RN05 |
| CP31 | Meta sin pasos | Se marca cumplida a mano | RF20 |
| CP32 | Metas de otro usuario | 404 y lista vacía | RNF05 |
| CP33 | Agregar deseo con precio de hoy | 201 con historial de 1 precio | RF21, RF22 |
| CP34 | Enlace "javascript:" y precio negativo | 422 | RNF04 |
| CP35 | Precio que llega al objetivo | Tendencia "baja", un solo aviso aunque siga bajando, logro "Paciente" | RF22, RF23, RN06 |
| CP36 | Historial y borrar precio | Orden correcto y el precio actual se recalcula | RF22 |
| CP37 | Marcar comprado | Guarda la fecha de compra | RF24 |
| CP38 | Deseos de otro usuario | 404 | RNF05 |
| CP39 a CP41 | Avance de metas, análisis de precios, validar enlaces, precios y fechas | Cálculos correctos en bordes: sin pasos, un solo precio, 30 de febrero | RN05, RN06 |

### Interfaz (18 pruebas)

| Caso | Resultado esperado |
|---|---|
| Calendario de un mes | 42 celdas que empiezan en lunes |
| Formato de minutos | "25 min", "1 h", "1 h 35 min" |
| Descripción de fecha límite | "Hoy", "Mañana", "Vencida" según corresponda |
| Formulario sin título | Muestra el error y no envía |
| Formulario válido | Envía los datos limpios (sin espacios extra) |
| Error de la API | Muestra el mensaje general y el error del campo |
| Formato de pesos | "$ 150.000" sin decimales |
| Estado del precio | "Llegó a tu precio" o cuánto falta |
| Gráfica de precios | El precio más alto queda arriba y el más bajo abajo |
| Formulario de meta | Toma un paso por renglón y no pide pasos al editar |
| Formulario de deseo | Envía los precios como número y rechaza enlaces que no son web |

## 3. Pruebas manuales realizadas

| Escenario | Escritorio | Celular |
|---|---|---|
| Registro e inicio de sesión | Correcto | Correcto |
| Crear, editar, completar y eliminar tareas | Correcto | Correcto |
| Vista de calendario y navegación entre meses | Correcto | Correcto |
| Temporizador de enfoque y guardado de sesión | Correcto | Correcto |
| Estadísticas, racha y logros | Correcto | Correcto |
| Notificaciones y recordatorio generado por el planificador | Correcto | Correcto |
| Gestión de categorías (color e icono) | Correcto | Correcto |

## 4. Cómo ejecutar las pruebas

```bash
cd backend && npm test
cd frontend && npm test
```
