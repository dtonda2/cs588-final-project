// This file is a React client component.
'use client';

// Import necessary dependencies from React.
import { FC, ReactNode, useEffect, useState } from 'react';

// Importing resizable components for a dynamic sidebar layout.
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';

// Importing a custom hook to manage sidebar width state.
import { useSidebarWidth } from '@/hooks/use-sidebar-width';

// Define the props type for the SharedLayout component.
// - `children`: The main content to be displayed in the layout.
// - `SidebarComponent`: A React functional component that serves as the sidebar.
// - `SidebarProps`: Optional props that can be passed to the SidebarComponent.
type SharedLayoutProps = {
  children: ReactNode;
  SidebarComponent: FC<any>; // Accepts any sidebar component.
  SidebarProps?: any; // Optional props for the sidebar.
};

// The SharedLayout component is a functional component (FC) that implements a resizable sidebar.
const SharedLayout: FC<SharedLayoutProps> = ({
  children,
  SidebarComponent,
  SidebarProps,
}) => {
  // State to track if the component has mounted in the browser.
  const [isRendered, setIsRendered] = useState(false);

  // Get the sidebar width and its setter function from the custom hook.
  const { setSidebarWidth, sidebarWidth } = useSidebarWidth();

  // useEffect hook ensures the component is mounted before rendering.
  useEffect(() => {
    setIsRendered(true);
  }, []);

  // Prevent rendering until the component is fully mounted.
  if (!isRendered) return null;

  return (
    <>
      {/* Grouping the resizable panels horizontally */}
      <ResizablePanelGroup direction='horizontal'>
        {/* Sidebar panel that can be resized */}
        <ResizablePanel
          onResize={width => setSidebarWidth(width)} // Update sidebar width on resize.
          defaultSize={sidebarWidth} // Set default width from state.
          maxSize={40} // Maximum width limit (40% of the available space).
          minSize={20} // Minimum width limit (20% of the available space).
        >
          {/* Render the SidebarComponent with any passed props */}
          <SidebarComponent {...SidebarProps} />
        </ResizablePanel>

        {/* Handle for resizing between the sidebar and main content */}
        <ResizableHandle
          className='border-r border-r-gray-400 dark:border-r-gray-800' // Styling for light and dark mode.
          withHandle // Enables the handle for resizing.
        />

        {/* Main content panel, allows scrolling */}
        <ResizablePanel className='!overflow-y-auto my-20'>
          {/* Content is hidden on small screens (md breakpoint) */}
          <div className='h-full hidden md:block'>{children}</div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Separate content container for mobile (shown only on small screens) */}
      <div className='md:hidden'>{children}</div>
    </>
  );
};

// Exporting the SharedLayout component for use in other parts of the app.
export default SharedLayout;
