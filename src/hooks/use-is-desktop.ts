// Importing React hooks: 
// - `useState` to manage the component's local state.
// - `useEffect` to perform side effects (in this case, to listen for window resize events).
import { useState, useEffect } from 'react';

/**
 * Custom hook: useIsDesktop
 *
 * Determines if the current viewport width qualifies as a desktop (greater than 768px).
 *
 * Returns:
 *   - A boolean value indicating whether the current screen is considered desktop-sized.
 */
export const useIsDesktop = () => {
  // Initialize a state variable 'isDesktop' with default value 'false'
  // This state will be updated based on the window's inner width.
  const [isDesktop, setIsDesktop] = useState(false);

  // useEffect hook to set up an event listener for window resize events.
  // The empty dependency array `[]` means this effect will run once when the component mounts.
  useEffect(() => {
    /**
     * Function: handleResize
     *
     * Checks the current window width and updates the `isDesktop` state.
     * - If window.innerWidth is greater than 768, it's considered desktop.
     */
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 768);
    };

    // Immediately call handleResize to set the initial state based on the current window width.
    handleResize();

    // Add the 'resize' event listener to the window object.
    // This ensures that the state is updated whenever the window is resized.
    window.addEventListener('resize', handleResize);

    // Cleanup function: This will remove the event listener when the component unmounts,
    // preventing memory leaks and unnecessary function calls.
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty dependency array ensures the effect runs only once when the component mounts.

  // Return the current state, which indicates if the viewport is considered desktop.
  return isDesktop;
};
