// Importing the Pusher library
// Pusher is a real-time messaging service that allows web applications to receive live updates
import Pusher from 'pusher';

// Creating a new Pusher instance using server-side credentials
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,   // Unique identifier for your Pusher application
  key: process.env.PUSHER_KEY!,       // Public key used by clients to connect
  secret: process.env.PUSHER_SECRET!, // Secret key used for authentication (keep this secure)
  cluster: process.env.PUSHER_CLUSTER!, // Defines the Pusher cluster region (e.g., "mt1", "us2")
  useTLS: true, // Ensures encrypted communication (TLS/SSL) for security
});

// Exporting the configured Pusher instance so it can be used in other parts of the application
export default pusher;
