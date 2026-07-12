import { create } from "zustand";

// Shared scroll progress (0..1) for the landing story. GSAP ScrollTrigger sets
// it; the R3F camera rig reads it every frame to choreograph the camera.
type StoryState = {
  progress: number;
  set: (p: number) => void;
};

export const useStory = create<StoryState>((set) => ({
  progress: 0,
  set: (p) => set({ progress: p }),
}));
