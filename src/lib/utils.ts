// Importing utilities from `clsx` and `tailwind-merge`.
// - `clsx`: A utility for conditionally joining class names.
// - `twMerge`: A function that intelligently merges Tailwind CSS classes to avoid conflicts.
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Importing date utilities from `date-fns` to handle time formatting and comparisons.
import {
  format,               // Formats a date into a human-readable string.
  differenceInHours,    // Calculates the difference between two dates in hours.
  differenceInDays,     // Calculates the difference between two dates in days.
  differenceInWeeks,    // Calculates the difference between two dates in weeks.
} from 'date-fns';

/**
 * Function: cn
 * 
 * Combines multiple class names into a single string, merging Tailwind classes intelligently.
 * 
 * @param {ClassValue[]} inputs - A list of class names (could be strings, objects, or arrays).
 * @returns {string} - A single optimized string with merged classes.
 * 
 * Example:
 *   cn('text-red-500', 'bg-blue-500', 'text-red-400') 
 *   -> 'bg-blue-500 text-red-400' (removes conflicting `text-red-500`)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Function: isRouteActivePath
 * 
 * Checks whether a given route is active based on the current path.
 * 
 * @param {string} currentPath - The current URL path.
 * @param {string} targetPath - The target path to compare against.
 * @returns {boolean} - `true` if the target path is active, `false` otherwise.
 * 
 * Logic:
 * - If `targetPath` is `'/'`, it considers `'/'` or any path containing `'chats'` as active.
 * - Otherwise, it checks if `currentPath` matches `targetPath` exactly or contains it as a substring.
 * 
 * Example:
 *   isRouteActivePath('/chats/123', '/')  -> true
 *   isRouteActivePath('/settings', '/settings')  -> true
 *   isRouteActivePath('/profile', '/dashboard')  -> false
 */
export function isRouteActivePath(currentPath: string, targetPath: string) {
  if (targetPath === '/') {
    return currentPath === '/' || currentPath.includes('chats');
  }

  return currentPath === targetPath || currentPath.includes(targetPath);
}

/**
 * Function: getFormattedTimestamp
 * 
 * Formats a given timestamp based on how recent it is.
 * 
 * @param {number} timestamp - The UNIX timestamp (in milliseconds) to format.
 * @returns {string} - A formatted date string based on the time difference.
 * 
 * Logic:
 * - If the timestamp is within the last 24 hours -> Returns the time in `HH:mm` format.
 * - If it's within the last 7 days -> Returns the day of the week (e.g., "Mon", "Tue").
 * - If it's within the last 4 weeks -> Returns the week number (e.g., "Week 2").
 * - Otherwise -> Returns the month name (e.g., "Jan", "Feb").
 * 
 * Example:
 *   getFormattedTimestamp(Date.now() - 2 * 60 * 60 * 1000)  -> "14:30"
 *   getFormattedTimestamp(Date.now() - 3 * 24 * 60 * 60 * 1000)  -> "Wed"
 *   getFormattedTimestamp(Date.now() - 10 * 24 * 60 * 60 * 1000) -> "Week 2"
 *   getFormattedTimestamp(Date.now() - 40 * 24 * 60 * 60 * 1000) -> "Feb"
 */
export const getFormattedTimestamp = (timestamp: number) => {
  const now = new Date();      // Get the current date and time.
  const date = new Date(timestamp);  // Convert timestamp to a Date object.

  if (differenceInHours(now, date) < 24) {
    return format(date, 'HH:mm'); // Show hours and minutes if less than a day old.
  } else if (differenceInDays(now, date) < 7) {
    return format(date, 'EEE');   // Show the weekday name if within the last week.
  } else if (differenceInWeeks(now, date) < 4) {
    return format(date, "'Week' w");  // Show "Week X" if within the last month.
  } else {
    return format(date, 'MMM');   // Show month name if older than four weeks.
  }
};

/**
 * Function: pluralize
 * 
 * Returns the plural form of a word based on a given number.
 * 
 * @param {string} word - The singular form of the word.
 * @param {number} length - The count to determine pluralization.
 * @returns {string} - The singular or plural form of the word.
 * 
 * Example:
 *   pluralize('message', 1)  -> "message"
 *   pluralize('message', 3)  -> "messages"
 *   pluralize('user', 0)     -> "users"
 */
export const pluralize = (word: string, length: number) =>
  length <= 1 ? word : `${word}s`;
