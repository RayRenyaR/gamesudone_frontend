import React from 'react';
import { useNavigate } from 'react-router-dom';

interface CreditCardItem {
  id: string;
  groupOrTool: string;
  roleTag: string;
  description: string;
  membersOrDetails: string;
  imageUrl: string;
}

const TEAM_CREDITS: CreditCardItem[] = [
  {
    id: 'amarillo',
    groupOrTool: 'Grupo Amarillo (Layout, Catálogo & UDOWare)',
    roleTag: 'ARQUITECTURA BASE & SINGLE PLAYER',
    description:
      'Diseño e implementación del Layout Principal táctil, sistema de temas dinámicos, catálogo estilo Launchbox, reproductor GameViewer unificado y desarrollo del videojuego de microjuegos UDOWare.',
    membersOrDetails: 'Integrantes: Nicolás (Líder), Rayner, Gabriel, Osmer, Rubén y Maxi.',
    imageUrl: 'https://placehold.co/320x240/7b2cbf/ffffff?text=Logo+Grupo+Amarillo',
  },
  {
    id: 'verde',
    groupOrTool: 'Grupo Verde (Subsistema Mascota Virtual Kaik)',
    roleTag: 'MASCOTA INTERACTIVA & BUFFS',
    description:
      'Desarrollo del ciclo de vida de Kaik, sistema de necesidades (hambre, felicidad, sueño), evolución por experiencia y habilidades pasivas transversales.',
    membersOrDetails: 'Especies: Morrocoya, Zorro, Dragón, Pingüino y Ajolote.',
    imageUrl: 'https://placehold.co/320x240/2ec4b6/161024?text=Logo+Kaik+Verde',
  },
  {
    id: 'multijugador',
    groupOrTool: 'Grupo Multijugador (Chess College / Ajedrez)',
    roleTag: 'JUEGO MULTIJUGADOR ONLINE',
    description:
      'Implementación del juego de ajedrez estratégico desplegado en la nube e integrado en tiempo real dentro del reproductor de la plataforma.',
    membersOrDetails: 'Despliegue: chesscollege.onrender.com',
    imageUrl: 'https://placehold.co/320x240/e5a93c/161024?text=Logo+Chess+College',
  },
  {
    id: 'cyan',
    groupOrTool: 'Grupo Cyan (Ranked Global, Gacha & Foro)',
    roleTag: 'COMPETITIVO & COMUNIDAD',
    description:
      'Gestión de tablas de clasificación competitiva (Top Ranked), sistema de tiradas Gacha e interacción en foros de discusión.',
    membersOrDetails: 'Módulos de economía compartida y ranking.',
    imageUrl: 'https://placehold.co/320x240/0095ff/ffffff?text=Logo+Grupo+Cyan',
  },
  {
    id: 'blanco',
    groupOrTool: 'Grupo Blanco (Avatar & Pase de Batalla)',
    roleTag: 'IDENTIDAD & PROGRESIÓN',
    description:
      'Sistema de personalización visual del Avatar del jugador, poses animadas y niveles de temporada del Pase de Batalla.',
    membersOrDetails: 'Personalización de perfil y recompensas.',
    imageUrl: 'https://placehold.co/320x240/475569/ffffff?text=Logo+Grupo+Blanco',
  },
];

const TECH_CREDITS: CreditCardItem[] = [
  {
    id: 'ruffle',
    groupOrTool: 'Ruffle Flash Emulator (WebAssembly)',
    roleTag: 'EXTENSIÓN DE EMULACIÓN .SWF',
    description:
      'Motor de código abierto escrito en Rust y compilado a WebAssembly que nos permite ejecutar juegos clásicos de Adobe Flash (.swf) de forma nativa y segura dentro del GameViewer.',
    membersOrDetails: 'Sitio oficial: ruffle.rs • Integrado vía RufflePlayer.tsx',
    imageUrl: 'https://placehold.co/320x240/f48c06/161024?text=Ruffle+Flash+Logo',
  },
  {
    id: 'stack',
    groupOrTool: 'React 18 + TypeScript + Spring Boot 3 + Godot 4',
    roleTag: 'STACK TECNOLÓGICO',
    description:
      'Arquitectura modular de componentes en React con TypeScript en el Frontend, API REST con Java 17 y Spring Boot en el Backend, y motor Godot 4 exportado a HTML5.',
    membersOrDetails: 'Sistemas de Información II • Universidad de Oriente (UDO)',
    imageUrl: 'https://placehold.co/320x240/3c096c/ffffff?text=React+%2B+Spring+%2B+Godot',
  },
];

export const CreditsView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Cabecera de Créditos */}
      <section
        className="tactile-panel"
        style={{
          padding: '22px 26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <span
            style={{
              background: 'var(--primary-mid)',
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: 900,
              padding: '3px 10px',
              borderRadius: '99px',
            }}
          >
            SISTEMAS DE INFORMACIÓN II • UDO
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginTop: '6px' }}>
            CRÉDITOS DE LA PLATAFORMA Y TECNOLOGÍAS
          </h1>
          <p style={{ color: 'var(--text-soft)', fontSize: '0.9rem', marginTop: '4px' }}>
            Conoce a los equipos de desarrollo del salón y las herramientas que dan vida a gamesUDONE.
          </p>
        </div>

        <button
          type="button"
          className="tactile-btn-purple"
          style={{ padding: '10px 20px', fontSize: '0.88rem' }}
          onClick={() => navigate('/')}
        >
          ⬅ Volver al Inicio
        </button>
      </section>

      {/* Sección 1: Equipos del Proyecto */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '14px' }}>
          EQUIPOS DE DESARROLLO
        </h2>
        <div className="credits-cards-grid">
          {TEAM_CREDITS.map((item) => (
            <article key={item.id} className="tactile-panel credit-rectangle-card">
              {/* 70% Izquierda: Arriba el Equipo, Abajo lo que implementó */}
              <div className="credit-card-left-info">
                <div>
                  <span className="credit-role-badge">{item.roleTag}</span>
                  <h3 style={{ fontSize: '1.18rem', fontWeight: 900, marginTop: '6px' }}>
                    {item.groupOrTool}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.86rem',
                      color: 'var(--text-soft)',
                      lineHeight: 1.45,
                      marginTop: '8px',
                    }}
                  >
                    {item.description}
                  </p>
                </div>

                <div className="credit-members-footer">{item.membersOrDetails}</div>
              </div>

              {/* 30% Derecha: Imagen o Logo del Equipo */}
              <div className="credit-card-right-logo">
                <img src={item.imageUrl} alt={item.groupOrTool} />
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Sección 2: Extensiones y Motores Utilizados */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '14px' }}>
          EXTENSIONES, EMULADORES Y HERRAMIENTAS
        </h2>
        <div className="credits-cards-grid">
          {TECH_CREDITS.map((item) => (
            <article key={item.id} className="tactile-panel credit-rectangle-card">
              <div className="credit-card-left-info">
                <div>
                  <span className="credit-role-badge">{item.roleTag}</span>
                  <h3 style={{ fontSize: '1.18rem', fontWeight: 900, marginTop: '6px' }}>
                    {item.groupOrTool}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.86rem',
                      color: 'var(--text-soft)',
                      lineHeight: 1.45,
                      marginTop: '8px',
                    }}
                  >
                    {item.description}
                  </p>
                </div>

                <div className="credit-members-footer">{item.membersOrDetails}</div>
              </div>

              <div className="credit-card-right-logo">
                <img src={item.imageUrl} alt={item.groupOrTool} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};