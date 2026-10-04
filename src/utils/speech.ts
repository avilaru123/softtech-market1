/**
 * Speech synthesis utility for SoftTech Market
 * Provides Spanish-language text-to-speech using window.speechSynthesis (WCAG 2.1 AAA accessibility).
 */

type SpeechCallback = () => void;

interface SpeakOptions {
  onStart?: SpeechCallback;
  onEnd?: SpeechCallback;
  onError?: (error: unknown) => void;
  rate?: number;
  pitch?: number;
  force?: boolean;
}

let cachedSpanishVoice: SpeechSynthesisVoice | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;

// Initialize voices and find Spanish voice
function loadVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    const spanishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith('es'));
    const voiceDescription = (voice: SpeechSynthesisVoice) => `${voice.name} ${voice.voiceURI}`;

    // Prefer installed Spanish voices so narration remains available without network access.
    cachedSpanishVoice =
      spanishVoices.find(
        (voice) => voice.localService && /natural|neural/i.test(voiceDescription(voice))
      ) ||
      spanishVoices.find((voice) => voice.localService && voice.lang.toLowerCase() === 'es-es') ||
      spanishVoices.find((voice) => voice.localService) ||
      spanishVoices.find((voice) => voice.lang.toLowerCase() === 'es-es') ||
      spanishVoices[0] ||
      null;
  }
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

/**
 * Speaks text aloud in Spanish using the Web Speech API.
 */
export function speakSpanish(text: string, options: SpeakOptions = {}): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis is not supported in this browser.');
    return false;
  }

  // When voice navigation is muted/disabled, cancel any speech unless force is requested
  if (!voiceNavEnabled && !options.force) {
    return false;
  }

  try {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    if (!text || text.trim() === '') {
      return false;
    }

    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = 'es-ES';
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;

    // Use cached Spanish voice if available or find one
    if (!cachedSpanishVoice) {
      loadVoices();
    }
    if (cachedSpanishVoice) {
      utterance.voice = cachedSpanishVoice;
    }

    utterance.onstart = () => {
      activeUtterance = utterance;
      if (options.onStart) options.onStart();
    };

    utterance.onend = () => {
      activeUtterance = null;
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = (e) => {
      activeUtterance = null;
      // 'interrupted' or 'canceled' is normal when user switches audio
      if (options.onError) {
        options.onError(e);
      }
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.error('Error invoking speechSynthesis:', err);
    return false;
  }
}

export const WELCOME_SPEECH_TEXT =
  'Bienvenido a SoftTech Market, tu tienda virtual accesible. Has iniciado sesión correctamente.';

/**
 * Plays the automatic welcome greeting for visually impaired users upon login.
 * Ensures any prior speech is explicitly cancelled first (speechSynthesis.cancel()).
 */
export function playWelcomeSpeech(options: SpeakOptions = {}): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis is not supported in this browser.');
    return false;
  }

  try {
    // Audio Priority: Cancel any previous speech playback immediately
    window.speechSynthesis.cancel();
    activeUtterance = null;

    const utterance = new SpeechSynthesisUtterance(WELCOME_SPEECH_TEXT);
    utterance.lang = 'es-ES';
    utterance.rate = options.rate ?? 0.95; // Clear, comfortable narration speed
    utterance.pitch = options.pitch ?? 1.0;

    if (!cachedSpanishVoice) {
      loadVoices();
    }
    if (cachedSpanishVoice) {
      utterance.voice = cachedSpanishVoice;
    }

    utterance.onstart = () => {
      activeUtterance = utterance;
      if (options.onStart) options.onStart();
    };

    utterance.onend = () => {
      activeUtterance = null;
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = (e) => {
      activeUtterance = null;
      if (options.onError) options.onError(e);
    };

    // Small timeout ensures the cancellation has settled on Chromium audio threads
    setTimeout(() => {
      try {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.speak(utterance);
        }
      } catch (e) {
        console.error('Error in window.speechSynthesis.speak:', e);
      }
    }, 60);

    return true;
  } catch (err) {
    console.error('Error invoking welcome speech synthesis:', err);
    return false;
  }
}

/**
 * Generates descriptive Spanish speech text for the current screen.
 */
export function getPageSpeechText(screen: string, cartCount: number = 0): string {
  switch (screen) {
    case 'home':
      return 'Bienvenido a SoftTech Market, plataforma de soluciones asistivas certificadas con nivel WCAG 2.1 AAA. En esta página encontrarás el índice de conformidad del 100%, el panel interactivo de auditoría de accesibilidad, accesos rápidos a categorías y nuestra selección de productos asistivos destacados como pantallas táctiles braille, lectores de pantalla y teclados adaptativos.';
    case 'catalog':
      return 'Catálogo completo de productos accesibles de SoftTech Market. Puedes filtrar por hardware braille, software de voz, ampliadores y conmutadores. En cada tarjeta puedes pulsar el botón Escuchar descripción para oír sus características técnicas en audio.';
    case 'checkout':
      return cartCount > 0
        ? `Pantalla de compra y tramitación de pedido de SoftTech Market. Tienes ${cartCount} producto${cartCount > 1 ? 's' : ''} en tu carrito. Revisa el resumen de compra, ingresa tus datos de entrega adaptada y selecciona tu método de pago seguro.`
        : 'Pantalla de compra y tramitación de pedido de SoftTech Market. Actualmente tu carrito está vacío. Regresa al catálogo para agregar productos asistivos.';
    case 'support':
      return 'Centro de Asistencia y Servicios de Accesibilidad de SoftTech Market. Ofrecemos asesoría técnica personalizada con especialistas asistivos, descarga de declaraciones de conformidad VPAT, canal telefónico directo y respuestas a preguntas frecuentes.';
    case 'auth':
      return 'Portal de Acceso y Registro de SoftTech Market. Inicia sesión con tus credenciales o crea una cuenta nueva para explorar el catálogo de tecnología asistiva.';
    default:
      return 'Bienvenido a SoftTech Market, tecnología asistiva con accesibilidad universal.';
  }
}

/**
 * Generates rich Spanish speech text for a product.
 */
export function getProductSpeechText(product: {
  name: string;
  categoryLabel: string;
  priceFormatted: string;
  description: string;
  specs?: Array<{ label: string; value: string }>;
}): string {
  let text = `${product.name}. Categoría: ${product.categoryLabel}. Precio: ${product.priceFormatted}, IVA incluido. Descripción: ${product.description}.`;
  if (product.specs && product.specs.length > 0) {
    const specsSummary = product.specs.slice(0, 4).map((s) => `${s.label}: ${s.value}`).join('. ');
    text += ` Especificaciones: ${specsSummary}.`;
  }
  return text;
}

// Global Voice Navigation state
const VOICE_NAV_STORAGE_KEY = 'softtech_voice_nav_enabled';
export const VOICE_STATE_CHANGE_EVENT = 'softtech_voice_state_changed';

let voiceNavEnabled: boolean = (() => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(VOICE_NAV_STORAGE_KEY);
      if (saved !== null) {
        return saved === 'true';
      }
    } catch {
      // ignore
    }
  }
  return true;
})();

let voiceNavTimer: ReturnType<typeof setTimeout> | null = null;
let lastSpokenElement: HTMLElement | null = null;

// Global Escape Key Listener: Cancels any active audio immediately
if (typeof window !== 'undefined') {
  window.addEventListener(
    'keydown',
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.code === 'Escape') {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          activeUtterance = null;
        }
        if (voiceNavTimer) {
          clearTimeout(voiceNavTimer);
          voiceNavTimer = null;
        }
        if (typeof document !== 'undefined') {
          document.querySelectorAll('[data-voice-speaking="true"]').forEach((el) => {
            el.removeAttribute('data-voice-speaking');
          });
        }
      }
    },
    true // Capture phase: immediately silences audio before any element can stop propagation
  );
}

export function isVoiceNavigationEnabled(): boolean {
  return voiceNavEnabled;
}

export function setVoiceNavigationEnabled(enabled: boolean): void {
  voiceNavEnabled = enabled;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(VOICE_NAV_STORAGE_KEY, String(enabled));
    } catch {
      // ignore
    }

    // Notify components of the voice state change
    window.dispatchEvent(
      new CustomEvent(VOICE_STATE_CHANGE_EVENT, { detail: { enabled } })
    );

    if (!enabled) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      activeUtterance = null;
      if (voiceNavTimer) {
        clearTimeout(voiceNavTimer);
        voiceNavTimer = null;
      }
      lastSpokenElement = null;

      if (typeof document !== 'undefined') {
        document.querySelectorAll('[data-voice-speaking="true"]').forEach((el) => {
          el.removeAttribute('data-voice-speaking');
        });
        document.querySelectorAll('[data-voice-focused="true"]').forEach((el) => {
          el.removeAttribute('data-voice-focused');
        });
      }
    }
  }
}

/**
 * Parses and formats speech narration for an interactive element following the format:
 * 'Enlace: [Nombre del enlace], sección [Categoría]' o 'Botón: [Acción], [Descripción]'
 */
export function formatElementSpeech(element: HTMLElement): string | null {
  // Direct override
  const directSpeech = element.getAttribute('data-speech');
  if (directSpeech) {
    return directSpeech.trim();
  }

  const ariaLabel = element.getAttribute('aria-label')?.trim() || '';

  // If the aria-label is already preformatted with 'Enlace: ...' or 'Botón: ...'
  if (/^(Enlace|Botón):/i.test(ariaLabel)) {
    return ariaLabel;
  }

  const tagName = element.tagName.toLowerCase();
  const role = element.getAttribute('role')?.toLowerCase();
  const isLink = tagName === 'a' || role === 'link';
  const isButton = tagName === 'button' || role === 'button' || role === 'tab';

  const visibleText = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
  const title = element.getAttribute('title')?.trim() || '';
  const dataSection = element.getAttribute('data-section');
  const dataDesc = element.getAttribute('data-desc');

  // Determine section/category context
  const sectionContainer = element.closest('nav, section, aside, header, footer');
  const sectionLabel =
    dataSection ||
    sectionContainer?.getAttribute('aria-label') ||
    sectionContainer?.querySelector('h1, h2, h3')?.textContent?.trim() ||
    'General';

  if (isLink) {
    const linkName = ariaLabel || visibleText || title || 'Enlace';
    return `Enlace: ${linkName}, sección ${sectionLabel}`;
  }

  if (isButton) {
    const action = ariaLabel || visibleText || title || 'Acción';
    const description = dataDesc || title || `sección ${sectionLabel}`;
    return `Botón: ${action}, ${description}`;
  }

  // Interactive inputs or cards
  if (tagName === 'input' || tagName === 'select') {
    const labelElem = element.id ? document.querySelector(`label[for="${element.id}"]`) : null;
    const labelText = ariaLabel || labelElem?.textContent?.trim() || visibleText || title || 'Campo de entrada';
    return `Campo interactivo: ${labelText}, sección ${sectionLabel}`;
  }

  if (ariaLabel) {
    return ariaLabel;
  }

  return null;
}

/**
 * Narrates an interactive element upon keyboard Tab (focus) or mouse hover (mouseenter).
 * Cancels any prior audio immediately and speaks in exact synchronization with the visual highlight.
 */
export function narrateInteractiveElement(element: HTMLElement, immediate: boolean = true): void {
  if (!voiceNavEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  // Avoid repeating audio if pointer merely wiggles over the exact same element
  if (lastSpokenElement === element && isSpeaking()) {
    return;
  }
  lastSpokenElement = element;

  const speechText = formatElementSpeech(element);
  if (!speechText) {
    return;
  }

  if (voiceNavTimer) {
    clearTimeout(voiceNavTimer);
    voiceNavTimer = null;
  }

  const performNarration = () => {
    try {
      window.speechSynthesis.cancel();
      activeUtterance = null;

      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.lang = 'es-ES';
      utterance.rate = 1.05; // Lively, clear responsive rate for navigation
      utterance.pitch = 1.0;

      if (!cachedSpanishVoice) {
        loadVoices();
      }
      if (cachedSpanishVoice) {
        utterance.voice = cachedSpanishVoice;
      }

      utterance.onstart = () => {
        activeUtterance = utterance;
        element.setAttribute('data-voice-speaking', 'true');
      };
      utterance.onend = () => {
        activeUtterance = null;
        element.removeAttribute('data-voice-speaking');
      };
      utterance.onerror = () => {
        activeUtterance = null;
        element.removeAttribute('data-voice-speaking');
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Error during voice navigation narration:', err);
    }
  };

  if (immediate) {
    // Exact instant synchronization with visual focus (Tab navigation)
    performNarration();
  } else {
    // Gentle debounce for pointer hover
    voiceNavTimer = setTimeout(performNarration, 60);
  }
}

/**
 * Stops any active speech playback.
 */
export function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
}

/**
 * Checks if speech is currently playing.
 */
export function isSpeaking(): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }
  return window.speechSynthesis.speaking;
}
