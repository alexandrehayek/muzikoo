'use client';

import React from 'react';
import Link from 'next/link';

export default function AboutClient() {
  return (
    <div className="space-y-8 pb-24 animate-fade-in max-w-4xl mx-auto px-2 sm:px-4" id="about-page-container">
      {/* Header Banner */}
      <div className="border-b border-zinc-900 pb-8 pt-2" id="about-header">
        <div className="flex items-start gap-4 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-1">
            <span className="material-icons-round text-3xl">info</span>
          </div>
          <div>
            <h1 className="font-sans font-extrabold text-2xl sm:text-3xl text-white tracking-tight leading-snug">
              Search for music, discover songs &amp; create beautiful playlists.
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 mt-2 leading-relaxed">
              The music catalog is built on open data from{' '}
              <a
                href="https://musicbrainz.org"
                target="_blank"
                rel="noreferrer noopener"
                className="text-zinc-200 hover:text-white underline underline-offset-2 decoration-zinc-600 hover:decoration-blue-400 transition-colors"
              >
                MusicBrainz
              </a>
              , the open music encyclopedia and{' '}
              <a
                href="https://www.last.fm"
                target="_blank"
                rel="noreferrer noopener"
                className="text-zinc-200 hover:text-white underline underline-offset-2 decoration-zinc-600 hover:decoration-rose-400 transition-colors"
              >
                Last.fm
              </a>
              , the world&apos;s largest online music service.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="space-y-6">
        {/* Section 1: Where does the data come from? */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg" id="about-data-sources">
          <div className="flex items-center gap-2.5 text-blue-400">
            <span className="material-icons-round text-xl">dataset</span>
            <h2 className="font-sans font-bold text-lg text-white">Where does the data on Muzikoo come from?</h2>
          </div>

          <ul className="space-y-2 text-sm text-zinc-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold select-none">•</span>
              <span>
                <a
                  href="https://musicbrainz.org"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-medium text-blue-400 hover:text-blue-300 underline underline-offset-2"
                >
                  musicbrainz.org
                </a>{' '}
                for artists, albums, tracks
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold select-none">•</span>
              <span>
                <a
                  href="https://www.last.fm"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-medium text-rose-400 hover:text-rose-300 underline underline-offset-2"
                >
                  last.fm
                </a>{' '}
                for artists, albums, tracks and charts
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold select-none">•</span>
              <span>
                <a
                  href="https://lrclib.net"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-medium text-purple-400 hover:text-purple-300 underline underline-offset-2"
                >
                  lrclib.net
                </a>{' '}
                for lyrics
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold select-none">•</span>
              <span>
                <a
                  href="https://fanart.tv"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-medium text-amber-400 hover:text-amber-300 underline underline-offset-2"
                >
                  fanart.tv
                </a>{' '}
                and{' '}
                <a
                  href="https://www.wikipedia.org"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                >
                  wikipedia.org
                </a>{' '}
                for artist backgrounds and thumbnails
              </span>
            </li>
          </ul>

          <div className="pt-2 border-t border-zinc-800/60 text-sm text-zinc-400 space-y-2">
            <p>
              None of this infrastructure is Muzikoo&apos;s. If you find Muzikoo useful, please support them.
            </p>
            <p>
              The MetaBrainz Foundation runs MusicBrainz and ListenBrainz on donations (
              <a
                href="https://metabrainz.org/donate"
                target="_blank"
                rel="noreferrer noopener"
                className="text-blue-400 hover:text-blue-300 underline underline-offset-2 font-medium"
              >
                https://metabrainz.org/donate
              </a>
              ).
            </p>
          </div>
        </div>

        {/* Section 2: Projects that inspired Muzikoo */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg" id="about-inspirations">
          <div className="flex items-center gap-2.5 text-blue-400">
            <span className="material-icons-round text-xl">auto_awesome</span>
            <h2 className="font-sans font-bold text-lg text-white">What are the projects that inspired Muzikoo?</h2>
          </div>

          <ul className="space-y-3 text-sm text-zinc-300">
            <li className="flex items-start gap-2.5">
              <span className="material-icons-round text-base text-zinc-500 mt-0.5 select-none">arrow_right</span>
              <div>
                <a
                  href="https://play.cash"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-semibold text-white hover:text-blue-400 underline underline-offset-2 transition-colors"
                >
                  play.cash
                </a>{' '}
                <span className="text-zinc-400">by feross</span> — Music lovers, rejoice.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="material-icons-round text-base text-zinc-500 mt-0.5 select-none">arrow_right</span>
              <div>
                <a
                  href="https://achordion.xyz"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-semibold text-white hover:text-blue-400 underline underline-offset-2 transition-colors"
                >
                  achordion.xyz
                </a>{' '}
                <span className="text-zinc-400">by herskowitz</span> — People-powered music discovery. An independent and open community experience.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="material-icons-round text-base text-zinc-500 mt-0.5 select-none">arrow_right</span>
              <div>
                <a
                  href="https://newmusictracker.com"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-semibold text-white hover:text-blue-400 underline underline-offset-2 transition-colors"
                >
                  newmusictracker.com
                </a>{' '}
                — Hand-picked new music. No algorithms. No ads. Just great records.
              </div>
            </li>
          </ul>
        </div>

        {/* Section 3: What does Muzikoo store about me? */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-3 shadow-lg" id="about-privacy-storage">
          <div className="flex items-center gap-2.5 text-blue-400">
            <span className="material-icons-round text-xl">storage</span>
            <h2 className="font-sans font-bold text-lg text-white">What does Muzikoo store about me?</h2>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Muzikoo relies on supabase to store user-related data, such as profile and playlists.
          </p>
          <p className="text-sm text-zinc-400 leading-relaxed">
            And that&apos;s all about it!
          </p>
        </div>

        {/* Section 4: Is Muzikoo open source? */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-3 shadow-lg" id="about-open-source">
          <div className="flex items-center gap-2.5 text-blue-400">
            <span className="material-icons-round text-xl">code</span>
            <h2 className="font-sans font-bold text-lg text-white">Is Muzikoo open source?</h2>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Yes. The code lives at{' '}
            <a
              href="https://github.com/alexandrehayek/muzikoo"
              target="_blank"
              rel="noreferrer noopener"
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2 font-medium"
            >
              github.com/alexandrehayek/muzikoo
            </a>
            . Issues and Pull Requests are welcome.
          </p>
        </div>

        {/* Section 5: How do I support the project? */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-3 shadow-lg" id="about-support">
          <div className="flex items-center gap-2.5 text-blue-400">
            <span className="material-icons-round text-xl">favorite</span>
            <h2 className="font-sans font-bold text-lg text-white">How do I support the project?</h2>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            The most important thing you may do is to donate to the{' '}
            <a
              href="https://metabrainz.org/donate"
              target="_blank"
              rel="noreferrer noopener"
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2 font-medium"
            >
              MetaBrainz Foundation
            </a>{' '}
            or support{' '}
            <a
              href="https://www.last.fm"
              target="_blank"
              rel="noreferrer noopener"
              className="text-rose-400 hover:text-rose-300 underline underline-offset-2 font-medium"
            >
              Last.fm
            </a>
            , since Muzikoo would not exist without them.
          </p>
        </div>
      </div>

      {/* Footer Navigation Links */}
      <div className="pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500 border-t border-zinc-900">
        <div className="flex items-center gap-4">
          <Link href="/terms" className="hover:text-zinc-300 transition-colors">
            Terms of Service
          </Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-zinc-300 transition-colors">
            Privacy Policy
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span>Built for music lovers</span>
        </div>
      </div>
    </div>
  );
}
