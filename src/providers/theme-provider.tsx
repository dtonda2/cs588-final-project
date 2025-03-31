// The `"use client"` directive indicates that this file is a React Client Component in Next.js 13+.
// It ensures that the component runs in the browser and can use client-side features like state and effects.
'use client';

// Importing the React library to use React components and hooks.
import * as React from 'react';

// Importing the `ThemeProvider` from the `next-themes` package.
// `next-themes` is a library that enables dark mode and theme switching in Next.js applications.
import { ThemeProvider as NextThemesProvider } from 'next-themes';

// Importing the `ThemeProviderProps` type from `next-themes` to provide TypeScript type safety.
// This ensures that the props passed to the `ThemeProvider` component match what `next-themes` expects.
import { type ThemeProviderProps } from 'next-themes/dist/types';

/*
  Defining a custom `ThemeProvider` component that wraps the `NextThemesProvider` from `next-themes`.

  - `({ children, ...props }: ThemeProviderProps)`: 
    - This is a functional component that takes `children` and any additional props.
    - `children`: Represents the components wrapped inside this provider.
    - `...props`: A spread operator to pass down all other props to the `NextThemesProvider`.

  - The component returns the `NextThemesProvider`, passing along all received props.
  - This allows the application to manage themes dynamically (e.g., dark mode, system theme, or custom themes).
*/
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
