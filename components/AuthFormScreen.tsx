// /components/AuthFormScreen.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlayer } from '@/context/PlayerContext';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { validateUsername } from '@/lib/userValidation';
import {
  upsertUserProfile,
  checkIsUsernameTaken,
  checkIsEmailRegistered,
  recordRegisteredUser,
} from '@/lib/supabaseService';

export default function AuthFormScreen({ initialMode = 'signin' }: { initialMode?: 'signin' | 'signup' }) {
  const router = useRouter();
  const { userSession, supabase, loginUser, t } = usePlayer();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [usernameStatus, setUsernameStatus] = useState<{ checking: boolean; taken?: boolean; error?: string } | null>(null);
  const [emailStatus, setEmailStatus] = useState<{ checking: boolean; registered?: boolean; error?: string } | null>(null);

  // If user is already logged in, redirect to library page
  useEffect(() => {
    if (userSession.isLoggedIn) {
      router.push('/library');
    }
  }, [userSession.isLoggedIn, router]);

  // Debounced check for username availability in signup mode
  useEffect(() => {
    const trimmed = username.trim();
    if (mode !== 'signup' || !trimmed) {
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
      const taken = await checkIsUsernameTaken(trimmed);
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
  }, [username, mode]);

  // Debounced check for email availability in signup mode
  useEffect(() => {
    const trimmed = email.trim();
    if (mode !== 'signup' || !trimmed || !trimmed.includes('@')) {
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      if (active) setEmailStatus({ checking: true });
      const registered = await checkIsEmailRegistered(trimmed);
      if (active) {
        if (registered) {
          setEmailStatus({ checking: false, registered: true, error: 'Email is already registered' });
        } else {
          setEmailStatus({ checking: false, registered: false });
        }
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [email, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    if (!trimmedEmail) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }
    if (mode === 'signup') {
      if (!trimmedUsername) {
        setError('Please choose a username');
        return;
      }
      const validation = validateUsername(trimmedUsername);
      if (!validation.valid) {
        setError(validation.error || 'Username may only contain alphanumeric characters or single hyphens, and cannot begin or end with a hyphen.');
        return;
      }

      setLoading(true);

      // Check if username is already taken
      const isTaken = await checkIsUsernameTaken(trimmedUsername);
      if (isTaken) {
        setError('This username is already taken. Please choose another one.');
        setLoading(false);
        return;
      }

      // Check if email is already registered
      const isEmailTaken = await checkIsEmailRegistered(trimmedEmail);
      if (isEmailTaken) {
        setError('An account with this email address is already registered. Please sign in instead.');
        setLoading(false);
        return;
      }
    } else {
      setLoading(true);
    }

    try {
      if (supabase) {
        if (mode === 'signup') {
          // Real Supabase Sign Up
          const { data, error: signupErr } = await supabase.auth.signUp({
            email: trimmedEmail,
            password,
            options: {
              data: {
                username: trimmedUsername,
              },
            },
          });

          if (signupErr) {
            const msg = signupErr.message.toLowerCase();
            if (msg.includes('already registered') || msg.includes('already taken') || msg.includes('user already exists')) {
              throw new Error('An account with this email address is already registered. Please sign in instead.');
            }
            throw signupErr;
          }

          if (data?.user) {
            await upsertUserProfile(data.user.id, {
              username: trimmedUsername,
              display_name: trimmedUsername,
              email: trimmedEmail,
            });
            recordRegisteredUser({
              id: data.user.id,
              username: trimmedUsername,
              email: trimmedEmail,
            });
          }
          
          if (data?.session) {
            setSuccessMsg('Account created successfully!');
            setTimeout(() => router.push('/library'), 1000);
          } else {
            setSuccessMsg('Sign-up successful! Please check your email for a verification link.');
          }
        } else {
          // Real Supabase Sign In
          const { data: signinData, error: signinErr } = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          });
          if (signinErr) throw signinErr;

          if (signinData?.user) {
            const u = signinData.user;
            const uname = u.user_metadata?.username || u.user_metadata?.name || u.user_metadata?.full_name || u.email?.split('@')[0] || 'User';
            loginUser(uname, u.email || trimmedEmail);
          }
          
          setSuccessMsg('Signed in successfully!');
          setTimeout(() => router.push('/library'), 500);
        }
      } else {
        // Fallback Sandbox Mode
        if (mode === 'signup') {
          recordRegisteredUser({
            username: trimmedUsername,
            email: trimmedEmail,
          });
        }
        setTimeout(() => {
          loginUser(mode === 'signup' ? trimmedUsername : trimmedEmail.split('@')[0], trimmedEmail);
          setSuccessMsg(mode === 'signup' ? 'Account created (Sandbox Mode)!' : 'Signed in (Sandbox Mode)!');
          setTimeout(() => router.push('/library'), 800);
        }, 800);
      }
    } catch (err: any) {
      setError(err.message || 'An authentication error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setError(null);
    setSuccessMsg(null);
    
    if (supabase) {
      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const redirectTo = `${origin}/auth/callback?next=/library`;
        
        const { error: oauthErr } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo,
          },
        });
        if (oauthErr) throw oauthErr;
      } catch (err: any) {
        setError(err.message || `Failed to sign in with ${provider}`);
      }
    } else {
      // Sandbox OAuth Mock
      setLoading(true);
      setTimeout(() => {
        loginUser(`${provider.charAt(0).toUpperCase() + provider.slice(1)}User`, `${provider}@example.com`);
        setSuccessMsg(`Signed in with ${provider} (Sandbox Mode)!`);
        setLoading(false);
        setTimeout(() => router.push('/library'), 800);
      }, 1000);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden select-none">
      {/* Decorative ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-zinc-900/20 border border-zinc-900 rounded-3xl p-8 backdrop-blur-md relative z-10 space-y-6 shadow-2xl"
      >
        {/* Back Link */}
        <div className="flex items-center">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors text-xs"
          >
            <span className="material-icons-round text-sm block">arrow_back</span>
            Back to Explore
          </Link>
        </div>

        {/* Logo and Greeting */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 bg-gradient-to-tr from-blue-500 to-cyan-600 rounded-xl items-center justify-center shadow-lg shadow-blue-500/10 mb-2">
            <span className="material-icons-round text-2xl text-zinc-950 block">music_note</span>
          </div>
          <h1 className="font-sans font-extrabold text-2xl text-white tracking-tight">
            {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-zinc-500 text-xs max-w-xs mx-auto leading-relaxed">
            {mode === 'signin'
              ? 'Sign in to access your custom playlists, favorites, and ListenBrainz profile synchronizations.'
              : 'Sign up to register your listener profile and save collections to your persistent dashboard.'}
          </p>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-xs text-rose-400 font-medium overflow-hidden"
              >
                {error}
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-400 font-medium overflow-hidden"
              >
                {successMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mode-specific username field */}
          <AnimatePresence>
            {mode === 'signup' && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="space-y-1.5 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <label className="block text-zinc-400 text-xs font-semibold animate-fade-in" htmlFor="username-input">
                    Username
                  </label>
                  {usernameStatus && (
                    <span className="text-[10px] flex items-center gap-1 font-medium transition-colors">
                      {usernameStatus.checking ? (
                        <span className="text-zinc-500 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full border border-blue-400 border-t-transparent animate-spin" />
                          Checking...
                        </span>
                      ) : usernameStatus.taken ? (
                        <span className="text-rose-400 flex items-center gap-0.5">
                          <span className="material-icons-round text-xs">close</span> Already taken
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
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500">
                    <span className="material-icons-round text-base block">person</span>
                  </div>
                  <input
                    id="username-input"
                    type="text"
                    placeholder="e.g. MusicGeek"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (!e.target.value.trim()) setUsernameStatus(null);
                    }}
                    disabled={loading}
                    className={`w-full bg-zinc-950/60 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-0 transition-all disabled:opacity-50 ${
                      usernameStatus?.taken || usernameStatus?.error
                        ? 'border-rose-500/50 focus:border-rose-500'
                        : usernameStatus?.taken === false
                        ? 'border-emerald-500/50 focus:border-emerald-500'
                        : 'border-zinc-800 focus:border-blue-500/40'
                    }`}
                    required={mode === 'signup'}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-zinc-400 text-xs font-semibold" htmlFor="email-input">
                Email Address
              </label>
              {mode === 'signup' && emailStatus && (
                <span className="text-[10px] flex items-center gap-1 font-medium transition-colors">
                  {emailStatus.checking ? (
                    <span className="text-zinc-500 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full border border-blue-400 border-t-transparent animate-spin" />
                      Checking...
                    </span>
                  ) : emailStatus.registered ? (
                    <span className="text-rose-400 flex items-center gap-0.5">
                      <span className="material-icons-round text-xs">error_outline</span> Already registered
                    </span>
                  ) : emailStatus.registered === false ? (
                    <span className="text-emerald-400 flex items-center gap-0.5">
                      <span className="material-icons-round text-xs">check</span> Available
                    </span>
                  ) : null}
                </span>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500">
                <span className="material-icons-round text-base block">mail</span>
              </div>
              <input
                id="email-input"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (!e.target.value.trim()) setEmailStatus(null);
                }}
                disabled={loading}
                className={`w-full bg-zinc-950/60 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-0 transition-all disabled:opacity-50 ${
                  mode === 'signup' && emailStatus?.registered
                    ? 'border-rose-500/50 focus:border-rose-500'
                    : mode === 'signup' && emailStatus?.registered === false
                    ? 'border-emerald-500/50 focus:border-emerald-500'
                    : 'border-zinc-800 focus:border-blue-500/40'
                }`}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-zinc-400 text-xs font-semibold" htmlFor="password-input">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                id="forgot-password-link"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500">
                <span className="material-icons-round text-base block">lock</span>
              </div>
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-blue-500/40 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-0 transition-all disabled:opacity-50"
                required
              />
              <button
                type="button"
                id="password-visibility-toggle"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                <span className="material-icons-round text-base">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Security / Info Banner */}
          <div className="bg-zinc-950/40 rounded-xl p-3 border border-zinc-900 flex gap-2.5 items-start">
            <span className="material-icons-round text-blue-500 text-base shrink-0 mt-0.5">shield</span>
            <span className="text-[10px] text-zinc-500 leading-normal">
              {supabase 
                ? 'Your authentication details are secured by official Supabase project database protocols.'
                : 'Sandbox Mode is active. Any credentials will grant immediate localized access.'}
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-400 disabled:bg-blue-500/50 text-white font-bold py-3 rounded-xl text-xs transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/5 font-sans"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              </span>
            ) : (
              <>
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
                <span className="material-icons-round text-sm block">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-zinc-800"></div>
          <span className="px-3 text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Or continue with</span>
          <div className="flex-1 border-t border-zinc-800"></div>
        </div>

        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleOAuthLogin('google')}
            disabled={loading}
            className="flex items-center justify-center gap-2.5 bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 text-zinc-200 px-4 py-3 rounded-xl text-xs font-semibold transition-all hover:scale-[1.01] active:scale-95 cursor-pointer shadow-sm disabled:opacity-50"
          >
            {/* Official Google Icon SVG */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="text-xs font-semibold">Google</span>
          </button>

          <button
            type="button"
            onClick={() => handleOAuthLogin('github')}
            disabled={loading}
            className="flex items-center justify-center gap-2.5 bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 text-zinc-200 px-4 py-3 rounded-xl text-xs font-semibold transition-all hover:scale-[1.01] active:scale-95 cursor-pointer shadow-sm disabled:opacity-50"
          >
            {/* Official GitHub Icon SVG */}
            <svg className="w-5 h-5 shrink-0 fill-current text-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <span className="text-xs font-semibold">GitHub</span>
          </button>
        </div>

        {/* Toggle Mode Link */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError(null);
              setSuccessMsg(null);
            }}
            className="text-xs text-blue-500 hover:text-blue-400 font-semibold cursor-pointer underline"
          >
            {mode === 'signin'
              ? "Don't have an account? Sign Up"
              : 'Already have an account? Sign In'}
          </button>
          <p className="text-[10px] text-zinc-600 mt-4 leading-normal">
            By signing in, you agree to our Terms of Service & Privacy Policy.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
