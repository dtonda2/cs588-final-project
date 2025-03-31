// Importing the React Functional Component type from the 'react' package.
// This provides type-checking and ensures that the component adheres to the functional component standard.
import { FC } from 'react';

// Importing the ChatList component from the local file './chat-list'.
// ChatList is assumed to be a component that renders a list of chat conversations.
import { ChatList } from './chat-list';

// Declaring and exporting the MobileChatContent component as a Functional Component (FC).
// This component serves as the main content for the mobile chat view.
export const MobileChatContent: FC = () => (
  // The MobileChatContent component renders the ChatList component directly.
  // This provides the mobile UI with a list of chats.
  <ChatList />
);
