'use client';

import React from 'react';
import Link from 'next/link';

export default function TermsClient() {
  return (
    <div className="space-y-8 pb-24 animate-fade-in max-w-4xl mx-auto px-2 sm:px-4">
      {/* Header Banner */}
      <div className="border-b border-zinc-900 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <span className="material-icons-round text-2xl">gavel</span>
          </div>
          <div>
            <h1 className="font-sans font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              Terms of Service
            </h1>
            <p className="text-xs text-zinc-400">
              Core Service Agreement &amp; Platform Guidelines
            </p>
          </div>
        </div>
      </div>

      {/* Terms Sections */}
      <div className="space-y-6">
        {/* Section 1 */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-3 shadow-lg">
          <div className="flex items-center gap-2.5 text-blue-400">
            <span className="material-icons-round text-xl">dataset</span>
            <h2 className="font-sans font-bold text-lg text-white">1. Core Service Agreement</h2>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Muzikoo aggregates public music metadata, artist discographies, track lists, release details, lyrics, and audio preview streams from open music platforms including <strong className="text-zinc-100">Last.fm</strong>, <strong className="text-zinc-100">MusicBrainz</strong>, and <strong className="text-zinc-100">ListenBrainz</strong> under open community licenses (such as Creative Commons CC0).
          </p>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Muzikoo acts strictly as a unified music discovery portal and player client, consolidating open catalog metadata into an intuitive listener interface.
          </p>
        </div>

        {/* Section 2 */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-3 shadow-lg">
          <div className="flex items-center gap-2.5 text-blue-400">
            <span className="material-icons-round text-xl">verified_user</span>
            <h2 className="font-sans font-bold text-lg text-white">2. Acceptable Use &amp; User Obligations</h2>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            You agree to access Muzikoo solely for personal, non-commercial music listening and discovery. You must not attempt to circumvent API limits, reverse-engineer audio streaming proxies, or execute automated scraping routines against our server endpoints or community databases.
          </p>
        </div>

        {/* Section 3 */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-3 shadow-lg">
          <div className="flex items-center gap-2.5 text-blue-400">
            <span className="material-icons-round text-xl">storage</span>
            <h2 className="font-sans font-bold text-lg text-white">3. Supabase Storage Infrastructure</h2>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Muzikoo utilizes <strong className="text-zinc-100">Supabase</strong> (managed PostgreSQL with Row Level Security and encrypted Auth protocols) to store user authentication records, account profiles, personalized library favorites, custom playlists, and playback scrobble history.
          </p>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Your personal profile and created playlists are tied securely to your account session. Database policies ensure that user content is isolated and protected against unauthorized cross-tenant access.
          </p>
        </div>

        {/* Section 4 */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-3 shadow-lg">
          <div className="flex items-center gap-2.5 text-blue-400">
            <span className="material-icons-round text-xl">copyright</span>
            <h2 className="font-sans font-bold text-lg text-white">4. Intellectual Property &amp; Content Disclaimer</h2>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            All artist images, track titles, album covers, and audio preview clips remain the intellectual property of their respective creators, record labels, and rights holders. Muzikoo does not claim ownership over external metadata or audio files provided via open APIs.
          </p>
        </div>

        {/* Section 5 */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-3 shadow-lg">
          <div className="flex items-center gap-2.5 text-blue-400">
            <span className="material-icons-round text-xl">update</span>
            <h2 className="font-sans font-bold text-lg text-white">5. Service Modifications &amp; Updates</h2>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            We reserve the right to refine service features, adjust API integrations, or update these terms at any time. Continued use of Muzikoo signifies your agreement to any updated terms.
          </p>
        </div>
      </div>

      {/* Footer Navigation Link */}
      <div className="pt-4 flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-900">
        <span>Last updated: August 2026</span>
        <Link href="/privacy" className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 font-medium">
          <span>Read Privacy Policy</span>
          <span className="material-icons-round text-sm">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
