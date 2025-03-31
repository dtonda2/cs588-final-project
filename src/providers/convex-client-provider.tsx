'use client';

// Importing necessary types and components from React.
import { FC, ReactNode } from 'react';

// Importing authentication-related components from Clerk.
// - `ClerkProvider`: Provides authentication context using Clerk.
// - `useAuth`: A hook to access authentication details.
// - `SignInButton`: A pre-built sign-in button component.
import { ClerkProvider, useAuth, SignInButton } from '@clerk/clerk-react';

// Importing Convex-related authentication components that work with Clerk.
import { ConvexProviderWithClerk } from 'convex/react-clerk';

// Importing Convex authentication components to manage authenticated and unauthenticated states.
import {
  Authenticated, // Renders content only when the user is authenticated.
  ConvexReactClient, // Client instance for interacting with Convex backend.
  Unauthenticated, // Renders content only when the user is not authenticated.
} from 'convex/react';

// Importing an icon from the `react-icons/fa6` package for UI styling.
import { FaSignalMessenger } from 'react-icons/fa6';

// Importing custom UI components (Card, CardContent, etc.) from the local project.
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Retrieving environment variables for Convex and Clerk configuration.
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!; 
// `NEXT_PUBLIC_` ensures the variable is accessible on both client and server.

const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!;

// Creating an instance of the Convex client to interact with the backend.
const convex = new ConvexReactClient(CONVEX_URL);

/*
  `ConvexClientProvider` is a React component that wraps children components with
  authentication and database context, enabling secure user access.

  - `FC<{ children: ReactNode }>`:
    - `FC`: Stands for Function Component in TypeScript.
    - `{ children: ReactNode }`: Specifies that this component accepts child elements.
*/
const ConvexClientProvider: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    // Wrapping the entire component with Clerk's authentication provider.
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>

      {/* Wrapping the application with Convex provider, integrating Clerk authentication. */}
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        
        {/* Content inside `<Authenticated>` is only rendered if the user is signed in. */}
        <Authenticated>{children}</Authenticated>

        {/* Content inside `<Unauthenticated>` is shown if the user is NOT signed in. */}
        <Unauthenticated>
          {/* Full-screen background for the authentication page. */}
          <div className='bg-slate-900 w-svw h-dvh grid place-content-center'>
            
            {/* Centered logo */}
            <div className='grid place-content-center mb-5'>
              <FaSignalMessenger size={100} className='text-primary-main' />
            </div>

            {/* Authentication card with a sign-in button */}
            <Card className='bg-slate-800 w-[350px] border-none shadow-xl'>
              <CardHeader>
                <CardTitle className='text-white'>Authenticate</CardTitle>
              </CardHeader>
              <CardContent className='text-white'>
                {/* Sign-in button provided by Clerk */}
                <SignInButton />
              </CardContent>
            </Card>
          </div>
        </Unauthenticated>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};

// Exporting `ConvexClientProvider` so it can be used throughout the application.
export default ConvexClientProvider;
