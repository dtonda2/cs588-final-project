// Importing necessary dependencies from various libraries
import { Ban, Phone, Scroll, Video } from 'lucide-react'; // Importing icons for UI elements
import Link from 'next/link'; // Importing Link component from Next.js for client-side navigation
import { useQuery } from 'convex/react'; // Hook to fetch data from the Convex backend
import { FC, useState } from 'react'; // Importing types and hooks from React
import { api } from '../../convex/_generated/api'; // Importing API methods from the Convex backend
import { toast } from 'sonner'; // Toast notifications for user feedback
import { ConvexError } from 'convex/values'; // Handling Convex-related errors
import { Id } from '../../convex/_generated/dataModel'; // Importing Convex ID type for data consistency

// Importing UI components from the application's component library
import { SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useMutationHandler } from '@/hooks/use-mutation-handler'; // Custom hook for handling mutations
import { ChatTypeContent } from '@/components/chat-type-content'; // Component for rendering chat-related content
import { pluralize } from '@/lib/utils'; // Utility function for pluralizing words

// Defining the props type for the ActionButton component
type ActionButtonProps = {
  Icon: FC; // Icon component to be rendered (e.g., Phone, Video, Ban)
  label: string; // Text label describing the action
};

// ActionButton component for displaying an action icon with a label
const ActionButton: FC<ActionButtonProps> = ({ Icon, label }) => (
  <div className='flex space-y-2 flex-col items-center w-fit px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800'>
    <Icon /> {/* Renders the passed icon */}
    <p className='text-xs'>{label}</p> {/* Displays the label below the icon */}
  </div>
);


// Defining the props type for the ProfileSheet component
type ProfileSheetProps = {
  chatId: string; // Unique identifier for the chat
  username: string; // Display name of the user
  status: string; // User's online/offline status
  groupsInCommon: // Optional list of group conversations the user is part of
    | {
        conversation: {
          isGroup: boolean; // Indicates if the conversation is a group
          name?: string; // Name of the group (if applicable)
          _creationTime: number; // Timestamp of when the group was created
          _id: string; // Unique identifier for the group conversation
        };
        unseenCount: number; // Number of unread messages in the group
      }[]
    | undefined;
  chatAvatar: string; // URL of the user's profile picture
};


// Declaring the ProfileSheet component, which is responsible for displaying a user's profile details in a sidebar or modal.
export const ProfileSheet: FC<ProfileSheetProps> = ({
  chatAvatar, // The user's profile picture URL.
  chatId, // Unique identifier for the chat conversation.
  groupsInCommon, // List of group conversations the user is a part of.
  status, // The online/offline status of the user.
  username, // Display name of the user.
}) => {
  // State to control the visibility of the block confirmation dialog.
  const [blockConfirmationDialog, setBlockConfirmationDialog] = useState(false);

  // Fetching the chat messages for the given conversation ID using a Convex API query.
  const messages = useQuery(api.messages.get, {
    id: chatId as Id<'conversations'>, // Casting chatId to match the Convex conversation ID type.
  });

  // Using the custom useMutationHandler hook to manage the state and execution of the block contact mutation.
  const { mutate: blockContact, state: blockContactState } = useMutationHandler(
    api.contact.block // Calling the block API endpoint to block a contact.
  );

  // Function to handle blocking a contact.
  const blockContactHandler = async () => {
    try {
      // Calling the block contact mutation with the chat ID.
      await blockContact({ conversationId: chatId });

      // Displaying a success message to the user.
      toast.success('Contact blocked');
    } catch (error) {
      console.log(error); // Logging the error for debugging purposes.

      // Displaying an error toast message, providing specific error details if available.
      toast.error(
        error instanceof ConvexError ? error.data : 'An error occurred'
      );
    }
  };


  const chatFiles = messages?.filter(({ type }) => type !== 'text');

  return (
    // Scrollable container for the entire profile sheet
    <ScrollArea className='h-full'>
  
      {/* Avatar section displaying the user's profile picture */}
      <Avatar className='mx-auto h-20 w-20 mt-10'>
        {/* Image source for the avatar */}
        <AvatarImage src={chatAvatar} />
  
        {/* Fallback text using the first letter of the username if the image fails to load */}
        <AvatarFallback>{username[0]}</AvatarFallback>
      </Avatar>
  
      {/* Displaying the username in a centered title */}
      <SheetTitle className='text-center mt-2 text-2xl'>{username}</SheetTitle>
  
      {/* Displaying the user's current status */}
      <p className='text-center'>{status}</p>
  
      {/* Action buttons for video call and voice call */}
      <div className='flex justify-center space-x-4 mt-5'>
        <ActionButton Icon={Video} label='Video' />
        <ActionButton Icon={Phone} label='Call' />
      </div>
  
      {/* Separator line for UI separation */}
      <Separator className='my-5 border border-gray-100 dark:border-gray-800' />
  
      {/* Dialog for confirming the block action */}
      <Dialog
        open={blockConfirmationDialog} // Controls the visibility of the block confirmation dialog
        onOpenChange={() =>
          setBlockConfirmationDialog(!blockConfirmationDialog) // Toggles the dialog when opened/closed
        }
      >
        {/* Button to trigger the block confirmation dialog */}
        <DialogTrigger
          className='w-full'
          onClick={() => setBlockConfirmationDialog(true)}
        >
          <div className='flex items-center justify-center w-full text-red-600 space-x-3'>
            <Ban />
            <p>Block</p>
          </div>
        </DialogTrigger>
  
        {/* Dialog content prompting the user for confirmation */}
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='mb-5'>
              Are you absolutely sure you want to block {username}?
            </DialogTitle>
          </DialogHeader>
  
          {/* Action buttons: Cancel and Block */}
          <div className='flex items-center space-x-3'>
            <Button
              onClick={() => setBlockConfirmationDialog(false)} // Closes the dialog on cancel
              variant='link'
              disabled={blockContactState === 'loading'} // Disables button if mutation is in progress
            >
              Cancel
            </Button>
            <Button
              disabled={blockContactState === 'loading'} // Disables button if mutation is in progress
              variant='destructive'
              onClick={blockContactHandler} // Calls function to block the contact
            >
              Block
            </Button>
          </div>
        </DialogContent>
      </Dialog>
  
      {/* Separator line for UI separation */}
      <Separator className='my-5 border border-gray-100 dark:border-gray-800' />
  
      {/* Section for displaying shared media files */}
      <div>
        <p className='font-bold text-lg my-5'>Shared Media</p>
  
        {/* If media files are available, render them in a scrollable area */}
        {chatFiles?.length ? (
          <ScrollArea className='rounded-md border max-w-80'>
            <div className='flex space-x-4 p-4'>
              {/* Loop through and display each media file */}
              {chatFiles.map(({ _id, type, content }) => (
                <div key={_id} className='w-[200px] rounded-xl overflow-hidden'>
                  <ChatTypeContent type={type} content={content} />
                </div>
              ))}
            </div>
            <ScrollBar orientation='horizontal' />
          </ScrollArea>
        ) : (
          // Display message if no media has been shared
          <p>No media shared</p>
        )}
      </div>
  
      {/* Separator line for UI separation */}
      <Separator className='my-5 border border-gray-100 dark:border-gray-800' />
  
      {/* Section for displaying groups in common */}
      <div className='flex flex-col gap-y-2'>
        <p className='font-bold text-lg'>
          {groupsInCommon?.length || 0}{' '}
          {pluralize('group', groupsInCommon?.length || 0)} in common
        </p>
  
        <div>
          {/* Loop through and display shared group conversations */}
          {groupsInCommon?.length &&
            groupsInCommon.map(({ conversation }) => (
              <Link
                href={`/chats/${conversation._id}`} // Navigate to the respective chat
                key={conversation._id}
                className='flex items-center space-x-3 hover:bg-gray-400 px-3 py-2 rounded-md'
              >
                {/* Avatar for the group chat */}
                <Avatar>
                  <AvatarFallback>
                    {conversation?.name?.slice(0, 2) || 'G'} {/* Display initials or fallback */}
                  </AvatarFallback>
                </Avatar>
                {/* Display group name */}
                <p>{conversation.name}</p>
              </Link>
            ))}
        </div>
      </div>
    </ScrollArea>
  );
  
};
