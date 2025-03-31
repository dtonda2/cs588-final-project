import React from 'react';

// Importing the SidebarContainer component which provides a styled layout for sidebars.
// This component accepts a title and a trigger element to display at the top of the sidebar.
import { SidebarContainer } from '@/components/sidebar-container';
// Importing the ChatList component that renders a list of chat conversations.
import { ChatList } from '@/components/chat-list';
// Importing the NewGroup component which acts as a trigger (button) to create a new chat group.
import { NewGroup } from '@/components/new-group';

// Defining the ChatSidebar functional component.
// This component combines the SidebarContainer, ChatList, and NewGroup trigger to create a complete sidebar for chats.
const ChatSidebar = () => {
  return (
    // The SidebarContainer component wraps the chat sidebar content.
    // It is passed a title ("Chats") and a trigger component (<NewGroup />) which appears in the sidebar header.
    <SidebarContainer title='Chats' trigger={<NewGroup />}>
      {/* The ChatList component renders the list of available chat conversations inside the sidebar container. */}
      <ChatList />
    </SidebarContainer>
  );
};

// Exporting ChatSidebar as the default export so that it can be imported and used in other parts of the application.
export default ChatSidebar;
