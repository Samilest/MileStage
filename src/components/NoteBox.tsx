import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Smile, RotateCcw, HelpCircle } from 'lucide-react';
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
  disabled?: boolean;
  stage?: {
    revisions_included: number;
    revisions_used: number;
    extension_purchased: boolean;
    extension_revisions_used: number;
  };
  onMarkRevisionUsed?: (stageId: string, stage: any) => void;
  isMarkingRevisionUsed?: boolean;
}

export default function NoteBox({ stageId, authorType, authorName, stage, onMarkRevisionUsed, isMarkingRevisionUsed = false, disabled = false }: NoteBoxProps) {
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
      // Get all unviewed client messages
      const { data: unviewedMessages } = await supabase
        .from('stage_notes')
        .select('id')
        .eq('stage_id', stageId)
        .eq('author_type', 'client')
        .is('viewed_by_freelancer_at', null);

      if (unviewedMessages && unviewedMessages.length > 0) {
        const messageIds = unviewedMessages.map(m => m.id);
        await supabase
          .from('stage_notes')
          .update({ viewed_by_freelancer_at: new Date().toISOString() })
          .in('id', messageIds);

        console.log('🟡 [NoteBox] Marked', unviewedMessages.length, 'client messages as viewed');
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
      console.log('🟡 [NoteBox] Sending note...');
      const { error } = await supabase.from('stage_notes').insert({
        stage_id: stageId,
        author_type: authorType,
        author_name: authorName,
        message: messageToSend,
        is_read: false,
      });

      if (error) throw error;

      console.log('🟡 [NoteBox] Note sent successfully');

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
      console.error('🟡 [NoteBox] Error sending note:', error);
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
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-bold text-black">
            Notes & Feedback
          </h3>
          
          {/* Log Revision button - only for freelancers with revisions remaining */}
          {authorType === 'freelancer' && stage && onMarkRevisionUsed && (() => {
            const freeRevisionsRemaining = (stage.revisions_included || 0) - (stage.revisions_used || 0);
            const extensionRevisionsTotal = stage.extension_purchased ? 3 : 0;
            const extensionRevisionsUsed = stage.extension_revisions_used || 0;
            const extensionRevisionsRemaining = extensionRevisionsTotal - extensionRevisionsUsed;
            const totalRemaining = freeRevisionsRemaining + extensionRevisionsRemaining;
            
            if (totalRemaining <= 0) return null;
            
            return (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => onMarkRevisionUsed(stageId, stage)}
                  disabled={isMarkingRevisionUsed || disabled}
                  className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{isMarkingRevisionUsed ? '...' : 'Log Revision'}</span>
                </button>
                <div className="relative group">
                  <HelpCircle className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-help" />
                  <div className="absolute right-0 top-8 w-56 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
                    <p>Client asked for a significant change in chat? Click to count it as a revision.</p>
                    <p className="mt-2 text-gray-300 text-xs">({totalRemaining} of {(stage.revisions_included || 0) + extensionRevisionsTotal} remaining)</p>
                    <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
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
            placeholder={disabled ? "Stage locked - complete previous stage first" : "Type your message..."}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-12 text-sm resize-none focus:border-green-500 focus:outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            aria-label="Type your message"
            disabled={sending || disabled}
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
            disabled={!message.trim() || sending || isOverLimit || disabled}
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
