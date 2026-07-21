import { Link } from 'react-router-dom';
import PublicHeader from '../../shared/components/PublicHeader.jsx';
import MechSyncLogo from '../../shared/components/MechSyncLogo.jsx';
import './landing.css';

const services = [
  {
    icon: '⌁',
    title: 'Diagnóstico preciso',
    description:
      'Identifica el origen de la falla con un proceso técnico claro y documentado.',
  },
  {
    icon: '⚙',
    title: 'Reparación especializada',
    description:
      'Organiza el servicio de transmisiones automáticas y mantén cada etapa bajo control.',
  },
  {
    icon: '✓',
    title: 'Entrega transparente',
    description:
      'Comunica avances, responsables y próximos pasos sin perder información importante.',
  },
];

const processSteps = [
  {
    title: 'Registra el ingreso',
    description: 'Centraliza los datos del cliente, vehículo y motivo de servicio.',
  },
  {
    title: 'Coordina el trabajo',
    description: 'Asigna responsables y da seguimiento a cada etapa de reparación.',
  },
  {
    title: 'Mantén al cliente informado',
    description: 'Consulta el progreso y conserva un historial claro del servicio.',
  },
];

const previewRows = [
  ['Recepción y diagnóstico', 'Completado', 'Listo'],
  ['Revisión técnica', 'En proceso', '14:45'],
  ['Instalación y pruebas', 'Por iniciar', 'Siguiente etapa operativa'],
];

function LandingPage() {
  return (
    <div className="landing-page">
      <div className="landing-page__dark">
        <PublicHeader />

        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero__copy">
            <p className="landing-eyebrow">Gestión especializada de taller</p>
            <h1 id="landing-title">Tu transmisión en manos expertas</h1>
            <p>
              Organiza servicios, vehículos y órdenes de trabajo desde una plataforma
              diseñada para talleres de transmisiones automáticas.
            </p>
            <div className="landing-hero__actions">
              <Link className="button button--primary" to="/login">
                Iniciar sesión
              </Link>
              <a className="button button--outline-light" href="#servicios">
                Ver servicios
              </a>
            </div>
          </div>

          <div
            className="transmission-visual"
            role="img"
            aria-label="Representación técnica de una transmisión automática"
          >
            <div className="transmission-visual__grid" />
            <div className="transmission-visual__shaft transmission-visual__shaft--left" />
            <div className="transmission-visual__gear transmission-visual__gear--large">
              <span />
            </div>
            <div className="transmission-visual__gear transmission-visual__gear--small">
              <span />
            </div>
            <div className="transmission-visual__shaft transmission-visual__shaft--right" />
            <div className="precision-card">
              <strong>Control operativo</strong>
              <span>Procesos documentados para cada servicio.</span>
            </div>
          </div>
        </section>
      </div>

      <main>
        <section className="landing-section services-section" id="servicios">
          <div className="section-title section-title--left">
            <span>Soluciones para tu taller</span>
            <h2>Servicios coordinados de principio a fin</h2>
          </div>

          <div className="services-grid">
            {services.map((service) => (
              <article className="service-card" key={service.title}>
                <span className="service-card__icon" aria-hidden="true">
                  {service.icon}
                </span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section process-section" id="proceso">
          <div className="section-title">
            <span>Nuestro proceso</span>
            <h2>Una experiencia de servicio sin fricciones</h2>
            <p>Información organizada para que el equipo avance con confianza.</p>
          </div>

          <ol className="process-list">
            {processSteps.map((step, index) => (
              <li key={step.title}>
                <span className="process-list__number">{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="tracking-section" id="seguimiento">
          <div className="tracking-preview">
            <div className="tracking-preview__header">
              <div>
                <span>Vista de operación</span>
                <h2>Seguimiento claro en cada etapa</h2>
              </div>
              <span className="tracking-preview__tag">Ejemplo ilustrativo</span>
            </div>

            <div className="tracking-preview__table" role="table" aria-label="Ejemplo de seguimiento">
              {previewRows.map(([stage, status, time]) => (
                <div className="tracking-preview__row" role="row" key={stage}>
                  <strong role="cell">{stage}</strong>
                  <span
                    role="cell"
                    className={`stage-status stage-status--${status
                      .toLowerCase()
                      .replace(' ', '-')}`}
                  >
                    {status}
                  </span>
                  <span role="cell">{time}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="tracking-aside">
            <div className="tracking-aside__dark">
              <p className="landing-eyebrow">Acceso seguro</p>
              <h2>Todo tu taller, sincronizado</h2>
              <p>Ingresa al portal para continuar con la operación diaria de tu equipo.</p>
              <Link className="button button--primary" to="/login">
                Ir al portal
              </Link>
            </div>
            <div className="tracking-aside__light">
              <strong>Preparado para crecer</strong>
              <p>
                La plataforma integra clientes, vehículos, ingresos, órdenes, trabajos y
                reportes de servicio en un flujo administrativo.
              </p>
            </div>
          </aside>
        </section>

        <section className="landing-cta" aria-labelledby="cta-title">
          <div>
            <span>¿Aún no tienes acceso?</span>
            <h2 id="cta-title">Conoce cómo solicitar una cuenta MechSync</h2>
          </div>
          <Link className="button button--light" to="/register">
            Ver registro
          </Link>
        </section>
      </main>

      <footer className="landing-footer" id="contacto">
        <div className="landing-footer__main">
          <div className="landing-footer__about">
            <MechSyncLogo compact />
            <p>
              Sistema de gestión para talleres especializados en transmisiones
              automáticas.
            </p>
          </div>
          <div>
            <strong>Plataforma</strong>
            <Link to="/login">Iniciar sesión</Link>
            <Link to="/register">Solicitar acceso</Link>
          </div>
          <div>
            <strong>Secciones</strong>
            <a href="#servicios">Servicios</a>
            <a href="#proceso">Cómo funciona</a>
            <a href="#seguimiento">Seguimiento</a>
          </div>
        </div>
        <div className="landing-footer__legal">
          <span>© {new Date().getFullYear()} MechSync.</span>
          <span>Gestión de taller conectada.</span>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
