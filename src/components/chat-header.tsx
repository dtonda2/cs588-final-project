'use client'; // Indicates that this component is a client-side component in Next.js

// Import icons for navigation and call actions from lucide-react.
import { ChevronLeft, Phone, Video } from 'lucide-react';
// Import Next.js Link component for client-side navigation.
import Link from 'next/link';
// Import the Functional Component (FC) type from React.
import { FC } from 'react';
// Import useQuery from Convex to fetch data from the backend.
import { useQuery } from 'convex/react';
// Import useRouter from Next.js to programmatically navigate.
import { useRouter } from 'next/navigation';
// Import Convex API methods.
import { api } from '../../convex/_generated/api';

// Import custom hook for managing the sidebar width.
import { useSidebarWidth } from '@/hooks/use-sidebar-width';
// Import utility function 'cn' for conditionally merging Tailwind CSS classes.
import { cn } from '@/lib/utils';
// Import Avatar components for displaying user images.
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// Import Sheet components for displaying modals or side panels.
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
// Import custom hook to detect if the device is a desktop.
import { useIsDesktop } from '@/hooks/use-is-desktop';
// Import Button component for clickable actions.
import { Button } from '@/components/ui/button';
// Import ProfileSheet component for displaying a detailed profile view.
import { ProfileSheet } from '@/components/profile-sheet';
// Import GroupSheet component for displaying group details.
import { GroupSheet } from '@/components/group-sheet';

// Define the props type for the ChatHeader component.
// - chatAvatar: URL of the chat or user's avatar image.
// - username: Name to display in the header.
// - isGroup: Boolean flag indicating if the chat is a group chat.
// - chatId: Unique identifier of the chat conversation.
// - status: Current status (e.g., online, offline) of the user.
type ChatHeaderProps = {
  chatAvatar: string;
  username: string;
  isGroup: boolean;
  chatId: string;
  status: string;
};

// ChatHeader component renders the header area of a chat conversation.
// It displays navigation, avatar, username, and call action buttons.
export const ChatHeader: FC<ChatHeaderProps> = ({
  chatAvatar,
  chatId,
  isGroup,
  status,
  username,
}) => {
  // Retrieve the current sidebar width from the custom hook.
  const { sidebarWidth } = useSidebarWidth();
  // Determine if the current viewport is a desktop using the custom hook.
  const isDesktop = useIsDesktop();
  // Get the router object to allow programmatic navigation.
  const router = useRouter();
  // Fetch the list of conversations using Convex's useQuery hook.
  const conversations = useQuery(api.conversations.get);

  // Filter the conversations to find only group chats.
  const groupsInCommon = conversations?.filter(
    ({ conversation }) => conversation.isGroup
  );

  // Function to initiate a video call by navigating to the call route.
  const videoCall = () => router.push(`/calls/${chatId}`);

  return (
    // Render the header container with fixed positioning at the top.
    // Uses the `cn` utility to conditionally apply background color based on active state.
    <div
      className={cn(
        'fixed bg-white dark:bg-gray-800 px-3 md:pr-10 flex items-center justify-between space-x-3 z-30 top-0 w-full h-20'
      )}
      // If on desktop, adjust the width to account for the sidebar width.
      style={isDesktop ? { width: `calc(100% - ${sidebarWidth + 3}%)` } : {}}
    >
      {/* Left section of the header: includes back navigation and profile display */}
      <div className='flex space-x-3'>
        {/* Back button: visible only on mobile (hidden on medium devices and above) */}
        <div className='md:hidden'>
          <Button asChild variant='outline' size='icon'>
            {/* Wrap the ChevronLeft icon inside a Link to navigate back to the chats list */}
            <Link href='/chats'>
              <ChevronLeft />
            </Link>
          </Button>
        </div>
        {/* Sheet component to display profile or group details when triggered */}
        <Sheet>
          {/* SheetTrigger: wraps the avatar and username, making them clickable */}
          <SheetTrigger className='flex items-center cursor-pointer space-x-4'>
            <Avatar>
              {/* Display the chat or user avatar image */}
              <AvatarImage src={chatAvatar} />
              {/* Fallback displays the first letter of the username */}
              <AvatarFallback>{username[0]}</AvatarFallback>
            </Avatar>
            {/* Display the username as a bold heading */}
            <h2 className='font-bold text-lg'>{username}</h2>
          </SheetTrigger>
          {/* SheetContent: modal panel that opens when the trigger is clicked */}
          <SheetContent className='bg-white dark:bg-black dark:text-white w-80 md:w-96'>
            {/* Conditionally render GroupSheet if it's a group chat, otherwise render ProfileSheet */}
            {isGroup ? (
              <GroupSheet chatId={chatId} groupName={username} />
            ) : (
              <ProfileSheet
                username={username}
                status={status}
                chatId={chatId}
                groupsInCommon={groupsInCommon}
                chatAvatar={chatAvatar}
              />
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* Right section of the header: contains action icons for video and phone calls */}
      <div className='flex items-center space-x-4'>
        {/* Video icon triggers the video call function on click */}
        <Video className='cursor-pointer' onClick={videoCall} />
        {/* Phone icon also triggers the video call function (could be modified for audio-only) */}
        <Phone className='cursor-pointer' onClick={videoCall} />
      </div>
    </div>
  );
};
