'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X } from 'lucide-react';
import ChatContainer from './ChatContainer';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-Greeting Timer (Triggers after 5 seconds of page landing)
  useEffect(() => {
    const hasBeenOpened = localStorage.getItem('drpaul_chat_opened');
    const wasGreetingDismissed = sessionStorage.getItem('drpaul_greeting_dismissed');

    if (!hasBeenOpened && !wasGreetingDismissed && !isOpen) {
      timerRef.current = setTimeout(() => {
        setShowGreeting(true);
      }, 5000); // 5 seconds delay for greeting tooltip
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOpen]);

  // Notify parent window of state changes for dynamic iframe resizing
  useEffect(() => {
    if (typeof window !== 'undefined' && window.parent) {
      const state = isOpen ? 'open' : (showGreeting ? 'greeting' : 'closed');
      window.parent.postMessage({ type: 'drpaul_chat_state', state }, '*');
    }
  }, [isOpen, showGreeting]);

  const handleOpenToggle = () => {
    if (!isOpen) {
      localStorage.setItem('drpaul_chat_opened', 'true');
      setShowGreeting(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      sessionStorage.setItem('drpaul_chat_dismissed', 'true');
    }
    setIsOpen(!isOpen);
  };

  const handleDismissGreeting = (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering open on click
    setShowGreeting(false);
    sessionStorage.setItem('drpaul_greeting_dismissed', 'true');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans flex flex-col items-end">
      
      {/* 1. Popover Chat Window (Animated Transition Container) */}
      <div className={`absolute bottom-16 right-0 transition-all duration-300 ease-out origin-bottom-right ${
        isOpen 
          ? 'scale-100 opacity-100 pointer-events-auto translate-y-0 visible' 
          : 'scale-90 opacity-0 pointer-events-none translate-y-8 invisible'
      }`}>
        <ChatContainer 
          isOpen={isOpen}
          onClose={handleOpenToggle}
          showCloseButton={true}
          className="w-[380px] sm:w-[400px] h-[580px] shadow-2xl"
        />
      </div>


      {/* 2. Premium Speech Bubble Greeting Tooltip */}
      {showGreeting && !isOpen && (
        <div 
          onClick={handleOpenToggle}
          className="absolute bottom-1 right-16 mr-2 w-72 bg-white/95 backdrop-blur-md border border-slate-100 shadow-2xl p-3.5 rounded-2xl flex items-start gap-3 cursor-pointer group hover:scale-[1.02] hover:border-red-100 transition-all duration-300 animate-in fade-in slide-in-from-right-4 duration-500"
        >
          {/* Clinic Assistant Avatar */}
          <div className="relative shrink-0">
            <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-extrabold text-[10px] shadow-sm">
              DP
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full"></div>
          </div>

          {/* Greeting Text Content */}
          <div className="flex-1 space-y-0.5 pr-4">
            <h4 className="font-bold text-slate-800 text-[13px] leading-tight flex items-center gap-1.5">
              Hi there! <span className="animate-wave text-sm">👋</span>
            </h4>
            <p className="text-slate-500 text-xs font-medium leading-normal group-hover:text-slate-700 transition-colors">
              Hey, how can I help you?
            </p>
          </div>

          {/* Small Tooltip Dismiss Button */}
          <button 
            onClick={handleDismissGreeting}
            className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1 rounded-full transition-all"
          >
            <X className="w-3 h-3" />
          </button>

          {/* Little Speech Bubble Arrow */}
          <div className="absolute right-[-6px] bottom-5 w-3 h-3 bg-white border-t border-r border-slate-100 rotate-45"></div>
        </div>
      )}

      {/* 3. Floating Circular Bubble Button */}
      <button
        onClick={handleOpenToggle}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 border border-red-500/20 group relative"
      >
        {isOpen ? (
          <X className="w-6 h-6 transition-transform duration-300" />
        ) : (
          <>
            <MessageSquare className="w-6 h-6 transition-transform duration-300 group-hover:rotate-6" />
            {/* Subtle pulsing red active notification dot when greeting is not shown */}
            {!showGreeting && (
              <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-full animate-bounce"></span>
            )}
          </>
        )}
      </button>

    </div>
  );
}
