// Import the useUser hook from Clerk for authentication details.
import { useUser } from '@clerk/clerk-react';
// Import necessary LiveKit components for video conferencing and audio rendering.
import {
  LiveKitRoom,         // Main container to join a LiveKit room.
  RoomAudioRenderer,   // Renders the audio tracks from the LiveKit room.
  VideoConference,     // Component that handles video conferencing UI.
} from '@livekit/components-react';
// Import LiveKit component styles.
import '@livekit/components-styles';
// Import React hooks and types.
import { useEffect, useState, FC } from 'react';

// Define the MeetingRoom component which accepts a 'chatId' as a prop.
export const MeetingRoom: FC<{ chatId: string }> = ({ chatId }) => {
  // Local state to store the LiveKit token required to connect to the room.
  const [token, setToken] = useState('');

  // Retrieve the authenticated user from Clerk.
  const { user } = useUser();

  // Extract the user's primary email address.
  const email = user?.emailAddresses[0].emailAddress!;

  // useEffect hook to fetch the LiveKit token when the chatId or email changes.
  useEffect(() => {
    // Define an immediately invoked async function to perform the fetch.
    (async () => {
      try {
        // Fetch the LiveKit token from the API endpoint, passing room and username as query parameters.
        const resp = await fetch(
          `/api/livekit?room=${chatId}&username=${email}`
        );
        // Parse the JSON response.
        const data = await resp.json();
        // Update the token state with the fetched token.
        setToken(data.token);
      } catch (e) {
        // Log any errors that occur during the fetch.
        console.error(e);
      }
    })();
  }, [chatId, email]); // Dependency array ensures the effect runs when chatId or email changes.

  // If the token is not yet available, render a loading indicator.
  if (token === '') {
    return <div>Loading</div>;
  }

  // Once the token is available, render the LiveKitRoom component.
  return (
    <LiveKitRoom
      video={true} // Enable video streaming.
      audio={true} // Enable audio streaming.
      token={token} // Pass the fetched token to authenticate the room connection.
      connect={true} // Automatically connect to the room.
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL} // LiveKit server URL from environment variables.
      data-lk-theme='default' // Set the LiveKit theme.
      style={{ height: '100dvh' }} // Set the height of the room to 100% of the dynamic viewport height.
    >
      {/* Render the video conferencing UI */}
      <VideoConference />
      {/* Render the audio tracks in the room */}
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
};
