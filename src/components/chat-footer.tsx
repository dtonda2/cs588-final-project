// File: src/components/chat-footer.tsx
import { zodResolver } from '@hookform/resolvers/zod';
import crypto from 'crypto';
import { ConvexError } from 'convex/values';
import { ChangeEvent, FC, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { api } from '../../convex/_generated/api';
import Picker from '@emoji-mart/react';
import { Paperclip, Send, Smile } from 'lucide-react';
import { useTheme } from 'next-themes';
import data from '@emoji-mart/data';
import TextareaAutoSize from 'react-textarea-autosize';
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import { v4 as uuid } from 'uuid';
import { AudioRecorder } from 'react-audio-voice-recorder';
import Pusher from 'pusher-js';
import axios from 'axios';

import { useMutationHandler } from '@/hooks/use-mutation-handler';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useSidebarWidth } from '@/hooks/use-sidebar-width';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabaseBrowserClient as supabase } from '@/supabase/supabaseClient';

// ————————————————————————————————————————————————
// Zod schema
// ————————————————————————————————————————————————
const ChatMessageSchema = z.object({
  content: z.string().min(1, { message: 'Message must not be empty' }),
});

// ————————————————————————————————————————————————
// AES‐GCM + HMAC helper
// ————————————————————————————————————————————————
export function encryptText(plaintext: string, password: string): string {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const fullKey = crypto.pbkdf2Sync(password, salt, 200_000, 64, 'sha512');
  const encKey = fullKey.slice(0, 32);
  const hmacKey = fullKey.slice(32);
  const cipher = crypto.createCipheriv('aes-256-gcm', encKey, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const preHmac = Buffer.concat([salt, iv, authTag, ciphertext]);
  const hmac = crypto.createHmac('sha256', hmacKey).update(preHmac).digest();
  return Buffer.concat([preHmac, hmac]).toString('base64');
}

// ————————————————————————————————————————————————
// ChatFooter component
// ————————————————————————————————————————————————
type ChatFooterProps = {
  chatId: string;
  currentUserId: string;
  username: string;
  reciverName: string;
};

export const ChatFooter: FC<ChatFooterProps> = ({
  chatId,
  currentUserId,
  username,
  reciverName,
}) => {
  // mutation
  const { mutate: createMessage, state: createMessageState } =
    useMutationHandler(api.message.create);

    

  // UI hooks
  const isDesktop = useIsDesktop();
  const { sidebarWidth } = useSidebarWidth();
  const { resolvedTheme } = useTheme();

  // local state
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [imageOrPdf, setImageOrPdf] = useState<Blob | null>(null);
  const [imageOrPdfModalOpen, setImageOrPdfModalOpen] = useState(false);
  const [sendingFile, setSendingFile] = useState(false);

  // register FilePond plugins
  registerPlugin(FilePondPluginImagePreview, FilePondPluginFileValidateType);

  // form
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
  } = useForm<z.infer<typeof ChatMessageSchema>>({
    resolver: zodResolver(ChatMessageSchema),
    defaultValues: { content: '' },
  });
  const content = watch('content');

  // Pusher typing indicator
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusher.subscribe(chatId);
    channel.bind('typing', (data: { isTyping: boolean; userId: string }) => {
      if (data.userId !== currentUserId) setIsTyping(data.isTyping);
    });
    return () => {
      pusher.unsubscribe(chatId);
    };
  }, [chatId, currentUserId]);

  // send
  const onSubmit = async (vals: z.infer<typeof ChatMessageSchema>) => {
    const text = vals.content.trim();
    if (!text) return;

    try {
      // encrypted log
      const key = process.env.NEXT_PUBLIC_LOG_KEY!;
      const ts = new Date().toISOString();
      const enc = encryptText(text, key);
      let encryptedData = enc
      await axios.post(
        '/api/log',
        { chatId, username, reciverName, encryptedData },
        { headers: { 'x-log-signature': key } }
      );


      // backend
      await createMessage({ conversationId: chatId, type: 'text', content: [text] });
      // clear
      reset({ content: '' });
    } catch (e: any) {
      console.error(e);
      toast.error(e instanceof ConvexError ? e.data : 'Failed to send');
    }
  };

  // typing handler
  const onChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue('content', e.target.value);
    if (!typing) {
      setTyping(true);
      axios.post('/api/type-indicator', {
        channel: chatId,
        event: 'typing',
        data: { isTyping: true, userId: currentUserId },
      });
      setTimeout(() => {
        setTyping(false);
        axios.post('/api/type-indicator', {
          channel: chatId,
          event: 'typing',
          data: { isTyping: false, userId: currentUserId },
        });
      }, 2000);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={isDesktop ? { width: `calc(100% - ${sidebarWidth + 3}%)` } : undefined}
      className="fixed bottom-0 w-full flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 z-30"
    >
      {/* Emoji */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button"><Smile size={20} /></button>
        </PopoverTrigger>
        <PopoverContent>
          <Picker
            theme={resolvedTheme}
            data={data}
            onEmojiSelect={(emoji: any) =>
              setValue('content', getValues('content') + emoji.native)
            }
          />
        </PopoverContent>
      </Popover>

      {/* File */}
      <Paperclip
        className="cursor-pointer"
        onClick={() => setImageOrPdfModalOpen(true)}
      />

      {/* Text area */}
      <Controller
        control={control}
        name="content"
        render={({ field }) => (
          <TextareaAutoSize
            {...field}
            rows={1}
            maxRows={3}
            disabled={createMessageState === 'loading'}
            placeholder="Type a message"
            className="flex-grow bg-gray-200 dark:bg-gray-600 rounded-2xl px-4 py-2 focus:outline-none"
            onChange={e => {
              field.onChange(e);
              onChange(e);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(onSubmit)();
              }
            }}
          />
        )}
      />
      {isTyping && <p className="text-xs ml-1">typing…</p>}

      {/* Send */}
      <Send
        size={24}
        className={`cursor-pointer ${
          createMessageState === 'loading' || !content.trim()
            ? 'opacity-50 pointer-events-none'
            : ''
        }`}
        onClick={() => handleSubmit(onSubmit)()}
      />

      {/* Upload Dialog */}
      <Dialog
        open={imageOrPdfModalOpen}
        onOpenChange={() => setImageOrPdfModalOpen(o => !o)}
      >
        <DialogTrigger asChild>
          {/* no extra <button> here, the Paperclip above triggers it */}
          <span />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>Select image or PDF</DialogDescription>
          </DialogHeader>
          <FilePond
            files={imageOrPdf ? [imageOrPdf] : []}
            allowMultiple={false}
            acceptedFileTypes={['image/*', 'application/pdf']}
            onupdatefiles={items => setImageOrPdf(items[0]?.file ?? null)}
          />
          <DialogFooter>
            <Button
              onClick={async () => {
                /* handleImageUpload… */
              }}
              disabled={sendingFile}
            >
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audio */}
      {isDesktop && (
        <AudioRecorder
          onRecordingComplete={blob => {
            /* uploadAudio… */
          }}
          audioTrackConstraints={{
            noiseSuppression: true,
            echoCancellation: true,
          }}
        />
      )}
    </form>
  );
};
