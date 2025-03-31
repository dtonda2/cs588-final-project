// Importing React's FC (Function Component) type for component typing.
import { FC } from 'react';
// Importing Next.js's Link component for client-side navigation.
import Link from 'next/link';

// Importing utility functions:
// - `cn` to conditionally merge Tailwind CSS classes.
// - `getFormattedTimestamp` to format a timestamp into a human-readable time.
import { cn, getFormattedTimestamp } from '@/lib/utils';
// Importing Avatar components for displaying user avatars.
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// Importing Badge component for displaying notification counts.
import { Badge } from '@/components/ui/badge';

// Defining the props for the ChatListItem component.
// - name: The name of the chat or participant.
// - lastMessageContent: The content of the last message sent in the chat.
// - lastMessageSender: The sender of the last message (if needed).
// - timestamp: The time when the last message was sent (as a number).
// - avatarUrl: The URL for the avatar image to be displayed.
// - isActive: Boolean indicating if this chat is currently active/selected.
// - chatId: Unique identifier for the chat, used for linking.
// - unseenMessageCount: The number of unseen messages in the chat.
type ChatListItemProps = {
  name: string;
  lastMessageContent: string | undefined;
  lastMessageSender: string | undefined;
  timestamp: number | undefined;
  avatarUrl: string;
  isActive: boolean;
  chatId: string;
  unseenMessageCount: number | undefined;
};

// ChatListItem component renders a single chat entry in a chat list.
export const ChatListItem: FC<ChatListItemProps> = ({
  avatarUrl,
  chatId,
  isActive,
  lastMessageContent,
  lastMessageSender,
  name,
  timestamp,
  unseenMessageCount,
}) => {
  return (
    // The Link component wraps the entire chat list item,
    // navigating to the chat's page using the chatId.
    <Link
      href={`/chats/${chatId}`}
      // Conditionally apply background color if the chat is active.
      className={cn('p-3 rounded-2xl flex justify-between', {
        'bg-gray-200 dark:bg-gray-800': isActive,
      })}
    >
      {/* Left section containing avatar and chat details */}
      <div className='flex space-x-3'>
        {/* Avatar component displaying the chat or user image */}
        <Avatar className='h-12 w-12'>
          {/* Display the image from the provided avatarUrl */}
          <AvatarImage src={avatarUrl} />
          {/* Fallback to first letter of the name if image fails */}
          <AvatarFallback>{name[0]}</AvatarFallback>
        </Avatar>

        {/* Container for chat name and last message preview */}
        <div>
          {/* Chat name displayed in bold */}
          <h2 className='font-bold'>{name}</h2>
          {/* Preview of the last message sent in the chat */}
          <p className='text-sm text-gray-700 dark:text-gray-400'>
            {lastMessageContent}
          </p>
        </div>
      </div>

      {/* Right section containing the timestamp and unseen message count */}
      <div className='flex flex-col items-end justify-between'>
        {/* Formatted timestamp of the last message */}
        <p className='text-sm'>
          {timestamp && getFormattedTimestamp(timestamp)}
        </p>
        {/* Conditionally render a Badge if there are unseen messages */}
        {unseenMessageCount && unseenMessageCount > 0 ? (
          <Badge className='text-gray-500' variant='secondary'>
            {unseenMessageCount}
          </Badge>
        ) : null}
      </div>
    </Link>
  );
};
