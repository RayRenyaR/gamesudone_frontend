import React, { useState, useEffect } from 'react';
import { type BentoSize, slugifyGameAlias } from '../../data/gamesData';
import { soundManager } from '../../data/audioConfig';
import {
  type DeveloperGameRecord,
  type DevGameBuildType,
  saveOrSubmitDeveloperGame,
  transitionDeveloperGameState,
} from '../../data/developerPortalMockService';

interface DeveloperUploadFormProps {
  editingGame: DeveloperGameRecord | null;
  onFinished: () => void;
  onCancelEdit: () => void;
}

type PreviewTab = 'card' | 'wiiu' | 'viewer';

const CATEGORY_OPTIONS = [
  'Acción',
  'Aventura',
  'Carreras',
  'Estrategia',
  'Puzzle',
  'Retro',
  'Casual',
  '2 Jugadores',
];

const AGE_RATINGS = [
  'Para todos (+3)',
  'Niños (+7)',
  'Adolescentes (+12)',
  'Mayores (+16)',
];

const SAMPLE_COVERS = [
  {
    label: 'Arcade Neon',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Cyber Arena',
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Retro Dungeon',
    url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
  },
];

const BLOCKED_EXTENSIONS = ['.exe', '.msi', '.bat', '.cmd', '.sh', '.apk', '.dmg'];

export const DeveloperUploadForm: React.FC<DeveloperUploadFormProps> = ({
  editingGame,
  onFinished,
  onCancelEdit,
}) => {
  const [title, setTitle] = useState<string>('');
  const [alias, setAlias] = useState<string>('');
  const [aliasManuallyEdited, setAliasManuallyEdited] = useState<boolean>(false);
  const [description, setDescription] = useState<string>('');
  const [controls, setControls] = useState<string>('');
  const [categories, setCategories] = useState<string[]>(['Acción']);
  const [ageRating, setAgeRating] = useState<string>(AGE_RATINGS[0]);
  const [tipo, setTipo] = useState<DevGameBuildType>('WEB');
  const [coverUrl, setCoverUrl] = useState<string>(SAMPLE_COVERS[0].url);
  const [previewGifUrl, setPreviewGifUrl] = useState<string>('');
  const [gameUrl, setGameUrl] = useState<string>('');
  const [buildFileName, setBuildFileName] = useState<string>('');
  const [version, setVersion] = useState<string>('1.0.0');
  const [bentoSize, setBentoSize] = useState<BentoSize>('small');
  const [hasRanked, setHasRanked] = useState<boolean>(false);
  //const [mobileCompatible, setMobileCompatible] = useState<boolean>(false);

  const [previewTab, setPreviewTab] = useState<PreviewTab>('card');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // precarga datos cuando se abre en modo edicion desde mis juegos
  useEffect(() => {
    if (editingGame) {
      setTitle(editingGame.title);
      setAlias(editingGame.alias);
      setAliasManuallyEdited(true);
      setDescription(editingGame.description);
      setControls(editingGame.controls);
      setCategories(editingGame.categories);
      setAgeRating(editingGame.ageRating);
      setTipo(editingGame.tipo);
      setCoverUrl(editingGame.coverUrl);
      setPreviewGifUrl(editingGame.previewGifUrl || '');
      setGameUrl(editingGame.gameUrl);
      setBuildFileName(editingGame.buildFileName);
      setVersion(editingGame.version);
      setBentoSize(editingGame.bentoSize);
      setHasRanked(editingGame.hasRanked);
      //setMobileCompatible(editingGame.mobileCompatible);
      setErrorMsg(null);
      return;
    }

    setTitle('');
    setAlias('');
    setAliasManuallyEdited(false);
    setDescription('');
    setControls('');
    setCategories(['Acción']);
    setAgeRating(AGE_RATINGS[0]);
    setTipo('WEB');
    setCoverUrl(SAMPLE_COVERS[0].url);
    setPreviewGifUrl('');
    setGameUrl('');
    setBuildFileName('');
    setVersion('1.0.0');
    setBentoSize('small');
    setHasRanked(false);
    //setMobileCompatible(false);
    setErrorMsg(null);
  }, [editingGame]);

  const handleTitleChange = (nextTitle: string) => {
    setTitle(nextTitle);
    if (!aliasManuallyEdited) {
      setAlias(slugifyGameAlias(nextTitle));
    }
  };

  const toggleCategory = (cat: string) => {
    soundManager.playClick();
    setCategories((prev) => {
      if (prev.includes(cat)) {
        return prev.length > 1 ? prev.filter((c) => c !== cat) : prev;
      }
      return [...prev, cat];
    });
  };

  // valida extension del paquete simulado y bloquea ejecutables nativos
  const handleBuildFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lower = file.name.toLowerCase();
    if (BLOCKED_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
      setErrorMsg(
        'Por seguridad no se aceptan ejecutables (.exe, .msi, .bat). Sube un paquete .zip (Web/Godot) o .swf (Flash).'
      );
      e.target.value = '';
      return;
    }

    if (tipo === 'WEB' && !lower.endsWith('.zip') && !lower.endsWith('.html')) {
      setErrorMsg('Para juegos WEB el paquete debe ser .zip (con index.html en raiz) o .html.');
      e.target.value = '';
      return;
    }

    if (tipo === 'FLASH' && !lower.endsWith('.swf')) {
      setErrorMsg('Para juegos FLASH (Ruffle) el archivo debe tener extension .swf.');
      e.target.value = '';
      return;
    }

    setErrorMsg(null);
    setBuildFileName(file.name);
    const cleanSlug = slugifyGameAlias(alias || title || 'nuevo-juego');
    setGameUrl(
      tipo === 'FLASH'
        ? `/storage/builds/${cleanSlug}/${file.name}`
        : `/storage/builds/${cleanSlug}/index.html`
    );
  };

  const validateForm = (isDraft: boolean): string | null => {
    if (!title.trim()) return 'El titulo del juego es obligatorio.';
    if (isDraft) return null;

    if (description.trim().length < 12) {
      return 'Agrega una descripcion de al menos 12 caracteres.';
    }
    if (!controls.trim()) return 'Especifica los controles basicos del juego.';
    if (!coverUrl.trim()) return 'Indica una URL de portada para el catalogo.';

    const checkFile = (buildFileName || gameUrl).toLowerCase();
    if (!checkFile) {
      return 'Selecciona un archivo de build (.zip o .swf) o indica la ruta de build.';
    }
    if (BLOCKED_EXTENSIONS.some((ext) => checkFile.endsWith(ext))) {
      return 'No se permiten ejecutables nativos (.exe/.msi). Usa builds web o Flash.';
    }
    if (tipo === 'FLASH' && !checkFile.endsWith('.swf')) {
      return 'Un juego tipo FLASH debe apuntar a un archivo .swf.';
    }
    return null;
  };

  const buildPayload = (targetStatus: 'BORRADOR' | 'SUBIENDO') => {
    const finalAlias = slugifyGameAlias(alias || title || 'juego');
    const fallbackBuildName =
      buildFileName.trim() || (tipo === 'FLASH' ? `${finalAlias}.swf` : `${finalAlias}-v${version}.zip`);
    const fallbackGameUrl =
      gameUrl.trim() ||
      (tipo === 'FLASH'
        ? `/storage/builds/${finalAlias}/${fallbackBuildName}`
        : `/storage/builds/${finalAlias}/index.html`);

    return {
      id: editingGame?.id,
      title: title.trim(),
      alias: finalAlias,
      description: description.trim() || 'Borrador sin descripcion aun.',
      controls: controls.trim() || 'Por definir.',
      categories,
      ageRating,
      tipo,
      coverUrl: coverUrl.trim() || SAMPLE_COVERS[0].url,
      previewGifUrl: previewGifUrl.trim() || undefined,
      gameUrl: fallbackGameUrl,
      buildFileName: fallbackBuildName,
      version: version.trim() || '1.0.0',
      bentoSize,
      hasRanked,
      mobileCompatible : false,
      targetStatus,
    };
  };

  const handleSaveDraft = () => {
    const err = validateForm(true);
    if (err) {
      setErrorMsg(err);
      return;
    }
    setErrorMsg(null);
    soundManager.playClick();
    saveOrSubmitDeveloperGame(buildPayload('BORRADOR'));
    onFinished();
  };

  // simula la transicion SUBIENDO -> EN_VERIFICACION con barra de progreso
  const handleSubmitForReview = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateForm(false);
    if (err) {
      setErrorMsg(err);
      return;
    }

    setErrorMsg(null);
    soundManager.playOpen();
    const saved = saveOrSubmitDeveloperGame(buildPayload('SUBIENDO'));
    setUploadProgress(15);

    window.setTimeout(() => setUploadProgress(58), 320);
    window.setTimeout(() => setUploadProgress(92), 700);
    window.setTimeout(() => {
      transitionDeveloperGameState(saved.id, 'EN_VERIFICACION');
      setUploadProgress(null);
      onFinished();
    }, 1100);
  };

  const displayTitle = title.trim() || 'Titulo de tu Juego';
  const displayAlias = slugifyGameAlias(alias || title || 'mi-juego');
  const displayCover = coverUrl.trim() || SAMPLE_COVERS[0].url;
  const isUploading = uploadProgress !== null;

  return (
    <div className="dev-upload-grid">
      <form className="dev-wii-panel dev-form-stack" onSubmit={handleSubmitForReview}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '1.02rem', fontWeight: 700 }}>
              {editingGame ? `Editando: ${editingGame.title}` : 'Datos del Juego'}
            </h2>
            <p style={{ fontSize: '0.76rem', color: 'var(--dev-text-soft)' }}>
              Completa la ficha y valida el empaquetado antes de enviar a verificacion.
            </p>
          </div>
          {editingGame && (
            <button type="button" className="dev-secondary-btn" onClick={onCancelEdit}>
              Cancelar edicion
            </button>
          )}
        </div>

        {editingGame?.status === 'RECHAZADO' && editingGame.rejectionReason && (
          <div className="dev-alert-box dev-alert-danger">
            <strong>Motivo de rechazo anterior:</strong> {editingGame.rejectionReason}
          </div>
        )}

        {errorMsg && <div className="dev-alert-box dev-alert-danger">{errorMsg}</div>}

        <div className="dev-form-row-2">
          <label className="dev-field">
            <span>Titulo del juego *</span>
            <input
              type="text"
              className="dev-input"
              placeholder="Ej. Neo Margarita Runners"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              disabled={isUploading}
            />
          </label>

          <label className="dev-field">
            <span>Alias compartible (/juego/:alias)</span>
            <input
              type="text"
              className="dev-input"
              placeholder="neo-margarita-runners"
              value={alias}
              onChange={(e) => {
                setAliasManuallyEdited(true);
                setAlias(e.target.value);
              }}
              disabled={isUploading}
            />
          </label>
        </div>

        <label className="dev-field">
          <span>Descripcion *</span>
          <textarea
            className="dev-textarea"
            rows={3}
            placeholder="De que trata el juego, objetivo principal y detalles clave..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isUploading}
          />
        </label>

        <label className="dev-field">
          <span>Controles *</span>
          <input
            type="text"
            className="dev-input"
            placeholder="Ej. WASD para moverse, Espacio para saltar, Mouse para apuntar"
            value={controls}
            onChange={(e) => setControls(e.target.value)}
            disabled={isUploading}
          />
        </label>

        <div className="dev-field">
          <span>Categorias (selecciona al menos una)</span>
          <div className="dev-chip-wrap">
            {CATEGORY_OPTIONS.map((cat) => {
              const selected = categories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  className={`dev-chip-btn ${selected ? 'selected' : ''}`}
                  onClick={() => toggleCategory(cat)}
                  disabled={isUploading}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <div className="dev-form-row-3">
          <label className="dev-field">
            <span>Tipo de build</span>
            <select
              className="dev-input"
              value={tipo}
              onChange={(e) => {
                const nextType = e.target.value as DevGameBuildType;
                setTipo(nextType);
                setErrorMsg(null);
              }}
              disabled={isUploading}
            >
              <option value="WEB">WEB (HTML5 / Godot .zip)</option>
              <option value="FLASH">FLASH (Ruffle .swf)</option>
            </select>
          </label>

          <label className="dev-field">
            <span>Clasificacion de edad</span>
            <select
              className="dev-input"
              value={ageRating}
              onChange={(e) => setAgeRating(e.target.value)}
              disabled={isUploading}
            >
              {AGE_RATINGS.map((rating) => (
                <option key={rating} value={rating}>
                  {rating}
                </option>
              ))}
            </select>
          </label>

          <label className="dev-field">
            <span>Version / Tamano Bento</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="dev-input"
                style={{ width: '90px' }}
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0.0"
                disabled={isUploading}
              />
              <select
                className="dev-input"
                value={bentoSize}
                onChange={(e) => setBentoSize(e.target.value as BentoSize)}
                disabled={isUploading}
              >
                <option value="small">Small</option>
                <option value="wide">Wide</option>
                <option value="tall">Tall</option>
                <option value="large">Large</option>
              </select>
            </div>
          </label>
        </div>

        <div className="dev-form-row-2">
          <label className="dev-field">
            <span>URL de portada *</span>
            <input
              type="text"
              className="dev-input"
              placeholder="https://..."
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              disabled={isUploading}
            />
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
              {SAMPLE_COVERS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className="dev-mini-link-btn"
                  onClick={() => setCoverUrl(preset.url)}
                >
                  Usar {preset.label}
                </button>
              ))}
            </div>
          </label>

          <label className="dev-field">
            <span>URL de GIF animado (opcional)</span>
            <input
              type="text"
              className="dev-input"
              placeholder="https://.../preview.gif"
              value={previewGifUrl}
              onChange={(e) => setPreviewGifUrl(e.target.value)}
              disabled={isUploading}
            />
          </label>
        </div>

        {/* seleccion simulada del paquete para object storage */}
        <div className="dev-build-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 700 }}>
                Paquete del Juego ({tipo === 'FLASH' ? 'Archivo .swf' : 'Archivo .zip con index.html'})
              </div>
              <div style={{ fontSize: '0.73rem', color: 'var(--dev-text-soft)' }}>
                Se subira al Object Storage (R2/Supabase) y se congelara al aprobar. No se permiten .exe.
              </div>
            </div>

            <label className="dev-secondary-btn" style={{ cursor: 'pointer' }}>
              Seleccionar archivo
              <input
                type="file"
                accept={tipo === 'FLASH' ? '.swf' : '.zip,.html'}
                onChange={handleBuildFilePick}
                style={{ display: 'none' }}
                disabled={isUploading}
              />
            </label>
          </div>

          <div className="dev-form-row-2" style={{ marginTop: '10px' }}>
            <input
              type="text"
              className="dev-input"
              placeholder={tipo === 'FLASH' ? 'mi-juego.swf' : 'mi-juego-v1.zip'}
              value={buildFileName}
              onChange={(e) => setBuildFileName(e.target.value)}
              disabled={isUploading}
            />
            <input
              type="text"
              className="dev-input"
              placeholder="/storage/builds/mi-juego/index.html"
              value={gameUrl}
              onChange={(e) => setGameUrl(e.target.value)}
              disabled={isUploading}
            />
          </div>
        </div>

        <div className="dev-check-row">
       <label className="dev-checkbox-label">
         <input
           type="checkbox"
           checked={hasRanked}
           onChange={(e) => setHasRanked(e.target.checked)}
           disabled={isUploading}
         />
         <span>Incluye tabla de puntajes (Ranked)</span>
       </label>
     </div>

        {isUploading && (
          <div className="dev-upload-progress-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <span>Estado: SUBIENDO paquete al almacenamiento...</span>
              <strong>{uploadProgress}%</strong>
            </div>
            <div className="dev-bar-track">
              <div className="dev-bar-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap', paddingTop: '6px' }}>
          <button
            type="button"
            className="dev-secondary-btn"
            onClick={handleSaveDraft}
            disabled={isUploading}
          >
            Guardar como Borrador
          </button>
          <button type="submit" className="dev-primary-btn" disabled={isUploading}>
            {isUploading ? 'Subiendo...' : 'Enviar a Verificacion'}
          </button>
        </div>
      </form>

      {/* columna derecha: live preview en tiempo real */}
      <aside className="dev-wii-panel dev-preview-column">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ fontSize: '0.96rem', fontWeight: 700 }}>Live Preview</h2>
          <span style={{ fontSize: '0.72rem', color: 'var(--dev-border-bright)' }}>
            /juego/{displayAlias}
          </span>
        </div>

        <div className="dev-preview-tabs">
          <button
            type="button"
            className={`dev-chip-btn ${previewTab === 'card' ? 'selected' : ''}`}
            onClick={() => setPreviewTab('card')}
          >
            Bento / Grafo
          </button>
          <button
            type="button"
            className={`dev-chip-btn ${previewTab === 'wiiu' ? 'selected' : ''}`}
            onClick={() => setPreviewTab('wiiu')}
          >
            Canal Wii U
          </button>
          <button
            type="button"
            className={`dev-chip-btn ${previewTab === 'viewer' ? 'selected' : ''}`}
            onClick={() => setPreviewTab('viewer')}
          >
            Ficha Visor
          </button>
        </div>

        <div className="dev-preview-stage">
          {previewTab === 'card' && (
            <div className="dev-mock-bevel-card">
              <img src={displayCover} alt={displayTitle} />
              <div className="dev-mock-card-overlay">
                <div style={{ display: 'flex', gap: '5px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span className="dev-preview-pill">{tipo}</span>
                  {hasRanked && <span className="dev-preview-pill">RANKED</span>}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.96rem' }}>{displayTitle}</div>
                <div style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>
                  {categories.join(' • ')}
                </div>
              </div>
            </div>
          )}

          {previewTab === 'wiiu' && (
            <div className="dev-mock-wiiu-tile">
              <div className="dev-mock-wiiu-screen">
                <img src={displayCover} alt={displayTitle} />
              </div>
              <div style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.86rem', marginTop: '6px' }}>
                {displayTitle}
              </div>
            </div>
          )}

          {previewTab === 'viewer' && (
            <div className="dev-mock-viewer-card">
              <div className="dev-mock-viewer-banner">
                <img src={displayCover} alt={displayTitle} />
                <div className="dev-mock-viewer-play">JUGAR AHORA</div>
              </div>
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '0.95rem' }}>{displayTitle}</strong>
                  <span className="dev-preview-pill">{ageRating}</span>
                </div>
                <p style={{ fontSize: '0.76rem', color: 'var(--dev-text-soft)', lineHeight: 1.4 }}>
                  {description.trim() || 'Tu descripcion aparecera aqui antes de iniciar la partida.'}
                </p>
                <div style={{ fontSize: '0.73rem', color: '#94a3b8' }}>
                  <strong>Controles:</strong> {controls.trim() || 'Sin definir'}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                  <span className="dev-preview-pill">{tipo}</span>
                  <span className="dev-preview-pill">
                    
                  </span>
                  {hasRanked && <span className="dev-preview-pill">Tabla Ranked</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="dev-preview-checklist">
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--dev-text-soft)' }}>
            Resumen rapido del envio
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--dev-text-dim)' }}>
            • Archivo: <strong style={{ color: 'var(--dev-text-main)' }}>{buildFileName || 'Pendiente'}</strong>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--dev-text-dim)' }}>
            • Anuncios in-game:{' '}
            <strong style={{ color: 'var(--dev-text-main)' }}>
              {tipo === 'WEB' ? 'Compatible con UDONEADSDK' : 'Solo pre/post-roll (Flash)'}
            </strong>
          </div>
        </div>
      </aside>
    </div>
  );
};