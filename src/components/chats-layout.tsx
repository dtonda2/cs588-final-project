'use client';

// Importing necessary types from React.
import { FC, ReactNode } from 'react';
// Importing the SharedLayout component which defines a common layout structure.
import SharedLayout from '@/components/shared-layout';
// Importing the ChatSidebar component which will be used as the sidebar in the layout.
import ChatSidebar from '@/components/chat-sidebar';

// Define the props for the ChatsLayout component.
// - children: Represents the nested content (e.g., chat messages, other components) to be rendered within the layout.
type ChatsLayoutProps = {
  children: ReactNode;
};

// Declaring the ChatsLayout functional component which accepts props of type ChatsLayoutProps.
export const ChatsLayout: FC<ChatsLayoutProps> = ({ children }) => {
  // The ChatsLayout component renders a SharedLayout, passing a ChatSidebar component to be used as the sidebar.
  // The children passed to ChatsLayout are rendered inside the SharedLayout's main content area.
  return (
    <SharedLayout SidebarComponent={() => <ChatSidebar />}>
      {children}
    </SharedLayout>
  );
};
