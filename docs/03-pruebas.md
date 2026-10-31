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

### API (27 pruebas)

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
| CP27 | Correo rechazado por Resend | El aviso en la app se crea una sola vez y la tarea queda recordada | RF09, RF10 |
| CP16 a CP26 | Rachas (6 casos), logros (2), fechas (2), escape de HTML (1) | Cálculos correctos en bordes: cambio de mes, año bisiesto, racha rota, mejor racha | RN01, RN02, RN04 |

### Interfaz (9 pruebas)

| Caso | Resultado esperado |
|---|---|
| Calendario de un mes | 42 celdas que empiezan en lunes |
| Formato de minutos | "25 min", "1 h", "1 h 35 min" |
| Descripción de fecha límite | "Hoy", "Mañana", "Vencida" según corresponda |
| Formulario sin título | Muestra el error y no envía |
| Formulario válido | Envía los datos limpios (sin espacios extra) |
| Error de la API | Muestra el mensaje general y el error del campo |

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
