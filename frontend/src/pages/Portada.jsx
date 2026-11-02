// Portada pública: explica qué es Kuadri a quien llega sin sesión y le da a los buscadores texto para leer.
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import Logo from '../components/Logo';

const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const CUADROS = [
  {
    clase: 'cuadro-entregas',
    titulo: 'Tareas y entregas',
    texto:
      'Anota cada entrega con su fecha, prioridad y categoría. Míralas en lista o en un calendario mensual, y recibe un aviso antes de que venzan.',
  },
  {
    clase: 'cuadro-campus',
    titulo: 'Tu campus virtual',
    texto:
      'Conecta Moodle, Zajuna del SENA, Brightspace u otro campus que exporte su calendario, y tus entregas pendientes llegan solas a Tareas.',
  },
  {
    clase: 'cuadro-enfoque',
    titulo: 'Temporizador de enfoque',
    texto: 'Estudia en bloques de 15, 25, 50 o 90 minutos y mira cuánto estudiaste de verdad cada semana.',
  },
  {
    clase: 'cuadro-metas',
    titulo: 'Metas y lista de deseos',
    texto: 'Divide cada meta en pasos y sigue el precio de lo que quieres comprar hasta que llegue al que buscas.',
  },
  {
    clase: 'cuadro-rachas',
    titulo: 'Rachas y logros',
    texto: 'Tu semana se llena día a día y cada logro te recuerda lo que ya cumpliste.',
  },
  {
    clase: 'cuadro-estudio',
    titulo: 'Estudio creativo',
    texto: 'Guarda paletas de colores, tipografías y plantillas para tus proyectos de diseño.',
  },
  {
    clase: 'cuadro-ocio',
    titulo: 'Registro de ocio',
    texto: 'Lleva tus juegos, series, películas, libros y música, y compara ese tiempo con el de estudio.',
  },
];

const PASOS = [
  { titulo: 'Crea tu cuenta', texto: 'Solo necesitas tu nombre, tu correo y una contraseña.' },
  { titulo: 'Conecta tu campus', texto: 'Pega una sola vez el enlace de calendario, o anota tus entregas a mano.' },
  { titulo: 'Sigue tu semana', texto: 'Mira qué viene, estudia con el temporizador y marca lo que termines.' },
];

const PREGUNTAS = [
  {
    pregunta: '¿Qué es Kuadri?',
    respuesta:
      'Es una aplicación web para organizar tu vida de estudiante en un solo panel: tareas, entregas, tiempo de estudio, metas y ocio.',
  },
  {
    pregunta: '¿Tengo que dar la contraseña de mi campus virtual?',
    respuesta: 'No. Kuadri solo usa el enlace de calendario de tu campus y nunca te pide la contraseña.',
  },
  {
    pregunta: '¿Funciona en el celular?',
    respuesta: 'Sí. Se adapta a celular, tableta y computador, y puedes instalarla en la pantalla principal de tu teléfono.',
  },
  {
    pregunta: '¿Por qué tarda en responder la primera vez?',
    respuesta: 'El servidor se duerme cuando nadie lo usa. Puede tardar cerca de un minuto en despertar; después va normal.',
  },
];

export default function Portada() {
  return (
    <div className="portada">
      <header className="portada-cabecera">
        <Link to="/" className="logo portada-logo" aria-label="Kuadri, inicio">
          <Logo />
        </Link>
        <nav aria-label="Cuenta">
          <Link to="/login" className="enlace">
            Iniciar sesión
          </Link>
        </nav>
      </header>

      <main>
        <section className="portada-heroe">
          <div className="portada-heroe-texto">
            <h1>Organiza tus entregas, tu estudio y tus metas, cuadro por cuadro.</h1>
            <p>
              Kuadri reúne en un solo panel lo que tienes que entregar, el tiempo que estudias y lo que quieres lograr.
            </p>
            <Link to="/registro" className="boton boton-primario portada-accion">
              Crear cuenta
            </Link>
            <div className="muestra" aria-hidden="true">
              {DIAS.map((d, i) => (
                <span key={i}>{i < 5 ? <Check size={20} strokeWidth={3.2} /> : d}</span>
              ))}
            </div>
          </div>
          <img
            className="portada-heroe-captura"
            src="/portada/panel-escritorio.webp"
            width="1360"
            height="860"
            alt="Panel de Kuadri con la racha de la semana, las categorías Universidad, SENA y Personal, y las próximas entregas"
          />
        </section>

        <section className="portada-seccion" aria-labelledby="titulo-funciones">
          <h2 id="titulo-funciones">Todo lo que tienes pendiente, en un solo lugar</h2>
          <div className="portada-cuadros">
            {CUADROS.map(({ clase, titulo, texto }) => (
              <article key={titulo} className={`portada-cuadro ${clase}`}>
                <h3>{titulo}</h3>
                <p>{texto}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="portada-seccion portada-pasos-bloque" aria-labelledby="titulo-pasos">
          <div>
            <h2 id="titulo-pasos">Empieza en tres pasos</h2>
            <ol className="portada-pasos">
              {PASOS.map(({ titulo, texto }) => (
                <li key={titulo}>
                  <h3>{titulo}</h3>
                  <p>{texto}</p>
                </li>
              ))}
            </ol>
          </div>
          <img
            className="portada-celular"
            src="/portada/panel-celular.webp"
            width="780"
            height="1328"
            loading="lazy"
            alt="Kuadri en un celular, con la semana en cuadros y la barra de navegación inferior"
          />
        </section>

        <section className="portada-seccion" aria-labelledby="titulo-preguntas">
          <h2 id="titulo-preguntas">Preguntas frecuentes</h2>
          <dl className="portada-preguntas">
            {PREGUNTAS.map(({ pregunta, respuesta }) => (
              <div key={pregunta}>
                <dt>{pregunta}</dt>
                <dd>{respuesta}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

      <footer className="portada-pie">
        <p>Kuadri es un proyecto de Roycer Cervantes, desde Santa Marta, Colombia.</p>
        <nav aria-label="Enlaces del autor">
          <a href="https://github.com/royzeer/kuadri">Código en GitHub</a>
          <a href="https://www.linkedin.com/in/roycer-cervantes">LinkedIn</a>
        </nav>
      </footer>
    </div>
  );
}
