import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Smile } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Note {
  id: string;
  stage_id: string;
  author_type: 'freelancer' | 'client';
  author_name: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface NoteBoxProps {
  stageId: string;
  authorType: 'freelancer' | 'client';
  authorName: string;
}

export default function NoteBox({ stageId, authorType, authorName }: NoteBoxProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const emojis = ['😊', '😂', '❤️', '👍', '👎', '🎉', '✅', '❌', '🔥', '💡', '⚡', '✨', '👏', '💯', '🙌', '🤔'];

  const MAX_CHARS = 500;
  const charCount = message.length;
  const isOverLimit = charCount > MAX_CHARS;
  const isNearLimit = charCount > 450;

  useEffect(() => {
    let isMounted = true;

    const loadNotes = async () => {
      try {
        const { data, error } = await supabase
          .from('stage_notes')
          .select('*')
          .eq('stage_id', stageId)
          .order('created_at', { ascending: true });

        if (!isMounted) return;

        if (error) throw error;
        setNotes(data || []);
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching notes:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadNotes();

    // Mark client messages as viewed by freelancer when they open the page
    if (authorType === 'freelancer') {
      markClientMessagesAsViewed();
    }

    // ALWAYS subscribe to new messages (even in client portal)
    // This is the ONLY realtime subscription we keep
    const channel = supabase
      .channel(`stage-notes-${stageId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Only listen for new messages
          schema: 'public',
          table: 'stage_notes',
          filter: `stage_id=eq.${stageId}`,
        },
        (payload) => {
          if (!isMounted) return;
          const newNote = payload.new as Note;

          // Add new message to list (don't reload everything)
          setNotes((prev) => {
            // Prevent duplicates
            if (prev.find((n) => n.id === newNote.id)) {
              return prev;
            }
            return [...prev, newNote];
          });

          // Scroll to bottom when new message arrives
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [stageId]);

  useEffect(() => {
    scrollToBottom();
  }, [notes]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);


  const markClientMessagesAsViewed = async () => {
    try {
      console.log('🟡 [NoteBox] Starting to mark messages as viewed for stage:', stageId);
      
      // Get all unviewed client messages
      const { data: unviewedMessages, error: selectError } = await supabase
        .from('stage_notes')
        .select('id')
        .eq('stage_id', stageId)
        .eq('author_type', 'client')
        .is('viewed_by_freelancer_at', null);

      if (selectError) {
        console.error('🔴 [NoteBox] Error selecting unviewed messages:', selectError);
        return;
      }

      console.log('🟡 [NoteBox] Found', unviewedMessages?.length || 0, 'unviewed client messages');

      if (unviewedMessages && unviewedMessages.length > 0) {
        const messageIds = unviewedMessages.map(m => m.id);
        console.log('🟡 [NoteBox] Updating message IDs:', messageIds);
        
        const { data: updateData, error: updateError } = await supabase
          .from('stage_notes')
          .update({ viewed_by_freelancer_at: new Date().toISOString() })
          .in('id', messageIds);

        if (updateError) {
          console.error('🔴 [NoteBox] Error updating messages:', updateError);
          return;
        }

        console.log('✅ [NoteBox] Successfully marked', unviewedMessages.length, 'client messages as viewed');
        console.log('🟡 [NoteBox] Update response:', updateData);
      }
    } catch (error) {
      console.error('Error marking messages as viewed:', error);
    }
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || sending || isOverLimit) return;

    setSending(true);
    const messageToSend = trimmedMessage;

    // Clear input immediately for better UX
    setMessage('');

    try {
      console.log('🔵 [NoteBox] Sending note...');
      console.log('🔵 [NoteBox] Stage ID:', stageId);
      console.log('🔵 [NoteBox] Author Type:', authorType);
      console.log('🔵 [NoteBox] Author Name:', authorName);
      console.log('🔵 [NoteBox] Message:', messageToSend);

      const { data, error } = await supabase.from('stage_notes').insert({
        stage_id: stageId,
        author_type: authorType,
        author_name: authorName,
        message: messageToSend,
        is_read: false,
      }).select();

      console.log('🔵 [NoteBox] Insert response data:', data);
      console.log('🔵 [NoteBox] Insert response error:', error);

      if (error) {
        console.error('🔴 [NoteBox] Supabase error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error('🔴 [NoteBox] No data returned from insert!');
        throw new Error('Insert succeeded but no data returned');
      }

      console.log('✅ [NoteBox] Note sent successfully, data:', data);

      // ✅ If freelancer is replying, mark all client messages as viewed
      if (authorType === 'freelancer') {
        await markClientMessagesAsViewed();
        console.log('✅ [NoteBox] Marked client messages as viewed after reply');
      }

      // Realtime subscription will add the note to state
      // Scroll to bottom after a brief delay to allow realtime to update
      setTimeout(() => {
        scrollToBottom();
      }, 100);

      textareaRef.current?.focus();
    } catch (error) {
      console.error('🔴 [NoteBox] Error sending note:', error);
      // Restore message on error
      setMessage(messageToSend);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMessage = message.substring(0, start) + emoji + message.substring(end);

    setMessage(newMessage);
    setShowEmojiPicker(false);

    setTimeout(() => {
      textarea.focus();
      const newPosition = start + emoji.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-xl font-bold text-black flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Notes & Feedback
        </h3>
      </div>

      <div
        ref={messagesContainerRef}
        className="h-[300px] lg:h-[400px] overflow-y-auto p-4 space-y-3"
        style={{ scrollBehavior: 'smooth' }}
        role="log"
        aria-live="polite"
      >
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-2xl">💬</span>
            </div>
            <p className="text-gray-600 mb-2 text-center">No messages yet</p>
            <p className="text-sm text-gray-500 text-center">Start the conversation below ↓</p>
          </div>
        ) : (
          <>
            {notes.map((note) => {
              const isFreelancer = note.author_type === 'freelancer';
              return (
                <div
                  key={note.id}
                  className={`flex ${isFreelancer ? 'justify-start' : 'justify-end'} animate-fade-in`}
                >
                  <div
                    className={`max-w-[75%] lg:max-w-[75%] sm:max-w-[85%] p-3 rounded-lg ${
                      isFreelancer
                        ? 'bg-white border border-gray-200 ml-0 mr-auto'
                        : 'bg-green-50 ml-auto mr-0'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900">
                        {note.author_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(note.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm mt-1 whitespace-pre-wrap break-words">
                      {note.message}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="border-t border-gray-200 bg-white p-4">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-12 text-sm resize-none focus:border-green-500 focus:outline-none transition-colors"
            aria-label="Type your message"
            disabled={sending}
            maxLength={MAX_CHARS}
          />
          <div className="absolute right-3 top-3">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
              aria-label="Open emoji picker"
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute right-0 bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10"
            >
              <div className="grid grid-cols-4 gap-2">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-gray-100 rounded transition-colors"
                    aria-label={`Insert ${emoji} emoji`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span
            className={`text-xs ${
              isNearLimit ? 'text-red-500 font-semibold' : 'text-gray-500'
            }`}
          >
            {charCount}/{MAX_CHARS}
          </span>
          <button
            onClick={handleSend}
            disabled={!message.trim() || sending || isOverLimit}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send note"
          >
            {sending ? 'Sending...' : 'Send Note'}
          </button>
        </div>
      </div>
    </div>
  );
}
