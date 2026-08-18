// /components/MusicAssistant.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { motion, AnimatePresence } from 'motion/react';

export default function MusicAssistant() {
  const { showAssistant, setShowAssistant, currentTrack, playTrack } = usePlayer();
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: 'Greetings. I am your **AI Musicologist**, powered by Gemini with full High-Thinking reasoning. I analyze patterns across the MusicBrainz database and your ListenBrainz profiles.\n\nAsk me anything about artists, genre genealogies, track analysis, or ask for custom playlists!',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!showAssistant) return null;

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    setMessages((prev) => [...prev, { sender: 'user', text: textToSend }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/thinking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          currentTrack: currentTrack,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessages((prev) => [...prev, { sender: 'ai', text: data.text }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: 'ai', text: `Failed to consult the AI: ${data.error || 'Server error'}` },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'An error occurred while connecting to the thinking model.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const presets = [
    {
      label: 'Deconstruct Genre',
      prompt: currentTrack
        ? `Can you deconstruct the history, characteristics, and key sub-genres of "${currentTrack.genre || 'Ambient Electronic'}" (inspired by "${currentTrack.title}")?`
        : 'Can you deconstruct the history of IDM and electronic krautrock movements?',
    },
    {
      label: 'Song Insight',
      prompt: currentTrack
        ? `Tell me some interesting historical, lyrical, or production facts related to "${currentTrack.title}" by "${currentTrack.artist}".`
        : 'Tell me about the MusicBrainz schema, its release groups, and how recording MBIDs work.',
    },
    {
      label: 'AI Curated Playlist',
      prompt: currentTrack
        ? `Create a 5-track custom conceptual playlist bridging "${currentTrack.title}" by "${currentTrack.artist}" with artists from similar electronic, alternative, or neoclassical movements.`
        : 'Create a conceptual 5-track playlist focusing on Japanese Ambient and Vaporwave.',
    }
  ];

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-zinc-950 border-l border-zinc-900 shadow-2xl flex flex-col z-50 text-zinc-100 select-none">
      {/* Header */}
      <div className="p-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/90 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-500/10 rounded border border-blue-500/25 flex items-center justify-center">
            <span className="material-icons-round text-base leading-none text-blue-400">auto_awesome</span>
          </div>
          <div>
            <span className="font-sans font-bold text-sm block">AI Musicologist</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" />
              <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider">
                Thinking Level: High
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowAssistant(false)}
          className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition-colors flex items-center justify-center"
        >
          <span className="material-icons-round text-lg leading-none">close</span>
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-sm scrollbar-thin scrollbar-thumb-zinc-800">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex flex-col max-w-[85%] ${
              m.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
            }`}
          >
            <span className="font-mono text-[9px] text-zinc-500 uppercase mb-1">
              {m.sender === 'user' ? 'Listener' : 'AI Musicologist'}
            </span>
            <div
              className={`p-3.5 rounded-2xl leading-relaxed text-xs break-words ${
                m.sender === 'user'
                  ? 'bg-blue-500 text-white font-medium rounded-tr-none shadow-md shadow-blue-500/5'
                  : 'bg-zinc-900/60 text-zinc-200 rounded-tl-none border border-zinc-800/60'
              }`}
            >
              {m.text.split('\n').map((para, idx) => (
                <p key={idx} className={idx > 0 ? 'mt-2' : ''}>
                  {/* Basic parsing for markdown bold */}
                  {para.split('**').map((chunk, chunkIdx) =>
                    chunkIdx % 2 === 1 ? <strong key={chunkIdx} className="text-blue-100 font-semibold">{chunk}</strong> : chunk
                  )}
                </p>
              ))}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex flex-col mr-auto max-w-[85%]">
            <span className="font-mono text-[9px] text-zinc-500 uppercase mb-1 flex items-center gap-1">
              <span className="material-icons-round text-sm leading-none animate-spin text-blue-400">psychology</span>
              AI is reasoning (High Thinking Level)...
            </span>
            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800 rounded-tl-none space-y-2">
              <div className="h-1.5 bg-zinc-800 rounded animate-pulse w-full" />
              <div className="h-1.5 bg-zinc-800 rounded animate-pulse w-[85%]" />
              <div className="h-1.5 bg-zinc-800 rounded animate-pulse w-[60%]" />
              <span className="block text-[10px] text-blue-500/70 italic animate-pulse font-mono">
                Consulting MusicBrainz schema archives & active listen histories...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Preset Prompts */}
      <div className="p-3 border-t border-zinc-900 bg-zinc-950/60 space-y-1.5">
        <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider px-1">
          Quick Prompts
        </span>
        <div className="grid grid-cols-1 gap-1.5">
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p.prompt)}
              className="text-left text-xs bg-zinc-900/60 border border-zinc-800 hover:border-blue-500/25 p-2 rounded-lg text-zinc-300 hover:text-white transition-all flex items-center justify-between group"
            >
              <span className="truncate pr-2">{p.label}</span>
              <span className="material-icons-round text-base leading-none text-zinc-500 group-hover:text-blue-400 transition-all transform group-hover:translate-x-0.5">arrow_forward</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Footer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-3 border-t border-zinc-900 bg-zinc-950 flex gap-2"
      >
        <input
          type="text"
          placeholder={currentTrack ? `Ask about "${currentTrack.title}"...` : 'Ask your AI music assistant...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="bg-blue-500 hover:bg-blue-400 text-white p-2 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center shrink-0"
        >
          <span className="material-icons-round text-base leading-none text-white">send</span>
        </button>
      </form>
    </div>
  );
}
