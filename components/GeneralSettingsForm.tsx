// /components/GeneralSettingsForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { usePlayer } from '@/context/PlayerContext';
import { validateUsername } from '@/lib/userValidation';
import {
  upsertUserProfile,
  checkIsUsernameTaken,
  checkIsEmailRegistered,
  recordRegisteredUser,
} from '@/lib/supabaseService';

export default function GeneralSettingsForm() {
  const router = useRouter();
  const params = useParams();
  const { userSession, updateUserSession, supabase, locale, region } = usePlayer();

  const [username, setUsername] = useState(userSession?.username || '');
  const [displayName, setDisplayName] = useState(userSession?.displayName || '');
  const [email, setEmail] = useState(userSession?.email || '');
  const [bio, setBio] = useState(userSession?.bio || '');
  const [website, setWebsite] = useState(userSession?.website || '');

  const [actualPassword, setActualPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showActualPassword, setShowActualPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState<{ checking: boolean; taken?: boolean; error?: string } | null>(null);
  const [emailStatus, setEmailStatus] = useState<{ checking: boolean; registered?: boolean; error?: string } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Synchronize initial data from userSession or localStorage
  useEffect(() => {
    if (!userSession) return;

    const u = userSession.username || '';
    const e = userSession.email || '';
    const currentUsername = u || 'GuestListener';

    const dn = userSession.displayName || (typeof window !== 'undefined' ? localStorage.getItem(`mb_user_displayname_${currentUsername}`) : '') || '';
    const b = userSession.bio || (typeof window !== 'undefined' ? localStorage.getItem(`mb_user_bio_${currentUsername}`) : '') || '';
    const w = userSession.website || (typeof window !== 'undefined' ? localStorage.getItem(`mb_user_website_${currentUsername}`) : '') || '';

    queueMicrotask(() => {
      if (u) setUsername(u);
      if (e) setEmail(e);
      setDisplayName(dn);
      setBio(b);
      setWebsite(w);
    });
  }, [userSession]);

  // Debounced check for username uniqueness in Settings
  useEffect(() => {
    const trimmed = username.trim();
    if (!trimmed || trimmed.toLowerCase() === (userSession?.username || '').toLowerCase()) {
      return;
    }
    const validation = validateUsername(trimmed);

    let active = true;
    const timer = setTimeout(async () => {
      if (!validation.valid) {
        if (active) setUsernameStatus({ checking: false, error: validation.error });
        return;
      }
      if (active) setUsernameStatus({ checking: true });
      const taken = await checkIsUsernameTaken(trimmed, userSession?.supabaseUser?.id || userSession?.username);
      if (active) {
        if (taken) {
          setUsernameStatus({ checking: false, taken: true, error: 'Username is already taken' });
        } else {
          setUsernameStatus({ checking: false, taken: false });
        }
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [username, userSession?.username, userSession?.supabaseUser?.id]);

  // Debounced check for email uniqueness in Settings
  useEffect(() => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@') || trimmed.toLowerCase() === (userSession?.email || '').toLowerCase()) {
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      if (active) setEmailStatus({ checking: true });
      const registered = await checkIsEmailRegistered(trimmed, userSession?.supabaseUser?.id || userSession?.email);
      if (active) {
        if (registered) {
          setEmailStatus({ checking: false, registered: true, error: 'Email already in use' });
        } else {
          setEmailStatus({ checking: false, registered: false });
        }
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [email, userSession?.email, userSession?.supabaseUser?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const trimmedUsername = username.trim();
    const trimmedDisplayName = displayName.trim();
    const trimmedEmail = email.trim();
    const trimmedBio = bio.trim();
    const trimmedWebsite = website.trim();

    // 1. Strict Username Validation
    const validation = validateUsername(trimmedUsername);
    if (!validation.valid) {
      setStatusMessage({
        type: 'error',
        text: validation.error || 'Username may only contain alphanumeric characters or single hyphens, and cannot begin or end with a hyphen.',
      });
      return;
    }

    if (!trimmedEmail) {
      setStatusMessage({ type: 'error', text: 'Email cannot be empty.' });
      return;
    }

    setIsSaving(true);

    // 2. Check if username is already taken by another account
    if (trimmedUsername.toLowerCase() !== (userSession?.username || '').toLowerCase()) {
      const isTaken = await checkIsUsernameTaken(trimmedUsername, userSession?.supabaseUser?.id || userSession?.username);
      if (isTaken) {
        setStatusMessage({
          type: 'error',
          text: 'This username is already taken. Please choose another one.',
        });
        setIsSaving(false);
        return;
      }
    }

    // 3. Check if email is already in use by another account
    if (trimmedEmail.toLowerCase() !== (userSession?.email || '').toLowerCase()) {
      const isEmailTaken = await checkIsEmailRegistered(trimmedEmail, userSession?.supabaseUser?.id || userSession?.email);
      if (isEmailTaken) {
        setStatusMessage({
          type: 'error',
          text: 'This email address is already in use by another account.',
        });
        setIsSaving(false);
        return;
      }
    }

    // 4. Password validation if password change is requested
    if (newPassword || confirmPassword || actualPassword) {
      if (!actualPassword) {
        setStatusMessage({ type: 'error', text: 'Please enter your actual password to change password.' });
        setIsSaving(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        setStatusMessage({ type: 'error', text: 'New password and confirm new password do not match.' });
        setIsSaving(false);
        return;
      }
      if (newPassword.length < 6) {
        setStatusMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
        setIsSaving(false);
        return;
      }

      if (userSession.isLoggedIn && supabase) {
        try {
          const { error: passErr } = await supabase.auth.updateUser({ password: newPassword });
          if (passErr) {
            setStatusMessage({ type: 'error', text: passErr.message });
            setIsSaving(false);
            return;
          }
        } catch (err: any) {
          setStatusMessage({ type: 'error', text: err?.message || 'Failed to update password' });
          setIsSaving(false);
          return;
        }
      }
    }

    try {
      // 1. Supabase & persistence sync
      const userId = userSession.supabaseUser?.id || (typeof window !== 'undefined' ? localStorage.getItem('mb_user_id') : null) || userSession.username;
      
      if (userId) {
        await upsertUserProfile(userId, {
          username: trimmedUsername,
          display_name: trimmedDisplayName,
          email: trimmedEmail,
          bio: trimmedBio,
          website: trimmedWebsite,
          language: locale || 'en',
          region: region || 'US',
        });
      }

      // Record in registered users index
      recordRegisteredUser({
        id: userSession.supabaseUser?.id || undefined,
        username: trimmedUsername,
        email: trimmedEmail,
      });

      const oldUsernameVal = userSession.username;

      // 2. Update player context state & local storage
      updateUserSession({
        username: trimmedUsername,
        displayName: trimmedDisplayName,
        email: trimmedEmail,
        bio: trimmedBio,
        website: trimmedWebsite,
      });

      // If username changed and currently on profile page, redirect to new username URL
      if (trimmedUsername !== oldUsernameVal && typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (currentPath.includes('/user/')) {
          const lang = (typeof params?.lang === 'string' ? params.lang : 'en');
          router.push(`/${lang}/user/${encodeURIComponent(trimmedUsername)}`);
        }
      }

      // Clear password fields
      setActualPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setStatusMessage({ type: 'success', text: 'User profile synchronized successfully!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to synchronize user settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form id="general-settings-form" onSubmit={handleSubmit} className="space-y-4 animate-fade-in text-sm text-zinc-300">
      {statusMessage && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          <span className="material-icons-round text-base">
            {statusMessage.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Username with helper rule */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-zinc-400">Username</label>
          <div className="flex items-center gap-2">
            {usernameStatus && (
              <span className="text-[10px] flex items-center gap-1 font-medium transition-colors">
                {usernameStatus.checking ? (
                  <span className="text-zinc-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full border border-blue-400 border-t-transparent animate-spin" />
                    Checking...
                  </span>
                ) : usernameStatus.taken ? (
                  <span className="text-rose-400 flex items-center gap-0.5">
                    <span className="material-icons-round text-xs">close</span> Taken
                  </span>
                ) : usernameStatus.error ? (
                  <span className="text-rose-400">{usernameStatus.error}</span>
                ) : usernameStatus.taken === false ? (
                  <span className="text-emerald-400 flex items-center gap-0.5">
                    <span className="material-icons-round text-xs">check</span> Available
                  </span>
                ) : null}
              </span>
            )}
            <span className="text-[10px] text-zinc-500 font-mono">Alphanumeric &amp; single hyphens</span>
          </div>
        </div>
        <input
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            if (!e.target.value.trim() || e.target.value.trim().toLowerCase() === (userSession?.username || '').toLowerCase()) {
              setUsernameStatus(null);
            }
          }}
          placeholder="e.g. music-geek-99"
          className={`w-full bg-zinc-950 border rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors font-mono ${
            usernameStatus?.taken || usernameStatus?.error
              ? 'border-rose-500/50 focus:border-rose-500'
              : usernameStatus?.taken === false
              ? 'border-emerald-500/50 focus:border-emerald-500'
              : 'border-zinc-800 focus:border-blue-500'
          }`}
          required
        />
        <p className="text-[11px] text-zinc-500 leading-normal">
          Username may only contain alphanumeric characters or single hyphens, and cannot begin or end with a hyphen.
        </p>
      </div>

      {/* Display Name (optional) */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-zinc-400">Display Name (optional)</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your full or preferred name"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-zinc-400">Email</label>
          {emailStatus && (
            <span className="text-[10px] flex items-center gap-1 font-medium transition-colors">
              {emailStatus.checking ? (
                <span className="text-zinc-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full border border-blue-400 border-t-transparent animate-spin" />
                  Checking...
                </span>
              ) : emailStatus.registered ? (
                <span className="text-rose-400 flex items-center gap-0.5">
                  <span className="material-icons-round text-xs">error_outline</span> In use
                </span>
              ) : emailStatus.registered === false ? (
                <span className="text-emerald-400 flex items-center gap-0.5">
                  <span className="material-icons-round text-xs">check</span> Available
                </span>
              ) : null}
            </span>
          )}
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (!e.target.value.trim() || e.target.value.trim().toLowerCase() === (userSession?.email || '').toLowerCase()) {
              setEmailStatus(null);
            }
          }}
          placeholder="email@example.com"
          className={`w-full bg-zinc-950 border rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors ${
            emailStatus?.registered
              ? 'border-rose-500/50 focus:border-rose-500'
              : emailStatus?.registered === false
              ? 'border-emerald-500/50 focus:border-emerald-500'
              : 'border-zinc-800 focus:border-blue-500'
          }`}
          required
        />
      </div>

      {/* Bio */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-zinc-400">Bio</label>
        <textarea
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell other listeners about your music taste, favorite genres, and concerts..."
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
        />
      </div>

      {/* Website */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-zinc-400">Website</label>
        <input
          type="text"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://example.com"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Password Change Section */}
      <div className="pt-2 border-t border-zinc-800">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-3">
          Password Settings
        </span>

        {/* Actual password */}
        <div className="space-y-1.5 mb-3">
          <label className="block text-xs font-semibold text-zinc-400">Actual password</label>
          <div className="relative">
            <input
              type={showActualPassword ? 'text' : 'password'}
              value={actualPassword}
              onChange={(e) => setActualPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-4 pr-10 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="button"
              id="actual-password-visibility-toggle"
              onClick={() => setShowActualPassword(!showActualPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              aria-label={showActualPassword ? 'Hide actual password' : 'Show actual password'}
              tabIndex={-1}
            >
              <span className="material-icons-round text-base">
                {showActualPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        {/* New password */}
        <div className="space-y-1.5 mb-3">
          <label className="block text-xs font-semibold text-zinc-400">New password</label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-4 pr-10 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="button"
              id="new-password-visibility-toggle"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
              tabIndex={-1}
            >
              <span className="material-icons-round text-base">
                {showNewPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        {/* Confirm new password */}
        <div className="space-y-1.5 mb-3">
          <label className="block text-xs font-semibold text-zinc-400">Confirm new password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-4 pr-10 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="button"
              id="confirm-password-visibility-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              aria-label={showConfirmPassword ? 'Hide confirm new password' : 'Show confirm new password'}
              tabIndex={-1}
            >
              <span className="material-icons-round text-base">
                {showConfirmPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
