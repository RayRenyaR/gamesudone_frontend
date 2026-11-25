import React, { useState, useRef } from 'react';
import { type CatalogViewMode } from '../../services/catalogLayoutEngine';
import { soundManager } from '../../data/audioConfig';

interface CatalogToolbarProps {
  viewMode: CatalogViewMode;
  categories: string[];
  selectedCategory: string;
  searchQuery: string;
  onlyFavorites: boolean;
  isChatOpen: boolean;
  onSelectCategory: (category: string) => void;
  onSearchChange: (query: string) => void;
  onSwitchViewMode: (nextMode: CatalogViewMode) => void;
  onToggleFavorites: () => void;
}

const renderCategoryIcon = (category: string) => {
  const lower = category.toLowerCase();
  if (lower.includes('acción') || lower.includes('peleas') || lower.includes('disparos')) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    );
  }
  if (lower.includes('puzzle') || lower.includes('estrategia') || lower.includes('lógica')) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    );
  }
  if (lower.includes('2 jugadores') || lower.includes('multijugador')) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
      <rect x="2" y="6" width="20" height="12" rx="3" />
      <path d="M6 12h4m-2-2v4" />
    </svg>
  );
};

export const CatalogToolbar: React.FC<CatalogToolbarProps> = ({
  viewMode,
  categories,
  selectedCategory,
  searchQuery,
  onlyFavorites,
  isChatOpen,
  onSelectCategory,
  onSearchChange,
  onSwitchViewMode,
  onToggleFavorites,
}) => {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState<boolean>(false);

  const handleModeClick = (nextMode: CatalogViewMode) => {
    setIsCategoryMenuOpen(false);
    onSwitchViewMode(nextMode);
  };

  return (
    <footer
      className={`tactile-panel bottom-right-hud-dock ${
        viewMode !== 'graph' ? 'extended-full-bar' : ''
      } ${isChatOpen ? 'shift-for-chat' : ''}`}
    >
      <div className={`hud-left-search-filters ${viewMode !== 'graph' ? 'revealed' : ''}`}>
        <div className="custom-upward-combobox">
          <button
            type="button"
            className={`tactile-btn-dark ${selectedCategory !== 'Todas' ? 'active-state' : ''}`}
            style={{ height: '38px', padding: '0 13px', fontSize: '0.82rem' }}
            onClick={() => {
              soundManager.playClick();
              setIsCategoryMenuOpen((prev) => !prev);
            }}
          >
            {renderCategoryIcon(selectedCategory)}
            <span>{selectedCategory}</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>

          {isCategoryMenuOpen && (
            <div className="custom-upward-menu">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`combobox-option-btn ${selectedCategory === cat ? 'selected' : ''}`}
                  onClick={() => {
                    soundManager.playClick();
                    onSelectCategory(cat);
                    setIsCategoryMenuOpen(false);
                  }}
                >
                  {renderCategoryIcon(cat)}
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`animated-search-pod ${isSearchExpanded ? 'expanded' : 'collapsed'}`}>
          <button
            type="button"
            className="tactile-btn-dark"
            style={{
              border: 'none',
              borderRadius: 0,
              width: '42px',
              height: '38px',
              padding: 0,
              boxShadow: 'none',
              flexShrink: 0,
            }}
            onClick={() => {
              soundManager.playClick();
              setIsSearchExpanded((prev) => {
                const next = !prev;
                if (next) window.setTimeout(() => searchInputRef.current?.focus(), 120);
                else onSearchChange('');
                return next;
              });
            }}
            title="Buscar juego"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {isSearchExpanded && (
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Escribe para buscar..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                outline: 'none',
                padding: '0 10px',
                fontSize: '0.84rem',
              }}
            />
          )}
        </div>
      </div>

      <div className="hud-right-views-wrapper">
        <span className="hud-views-label">VISTAS</span>
        <div className="hud-right-views-subbox">
          <button
            type="button"
            className={`tactile-btn-dark ${viewMode === 'graph' ? 'active-state' : ''}`}
            style={{ width: '38px', height: '36px', padding: 0 }}
            onClick={() => handleModeClick('graph')}
            title="Vista de Grafo Interactivo"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
          </button>

          <button
            type="button"
            className={`tactile-btn-dark ${viewMode === 'mosaic' ? 'active-state' : ''}`}
            style={{ width: '38px', height: '36px', padding: 0 }}
            onClick={() => handleModeClick('mosaic')}
            title="Vista Mosaico"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="3" y="3" width="10" height="10" rx="1" />
              <rect x="16" y="3" width="5" height="10" rx="1" />
              <rect x="3" y="16" width="5" height="5" rx="1" />
              <rect x="11" y="16" width="10" height="5" rx="1" />
            </svg>
          </button>

          <button
            type="button"
            className={`tactile-btn-dark ${viewMode === 'channels' ? 'active-state' : ''}`}
            style={{ width: '38px', height: '36px', padding: 0 }}
            onClick={() => handleModeClick('channels')}
            title="Vista de Canales"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="2" y="4" width="20" height="16" rx="6" />
              <rect x="6" y="8" width="12" height="8" rx="2" />
            </svg>
          </button>

          <button
            type="button"
            className={`tactile-btn-dark ${onlyFavorites ? 'active-state' : ''}`}
            style={{ width: '38px', height: '36px', padding: 0 }}
            onClick={() => {
              soundManager.playClick();
              onToggleFavorites();
            }}
            title="Filtrar Favoritos"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill={onlyFavorites ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
};