// /components/Topbar.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePlayer } from '@/context/PlayerContext';
import Link from 'next/link';

export default function Topbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userSession, logoutUser, sidebarOpen, setSidebarOpen, theme, setTheme, activeDialog, setActiveDialog, t, addToSearchHistory } = usePlayer();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showSignedOutMenu, setShowSignedOutMenu] = useState(false);
  const [showSignedInMenu, setShowSignedInMenu] = useState(false);

  const signedOutMenuRef = useRef<HTMLDivElement>(null);
  const signedInMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (signedOutMenuRef.current && !signedOutMenuRef.current.contains(event.target as Node)) {
        setShowSignedOutMenu(false);
      }
      if (signedInMenuRef.current && !signedInMenuRef.current.contains(event.target as Node)) {
        setShowSignedInMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);

  // Sync search input with URL query param ONLY when input is not focused
  useEffect(() => {
    const q = searchParams.get('q') || '';
    if (inputRef.current && document.activeElement === inputRef.current) {
      return;
    }
    const timer = setTimeout(() => {
      setSearchQuery((prev) => (prev !== q ? q : prev));
    }, 0);
    return () => clearTimeout(timer);
  }, [searchParams]);

  // Live search debounced URL update on key press
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchQuery.trim();
      const currentUrlQuery = searchParams.get('q') || '';
      const isSearchPage = typeof window !== 'undefined' && (window.location.pathname.endsWith('/search') || window.location.pathname.includes('/search'));

      if (trimmed) {
        if (trimmed !== currentUrlQuery || !isSearchPage) {
          addToSearchHistory(trimmed);
          const targetUrl = `/search?q=${encodeURIComponent(trimmed)}`;
          if (isSearchPage) {
            router.replace(targetUrl);
          } else {
            router.push(targetUrl);
          }
        }
      } else if (isSearchPage && searchParams.has('q')) {
        router.replace('/search');
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, searchParams, router, addToSearchHistory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      addToSearchHistory(trimmed);
      const isSearchPage = typeof window !== 'undefined' && (window.location.pathname.endsWith('/search') || window.location.pathname.includes('/search'));
      const targetUrl = `/search?q=${encodeURIComponent(trimmed)}`;
      if (isSearchPage) {
        router.replace(targetUrl);
      } else {
        router.push(targetUrl);
      }
    }
  };

  return (
    <header id="app-topbar" className="h-16 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-[250] select-none gap-3 sm:gap-6">
      {/* Menu & Logo Header */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition-colors flex items-center justify-center"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <span className="material-icons-round text-2xl leading-none">menu</span>
        </button>

        <Link href="/" className="hidden sm:flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/10">
            <span className="material-icons-round text-lg leading-none text-zinc-950">music_note</span>
          </div>
          <div className="hidden md:block">
            <span className="font-sans font-bold tracking-tight text-white text-2xl block leading-none mb-0.5">muzikoo</span>
          </div>
        </Link>
      </div>

      {/* Back/Forward Navigation and Search Form */}
      <div className="flex items-center gap-2 sm:gap-6 flex-1 max-w-2xl">
        <div className="hidden sm:flex items-center gap-1 text-zinc-400">
          <button
            onClick={() => router.back()}
            className="p-1.5 hover:bg-zinc-900 rounded-md hover:text-white transition-colors flex items-center justify-center"
          >
            <span className="material-icons-round text-xl leading-none">chevron_left</span>
          </button>
          <button
            onClick={() => router.forward()}
            className="p-1.5 hover:bg-zinc-900 rounded-md hover:text-white transition-colors flex items-center justify-center"
          >
            <span className="material-icons-round text-xl leading-none">chevron_right</span>
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex-1 relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500">
            <span className="material-icons-round text-base leading-none">search</span>
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder={t.topbar.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700/60 focus:border-blue-500/50 rounded-full pl-10 pr-9 py-2 text-[16.8px] text-white placeholder-zinc-500 focus:outline-none focus:ring-0 transition-all [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                const isSearchPage = typeof window !== 'undefined' && (window.location.pathname.endsWith('/search') || window.location.pathname.includes('/search'));
                if (isSearchPage) {
                  router.replace('/search');
                }
              }}
              className="absolute inset-y-0 right-3 flex items-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Clear search"
            >
              <span className="material-icons-round text-sm leading-none">close</span>
            </button>
          )}
        </form>
      </div>

      {/* Action Area */}
      <div className="flex items-center gap-3">
        {userSession.isLoggedIn ? (
          <div className="relative" ref={signedInMenuRef}>
            <button
              onClick={() => setShowSignedInMenu(!showSignedInMenu)}
              className="flex items-center gap-1 group bg-zinc-900/40 border border-zinc-800/40 p-1 rounded-full hover:bg-zinc-900/80 transition-colors cursor-pointer"
              title={userSession.username}
            >
              <img
                src={userSession.avatarUrl || 'https://picsum.photos/seed/user/50/50'}
                alt="User Avatar"
                className="w-7 h-7 rounded-full border border-zinc-700 object-cover"
              />
              <span className="material-icons-round text-xs text-zinc-500 group-hover:text-zinc-300 pr-0.5">keyboard_arrow_down</span>
            </button>

            {showSignedInMenu && (
              <div className="absolute right-0 mt-2 w-60 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-[300] py-1 text-sm text-zinc-200">
                {/* Account picture and username (not clickable) */}
                <div className="flex items-center gap-3 p-3 border-b border-zinc-800 bg-zinc-950/20 rounded-t-xl select-none">
                  <img
                    src={userSession.avatarUrl || 'https://picsum.photos/seed/user/50/50'}
                    alt="User Avatar Large"
                    className="w-10 h-10 rounded-full object-cover border border-zinc-800"
                  />
                  <div className="min-w-0">
                    <span className="block text-sm font-semibold text-white truncate">{userSession.username}</span>
                    <span className="block text-[10px] text-zinc-500 truncate">{userSession.email || 'ListenBrainz user'}</span>
                  </div>
                </div>

                {/* Appearance Switcher */}
                <div className="px-3 py-2 border-b border-zinc-800">
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
                    <span className="material-icons-round text-sm">palette</span>
                    <span>{t.topbar.appearance}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-lg">
                    <button
                      onClick={() => setTheme('light')}
                      className={`px-1 py-1.5 text-[10px] font-medium rounded transition-colors flex flex-col items-center gap-1 cursor-pointer ${
                        theme === 'light' ? 'bg-blue-500 text-white font-semibold' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span className="material-icons-round text-sm">light_mode</span>
                      <span>Light</span>
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`px-1 py-1.5 text-[10px] font-medium rounded transition-colors flex flex-col items-center gap-1 cursor-pointer ${
                        theme === 'dark' ? 'bg-blue-500 text-white font-semibold' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span className="material-icons-round text-sm">dark_mode</span>
                      <span>Dark</span>
                    </button>
                    <button
                      onClick={() => setTheme('system')}
                      className={`px-1 py-1.5 text-[10px] font-medium rounded transition-colors flex flex-col items-center gap-1 cursor-pointer ${
                        theme === 'system' ? 'bg-blue-500 text-white font-semibold' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span className="material-icons-round text-sm">settings_brightness</span>
                      <span>System</span>
                    </button>
                  </div>
                </div>

                {/* Your Profile */}
                <Link
                  href={`/user/${encodeURIComponent(userSession.username)}`}
                  onClick={() => setShowSignedInMenu(false)}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-zinc-800/80 transition-colors text-left"
                >
                  <span className="material-icons-round text-base text-zinc-400">person</span>
                  <span>{t.navigation.profile}</span>
                </Link>

                {/* History */}
                <Link
                  href="/history"
                  onClick={() => setShowSignedInMenu(false)}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-zinc-800/80 transition-colors text-left"
                >
                  <span className="material-icons-round text-base text-zinc-400">history</span>
                  <span>{t.navigation.history}</span>
                </Link>

                {/* Settings */}
                <button
                  onClick={() => { setShowSignedInMenu(false); setActiveDialog('settings'); }}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-800/80 transition-colors text-left text-sm cursor-pointer"
                >
                  <span className="material-icons-round text-base text-zinc-400">settings</span>
                  <span>{t.topbar.settings}</span>
                </button>

                {/* About */}
                <Link
                  href="/about"
                  onClick={() => setShowSignedInMenu(false)}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-800/80 transition-colors text-left text-sm cursor-pointer text-zinc-200 hover:text-white"
                  id="topbar-about-link"
                >
                  <span className="material-icons-round text-base text-zinc-400">info</span>
                  <span>{t.topbar.about || 'About'}</span>
                </Link>

                {/* Terms */}
                <Link
                  href="/terms"
                  onClick={() => setShowSignedInMenu(false)}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-800/80 transition-colors text-left text-sm cursor-pointer text-zinc-200 hover:text-white"
                  id="topbar-terms-link"
                >
                  <span className="material-icons-round text-base text-zinc-400">gavel</span>
                  <span>{t.topbar.terms}</span>
                </Link>

                {/* Privacy */}
                <Link
                  href="/privacy"
                  onClick={() => setShowSignedInMenu(false)}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-800/80 transition-colors text-left text-sm cursor-pointer text-zinc-200 hover:text-white"
                  id="topbar-privacy-link"
                >
                  <span className="material-icons-round text-base text-zinc-400">security</span>
                  <span>{t.topbar.privacy}</span>
                </Link>

                {/* Help */}
                <button
                  onClick={() => { setShowSignedInMenu(false); setActiveDialog('help'); }}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-800/80 transition-colors text-left text-sm cursor-pointer"
                >
                  <span className="material-icons-round text-base text-zinc-400">help_outline</span>
                  <span>{t.topbar.help}</span>
                </button>

                <div className="border-t border-zinc-800/80 my-1" />

                {/* Sign out */}
                <button
                  onClick={() => {
                    setShowSignedInMenu(false);
                    logoutUser();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-rose-950/30 text-rose-400 hover:text-rose-300 transition-colors text-left text-sm cursor-pointer"
                >
                  <span className="material-icons-round text-base">logout</span>
                  <span>{t.topbar.signOut}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link
              href="/signin"
              className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-1.5 rounded-full text-xs font-semibold transition-colors"
            >
              {t.topbar.signIn}
            </Link>

            {/* Settings Three Dots Menu Button (Only when signed out) */}
            <div className="relative" ref={signedOutMenuRef}>
              <button
                onClick={() => setShowSignedOutMenu(!showSignedOutMenu)}
                className="p-1.5 hover:bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                title="Menu & Options"
                id="topbar-three-dots-menu-btn"
              >
                <span className="material-icons-round text-xl leading-none">more_vert</span>
              </button>

              {showSignedOutMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-[300] py-1 text-sm text-zinc-200" id="topbar-three-dots-menu">
                  {/* Appearance Switcher */}
                  <div className="px-3 py-2 border-b border-zinc-800">
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-2">
                      <span className="material-icons-round text-sm">palette</span>
                      <span>{t.topbar.appearance}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-lg">
                      <button
                        onClick={() => setTheme('light')}
                        className={`px-1 py-1.5 text-[10px] font-medium rounded transition-colors flex flex-col items-center gap-1 cursor-pointer ${
                          theme === 'light' ? 'bg-blue-500 text-white font-semibold' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <span className="material-icons-round text-sm">light_mode</span>
                        <span>Light</span>
                      </button>
                      <button
                        onClick={() => setTheme('dark')}
                        className={`px-1 py-1.5 text-[10px] font-medium rounded transition-colors flex flex-col items-center gap-1 cursor-pointer ${
                          theme === 'dark' ? 'bg-blue-500 text-white font-semibold' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <span className="material-icons-round text-sm">dark_mode</span>
                        <span>Dark</span>
                      </button>
                      <button
                        onClick={() => setTheme('system')}
                        className={`px-1 py-1.5 text-[10px] font-medium rounded transition-colors flex flex-col items-center gap-1 cursor-pointer ${
                          theme === 'system' ? 'bg-blue-500 text-white font-semibold' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <span className="material-icons-round text-sm">settings_brightness</span>
                        <span>System</span>
                      </button>
                    </div>
                  </div>

                  {/* History */}
                  <Link
                    href="/history"
                    onClick={() => setShowSignedOutMenu(false)}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-zinc-800/80 transition-colors text-left text-sm text-zinc-200 hover:text-white"
                    id="three-dots-history-link"
                  >
                    <span className="material-icons-round text-base text-zinc-400">history</span>
                    <span>{t.navigation.history}</span>
                  </Link>

                  {/* Settings */}
                  <button
                    onClick={() => { setShowSignedOutMenu(false); setActiveDialog('settings'); }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-800/80 transition-colors text-left text-sm cursor-pointer"
                  >
                    <span className="material-icons-round text-base text-zinc-400">settings</span>
                    <span>{t.topbar.settings}</span>
                  </button>

                  {/* About */}
                  <Link
                    href="/about"
                    onClick={() => setShowSignedOutMenu(false)}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-800/80 transition-colors text-left text-sm cursor-pointer text-zinc-200 hover:text-white"
                    id="three-dots-about-link"
                  >
                    <span className="material-icons-round text-base text-zinc-400">info</span>
                    <span>{t.topbar.about || 'About'}</span>
                  </Link>

                  {/* Terms */}
                  <Link
                    href="/terms"
                    onClick={() => setShowSignedOutMenu(false)}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-800/80 transition-colors text-left text-sm cursor-pointer text-zinc-200 hover:text-white"
                    id="three-dots-terms-link"
                  >
                    <span className="material-icons-round text-base text-zinc-400">gavel</span>
                    <span>{t.topbar.terms}</span>
                  </Link>

                  {/* Privacy */}
                  <Link
                    href="/privacy"
                    onClick={() => setShowSignedOutMenu(false)}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-800/80 transition-colors text-left text-sm cursor-pointer text-zinc-200 hover:text-white"
                    id="three-dots-privacy-link"
                  >
                    <span className="material-icons-round text-base text-zinc-400">security</span>
                    <span>{t.topbar.privacy}</span>
                  </Link>

                  {/* Help */}
                  <button
                    onClick={() => { setShowSignedOutMenu(false); setActiveDialog('help'); }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-800/80 transition-colors text-left text-sm cursor-pointer"
                  >
                    <span className="material-icons-round text-base text-zinc-400">help_outline</span>
                    <span>{t.topbar.help}</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
