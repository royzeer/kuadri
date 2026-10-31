# Kuadri - Documento de diseño

Versión: 1.0 (Fase 1)

Los diagramas están escritos en Mermaid, por lo que GitHub los muestra como imágenes directamente en esta página.

## 1. Arquitectura

Arquitectura cliente-servidor de tres capas:

- **Cliente:** aplicación de una sola página (SPA) en React, construida con Vite.
- **Servidor:** API REST en Node.js con Express, organizada en rutas, controladores, servicios y modelos.
- **Datos:** base de datos MySQL.
- **Planificador:** tarea programada (node-cron) que corre dentro del servidor y genera recordatorios.

```mermaid
flowchart LR
  U[Usuario] -->|Navegador| FE[React + Vite]
  FE -->|HTTP JSON + JWT| API[API REST Express]
  API --> DB[(MySQL)]
  CRON[Planificador node-cron] --> DB
  CRON -->|SMTP| MAIL[Servidor de correo]
  MAIL --> U
```

### Capas del servidor

```mermaid
flowchart TB
  R[routes: define URL y middlewares] --> C[controllers: recibe la petición y responde]
  C --> S[services: reglas de negocio, rachas, logros]
  S --> M[models: consultas SQL parametrizadas]
  M --> DB[(MySQL)]
```

## 2. Diagrama de casos de uso

```mermaid
flowchart LR
  Usuario((Usuario))
  Sistema((Sistema))
  Usuario --- CU01[Registrarse]
  Usuario --- CU02[Iniciar sesión]
  Usuario --- CU03[Gestionar categorías]
  Usuario --- CU04[Gestionar tareas]
  Usuario --- CU05[Consultar calendario]
  Usuario --- CU07[Consultar notificaciones]
  Usuario --- CU08[Registrar sesión de enfoque]
  Usuario --- CU09[Consultar estadísticas]
  Sistema --- CU06[Generar recordatorios]
  Sistema --- CU10[Otorgar logros]
  CU04 -. include .-> CU10
  CU08 -. include .-> CU10
```

## 3. Modelo entidad-relación

```mermaid
erDiagram
  USUARIOS ||--o{ CATEGORIAS : tiene
  USUARIOS ||--o{ TAREAS : registra
  USUARIOS ||--o{ SESIONES_ENFOQUE : realiza
  USUARIOS ||--o{ NOTIFICACIONES : recibe
  USUARIOS ||--o{ USUARIO_LOGROS : obtiene
  LOGROS ||--o{ USUARIO_LOGROS : otorgado
  CATEGORIAS |o--o{ TAREAS : clasifica
  TAREAS |o--o{ SESIONES_ENFOQUE : asociada

  USUARIOS {
    int id PK
    varchar nombre
    varchar correo UK
    varchar contrasena_hash
    boolean avisos_correo
    datetime creado_en
  }
  CATEGORIAS {
    int id PK
    int usuario_id FK
    varchar nombre
    char color
    varchar icono
  }
  TAREAS {
    int id PK
    int usuario_id FK
    int categoria_id FK
    varchar titulo
    text descripcion
    enum prioridad
    datetime fecha_limite
    boolean completada
    datetime completada_en
    boolean recordatorio_enviado
  }
  SESIONES_ENFOQUE {
    int id PK
    int usuario_id FK
    int tarea_id FK
    int categoria_id FK
    smallint minutos
    datetime terminada_en
  }
  NOTIFICACIONES {
    int id PK
    int usuario_id FK
    enum tipo
    varchar mensaje
    boolean leida
  }
  LOGROS {
    int id PK
    varchar codigo UK
    varchar nombre
    varchar descripcion
  }
  USUARIO_LOGROS {
    int usuario_id PK
    int logro_id PK
    datetime obtenido_en
  }
```

La base está normalizada hasta tercera forma normal: cada tabla describe una sola entidad, no hay grupos repetidos y los atributos dependen solo de la llave primaria. La vista `v_dias_activos` une tareas completadas y sesiones de enfoque para calcular rachas.

## 4. Diagrama de clases (servidor)

```mermaid
classDiagram
  class AuthService {
    +registrar(nombre, correo, contrasena)
    +iniciarSesion(correo, contrasena)
  }
  class TareaService {
    +listar(usuarioId, filtros)
    +crear(usuarioId, datos)
    +actualizar(usuarioId, id, datos)
    +completar(usuarioId, id)
    +eliminar(usuarioId, id)
  }
  class EnfoqueService {
    +registrar(usuarioId, minutos, tareaId)
  }
  class EstadisticasService {
    +resumenSemanal(usuarioId)
    +calcularRacha(dias, hoy)
  }
  class LogroService {
    +revisar(usuarioId)
  }
  class RecordatorioJob {
    +ejecutar()
  }
  class CorreoService {
    +enviar(destino, asunto, html)
  }
  TareaService --> LogroService
  EnfoqueService --> LogroService
  LogroService --> EstadisticasService
  RecordatorioJob --> CorreoService
```

## 5. Diagrama de secuencia: recordatorio automático

```mermaid
sequenceDiagram
  participant Cron as Planificador
  participant DB as MySQL
  participant Mail as Correo
  Cron->>DB: Buscar tareas pendientes que vencen en menos de 24 h y sin recordatorio
  DB-->>Cron: Lista de tareas
  loop Por cada tarea
    Cron->>DB: Insertar notificación tipo recordatorio
    alt Usuario con avisos por correo
      Cron->>Mail: Enviar correo
    end
    Cron->>DB: Marcar recordatorio_enviado = TRUE
  end
```

## 6. Diagrama de secuencia: completar tarea

```mermaid
sequenceDiagram
  actor U as Usuario
  participant FE as React
  participant API as API
  participant DB as MySQL
  U->>FE: Marca la tarea como completada
  FE->>API: PATCH /api/tareas/:id/completar (JWT)
  API->>DB: UPDATE tareas SET completada = TRUE
  API->>DB: Consultar días activos y totales
  API->>DB: Insertar logros nuevos y notificaciones
  API-->>FE: Tarea actualizada + logros nuevos
  FE-->>U: Muestra la tarea completada y el logro ganado
```

## 7. Servicios de la API

Todas las respuestas usan el formato `{ ok, data, mensaje }`. Las rutas marcadas con candado requieren el encabezado `Authorization: Bearer <token>`.

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | /api/auth/registro | Crear cuenta | |
| POST | /api/auth/login | Iniciar sesión | |
| GET | /api/auth/perfil | Ver perfil | Sí |
| PUT | /api/auth/perfil | Actualizar nombre y avisos por correo | Sí |
| GET | /api/categorias | Listar categorías con conteo de tareas | Sí |
| POST | /api/categorias | Crear categoría | Sí |
| PUT | /api/categorias/:id | Editar categoría | Sí |
| DELETE | /api/categorias/:id | Eliminar categoría | Sí |
| GET | /api/tareas | Listar tareas (filtros: estado, categoria, prioridad, desde, hasta) | Sí |
| POST | /api/tareas | Crear tarea | Sí |
| PUT | /api/tareas/:id | Editar tarea | Sí |
| PATCH | /api/tareas/:id/completar | Marcar completada o pendiente | Sí |
| DELETE | /api/tareas/:id | Eliminar tarea | Sí |
| POST | /api/enfoque | Registrar sesión de enfoque | Sí |
| GET | /api/estadisticas/resumen | Resumen semanal, racha y totales | Sí |
| GET | /api/logros | Logros con estado obtenido o bloqueado | Sí |
| GET | /api/notificaciones | Listar notificaciones | Sí |
| PATCH | /api/notificaciones/leer-todas | Marcar todas como leídas | Sí |

## 8. Diseño de interfaz

**Concepto: "lima".** Interfaz plana y alegre sobre fondo blanco, con tarjetas de color sólido en verde lima y negro, esquinas muy redondeadas, botones y días de la semana en forma de píldora, y barras negras. El nombre Kuadri sigue viniendo de *cuadrícula*: la semana y el temporizador se llenan cuadro por cuadro.

| Token | Valor | Uso |
|---|---|---|
| Blanco | #FFFFFF | Fondo de la página |
| Negro | #141414 | Texto, barra lateral, botón principal, racha y día actual |
| Lima | #B1CB5A | Color principal: enlace activo, tarjetas, barras y logros |
| Lima clara | #D6E6A1 | Tarjetas y días con poco avance |
| Lima pálida | #F1F6DF | Fondo de tareas, campos y gráficos |
| Fuente | Poppins | Títulos y texto |

**Elementos propios del sistema**

- **Logo:** cuatro cuadritos en tonos de lima, uno marcado con un chulo: completar la cuadrícula.
- **Tu semana en cuadros:** siete píldoras con borde negro; el día se marca en lima según los minutos de enfoque y el día de hoy va en negro.
- **Categorías:** bloques de color sólido que alternan lima, negro y lima clara, con el número de pendientes en grande.
- **Temporizador en cuadrícula:** tarjeta negra con 50 cuadritos que se llenan en lima.
- **Gráficos de barras:** barras lima y la del día actual en negro.
- **Logros** como círculos lima y negros, punteados mientras están bloqueados.
- **Barra inferior en celular:** píldora negra con el elemento activo en un círculo blanco.

**Pantallas de la Fase 1:** inicio de sesión y registro (pantalla dividida), inicio, tareas (lista y calendario), enfoque, progreso y ajustes.
