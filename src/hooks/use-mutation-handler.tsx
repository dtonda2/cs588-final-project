// Import necessary hooks from Convex and React
import { useMutation } from 'convex/react'; // Hook for performing mutations in a Convex backend
import { useCallback, useState } from 'react'; // React hooks for managing state and memoized functions

// Define a TypeScript type for the possible mutation states
type MutationState = 'idle' | 'loading' | 'success' | 'error';

// Define a generic hook for handling Convex mutations
// <T, P> are generic types:
// - `T` represents the expected return type of the mutation
// - `P` represents the type of the payload passed to the mutation
export const useMutationHandler = <T, P>(mutation: any) => {
  // Local state to track the mutation's current state (e.g., idle, loading, success, error)
  const [state, setState] = useState<MutationState>('idle');

  // `useMutation` is a Convex hook that returns a function for calling the mutation
  const mutationFn = useMutation(mutation);

  // Define a function `mutate` that executes the mutation with error handling
  const mutate = useCallback(
    async (payload: P): Promise<T | null> => {
      setState('loading'); // Set state to 'loading' before mutation starts

      try {
        // Call the mutation function with the given payload and wait for the result
        const result = await mutationFn(payload);
        setState('success'); // If successful, update state to 'success'
        return result;
      } catch (error) {
        setState('error'); // If an error occurs, update state to 'error'
        console.log('Mutation error', error); // Log the error for debugging
        throw error; // Re-throw the error to allow further handling if needed
      } finally {
        setState('idle'); // Reset state to 'idle' after the mutation attempt
      }
    },
    [mutationFn] // Dependency array ensures that `mutate` updates when `mutationFn` changes
  );

  // Return the mutation state and the mutate function for external use
  return { state, mutate };
};
