import { useEffect } from 'react';
import {
  narrateInteractiveElement,
  isVoiceNavigationEnabled,
  VOICE_STATE_CHANGE_EVENT,
} from '../utils/speech';

/**
 * Hook that enables real-time Spanish voice navigation for all links, buttons, and interactive elements.
 * Responds to both keyboard Tab (focusin) and mouse hover (mouseover).
 */
export function useVoiceNavigation(enabled: boolean = true) {
  useEffect(() => {
    if (typeof window === 'undefined' || !enabled) {
      return;
    }

    let lastTarget: HTMLElement | null = null;
    let focusOutTimer: ReturnType<typeof setTimeout> | null = null;

    const getInteractiveTarget = (event: Event): HTMLElement | null => {
      const target = event.target as HTMLElement | null;
      if (!target || typeof target.closest !== 'function') {
        return null;
      }
      return target.closest<HTMLElement>(
        'a, button, input, select, textarea, [role="button"], [role="link"], [role="tab"], [role="checkbox"], [role="radio"], [role="switch"], [tabindex="0"], article.interactive-card, .interactive-card, [data-speech]'
      );
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (focusOutTimer) {
        clearTimeout(focusOutTimer);
        focusOutTimer = null;
      }

      const interactive = getInteractiveTarget(event);
      if (interactive) {
        if (lastTarget && lastTarget !== interactive) {
          lastTarget.removeAttribute('data-voice-focused');
          lastTarget.removeAttribute('data-voice-speaking');
        }
        lastTarget = interactive;

        // Synchronize visual focus state immediately in DOM
        interactive.setAttribute('data-voice-focused', 'true');

        // Voice narration
        if (isVoiceNavigationEnabled()) {
          narrateInteractiveElement(interactive, true);
        }
      }
    };

    const handleFocusOut = (event: FocusEvent) => {
      const interactive = getInteractiveTarget(event);
      if (interactive) {
        interactive.removeAttribute('data-voice-focused');
        interactive.removeAttribute('data-voice-speaking');
      }

      if (focusOutTimer) clearTimeout(focusOutTimer);
      focusOutTimer = setTimeout(() => {
        if (lastTarget === interactive) {
          lastTarget = null;
        }
      }, 40);
    };

    const handleMouseOver = (event: MouseEvent) => {
      if (!isVoiceNavigationEnabled()) return;
      const interactive = getInteractiveTarget(event);
      if (interactive && interactive !== lastTarget) {
        lastTarget = interactive;
        narrateInteractiveElement(interactive, false);
      }
    };

    const handleMouseLeave = () => {
      // Allow re-speaking when re-entering
      lastTarget = null;
    };

    // Global keyboard listener: track navigation and cancel on Escape (ESC)
    const handleKeyDown = (event: KeyboardEvent) => {
      // Instant Silence and Clear Focus with Escape (ESC)
      if (event.key === 'Escape' || event.code === 'Escape') {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        if (lastTarget) {
          lastTarget.removeAttribute('data-voice-speaking');
          lastTarget.removeAttribute('data-voice-focused');
          lastTarget = null;
        }

        // Release document focus to remove outline completely
        if (document.activeElement && typeof (document.activeElement as HTMLElement).blur === 'function') {
          (document.activeElement as HTMLElement).blur();
        }
      }
    };

    // Listen to voice state toggles (MUTE / UNMUTE)
    const handleVoiceChange = (e: Event) => {
      const custom = e as CustomEvent<{ enabled: boolean }>;
      if (custom.detail && !custom.detail.enabled) {
        if (lastTarget) {
          lastTarget.removeAttribute('data-voice-speaking');
        }
      }
    };

    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('focusout', handleFocusOut, true);
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseleave', handleMouseLeave, true);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener(VOICE_STATE_CHANGE_EVENT, handleVoiceChange);

    return () => {
      if (focusOutTimer) clearTimeout(focusOutTimer);
      document.removeEventListener('focusin', handleFocusIn, true);
      document.removeEventListener('focusout', handleFocusOut, true);
      document.removeEventListener('mouseover', handleMouseOver, true);
      document.removeEventListener('mouseleave', handleMouseLeave, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener(VOICE_STATE_CHANGE_EVENT, handleVoiceChange);
    };
  }, [enabled]);
}
