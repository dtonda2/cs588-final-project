// Importing necessary types from React.
import { FC, ReactNode } from 'react';

// Importing the Search icon from the 'lucide-react' icon library.
import { Search } from 'lucide-react';

// Importing a custom ScrollArea component for scrollable content.
import { ScrollArea } from '@/components/ui/scroll-area';

// Define the type for the component props using TypeScript.
// - `children`: The inner content of the sidebar.
// - `title`: A string representing the title displayed in the header of the sidebar.
// - `trigger`: A React node used as a trigger (e.g., a button or icon) on the header.
type SidebarContainerProps = {
  children: ReactNode;
  title: string;
  trigger: ReactNode;
};

// The SidebarContainer component is a functional component (FC) that accepts SidebarContainerProps.
export const SidebarContainer: FC<SidebarContainerProps> = ({
  children,
  title,
  trigger,
}) => {
  return (
    // The ScrollArea component provides a scrollable container for its children.
    // It has a className that sets its height to full available space.
    <ScrollArea className='h-full'>
      {/* Main container with horizontal padding */}
      <div className='px-4'>
        {/* Header section: Contains title and trigger */}
        <div className='flex items-center mt-10 justify-between'>
          {/* Title of the sidebar, styled as a large, bold header */}
          <h2 className='text-2xl font-bold'>{title}</h2>
          {/* Trigger element (e.g., button or icon) passed as a prop */}
          <div>{trigger}</div>
        </div>
        
        {/* Search input container */}
        <div className='my-4 h-8 bg-gray-200 dark:bg-gray-800 flex items-center p-2 rounded-xl'>
          {/* Search icon, styled with margin for spacing */}
          <Search className='text-gray-500 mr-2' />
          {/* Input field for search functionality */}
          <input
            type='text'
            placeholder='Search...'
            className='w-full h-8 p-2 rounded-lg outline-none bg-gray-200 dark:bg-gray-800'
          />
        </div>

        {/* Render any children passed to the SidebarContainer */}
        {children}
      </div>
    </ScrollArea>
  );
};
