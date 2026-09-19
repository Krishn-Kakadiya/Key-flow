import { create } from 'zustand';

/** Non-persisted UI state. */
interface UiState {
  levelUp: { level: number; themes: string[] } | null;
  showLevelUp: (level: number, themes: string[]) => void;
  dismissLevelUp: () => void;
  /** a typing session is in progress (chrome dims) */
  typing: boolean;
  setTyping: (v: boolean) => void;
}

export const useUi = create<UiState>((set) => ({
  levelUp: null,
  showLevelUp: (level, themes) => set({ levelUp: { level, themes } }),
  dismissLevelUp: () => set({ levelUp: null }),
  typing: false,
  setTyping: (typing) => set({ typing }),
}));
