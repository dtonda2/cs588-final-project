// Importing necessary types and components from React and other libraries.
import { FC, ReactNode } from 'react';
// `format` is used to format timestamps.
import { format } from 'date-fns';
// Next.js components for handling images and navigation.
import Image from 'next/image';
import Link from 'next/link';

// Importing a utility function to merge CSS classes conditionally.
import { cn } from '@/lib/utils';
// Importing Avatar components for displaying user avatars.
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

// Defining the props type for the MessageItem component.
// - `fromCurrentUser`: Boolean indicating if the message is sent by the current user.
// - `senderImage`: URL of the sender's avatar image.
// - `senderName`: Name of the sender.
// - `lastByUser`: Boolean indicating if this message is the last one by the sender in a sequence.
// - `content`: Array of strings containing message content (could be text, media URLs, etc.).
// - `createdAt`: Timestamp indicating when the message was created.
// - `type`: Type of message content (e.g., 'text', 'audio', 'image', 'pdf').
// - `seen`: Optional ReactNode to indicate if the message has been seen.
type MessageItemProps = {
  fromCurrentUser: boolean;
  senderImage: string;
  senderName: string;
  lastByUser: boolean;
  content: string[];
  createdAt: number;
  type: string;
  seen?: ReactNode;
};

// The MessageItem component renders an individual chat message with various media types.
export const MessageItem: FC<MessageItemProps> = ({
  content,
  createdAt,
  fromCurrentUser,
  lastByUser,
  senderImage,
  senderName,
  type,
  seen,
}) => {
  // Helper function to format the timestamp to 'HH:mm' format.
  const formatTime = (timestamp: number) => format(timestamp, 'HH:mm');

  return (
    // Container for the message, aligning items based on whether it is from the current user.
    <div
      className={cn('flex items-end', {
        'justify-end': fromCurrentUser, // Right-align message if it's from the current user.
      })}
    >
      {/* Main content container for the message bubble and metadata */}
      <div
        className={cn('flex flex-col w-full mx-2', {
          'order-1 items-end': fromCurrentUser, // Order and align message content to the right.
          'order-2 items-start': !fromCurrentUser, // Order and align message content to the left.
        })}
      >
        {/* Message bubble with conditional styling based on message type and sender */}
        <div
          className={cn(
            'px-3 py-1 flex flex-col space-x-2 items-center justify-between rounded-lg max-w-[80%]',
            {
              // Styling for text messages from the current user.
              'bg-blue-700 text-primary-foreground':
                fromCurrentUser && type === 'text',
              // Styling for text messages from others.
              'bg-secondary text-secondary-foreground':
                !fromCurrentUser && type === 'text',
              // Adjusts border radius if the message is not the last one in a sequence.
              'rounded-br-none': !lastByUser && fromCurrentUser,
              'rounded-bl-none': !lastByUser && !fromCurrentUser,
            }
          )}
        >
          {/* Conditional rendering of message content based on its type */}
          {type == 'text' && (
            // For text messages, display the content with proper word wrapping.
            <p className='text-wrap break-words whitespace-pre-wrap break-all'>
              {content}
            </p>
          )}

          {type === 'audio' && (
            // For audio messages, render an HTML audio element with controls.
            <audio className='max-w-44 md:max-w-full' controls>
              <source src={content[0]} type='audio/mpeg' />
              {/* Fallback text for browsers that do not support the audio element */}
              Your browser does not support the audio element.
            </audio>
          )}

          {type === 'image' && (
            // For image messages, wrap the image in a Link to open it in a new tab.
            <Link
              href={content[0]}
              passHref
              target='_blank'
              rel='noopener noreferrer'
            >
              <Image
                src={content[0]} // Source URL for the image.
                alt='image' // Alternative text for accessibility.
                width={240} // Image width.
                height={112} // Image height.
                className='rounded-xl w-60 object-cover h-28' // Styling for the image.
              />
            </Link>
          )}

          {type === 'pdf' && (
            // For PDF messages, display a clickable text link to open the document.
            <Link href={content[0]} target='_blank' rel='noopener noreferrer'>
              <p className='underline'>PDF Document</p>
            </Link>
          )}

          {/* Display the formatted time of message creation */}
          <p
            className={cn('text-xs flex w-full my-1', {
              // Align time to the right for messages from the current user.
              'text-primary-foreground justify-end': fromCurrentUser,
              // Align time to the left for messages from others.
              'text-secondary-foreground justify-start': !fromCurrentUser,
              // Override text color for non-text messages (audio, image, pdf).
              'dark:text-white text-black':
                type === 'audio' || type === 'image' || type === 'pdf',
            })}
          >
            {formatTime(createdAt)}
          </p>
        </div>
        {/* Display an optional 'seen' indicator below the message bubble */}
        <span className='text-sm italic'>{seen}</span>
      </div>

      {/* Avatar component displaying the sender's image or fallback initials */}
      <Avatar
        className={cn('w-8 h-8 relative', {
          'order-2': fromCurrentUser, // Position avatar after the message bubble for current user's messages.
          'order-1': !fromCurrentUser, // Position avatar before the message bubble for others' messages.
          invisible: lastByUser, // Hide avatar if this is not the last message in a sequence by the user.
        })}
      >
        {/* Display sender's image if available */}
        <AvatarImage src={senderImage} alt={senderName} />
        {/* Fallback: Display the first two letters of the sender's name */}
        <AvatarFallback>{senderName.slice(0, 2)}</AvatarFallback>
      </Avatar>
    </div>
  );
};
