import React, { useState, useEffect, useRef } from 'react';
import { Screen, ContrastMode, AccessibilitySettings } from '../types';
import { useAnnouncer } from './LiveAnnouncer';
import {
  speakSpanish,
  stopSpeech,
  isSpeaking,
  getPageSpeechText,
  isVoiceNavigationEnabled,
  setVoiceNavigationEnabled,
  VOICE_STATE_CHANGE_EVENT,
} from '../utils/speech';

const STORAGE_KEY = 'softtech_a11y_settings';

const DEFAULT_SETTINGS: AccessibilitySettings = {
  contrast: 'normal',
  highlightLinks: false,
  fontSize: 100,
  textSpacing: false,
  hideImages: false,
  stopAnimations: false,
  largeCursor: false,
};

interface AccessibilityWidgetProps {
  currentScreen: Screen;
  cartCount?: number;
  isHighContrast: boolean;
  onToggleHighContrast: (mode?: ContrastMode) => void;
  fontSizePercentage: number;
  onChangeFontSize: (size: 100 | 120 | 140) => void;
}

export const AccessibilityWidget: React.FC<AccessibilityWidgetProps> = ({
  currentScreen,
  cartCount = 0,
  isHighContrast,
  onToggleHighContrast,
  fontSizePercentage,
  onChangeFontSize,
}) => {
  const { announce } = useAnnouncer();
  const [isOpen, setIsOpen] = useState(false);
  const [isReadingAudio, setIsReadingAudio] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(() => isVoiceNavigationEnabled());

  // Listen to external voice state changes (e.g. from key shortcuts or other components)
  useEffect(() => {
    const onVoiceStateChange = (e: Event) => {
      const custom = e as CustomEvent<{ enabled: boolean }>;
      if (custom.detail !== undefined) {
        setIsVoiceActive(custom.detail.enabled);
      } else {
        setIsVoiceActive(isVoiceNavigationEnabled());
      }
    };
    window.addEventListener(VOICE_STATE_CHANGE_EVENT, onVoiceStateChange);
    return () => window.removeEventListener(VOICE_STATE_CHANGE_EVENT, onVoiceStateChange);
  }, []);

  // Widget settings
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          contrast: isHighContrast ? 'inverse' : (parsed.contrast || 'normal'),
        };
      }
    } catch (e) {
      console.error('Error reading a11y settings from localStorage', e);
    }
    return {
      ...DEFAULT_SETTINGS,
      contrast: isHighContrast ? 'inverse' : 'normal',
    };
  });

  const panelRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  // Keep contrast in sync with parent header toggle
  useEffect(() => {
    if (isHighContrast && settings.contrast !== 'inverse') {
      setSettings((prev) => ({ ...prev, contrast: 'inverse' }));
    } else if (!isHighContrast && settings.contrast === 'inverse') {
      setSettings((prev) => ({ ...prev, contrast: 'normal' }));
    }
  }, [isHighContrast]);

  // Apply CSS classes to document.body and document.documentElement
  useEffect(() => {
    // 1. Contrast modes
    if (settings.contrast === 'inverse') {
      document.body.classList.add('high-contrast-mode');
      document.body.classList.remove('grayscale-mode');
    } else if (settings.contrast === 'grayscale') {
      document.body.classList.remove('high-contrast-mode');
      document.body.classList.add('grayscale-mode');
    } else {
      document.body.classList.remove('high-contrast-mode');
      document.body.classList.remove('grayscale-mode');
    }

    // 2. Highlight links
    if (settings.highlightLinks) {
      document.body.classList.add('highlight-links-mode');
    } else {
      document.body.classList.remove('highlight-links-mode');
    }

    // 3. Font Size
    document.documentElement.style.fontSize = `${settings.fontSize}%`;

    // 4. Dyslexia Spacing
    if (settings.textSpacing) {
      document.body.classList.add('dyslexia-spacing-mode');
    } else {
      document.body.classList.remove('dyslexia-spacing-mode');
    }

    // 5. Hide images
    if (settings.hideImages) {
      document.body.classList.add('hide-images-mode');
    } else {
      document.body.classList.remove('hide-images-mode');
    }

    // 6. Stop animations
    if (settings.stopAnimations) {
      document.body.classList.add('stop-animations-mode');
    } else {
      document.body.classList.remove('stop-animations-mode');
    }

    // 7. Large cursor
    if (settings.largeCursor) {
      document.body.classList.add('large-cursor-mode');
    } else {
      document.body.classList.remove('large-cursor-mode');
    }

    // Persist to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving a11y settings to localStorage', e);
    }
  }, [settings]);

  // Global keyboard shortcuts: CTRL + U or ALT + A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+U or Alt+A (case-insensitive)
      const isCtrlU = (e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U');
      const isAltA = e.altKey && (e.key === 'a' || e.key === 'A');

      if (isCtrlU || isAltA) {
        e.preventDefault();
        const next = !isOpen;
        setIsOpen(next);
        announce(
          next
            ? 'Menú de accesibilidad abierto. Navega con el tabulador.'
            : 'Menú de accesibilidad cerrado.'
        );
      } else if (e.key === 'Escape' || e.code === 'Escape') {
        // Immediate silence shortcut with ESC key: instantly cancel speech in progress
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        setIsReadingAudio(false);
        if (isOpen) {
          e.preventDefault();
          setIsOpen(false);
          announce('Menú de accesibilidad cerrado.');
          triggerButtonRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, announce]);

  // Close when clicking outside panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        triggerButtonRef.current &&
        !triggerButtonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Count how many non-default tools are active
  const activeCount = [
    settings.contrast !== 'normal',
    settings.highlightLinks,
    settings.fontSize !== 100,
    settings.textSpacing,
    settings.hideImages,
    settings.stopAnimations,
    settings.largeCursor,
    !isVoiceActive,
  ].filter(Boolean).length;

  // Tool 1: Contraste + (Normal -> Inverso -> Grayscale -> Normal)
  const handleToggleContrast = () => {
    let nextMode: ContrastMode = 'normal';
    if (settings.contrast === 'normal') {
      nextMode = 'inverse';
      announce('Modo de contraste: Alto Contraste Inverso activado.');
      onToggleHighContrast('inverse');
    } else if (settings.contrast === 'inverse') {
      nextMode = 'grayscale';
      announce('Modo de contraste: Escala de Grises activada.');
      onToggleHighContrast('grayscale');
    } else {
      nextMode = 'normal';
      announce('Modo de contraste: Vista Normal restablecida.');
      onToggleHighContrast('normal');
    }

    setSettings((prev) => ({ ...prev, contrast: nextMode }));
  };

  // Tool 2: Resaltar Enlaces
  const handleToggleHighlightLinks = () => {
    const next = !settings.highlightLinks;
    setSettings((prev) => ({ ...prev, highlightLinks: next }));
    announce(
      next
        ? 'Resaltar enlaces y botones interactivos activado con fondo amarillo y subrayado.'
        : 'Resaltado de enlaces desactivado.'
    );
  };

  // Tool 3: Agrandar Texto (100% -> 120% -> 140% -> 100%)
  const handleCycleFontSize = () => {
    let nextSize: 100 | 120 | 140 = 100;
    if (settings.fontSize === 100) nextSize = 120;
    else if (settings.fontSize === 120) nextSize = 140;
    else nextSize = 100;

    setSettings((prev) => ({ ...prev, fontSize: nextSize }));
    onChangeFontSize(nextSize);
    announce(`Tamaño de fuente ajustado a ${nextSize} por ciento.`);
  };

  // Tool 4: Espaciado de Texto (Dyslexia-friendly)
  const handleToggleTextSpacing = () => {
    const next = !settings.textSpacing;
    setSettings((prev) => ({ ...prev, textSpacing: next }));
    announce(
      next
        ? 'Espaciado aumentado de texto activado para facilitar la lectura.'
        : 'Espaciado normal de texto restablecido.'
    );
  };

  // Tool 5: Interruptor de Voz / Audio (Toggle Mute ON / OFF)
  const handleToggleVoice = () => {
    const nextState = !isVoiceActive;
    setVoiceNavigationEnabled(nextState);
    setIsVoiceActive(nextState);
    setIsReadingAudio(false);

    if (!nextState) {
      // OFF: immediately stop any speech in progress and disable automatic navigation audio
      stopSpeech();
      announce('Voz y lector de navegación silenciado y desactivado. Las lecturas automáticas están deshabilitadas.');
    } else {
      // ON: resume normal auditory navigation assistance
      announce('Voz y lector de navegación activado. Asistencia auditiva en español reanudada.');
      speakSpanish('Voz activada.', { force: true });
    }
  };

  // Tool 6: Ocultar Imágenes
  const handleToggleHideImages = () => {
    const next = !settings.hideImages;
    setSettings((prev) => ({ ...prev, hideImages: next }));
    announce(
      next
        ? 'Imágenes ocultadas para evitar distracciones o sobrecarga visual.'
        : 'Imágenes visibles nuevamente.'
    );
  };

  // Tool 7: Detener Animaciones
  const handleToggleStopAnimations = () => {
    const next = !settings.stopAnimations;
    setSettings((prev) => ({ ...prev, stopAnimations: next }));
    announce(
      next
        ? 'Animaciones y transiciones detenidas.'
        : 'Animaciones y transiciones reactivadas.'
    );
  };

  // Tool 8: Cursor Grande
  const handleToggleLargeCursor = () => {
    const next = !settings.largeCursor;
    setSettings((prev) => ({ ...prev, largeCursor: next }));
    announce(
      next
        ? 'Cursor de mouse grande de alta visibilidad activado.'
        : 'Cursor de mouse estándar restablecido.'
    );
  };

  // Reset all
  const handleResetAll = () => {
    stopSpeech();
    setIsReadingAudio(false);
    setVoiceNavigationEnabled(true);
    setIsVoiceActive(true);
    setSettings(DEFAULT_SETTINGS);
    onToggleHighContrast('normal');
    onChangeFontSize(100);
    announce('Todas las herramientas de accesibilidad han sido restablecidas a sus valores iniciales.');
  };

  return (
    <aside
      aria-label="Herramientas de Accesibilidad Flotantes"
      className="a11y-widget-exempt a11y-exempt"
    >
      {/* Floating Activation Button */}
      <button
        ref={triggerButtonRef}
        id="btn-floating-a11y-trigger"
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          announce(
            !isOpen
              ? 'Menú de accesibilidad desplegado.'
              : 'Menú de accesibilidad cerrado.'
          );
        }}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls="a11y-tools-panel"
        aria-label={`Menú de Accesibilidad Universal. ${
          activeCount > 0 ? `${activeCount} herramientas activas.` : ''
        } Atajo de teclado: Control + U o Alt + A.`}
        data-speech="Botón: Menú de Accesibilidad Universal, configurar opciones asistivas"
        title="Menú de Accesibilidad (Atajo: Ctrl + U o Alt + A)"
        style={{
          backgroundColor: '#000000',
          border: '3px solid #00FFFF',
          boxShadow: '0 0 20px rgba(0, 255, 255, 0.6), 0 8px 24px rgba(0, 0, 0, 0.8)',
        }}
        className="a11y-exempt fixed bottom-6 right-6 z-50 w-14 h-14 sm:w-16 sm:h-16 rounded-full active:scale-95 text-[#00FFFF] flex items-center justify-center cursor-pointer transition-transform duration-200 focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#00FFFF] focus-visible:outline-offset-2"
      >
        <span className="material-symbols-outlined text-[32px] sm:text-[36px] leading-none pointer-events-none text-[#00FFFF]">
          accessibility_new
        </span>

        {/* Active badge indicator */}
        {activeCount > 0 && (
          <span
            style={{
              backgroundColor: '#00FFFF',
              color: '#000000',
              border: '2px solid #FFFFFF',
              boxShadow: '0 0 10px #00FFFF',
            }}
            className="absolute -top-1 -right-1 min-w-[24px] h-[24px] px-1.5 text-[12px] font-black rounded-full flex items-center justify-center animate-pulse"
            aria-hidden="true"
          >
            {activeCount}
          </span>
        )}
      </button>

      {/* Floating Dropdown / Tools Modal */}
      {isOpen && (
        <div
          id="a11y-tools-panel"
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby="a11y-panel-title"
          style={{
            backgroundColor: '#000000',
            border: '3px solid #00FFFF',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 0 35px rgba(0, 255, 255, 0.4), 0 20px 40px rgba(0, 0, 0, 0.95)',
            top: '10%',
            right: '24px',
            maxHeight: '80vh',
          }}
          className="a11y-widget-exempt a11y-exempt fixed z-50 w-[calc(100vw-48px)] sm:w-[410px] flex flex-col text-white animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: '#0A0A0A',
              borderBottom: '2px solid #00FFFF',
            }}
            className="px-5 py-3.5 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div
                style={{
                  backgroundColor: '#000000',
                  border: '2px solid #00FFFF',
                  boxShadow: '0 0 10px rgba(0,255,255,0.4)',
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[22px] text-[#00FFFF]">
                  accessibility_new
                </span>
              </div>
              <div>
                <h2 id="a11y-panel-title" className="text-base font-black leading-tight text-white tracking-wide">
                  ACCESIBILIDAD UNIVERSAL
                </h2>
                <p className="text-[11px] text-[#00FFFF] font-bold tracking-wider uppercase">
                  Estándares WCAG 2.1 AAA
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                announce('Menú de accesibilidad cerrado.');
                triggerButtonRef.current?.focus();
              }}
              aria-label="Cerrar panel de accesibilidad"
              style={{
                backgroundColor: '#1E293B',
                border: '1px solid #475569',
              }}
              className="a11y-exempt w-8 h-8 rounded-lg hover:bg-red-600 hover:text-white text-slate-300 flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00FFFF] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Subheader / Quick Shortcut Info */}
          <div
            style={{
              backgroundColor: '#111827',
              borderBottom: '1px solid #1F2937',
            }}
            className="px-4 py-2 flex items-center justify-between text-xs text-slate-200"
          >
            <span className="flex items-center gap-1.5 font-bold text-[#E2E8F0]">
              <span className="material-symbols-outlined text-[16px] text-[#00FFFF]">keyboard</span>
              Atajo: <kbd className="px-1.5 py-0.5 bg-black text-[#00FFFF] border border-[#00FFFF]/50 rounded font-mono text-[10px] font-bold">Ctrl+U</kbd> o <kbd className="px-1.5 py-0.5 bg-black text-[#00FFFF] border border-[#00FFFF]/50 rounded font-mono text-[10px] font-bold">Alt+A</kbd>
            </span>
            <span
              style={{
                backgroundColor: activeCount > 0 ? '#00FFFF' : '#374151',
                color: activeCount > 0 ? '#000000' : '#E5E7EB',
              }}
              className="text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider"
            >
              {activeCount} activo{activeCount !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Grid of Interactive Accessibility Tools */}
          <div
            style={{ backgroundColor: '#000000' }}
            className="p-3 sm:p-4 overflow-y-auto flex-1 min-h-0"
          >
            <div className="grid grid-cols-2 gap-3">
              {/* Tool 1: Contraste + (Amarillo Neón #EAB308 con texto negro) */}
              {(() => {
                const isActive = settings.contrast !== 'normal';
                return (
                  <button
                    type="button"
                    onClick={handleToggleContrast}
                    aria-label={`Contraste. Modo actual: ${
                      settings.contrast === 'normal'
                        ? 'Normal'
                        : settings.contrast === 'inverse'
                        ? 'Alto Contraste Inverso (Negro y Amarillo)'
                        : 'Escala de Grises'
                    }. Presiona para cambiar.`}
                    style={{
                      backgroundColor: '#EAB308',
                      color: '#000000',
                      outline: isActive ? '3px solid #FFFFFF' : 'none',
                      boxShadow: isActive ? '0 0 16px #FFFFFF, inset 0 0 8px rgba(0,0,0,0.2)' : '0 4px 6px rgba(0,0,0,0.3)',
                    }}
                    className="a11y-exempt p-3.5 rounded-xl font-bold flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer hover:brightness-110 active:scale-95 focus-visible:outline focus-visible:outline-4 focus-visible:outline-white"
                  >
                    <span className="material-symbols-outlined text-[28px] font-bold text-black pointer-events-none">
                      contrast
                    </span>
                    <span className="text-xs font-black leading-tight text-black">
                      Contraste +
                    </span>
                    <span
                      style={{
                        backgroundColor: isActive ? '#000000' : '#CA8A04',
                        color: isActive ? '#FFFFFF' : '#000000',
                        border: isActive ? '2px solid #FFFFFF' : 'none',
                      }}
                      className="text-[11px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider transition-all"
                    >
                      {isActive ? '¡ACTIVADO!' : 'Normal'}
                    </span>
                  </button>
                );
              })()}

              {/* Tool 2: Resaltar Enlaces (Azul Neón #2563EB con texto blanco) */}
              {(() => {
                const isActive = settings.highlightLinks;
                return (
                  <button
                    type="button"
                    onClick={handleToggleHighlightLinks}
                    aria-pressed={isActive}
                    aria-label={`Resaltar Enlaces. Actualmente ${isActive ? 'activado' : 'desactivado'}.`}
                    style={{
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      outline: isActive ? '3px solid #FFFFFF' : 'none',
                      boxShadow: isActive ? '0 0 16px #FFFFFF, inset 0 0 8px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.3)',
                    }}
                    className="a11y-exempt p-3.5 rounded-xl font-bold flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer hover:brightness-110 active:scale-95 focus-visible:outline focus-visible:outline-4 focus-visible:outline-white"
                  >
                    <span className="material-symbols-outlined text-[28px] font-bold text-white pointer-events-none">
                      link
                    </span>
                    <span className="text-xs font-black leading-tight text-white">
                      Resaltar Enlaces
                    </span>
                    <span
                      style={{
                        backgroundColor: isActive ? '#FFFFFF' : '#1D4ED8',
                        color: isActive ? '#000000' : '#FFFFFF',
                        border: isActive ? '2px solid #FFFFFF' : 'none',
                      }}
                      className="text-[11px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider transition-all"
                    >
                      {isActive ? '¡ACTIVADO!' : 'Inactivo'}
                    </span>
                  </button>
                );
              })()}

              {/* Tool 3: Agrandar Texto (Verde Neón #22C55E con texto negro) */}
              {(() => {
                const isActive = settings.fontSize > 100;
                return (
                  <button
                    type="button"
                    onClick={handleCycleFontSize}
                    aria-label={`Agrandar Texto. Tamaño actual: ${settings.fontSize} por ciento. Presiona para alternar.`}
                    style={{
                      backgroundColor: '#22C55E',
                      color: '#000000',
                      outline: isActive ? '3px solid #FFFFFF' : 'none',
                      boxShadow: isActive ? '0 0 16px #FFFFFF, inset 0 0 8px rgba(0,0,0,0.2)' : '0 4px 6px rgba(0,0,0,0.3)',
                    }}
                    className="a11y-exempt p-3.5 rounded-xl font-bold flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer hover:brightness-110 active:scale-95 focus-visible:outline focus-visible:outline-4 focus-visible:outline-white"
                  >
                    <span className="material-symbols-outlined text-[28px] font-bold text-black pointer-events-none">
                      format_size
                    </span>
                    <span className="text-xs font-black leading-tight text-black">
                      Agrandar Texto
                    </span>
                    <span
                      style={{
                        backgroundColor: isActive ? '#000000' : '#16A34A',
                        color: isActive ? '#FFFFFF' : '#000000',
                        border: isActive ? '2px solid #FFFFFF' : 'none',
                      }}
                      className="text-[11px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider transition-all"
                    >
                      {isActive ? '¡ACTIVADO!' : `${settings.fontSize}%`}
                    </span>
                  </button>
                );
              })()}

              {/* Tool 4: Espaciado de Texto (Morado Vívido #A855F7 con texto blanco) */}
              {(() => {
                const isActive = settings.textSpacing;
                return (
                  <button
                    type="button"
                    onClick={handleToggleTextSpacing}
                    aria-pressed={isActive}
                    aria-label={`Espaciado de Texto para dislexia. Actualmente ${isActive ? 'activado' : 'normal'}.`}
                    style={{
                      backgroundColor: '#A855F7',
                      color: '#FFFFFF',
                      outline: isActive ? '3px solid #FFFFFF' : 'none',
                      boxShadow: isActive ? '0 0 16px #FFFFFF, inset 0 0 8px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.3)',
                    }}
                    className="a11y-exempt p-3.5 rounded-xl font-bold flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer hover:brightness-110 active:scale-95 focus-visible:outline focus-visible:outline-4 focus-visible:outline-white"
                  >
                    <span className="material-symbols-outlined text-[28px] font-bold text-white pointer-events-none">
                      format_line_spacing
                    </span>
                    <span className="text-xs font-black leading-tight text-white">
                      Espaciado Texto
                    </span>
                    <span
                      style={{
                        backgroundColor: isActive ? '#FFFFFF' : '#9333EA',
                        color: isActive ? '#000000' : '#FFFFFF',
                        border: isActive ? '2px solid #FFFFFF' : 'none',
                      }}
                      className="text-[11px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider transition-all"
                    >
                      {isActive ? '¡ACTIVADO!' : 'Normal'}
                    </span>
                  </button>
                );
              })()}

              {/* Tool 5: Interruptor de Voz / Audio (Toggle Mute ON / OFF) */}
              {(() => {
                const isActive = isVoiceActive;
                return (
                  <button
                    id="btn-a11y-voice-toggle"
                    type="button"
                    onClick={handleToggleVoice}
                    aria-pressed={isActive}
                    aria-label={`Interruptor de Lector de Voz. Actualmente ${isActive ? 'ACTIVADO (ON)' : 'SILENCIADO (OFF)'}. Presiona para ${isActive ? 'silenciar y apagar la voz' : 'activar y reanudar la voz'}.`}
                    data-speech={`Botón: Interruptor de Lector de Voz. Actualmente ${isActive ? 'activado' : 'silenciado'}. Presiona para ${isActive ? 'silenciar' : 'activar'}.`}
                    style={{
                      backgroundColor: isActive ? '#059669' : '#1E293B',
                      color: '#FFFFFF',
                      outline: isActive ? '3px solid #FFFFFF' : '3px solid #EF4444',
                      boxShadow: isActive
                        ? '0 0 16px rgba(52, 211, 153, 0.5), inset 0 0 8px rgba(0,0,0,0.3)'
                        : '0 0 16px rgba(239, 68, 68, 0.6), inset 0 0 8px rgba(0,0,0,0.4)',
                    }}
                    className="a11y-exempt p-3.5 rounded-xl font-bold flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer hover:brightness-110 active:scale-95 focus-visible:outline focus-visible:outline-4 focus-visible:outline-white"
                  >
                    <span className="material-symbols-outlined text-[28px] font-bold text-white pointer-events-none">
                      {isActive ? 'volume_up' : 'volume_off'}
                    </span>
                    <span className="text-xs font-black leading-tight text-white">
                      {isActive ? 'Lector de Voz' : 'Voz: Silenciada'}
                    </span>
                    <span
                      style={{
                        backgroundColor: isActive ? '#000000' : '#DC2626',
                        color: isActive ? '#34D399' : '#FFFFFF',
                        border: isActive ? '2px solid #34D399' : '2px solid #FFFFFF',
                      }}
                      className="text-[11px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider transition-all flex items-center gap-1"
                    >
                      <span>{isActive ? '🔊' : '🔇'}</span>
                      <span>{isActive ? 'ACTIVADA' : 'SILENCIADA'}</span>
                    </span>
                  </button>
                );
              })()}

              {/* Tool 6: Ocultar Imágenes (Rosa Neón #EC4899 con texto blanco) */}
              {(() => {
                const isActive = settings.hideImages;
                return (
                  <button
                    type="button"
                    onClick={handleToggleHideImages}
                    aria-pressed={isActive}
                    aria-label={`Ocultar Imágenes decorativas. Actualmente ${isActive ? 'ocultas' : 'visibles'}.`}
                    style={{
                      backgroundColor: '#EC4899',
                      color: '#FFFFFF',
                      outline: isActive ? '3px solid #FFFFFF' : 'none',
                      boxShadow: isActive ? '0 0 16px #FFFFFF, inset 0 0 8px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.3)',
                    }}
                    className="a11y-exempt p-3.5 rounded-xl font-bold flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer hover:brightness-110 active:scale-95 focus-visible:outline focus-visible:outline-4 focus-visible:outline-white"
                  >
                    <span className="material-symbols-outlined text-[28px] font-bold text-white pointer-events-none">
                      hide_image
                    </span>
                    <span className="text-xs font-black leading-tight text-white">
                      Ocultar Imágenes
                    </span>
                    <span
                      style={{
                        backgroundColor: isActive ? '#FFFFFF' : '#DB2777',
                        color: isActive ? '#000000' : '#FFFFFF',
                        border: isActive ? '2px solid #FFFFFF' : 'none',
                      }}
                      className="text-[11px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider transition-all"
                    >
                      {isActive ? '¡ACTIVADO!' : 'Visible'}
                    </span>
                  </button>
                );
              })()}

              {/* Tool 7: Detener Animaciones (Turquesa #06B6D4 con texto negro) */}
              {(() => {
                const isActive = settings.stopAnimations;
                return (
                  <button
                    type="button"
                    onClick={handleToggleStopAnimations}
                    aria-pressed={isActive}
                    aria-label={`Detener Animaciones. Actualmente ${isActive ? 'pausadas' : 'activas'}.`}
                    style={{
                      backgroundColor: '#06B6D4',
                      color: '#000000',
                      outline: isActive ? '3px solid #FFFFFF' : 'none',
                      boxShadow: isActive ? '0 0 16px #FFFFFF, inset 0 0 8px rgba(0,0,0,0.2)' : '0 4px 6px rgba(0,0,0,0.3)',
                    }}
                    className="a11y-exempt p-3.5 rounded-xl font-bold flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer hover:brightness-110 active:scale-95 focus-visible:outline focus-visible:outline-4 focus-visible:outline-white"
                  >
                    <span className="material-symbols-outlined text-[28px] font-bold text-black pointer-events-none">
                      motion_photos_off
                    </span>
                    <span className="text-xs font-black leading-tight text-black">
                      Pausar Animaciones
                    </span>
                    <span
                      style={{
                        backgroundColor: isActive ? '#000000' : '#0891B2',
                        color: isActive ? '#FFFFFF' : '#000000',
                        border: isActive ? '2px solid #FFFFFF' : 'none',
                      }}
                      className="text-[11px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider transition-all"
                    >
                      {isActive ? '¡ACTIVADO!' : 'Activas'}
                    </span>
                  </button>
                );
              })()}

              {/* Tool 8: Cursor Grande (Turquesa #06B6D4 con texto negro) */}
              {(() => {
                const isActive = settings.largeCursor;
                return (
                  <button
                    type="button"
                    onClick={handleToggleLargeCursor}
                    aria-pressed={isActive}
                    aria-label={`Cursor Grande de alta visibilidad. Actualmente ${isActive ? 'activado' : 'normal'}.`}
                    style={{
                      backgroundColor: '#06B6D4',
                      color: '#000000',
                      outline: isActive ? '3px solid #FFFFFF' : 'none',
                      boxShadow: isActive ? '0 0 16px #FFFFFF, inset 0 0 8px rgba(0,0,0,0.2)' : '0 4px 6px rgba(0,0,0,0.3)',
                    }}
                    className="a11y-exempt p-3.5 rounded-xl font-bold flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer hover:brightness-110 active:scale-95 focus-visible:outline focus-visible:outline-4 focus-visible:outline-white"
                  >
                    <span className="material-symbols-outlined text-[28px] font-bold text-black pointer-events-none">
                      ads_click
                    </span>
                    <span className="text-xs font-black leading-tight text-black">
                      Cursor Grande
                    </span>
                    <span
                      style={{
                        backgroundColor: isActive ? '#000000' : '#0891B2',
                        color: isActive ? '#FFFFFF' : '#000000',
                        border: isActive ? '2px solid #FFFFFF' : 'none',
                      }}
                      className="text-[11px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider transition-all"
                    >
                      {isActive ? '¡ACTIVADO!' : 'Normal'}
                    </span>
                  </button>
                );
              })()}
            </div>
          </div>

          {/* Footer with Reset All & Done Buttons */}
          <div
            style={{
              backgroundColor: '#0A0A0A',
              borderTop: '2px solid #00FFFF',
            }}
            className="p-3 flex items-center justify-between gap-2"
          >
            <button
              type="button"
              onClick={handleResetAll}
              disabled={activeCount === 0}
              aria-label="Restablecer todos los ajustes de accesibilidad a su estado original"
              style={{
                backgroundColor: activeCount > 0 ? '#DC2626' : '#1F2937',
                color: activeCount > 0 ? '#FFFFFF' : '#6B7280',
                border: activeCount > 0 ? '1px solid #EF4444' : '1px solid #374151',
              }}
              className="a11y-exempt px-3.5 py-2 rounded-lg text-xs font-black flex items-center gap-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white cursor-pointer disabled:cursor-not-allowed uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span>Restablecer</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                triggerButtonRef.current?.focus();
              }}
              style={{
                backgroundColor: '#00FFFF',
                color: '#000000',
                boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
              }}
              className="a11y-exempt px-5 py-2 font-black rounded-lg text-xs transition-transform active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white cursor-pointer uppercase tracking-wider hover:brightness-110"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
