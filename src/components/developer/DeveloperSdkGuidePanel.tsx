import React, { useState } from 'react';
import { soundManager } from '../../data/audioConfig';

const JS_SNIPPET = `// 1) solicitar anuncio recompensado al contenedor (GameViewerStage)
window.parent.postMessage({ type: 'REQUEST_AD' }, '*');

// 2) escuchar la respuesta (si hay AdBlock, vuelve tras 2s sin congelar el juego)
window.addEventListener('message', (event) => {
  if (event.data?.type === 'AD_RESULT') {
    const completed = Boolean(event.data.completed);
    if (completed) {
      // entregar recompensa extra al jugador
      console.log('Anuncio completado: recompensa otorgada');
    } else {
      // reanudar juego normal sin recompensa extra
      console.log('Anuncio omitido o bloqueado por AdBlock');
    }
  }
});`;

const GODOT_SNIPPET = `# Godot 4 (Export HTML5) - Puente rapido hacia GameViewerStage
extends Node

var _ad_callback = null

func _ready() -> void:
\tif OS.has_feature("web"):
\t\t_ad_callback = JavaScriptBridge.create_callback(_on_window_message)
\t\tvar win = JavaScriptBridge.get_interface("window")
\t\twin.addEventListener("message", _ad_callback)

func request_rewarded_ad() -> void:
\tif OS.has_feature("web"):
\t\tJavaScriptBridge.eval("window.parent.postMessage({ type: 'REQUEST_AD' }, '*');")

func _on_window_message(args) -> void:
\tvar ev = args[0]
\tif ev.data != null and ev.data.type == "AD_RESULT":
\t\tvar completed: bool = bool(ev.data.completed)
\t\tif completed:
\t\t\tprint("Recompensa desbloqueada")
\t\telse:
\t\t\tprint("Reanudar sin recompensa")`;

export const DeveloperSdkGuidePanel: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<'js' | 'godot' | null>(null);

  const copySnippet = (key: 'js' | 'godot', text: string) => {
    soundManager.playClick();
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <section className="dev-wii-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h2 style={{ fontSize: '1.02rem', fontWeight: 700 }}>
          Checklist Tecnico de Subida (Plataforma PC)
        </h2>
        <div className="dev-guide-checklist">
          <div className="dev-guide-item">
            <strong>1. Formatos permitidos:</strong> Builds web HTML5 / Godot empaquetados en <code>.zip</code> (con <code>index.html</code> en la raiz) o archivos Flash <code>.swf</code> compatibles con Ruffle.
          </div>
          <div className="dev-guide-item">
            <strong>2. Restricciones de seguridad:</strong> No se aceptan ejecutables nativos (<code>.exe</code>, <code>.msi</code>, <code>.bat</code>) ni enlaces externos mutables sin control de version en Object Storage.
          </div>
          <div className="dev-guide-item">
            <strong>3. Version congelada:</strong> Cada build aprobado queda inmutable. Para publicar mejoras, sube una nueva version que pasara nuevamente por <code>EN_VERIFICACION</code>.
          </div>
          <div className="dev-guide-item">
            <strong>4. Metricas limpias:</strong> El sistema mide <code>tiempo_activo_seg</code> sin AFK, retencion semanal y likes para el reparto mensual; las impresiones de anuncios no alteran las recomendaciones.
          </div>
        </div>
      </section>

      <section className="dev-wii-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.02rem', fontWeight: 700 }}>
            Protocolo UDONEADSDK (Solo juegos WEB / Godot)
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--dev-text-soft)', marginTop: '4px', lineHeight: 1.45 }}>
            Los juegos Flash (.swf) solo participan en anuncios pre-roll/post-roll del visor. Para juegos HTML5 o Godot Web, nunca interrumpas accion activa: solicita el anuncio solo en menus, fin de nivel o botones de recompensa. Si el jugador tiene AdBlock, el contenedor responde tras 2 segundos para evitar que el juego se congele.
          </p>
        </div>

        <div className="dev-code-card">
          <div className="dev-code-header">
            <span>HTML5 / JavaScript</span>
            <button
              type="button"
              className="dev-mini-link-btn"
              onClick={() => copySnippet('js', JS_SNIPPET)}
            >
              {copiedKey === 'js' ? 'Copiado!' : 'Copiar codigo'}
            </button>
          </div>
          <pre className="dev-code-pre">{JS_SNIPPET}</pre>
        </div>

        <div className="dev-code-card">
          <div className="dev-code-header">
            <span>Godot 4 (GDScript + JavaScriptBridge)</span>
            <button
              type="button"
              className="dev-mini-link-btn"
              onClick={() => copySnippet('godot', GODOT_SNIPPET)}
            >
              {copiedKey === 'godot' ? 'Copiado!' : 'Copiar codigo'}
            </button>
          </div>
          <pre className="dev-code-pre">{GODOT_SNIPPET}</pre>
        </div>
      </section>
    </div>
  );
};