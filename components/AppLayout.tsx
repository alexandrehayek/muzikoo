// /components/AppLayout.tsx
'use client';

import React, { Suspense, useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import BottomPlayer from '@/components/BottomPlayer';
import MusicAssistant from '@/components/MusicAssistant';
import GeneralSettingsForm from '@/components/GeneralSettingsForm';
import LanguageSettingsForm from '@/components/LanguageSettingsForm';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, activeDialog, setActiveDialog, t } = usePlayer();
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'language'>('general');

  return (
    <div className="flex flex-col h-full overflow-hidden w-full">
      {/* Header Bar - Full Width */}
      <Suspense fallback={<div className="h-16 bg-zinc-950/20 border-b border-zinc-900/60" />}>
        <Topbar />
      </Suspense>

      {/* Middle Row containing Sidebar & Scrollable Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar */}
        <div
          className={`h-full border-r border-zinc-900 bg-zinc-950 transition-all duration-300 ease-in-out shrink-0 ${
            sidebarOpen ? 'w-64' : 'w-0 overflow-hidden border-r-0'
          }`}
        >
          <Sidebar />
        </div>

        {/* Scrollable page views */}
        <main id="app-main-content" className="flex-1 overflow-y-auto bg-zinc-950/40 p-3 sm:p-4 relative">
          {children}
        </main>
      </div>

      {/* Bottom persistent player bar - Full Width */}
      <BottomPlayer />

      {/* Floating Thinking AI Assistant drawer */}
      <MusicAssistant />

      {/* Dialog Modals */}
      {activeDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[300] p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="material-icons-round text-blue-500 text-xl">
                  {activeDialog === 'settings' && 'settings'}
                  {activeDialog === 'help' && 'help_outline'}
                </span>
                <span className="font-sans font-bold text-white capitalize">{activeDialog}</span>
              </div>
              <button
                onClick={() => setActiveDialog(null)}
                className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                <span className="material-icons-round text-base block">close</span>
              </button>
            </div>

            {/* Persistent Tab Navigation for Settings Dialog */}
            {activeDialog === 'settings' && (
              <div className="flex border-b border-zinc-800 px-6 pt-2 gap-2 bg-zinc-900 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveSettingsTab('general')}
                  className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                    activeSettingsTab === 'general'
                      ? 'border-blue-500 text-white'
                      : 'border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  {t.settings.generalTab}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSettingsTab('language')}
                  className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                    activeSettingsTab === 'language'
                      ? 'border-blue-500 text-white'
                      : 'border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  {t.settings.languageTab}
                </button>
              </div>
            )}

            <div className="p-6 overflow-y-auto flex-1 text-sm text-zinc-300 leading-relaxed space-y-4">
              {activeDialog === 'settings' && (
                <div>
                  {activeSettingsTab === 'general' && <GeneralSettingsForm />}
                  {activeSettingsTab === 'language' && <LanguageSettingsForm />}
                </div>
              )}

              {activeDialog === 'help' && (
                <div className="space-y-3 text-zinc-300">
                  <p className="font-semibold text-white">Quick Keyboard Controls</p>
                  <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-950 p-3 rounded-lg border border-zinc-800 font-mono">
                    <span className="text-zinc-400">Spacebar</span>
                    <span className="text-white text-right">Play / Pause</span>
                    <span className="text-zinc-400">Shift + Right Arrow</span>
                    <span className="text-white text-right">Next track</span>
                    <span className="text-zinc-400">Shift + Left Arrow</span>
                    <span className="text-white text-right">Previous track</span>
                  </div>
                  <p className="font-semibold text-white mt-4">AI Musicologist Assistant</p>
                  <p className="text-xs text-zinc-400">
                    Click the &quot;AI Musicologist&quot; button at the sidebar to interact with a high-thinking music
                    expert who analyzed the current track details, suggests complementary tags, and can build instant
                    customized playlist ideas.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-zinc-950/60 border-t border-zinc-800 px-6 py-3.5 flex justify-end">
              {activeDialog === 'settings' && activeSettingsTab === 'general' ? (
                <button
                  type="submit"
                  form="general-settings-form"
                  className="bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center gap-1.5 cursor-pointer font-sans"
                >
                  <span className="material-icons-round text-sm">save</span>
                  Save Settings
                </button>
              ) : activeDialog === 'settings' && activeSettingsTab === 'language' ? (
                <button
                  type="submit"
                  form="language-settings-form"
                  className="bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center gap-1.5 cursor-pointer font-sans"
                >
                  <span className="material-icons-round text-sm">save</span>
                  {t.settings.saveLanguage || 'Save & Refresh'}
                </button>
              ) : (
                <button
                  onClick={() => setActiveDialog(null)}
                  className="bg-zinc-850 hover:bg-zinc-800 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
