'use client';

import React from 'react';
import Link from 'next/link';

export default function PrivacyClient() {
  return (
    <div className="space-y-8 pb-24 animate-fade-in max-w-4xl mx-auto px-2 sm:px-4">
      {/* Header Banner */}
      <div className="border-b border-zinc-900 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <span className="material-icons-round text-2xl">security</span>
          </div>
          <div>
            <h1 className="font-sans font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xs text-zinc-400">
              Zero Tracker Guarantee &amp; Data Protection Principles
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Sections */}
      <div className="space-y-6">
        {/* Section 1 */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-3 shadow-lg">
          <div className="flex items-center gap-2.5 text-blue-400">
            <span className="material-icons-round text-xl">block</span>
            <h2 className="font-sans font-bold text-lg text-white">1. Zero Tracker Guarantee</h2>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Muzikoo does not deploy telemetry cookies, third-party advertising scripts, cross-site behavioral trackers, or user profiling analytics. We firmly believe in an ad-free, undisturbed, and transparent listening space for music lovers.
          </p>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Your listening habits and search queries are never monetized, sold, or shared with advertising networks.
          </p>
        </div>

        {/* Section 2 */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-3 shadow-lg">
          <div className="flex items-center gap-2.5 text-blue-400">
            <span className="material-icons-round text-xl">api</span>
            <h2 className="font-sans font-bold text-lg text-white">2. Open API Data Access</h2>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            All music catalog data, artist biographies, album covers, and genre tags are retrieved directly or through secure proxy endpoints connected to public open APIs (<strong className="text-zinc-100">Last.fm</strong>, <strong className="text-zinc-100">MusicBrainz</strong>, and <strong className="text-zinc-100">ListenBrainz</strong>).
          </p>
          <p className="text-sm text-zinc-400 leading-relaxed">
            These external requests contain no personal identity information, tracking identifiers, or confidential session tokens.
          </p>
        </div>

        {/* Section 3 */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-3 shadow-lg">
          <div className="flex items-center gap-2.5 text-blue-400">
            <span className="material-icons-round text-xl">lock</span>
            <h2 className="font-sans font-bold text-lg text-white">3. Supabase Account &amp; Data Security</h2>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            When you create an account or sign in via OAuth providers (such as Google or GitHub), your account credentials, profile data (username, avatar, email), custom playlists, and favorite tracks are handled through <strong className="text-zinc-100">Supabase Authentication</strong> and database services protected by Row Level Security (RLS) policies.
          </p>
          <p className="text-sm text-zinc-400 leading-relaxed">
            All database transmissions are encrypted in transit via SSL/TLS and stored in encrypted infrastructure.
          </p>
        </div>

        {/* Section 4 */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-3 shadow-lg">
          <div className="flex items-center gap-2.5 text-blue-400">
            <span className="material-icons-round text-xl">cookie</span>
            <h2 className="font-sans font-bold text-lg text-white">4. Minimal Functional Storage</h2>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            We use only essential local browser cookies and storage keys required to keep you signed in, remember active audio volume/theme preferences, and temporarily cache recent search history for instant access.
          </p>
        </div>

        {/* Section 5 */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-3 shadow-lg">
          <div className="flex items-center gap-2.5 text-blue-400">
            <span className="material-icons-round text-xl">manage_accounts</span>
            <h2 className="font-sans font-bold text-lg text-white">5. User Control &amp; Data Erasure</h2>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            You maintain full control over your personal account. You can log out at any time or request account and library data deletion directly from your account settings.
          </p>
        </div>
      </div>

      {/* Footer Navigation Link */}
      <div className="pt-4 flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-900">
        <span>Last updated: August 2026</span>
        <Link href="/terms" className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 font-medium">
          <span>Read Terms of Service</span>
          <span className="material-icons-round text-sm">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
