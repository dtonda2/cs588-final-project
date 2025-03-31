// Importing the Clerk middleware from the '@clerk/nextjs/server' package.
// Clerk is a user authentication and identity management service for Next.js applications.
// The middleware helps secure routes by enforcing authentication rules.
import { clerkMiddleware } from '@clerk/nextjs/server';

// Exporting the default middleware function by calling `clerkMiddleware()`.
// This middleware will automatically enforce authentication on matched routes,
// ensuring that users are properly signed in before accessing protected pages or API routes.
export default clerkMiddleware();

/*
  The `config` object defines the URL patterns (matchers) that the middleware should apply to.
  Next.js middleware runs on the Edge runtime and can intercept requests before they reach API routes
  or page handlers. The `matcher` property is used to define which requests should be processed by this middleware.
*/
export const config = {
  matcher: [
    /*
      This pattern `'/((?!.*\\..*|_next).*)'` ensures that:
      - The middleware applies to all routes **except** those containing a dot (`.`), which usually indicates
        a static file (e.g., images, stylesheets, JavaScript files).
      - The exception for `"_next"` ensures that Next.js internals (e.g., `_next/static/`, `_next/image/`) are
        not processed by the middleware, improving performance.
    */
    '/((?!.*\\..*|_next).*)',

    /*
      The `'/'` matcher ensures that the middleware runs on the homepage (`/`).
    */
    '/',

    /*
      This pattern `'/api|trpc(.*)'` ensures that:
      - The middleware applies to all API routes under `/api/*`.
      - It also applies to all TRPC routes (`/trpc/*`), which are used for building type-safe APIs in Next.js.
    */
    '/(api|trpc)(.*)',
  ],
};
