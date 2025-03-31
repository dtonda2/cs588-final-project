// Importing the `createBrowserClient` function from the `@supabase/ssr` package.
// This function is used to create a Supabase client specifically for use in browser environments.
// The `@supabase/ssr` package is optimized for use with Next.js, supporting both server-side rendering (SSR) and client-side interactions.
import { createBrowserClient } from '@supabase/ssr';

/*
  Creating an instance of the Supabase client for use in the browser.

  - `process.env.NEXT_PUBLIC_SUPABASE_URL!`:
    - This retrieves the public Supabase project URL from environment variables.
    - The `NEXT_PUBLIC_` prefix means this variable is available on both the client and server.
    - The `!` (non-null assertion) ensures TypeScript doesn't complain about possible `undefined` values.

  - `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!`:
    - This retrieves the anonymous authentication key for Supabase from environment variables.
    - The anon key allows unauthenticated users to interact with Supabase within the limits of the defined security rules.
    - Again, the `!` ensures TypeScript treats this as a non-null value.

  This client allows the frontend to perform operations like:
  - Fetching and storing data in the Supabase database.
  - Authenticating users via Supabase Auth.
  - Handling real-time updates using Supabase Realtime.
*/
export const supabaseBrowserClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
