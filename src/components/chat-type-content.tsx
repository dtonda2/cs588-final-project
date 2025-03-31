// Importing the FC (Function Component) type from React for typing the component.
import { FC } from 'react';
// Importing the AspectRatio component, which maintains a specific aspect ratio for its content.
import { AspectRatio } from '@/components/ui/aspect-ratio';
// Importing Link from Next.js for navigation to external documents.
import Link from 'next/link';
// Importing Image from Next.js to optimize image rendering.
import Image from 'next/image';

// Declaring the ChatTypeContent functional component.
// The component accepts two props:
// - type: A string indicating the type of content (e.g., 'image', 'audio', 'pdf').
// - content: An array of strings containing URLs or file paths for the media.
export const ChatTypeContent: FC<{
  type: string;
  content: string[];
}> = ({ content, type }) => {
  return (
    // The AspectRatio component ensures that its children maintain a 1:1 aspect ratio.
    <AspectRatio ratio={1 / 1}>
      
      {/* Conditional rendering for image content.
          If the type is 'image', an Image component is rendered using the first element of the content array. */}
      {type === 'image' && (
        <Image
          src={content[0]}              // Source URL of the image.
          alt='file'                    // Alternative text for accessibility.
          width={450}                   // Width of the image.
          height={235}                  // Height of the image.
          className='rounded-md object-cover' // Tailwind CSS classes for styling: rounded corners and cover-fit.
        />
      )}

      {/* Conditional rendering for audio content.
          If the type is 'audio', an HTML audio element is rendered with controls enabled. */}
      {type === 'audio' && (
        <audio 
          src={content[0]}             // Source URL of the audio file.
          controls                     // Enables audio controls (play, pause, etc.).
          className='w-full h-full'     // Tailwind CSS classes to set width and height to 100% of the container.
        />
      )}

      {/* Conditional rendering for PDF content.
          If the type is 'pdf', a Link component is used to open the PDF in a new browser tab.
          The link is styled with a background color and an underline for the text. */}
      {type === 'pdf' && (
        <Link
          href={content[0]}            // URL of the PDF document.
          target='_blank'              // Opens the link in a new tab.
          rel='noopener noreferrer'    // Security attributes to prevent access to the window.opener property.
          className='bg-purple-500'     // Tailwind CSS class for background color.
        >
          <p className='underline'>PDF Document</p> {/* Underlined text indicating the document is a PDF. */}
        </Link>
      )}
    </AspectRatio>
  );
};
