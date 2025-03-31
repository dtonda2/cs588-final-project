// Importing `create` from Zustand, a lightweight state management library.
// Zustand provides a simple way to manage global state in React applications.
import { create } from 'zustand';

// Defining the shape of the state using TypeScript.
type SidebarWidthState = {
  sidebarWidth: number;         // Stores the width of the sidebar.
  setSidebarWidth: (width: number) => void; // Function to update the sidebar width.
};

// Creating a Zustand store named `useSidebarWidth`.
// - The store holds and manages the `sidebarWidth` state.
// - It also provides a function `setSidebarWidth` to update the width dynamically.
export const useSidebarWidth = create<SidebarWidthState>((set) => ({
  sidebarWidth: 30,  // Initial sidebar width set to 30 units (pixels, %, etc.).
  
  // Function to update `sidebarWidth`.
  // It takes a new width value and updates the state.
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
}));
