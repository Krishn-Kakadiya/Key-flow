import { create } from 'zustand';

/** Non-persisted UI state. */
interface UiState {
  levelUp: { level: number; themes: string[] } | null;
  showLevelUp: (level: number, themes: string[]) => void;
  dismissLevelUp: () => void;
  /** a typing session is in progress (chrome dims) */
  typing: boolean;
  setTyping: (v: boolean) => void;
  /** short message shown at the bottom of the screen for a few seconds */
  notice: { id: number; text: string } | null;
  showNotice: (text: string) => void;
  clearNotice: () => void;
}

let noticeId = 0;

export const useUi = create<UiState>((set) => ({
  levelUp: null,
  showLevelUp: (level, themes) => set({ levelUp: { level, themes } }),
  dismissLevelUp: () => set({ levelUp: null }),
  typing: false,
  setTyping: (typing) => set({ typing }),
  notice: null,
  showNotice: (text) => set({ notice: { id: ++noticeId, text } }),
  clearNotice: () => set({ notice: null }),
}));
