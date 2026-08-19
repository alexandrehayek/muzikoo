// /components/LanguageSettingsForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { upsertUserProfile } from '@/lib/supabaseService';
import languageCodes from '@/lib/language-codes.json';
import Cookies from 'js-cookie';
import countryCodes from '@/lib/country-codes.json';

const normalizeLang = (code?: string): string => {
  if (!code) return 'en';
  const clean = code.trim().toLowerCase().replace('_', '-');
  if (Object.keys(languageCodes).includes(clean)) {
    return clean;
  }
  const base = clean.split('-')[0];
  if (Object.keys(languageCodes).includes(base)) {
    return base;
  }
  return 'en';
};

const normalizeCountry = (code?: string): string => {
  if (!code) return 'US';
  const clean = code.trim().toUpperCase();
  const matched = countryCodes.find((c) => c['alpha-2'].toUpperCase() === clean);
  return matched ? matched['alpha-2'].toUpperCase() : 'US';
};

export default function LanguageSettingsForm() {
  const { locale, setLocale, region, setRegion, userSession, t } = usePlayer();

  const getEffectiveLang = (): string => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const segments = pathname.split('/');
      const firstSegment = segments[1] ? segments[1].trim() : '';
      if (firstSegment) {
        const normSeg = normalizeLang(firstSegment);
        if (normSeg && normSeg !== 'en') {
          return normSeg;
        }
        if (firstSegment.toLowerCase() === 'en' || firstSegment.toLowerCase() === 'en-us') {
          return normalizeLang(firstSegment);
        }
      }
      const cookieLang = Cookies.get('NEXT_LOCALE');
      if (cookieLang) {
        return normalizeLang(cookieLang);
      }
    }
    return normalizeLang(locale || 'en');
  };

  const getEffectiveCountry = (): string => {
    if (typeof window !== 'undefined') {
      const cookieCountry = Cookies.get('USER_COUNTRY');
      if (cookieCountry) {
        return normalizeCountry(cookieCountry);
      }
    }
    return 'US';
  };

  const [selectedLang, setSelectedLang] = useState<string>(() => normalizeLang(getEffectiveLang()));
  const [selectedCountry, setSelectedCountry] = useState<string>(() => normalizeCountry(getEffectiveCountry()));
  const [countrySearch, setCountrySearch] = useState('');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentLang = normalizeLang(getEffectiveLang());
      const currentCountry = normalizeCountry(getEffectiveCountry());
      queueMicrotask(() => {
        setSelectedLang(currentLang);
        setSelectedCountry(currentCountry);
      });
    }
  }, [locale]);

  const handleSaveLanguageSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanLang = normalizeLang(selectedLang);
    const cleanCountry = normalizeCountry(selectedCountry);

    // 1. set NEXT_LOCALE cookie & update state in context
    setLocale(cleanLang);
    Cookies.set('NEXT_LOCALE', cleanLang, { expires: 365, path: '/', sameSite: 'lax' });

    // 2. set USER_COUNTRY cookie & update state in context
    setRegion(cleanCountry);
    Cookies.set('USER_COUNTRY', cleanCountry, { expires: 365, path: '/', sameSite: 'lax' });

    // 3. Directly await Supabase persistence if user is logged in
    const targetUserId =
      userSession?.supabaseUser?.id ||
      (typeof window !== 'undefined' ? localStorage.getItem('mb_user_id') : null) ||
      userSession?.username;

    if (targetUserId) {
      try {
        await upsertUserProfile(targetUserId, {
          language: cleanLang,
          region: cleanCountry,
        });
      } catch (err) {
        console.warn('Could not persist language/region to Supabase:', err);
      }
    }

    // 4. Clean up / update the URL if it had an explicit /[lang] prefix, or refresh
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const segments = pathname.split('/');
      const firstSegment = segments[1];

      const isLocale =
        /^[a-z]{2,3}(-[a-zA-Z]{2,4})?$/i.test(firstSegment) &&
        Object.keys(languageCodes).includes(firstSegment.toLowerCase());

      let newPathname = pathname;
      if (isLocale) {
        segments[1] = cleanLang;
        newPathname = segments.join('/') || '/';
      }

      window.location.href = `${newPathname}${window.location.search}${window.location.hash}`;
    }
  };

  return (
    <form id="language-settings-form" onSubmit={handleSaveLanguageSettings} className="space-y-4 animate-fade-in">
      <p className="text-xs text-zinc-400 leading-relaxed">
        Change your display language and select your region. When auto country detection is active, your IP address
        resolves your location automatically. Manual overrides will bypass auto detection.
      </p>

      {/* Language selection dropdown */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-zinc-400">{t.settings.languageSelectLabel}</label>
        <select
          value={normalizeLang(selectedLang)}
          onChange={(e) => setSelectedLang(normalizeLang(e.target.value))}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
        >
          {Object.entries(languageCodes)
            .sort((a, b) => a[1].localeCompare(b[1]))
            .map(([code, name]) => (
              <option key={code} value={code} className="bg-zinc-900 text-zinc-100">
                {name as string} ({code})
              </option>
            ))}
        </select>
      </div>

      {/* Location (Country) select with custom search box */}
      <div className="space-y-1.5 relative">
        <label className="block text-xs font-semibold text-zinc-400">Region / Location</label>

        <div className="relative">
          {/* Searchable Combobox Toggle Button */}
          <button
            type="button"
            id="country-combobox-toggle"
            onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors flex items-center justify-between text-left cursor-pointer"
          >
            <span>
              {(() => {
                const matched = countryCodes.find(
                  (c) => c['alpha-2'].toUpperCase() === (selectedCountry || 'US').toUpperCase()
                );
                return matched ? `${matched.name} (${matched['alpha-2']})` : `${selectedCountry}`;
              })()}
            </span>
            <span className="material-icons-round text-zinc-500 text-sm">
              {isCountryDropdownOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
            </span>
          </button>

          {/* Search dropdown panel */}
          {isCountryDropdownOpen && (
            <div className="absolute left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-56">
              <div className="p-2 border-b border-zinc-800 bg-zinc-950/60 flex items-center gap-2">
                <span className="material-icons-round text-zinc-500 text-sm">search</span>
                <input
                  type="text"
                  placeholder="Search countries..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="w-full bg-transparent border-none text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-0 py-1"
                  autoFocus
                />
                {countrySearch && (
                  <button
                    type="button"
                    onClick={() => setCountrySearch('')}
                    className="p-0.5 text-zinc-500 hover:text-white cursor-pointer"
                  >
                    <span className="material-icons-round text-xs block">close</span>
                  </button>
                )}
              </div>
              <div className="overflow-y-auto flex-1 py-1 divide-y divide-zinc-850/30">
                {(() => {
                  const query = countrySearch.toLowerCase().trim();
                  const filtered = countryCodes.filter(
                    (c) =>
                      c.name.toLowerCase().includes(query) ||
                      c['alpha-2'].toLowerCase().includes(query) ||
                      (c['alpha-3'] && c['alpha-3'].toLowerCase().includes(query)) ||
                      (c['country-code'] && c['country-code'].includes(query))
                  );

                  if (filtered.length === 0) {
                    return <div className="px-4 py-3 text-xs text-zinc-500 text-center">No countries found</div>;
                  }

                  return filtered.map((c) => (
                    <button
                      key={c['alpha-2']}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(c['alpha-2']);
                        setIsCountryDropdownOpen(false);
                        setCountrySearch('');
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs hover:bg-zinc-800 transition-colors flex justify-between items-center cursor-pointer ${
                        (selectedCountry || '').toUpperCase() === c['alpha-2'].toUpperCase()
                          ? 'text-blue-500 font-semibold bg-zinc-850/20'
                          : 'text-zinc-300'
                      }`}
                    >
                      <span className="truncate pr-4">{c.name}</span>
                      <span className="font-mono text-zinc-500 text-[9px] uppercase shrink-0">
                        {c['alpha-2']} {c['alpha-3'] ? `• ${c['alpha-3']}` : ''}
                      </span>
                    </button>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Informational Alerts */}
      <div className="space-y-2">
        <div className="bg-zinc-950 border border-zinc-800/80 p-4 rounded-xl text-xs text-zinc-400 flex items-start gap-2.5">
          <span className="material-icons-round text-blue-500 text-sm mt-0.5">info</span>
          <span>{t.settings.cookieAlert} Location preference is stored in your secure &apos;USER_COUNTRY&apos; cookie.</span>
        </div>

        {/* Status badge: detected vs custom preference */}
        <div className="flex items-center gap-2 px-1">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              Cookies.get('USER_COUNTRY') ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500 animate-pulse'
            }`}
          />
          <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
            Location source:{' '}
            {Cookies.get('USER_COUNTRY') ? 'Custom Preference (Detection Bypassed)' : 'Auto Edge IP Geolocation'}
          </span>
        </div>
      </div>
    </form>
  );
}
