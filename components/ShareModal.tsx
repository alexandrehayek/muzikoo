'use client';

import React, { useState } from 'react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  shareUrl: string;
}

export default function ShareModal({
  isOpen,
  onClose,
  title,
  subtitle,
  shareUrl,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.getElementById('share-url-input') as HTMLInputElement;
      if (input) {
        input.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="material-icons-round text-blue-400 text-xl">share</span>
            <div>
              <h3 className="font-sans font-bold text-base text-white">{title}</h3>
              {subtitle && <p className="text-xs text-zinc-400 truncate">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors p-1 rounded-lg cursor-pointer"
          >
            <span className="material-icons-round text-lg">close</span>
          </button>
        </div>

        {/* URL Input and Copy Button */}
        <div className="space-y-2">
          <label htmlFor="share-url-input" className="text-xs font-mono text-zinc-400 font-semibold block">
            Share Link
          </label>
          <div className="flex items-center gap-2">
            <input
              id="share-url-input"
              type="text"
              readOnly
              value={shareUrl}
              style={{ color: 'var(--color-zinc-200, #e4e4e7)' }}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-blue-500 selection:bg-blue-500/20"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                copied
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-blue-500 hover:bg-blue-400 text-white shadow-sm'
              }`}
            >
              <span className="material-icons-round text-base">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
