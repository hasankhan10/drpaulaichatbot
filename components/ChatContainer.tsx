'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  Check, 
  Shield, 
  AlertCircle, 
  ArrowRight
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read'; // WhatsApp receipt status for user messages
  isForm?: boolean; // Form indicator
}

interface ChatContainerProps {
  isOpen?: boolean;
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
}

// Pure unique ID generator outside of React component rendering context to satisfy React 19 Compiler purity rules
let messageCounter = 0;
const generateUniqueId = (): string => {
  messageCounter += 1;
  return `msg_${Date.now()}_${messageCounter}`;
};

// Helper to format bold markdown tags dynamically without third-party dependencies
const formatMessageContent = (content: string) => {
  const parts = content.split(/(\*\*[^\*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-extrabold select-text">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

// ==========================================
// 1. PREMIUM INLINE BOOKING FORM COMPONENT
// ==========================================
interface BookingFormProps {
  onSuccess: (name: string, number: string) => void;
  initialConcern?: string;
}

const BookingForm: React.FC<BookingFormProps> = ({ onSuccess, initialConcern = '' }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [number, setNumber] = useState('');
  const [concern, setConcern] = useState(initialConcern);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Pre-populate concern if initialConcern changes
  useEffect(() => {
    if (initialConcern && !concern) {
      setConcern(initialConcern);
    }
  }, [initialConcern]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!number.trim()) {
      setError('Please enter your mobile number.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          age: age.trim() || 'N/A',
          number: number.trim(),
          concern: concern.trim() || 'N/A',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit booking request.');
      }

      setSuccess(true);
      onSuccess(name.trim(), number.trim());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-emerald-800 space-y-2 select-text shadow-sm transition-all duration-300">
        <div className="flex items-center gap-2 font-bold text-xs">
          <Check className="w-5 h-5 text-emerald-600 bg-emerald-100 rounded-full p-1 shrink-0 animate-bounce" />
          <span>Booking Requested!</span>
        </div>
        <p className="text-[11px] leading-relaxed font-medium">
          Thank you, <strong>{name}</strong>. Our clinical coordinator will call or WhatsApp you shortly at <strong>{number}</strong> to finalize your consultation.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-100 p-4 rounded-2xl space-y-3.5 shadow-sm text-slate-700 w-full select-text transition-all duration-300">
      <div className="border-b border-slate-100 pb-2">
        <h4 className="font-bold text-[12px] text-slate-800 flex items-center gap-1.5">
          📅 Request Consultation Slot
        </h4>
        <p className="text-[9px] text-slate-400 font-medium">Provide quick details below</p>
      </div>

      <div className="space-y-2.5">
        {/* Name input */}
        <div className="space-y-1">
          <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Full Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            placeholder="e.g., Rajesh Sharma"
            className="w-full text-xs bg-slate-50 border border-slate-100 focus:border-red-500 focus:bg-white focus:outline-none rounded-lg px-2.5 py-2 text-slate-800 transition-all"
          />
        </div>

        {/* Age & Mobile row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1 space-y-1">
            <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              disabled={submitting}
              placeholder="Age"
              min="1"
              max="120"
              className="w-full text-xs bg-slate-50 border border-slate-100 focus:border-red-500 focus:bg-white focus:outline-none rounded-lg px-2.5 py-2 text-slate-800 transition-all"
            />
          </div>
          <div className="col-span-2 space-y-1">
            <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Mobile Number *</label>
            <input
              type="tel"
              required
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              disabled={submitting}
              placeholder="e.g., +91 9876543210"
              className="w-full text-xs bg-slate-50 border border-slate-100 focus:border-red-500 focus:bg-white focus:outline-none rounded-lg px-2.5 py-2 text-slate-800 transition-all"
            />
          </div>
        </div>

        {/* Concern input */}
        <div className="space-y-1">
          <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Primary Concern</label>
          <textarea
            rows={2}
            value={concern}
            onChange={(e) => setConcern(e.target.value)}
            disabled={submitting}
            placeholder="e.g., Hair loss, Hair transplant, Korean Facial..."
            className="w-full text-xs bg-slate-50 border border-slate-100 focus:border-red-500 focus:bg-white focus:outline-none rounded-lg px-2.5 py-1.5 text-slate-800 transition-all resize-none custom-scrollbar"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 text-[10px] text-rose-700 px-2.5 py-1.5 rounded-lg border border-rose-100 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className={`w-full py-2 text-xs font-bold text-white rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
          submitting 
            ? 'bg-slate-400 cursor-not-allowed' 
            : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 active:scale-[0.98]'
        }`}
      >
        {submitting ? 'Submitting Request...' : 'Confirm Appointment Slot'}
        {!submitting && <ArrowRight className="w-3.5 h-3.5" />}
      </button>
    </form>
  );
};

// ==========================================
// 2. MAIN CHAT CONSOLE CONTAINER COMPONENT
// ==========================================
export default function ChatContainer({ isOpen = false, onClose, showCloseButton = true, className = '' }: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [capturedLeadName, setCapturedLeadName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set mounted status on client load to avoid dynamic hydration mismatches
  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  // Trigger the welcome message typing effect (3 seconds) only when the chat window is actively opened by the user
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setIsTyping(true);
      const timer = setTimeout(() => {
        setIsTyping(false);
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: "Namaste! 🙏 Welcome to Dr. Paul's Hair & Skin Clinic. How can I assist you today? Feel free to ask about our FUE/QHT Painless Hair Transplants, Korean Glass Skin facials, Fusion Homeopathy, or clinical locations!",
            timestamp: new Date(),
          },
        ]);
      }, 3000); // 3 seconds typing delay for the initial welcome message

      return () => clearTimeout(timer);
    }
  }, [isOpen, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-dismiss toast notification after 5 seconds
  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => {
        setErrorMsg(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  // Send Message Logic with Ticks and Dynamic Intercept Form slide-in
  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || inputValue.trim();
    if (!messageText) return;

    if (!textToSend) {
      setInputValue('');
    }
    setErrorMsg(null);

    const userMessageId = generateUniqueId();

    // 1. Append User Message immediately with 'sent' status (1 tick)
    const userMsg: Message = {
      id: userMessageId,
      role: 'user',
      content: messageText === 'I want to book an appointment' ? '📅 Book Appointment' : messageText,
      timestamp: new Date(),
      status: 'sent',
    };
    setMessages((prev) => [...prev, userMsg]);

    // Count how many user messages are in the history to scale delays
    const userMessageCount = messages.filter((m) => m.role === 'user').length;
    // Scale factor: 1.0 for the first user message, 0.5 (50% reduction) for subsequent ones
    let delayScale = userMessageCount === 0 ? 1.0 : 0.5;

    // Hyper-realistic "After Hours" logic:
    // If the client time is after clinic hours (7:00 PM to 10:00 AM), we scale response delays by 1.5X
    // to perfectly simulate an on-call clinical assistant typing on their phone from home!
    const currentHour = new Date().getHours();
    const isAfterHours = currentHour >= 19 || currentHour < 10;
    if (isAfterHours) {
      delayScale = delayScale * 1.5;
    }

    // INTERCEPT BOOKING REQUESTS: Immediately slide up the structured booking form card!
    if (messageText === 'I want to book an appointment') {
      // Delivered after 500ms (scaled)
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === userMessageId ? { ...msg, status: 'delivered' as const } : msg
          )
        );
      }, 500 * delayScale);

      // Read after 1000ms (scaled)
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === userMessageId ? { ...msg, status: 'read' as const } : msg
          )
        );
      }, 1000 * delayScale);

      // Bouncing dots typing begins after 1500ms
      setTimeout(() => {
        setIsTyping(true);
      }, 1500 * delayScale);

      // Insert intro message and form bubble after 3000ms
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: generateUniqueId(),
            role: 'assistant',
            content: "Certainly! I would be happy to help you provisionally book a clinic slot. Please fill out your details in the brief form card below to reserve your appointment:",
            timestamp: new Date(),
          },
          {
            id: generateUniqueId(),
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isForm: true,
          }
        ]);
      }, 3000 * delayScale);

      return; // Exit out, bypassing AI completely!
    }

    // Standard AI fetch flow for conversational questions
    let apiResponseText = '';
    let fetchErrorOccurred = false;
    let fetchErrorMessage = '';

    const apiFetchPromise = (async () => {
      try {
        const chatHistory = [...messages, userMsg].map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: chatHistory }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to get response');
        }

        apiResponseText = data.message;
      } catch (err: unknown) {
        fetchErrorOccurred = true;
        fetchErrorMessage = err instanceof Error ? err.message : 'Unable to connect to Dr. Paul AI. Please configure GEMINI_API_KEY in .env.local.';
        console.error('Background fetch error:', err);
      }
    })();

    // Ticks Delivered transition after 500ms
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessageId ? { ...msg, status: 'delivered' as const } : msg
        )
      );
    }, 500);

    // Ticks Read transition after 1000ms
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessageId ? { ...msg, status: 'read' as const } : msg
        )
      );
    }, 1000);

    // Bouncing dots typing indicator begins after 1500ms
    setTimeout(() => {
      setIsTyping(true);
    }, 1500);

    // Capture starting timestamp to compute elapsed network overhead
    const startTime = Date.now();

    // Await API response and calculate typing delay based on text length asynchronously
    (async () => {
      await apiFetchPromise;

      if (fetchErrorOccurred) {
        setIsTyping(false);
        setErrorMsg(fetchErrorMessage);
        return;
      }

      // 1. Process response text for [SHOW_BOOKING_FORM] trigger token
      let cleanText = apiResponseText;
      let shouldShowForm = false;

      if (apiResponseText.includes('[SHOW_BOOKING_FORM]')) {
        cleanText = apiResponseText.replace('[SHOW_BOOKING_FORM]', '').trim();
        shouldShowForm = true;
      }

      // 2. Dynamic typing calculation: 15ms per character.
      // Capped between 1.0s (min) and 5.0s (max) to preserve lifelike realism.
      const charCount = cleanText.length;
      let typingDuration = Math.max(1000, Math.min(5000, charCount * 15));

      // Apply delayScale factor (50% reduction for subsequent queries)
      typingDuration = typingDuration * delayScale;

      // Calculate how much network time has already elapsed
      const elapsed = Date.now() - startTime;
      const prepTime = 1500; // Ticks preparation time
      const totalDesiredDelay = prepTime + typingDuration;

      // Remaining typing delay to execute
      const remainingDelay = Math.max(0, totalDesiredDelay - elapsed);

      setTimeout(() => {
        setIsTyping(false);

        // Append Assistant text message
        const assistantMsg: Message = {
          id: generateUniqueId(),
          role: 'assistant',
          content: cleanText,
          timestamp: new Date(),
        };
        
        setMessages((prev) => {
          const next = [...prev, assistantMsg];
          if (shouldShowForm) {
            next.push({
              id: generateUniqueId(),
              role: 'assistant',
              content: '',
              timestamp: new Date(),
              isForm: true,
            });
          }
          return next;
        });
      }, remainingDelay);
    })();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickReplies = [
    { text: '🗓️ Painless Hair Transplant', query: 'Tell me about your Painless Hair Transplant (QHT/FUE)' },
    { text: '📅 Book Appointment', query: 'I want to book an appointment' },
    { text: '🕒 Hours & Locations', query: 'What are your clinic locations, phone numbers, and working hours?' },
  ];

  return (
    <div className={`relative flex flex-col bg-white overflow-hidden sm:rounded-2xl rounded-none sm:shadow-2xl shadow-none sm:border sm:border-slate-100 border-none ${className}`}>
      {/* Dynamic Keyframes Injection to guarantee Instant WhatsApp-Style Blinking works immediately without browser stylesheet caching! */}
      <style>{`
        @keyframes typingBlinkLocal {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        .animate-typing-blink-local {
          animation: typingBlinkLocal 1.4s infinite ease-in-out;
          display: inline-block;
        }
      `}</style>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-rose-700 p-4 text-white flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-extrabold text-sm border-2 border-white/20 shadow-inner">
              DP
            </div>
            {/* Status dot changes color and pulses dynamically when typing */}
            <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-rose-700 rounded-full transition-all duration-300 ${
              isTyping ? 'bg-amber-300 animate-pulse' : 'bg-green-400 animate-pulse-slow'
            }`}></div>
          </div>
          <div>
            <h3 className="font-bold text-[15px] leading-tight flex items-center gap-1.5">
              Dr. Paul&apos;s Clinic Assistant
              <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            </h3>
            {/* Status text transitions dynamically to typing... */}
            <p className="text-xs text-rose-100/90 font-medium transition-all duration-300">
              Clinic Assistant • <span className={isTyping ? 'animate-typing-blink-local' : ''}>{isTyping ? 'typing...' : 'Online'}</span>
            </p>
          </div>
        </div>

        {/* Close button inside popover widget */}
        {showCloseButton && onClose && (
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Lead Captured Alert Banner */}
      {leadCaptured && (
        <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2 flex items-center justify-between text-xs text-emerald-800 font-medium transition-all">
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600 bg-emerald-100 rounded-full p-0.5" />
            Clinic notified! {capturedLeadName ? `${capturedLeadName}, our care manager will contact you.` : "We will call/WhatsApp you shortly."}
          </span>
          <button 
            onClick={() => setLeadCaptured(false)} 
            className="text-emerald-600 hover:text-emerald-800 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}


      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 custom-scrollbar">
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} ${msg.isForm ? 'w-full' : ''}`}
          >
            {msg.isForm ? (
              <div className="max-w-[90%] w-full rounded-tl-none rounded-2xl transition-all duration-300">
                <BookingForm 
                  onSuccess={(name, number) => {
                    setLeadCaptured(true);
                    setCapturedLeadName(name);
                  }}
                  // Fallback concern pre-population: search history for user messages preceding form
                  initialConcern={
                    messages
                      .slice(0, messages.findIndex((m) => m.id === msg.id))
                      .reverse()
                      .find((m) => m.role === 'user' && m.content !== '📅 Book Appointment')?.content || ''
                  }
                />
              </div>
            ) : (
              <div 
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed shadow-sm transition-all ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-red-600 to-rose-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-line">{formatMessageContent(msg.content)}</p>
              </div>
            )}
            
            <span className="text-[10px] text-slate-400 mt-1 px-1 flex items-center gap-1" suppressHydrationWarning>
              {mounted ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              {msg.role === 'user' && msg.status && (
                <span className="ml-1 font-bold text-[11px] leading-none select-none flex items-center tracking-tighter">
                  {msg.status === 'sent' && <span className="text-slate-400">✓</span>}
                  {msg.status === 'delivered' && <span className="text-slate-400">✓✓</span>}
                  {msg.status === 'read' && <span className="text-sky-500">✓✓</span>}
                </span>
              )}
            </span>
          </div>
        ))}

        {/* WhatsApp Typing indicator */}
        {isTyping && (
          <div className="flex flex-col items-start transition-all duration-300">
            <div className="max-w-[70%] bg-white text-slate-400 border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5 shadow-sm">
              <span className="typing-dot animate-typing-1"></span>
              <span className="typing-dot animate-typing-2"></span>
              <span className="typing-dot animate-typing-3"></span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 px-1">Dr. Paul&apos;s Clinic Assistant typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      {messages.length === 1 && !isTyping && (
        <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 font-semibold mb-2 uppercase tracking-wider">Suggested topics:</p>
          <div className="flex flex-wrap gap-1.5">
            {quickReplies.map((reply, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(reply.query)}
                className="text-xs bg-white hover:bg-rose-50 hover:text-red-700 text-slate-700 border border-slate-200 rounded-full px-3 py-1.5 transition-all flex items-center gap-1 shadow-sm font-medium cursor-pointer"
              >
                {reply.text}
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ask a clinic query, address, or book patches..."
          rows={1}
          disabled={isTyping}
          className="flex-1 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-slate-800 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-red-500 border border-transparent focus:border-transparent resize-none max-h-24 custom-scrollbar transition-all"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputValue.trim() || isTyping}
          className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
            inputValue.trim() && !isTyping
              ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md hover:shadow-lg active:scale-95'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Send className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Trust & HIPAA security Footer */}
      <div className="bg-slate-50 px-4 py-1.5 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-medium">
        <span className="flex items-center gap-1">
          <Shield className="w-3 h-3 text-red-600" />
          Secure & Encrypted Chat
        </span>
        <a 
          href="https://stovamedia.in" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-red-600 hover:underline transition-all cursor-pointer font-semibold"
        >
          Made by Stova Media
        </a>
      </div>

      {/* Beautiful Floating Toast Notification */}
      {errorMsg && (
        <div className="absolute bottom-20 left-4 right-4 bg-rose-50/95 backdrop-blur-md border border-rose-100 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 shadow-lg animate-in slide-in-from-bottom-2 duration-300 z-50">
          <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5 animate-bounce" />
          <div className="flex-1 select-text">
            <span className="font-bold block text-rose-950 mb-0.5">Connection Error</span>
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
          <button 
            onClick={() => setErrorMsg(null)} 
            className="text-rose-400 hover:text-rose-600 font-bold ml-2 text-sm cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>
      )}

    </div>
  );
}
