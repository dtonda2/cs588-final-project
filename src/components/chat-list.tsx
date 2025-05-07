// Importing the useQuery hook from Convex to fetch data from the backend.
import { useQuery } from 'convex/react';
// Importing the usePathname hook from Next.js for accessing the current URL pathname.
import { usePathname } from 'next/navigation';
// Importing the FC (Function Component) type from React for typing the component.
import { FC } from 'react';
// Importing the Convex API methods.
import { api } from '../../convex/_generated/api';

// Importing the ChatListItem component that renders each individual chat item.
import { ChatListItem } from '@/components/chat-list-item';

// Defining the ChatList component as a functional component.
export const ChatList: FC = () => {
  // Retrieve the current pathname from the Next.js navigation hook.
  const pathName = usePathname();
  // Extract the chat ID from the current URL by splitting the pathname and taking the last segment.
  const chatId = pathName ? pathName.split('/').pop() : null;

  // Fetch the conversations data from the Convex API.
  const conversations = useQuery(api.conversations.get);

  // Filter out conversations that are group chats based on the 'isGroup' property.
  const groupMessages = conversations?.filter(msg => msg.conversation.isGroup);

  // Filter out direct messages (non-group conversations).
  const directMessages = conversations?.filter(
    msg => !msg.conversation.isGroup
  );

  // Determine if there are any conversations (either group or direct).
  const hasConversations =
    (groupMessages && groupMessages.length > 0) ||
    (directMessages && directMessages.length > 0);

  return (
    // Container for the list of chat items, arranged vertically with spacing between items.
    <div className='flex flex-col space-y-2'>
      {/* If there are no conversations, display a message to the user. */}
      {!hasConversations ? (
        <div className='text-center text-gray-500'>No conversations yet</div>
      ) : (
        <>
          {/* If there are direct messages, map through them and render a ChatListItem for each. */}
          {directMessages && directMessages.length > 0
            ? directMessages.map(
                ({ conversation, otherMember, unseenCount, lastMessage }) => (
                  <ChatListItem
                    key={conversation._id} // Unique key for React list rendering.
                    name={otherMember?.username || ''} // Display the username of the other member.
                    lastMessageContent={lastMessage?.lastMessageContent || ''} // Content of the last message.
                    avatarUrl={otherMember?.imageUrl || ''} // Avatar image URL of the other member.
                    chatId={conversation._id} // ID of the conversation.
                    // Check if the current chatId from the URL matches this conversation's ID to mark it as active.
                    isActive={chatId === conversation._id}
                    lastMessageSender={lastMessage?.lastMessageSender} // The sender of the last message.
                    timestamp={lastMessage?.lastMessageTimestamp} // Timestamp of the last message.
                    unseenMessageCount={unseenCount} // Number of unseen messages.
                  />
                )
              )
            : null}

          {/* If there are group messages, map through them and render a ChatListItem for each. */}
          {groupMessages && groupMessages.length > 0
            ? groupMessages.map(
                ({ conversation, unseenCount, lastMessage, otherMember }) => (
                  <ChatListItem
                    key={conversation._id} // Unique key for React list rendering.
                    name={conversation.name || ''} // Display the group name.
                    lastMessageContent={lastMessage?.lastMessageContent || ''} // Content of the last message.
                    // For groups, no avatar URL is provided, could be customized later.
                    avatarUrl={''}
                    chatId={conversation._id} // ID of the conversation.
                    // Check if the current chatId from the URL matches this conversation's ID to mark it as active.
                    isActive={chatId === conversation._id}
                    lastMessageSender={lastMessage?.lastMessageSender} // The sender of the last message.
                    timestamp={lastMessage?.lastMessageTimestamp} // Timestamp of the last message.
                    unseenMessageCount={unseenCount} // Number of unseen messages.
                  />
                )
              )
            : null}
        </>
      )}
    </div>
  );
};
