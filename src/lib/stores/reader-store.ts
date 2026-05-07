import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ReaderState = {
  zoom: number;
  fitMode: 'width' | 'page';
  setZoom: (zoom: number) => void;
  setFitMode: (mode: 'width' | 'page') => void;
  resetZoom: () => void;
};

export const useReaderStore = create<ReaderState>()(
  persist(
    (set) => ({
      zoom: 1,
      fitMode: 'width',
      setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(3, zoom)) }),
      setFitMode: (fitMode) => set({ fitMode }),
      resetZoom: () => set({ zoom: 1 }),
    }),
    { name: 'reader-prefs' }
  )
);
