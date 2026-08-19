// /components/AuthCallbackClient.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePlayer } from '@/context/PlayerContext';
import { motion } from 'motion/react';
import Link from 'next/link';
import { upsertUserProfile, recordRegisteredUser } from '@/lib/supabaseService';

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { supabase, loginUser, refreshSupabaseData } = usePlayer();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string>('Finalizing your sign in...');
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    async function processOAuthCallback() {
      try {
        const errorParam = searchParams.get('error');
        const errorDescParam = searchParams.get('error_description');

        if (errorParam || errorDescParam) {
          setStatus('error');
          setErrorMessage(errorDescParam || errorParam || 'OAuth authentication was cancelled or failed.');
          return;
        }

        const code = searchParams.get('code');
        const tokenHash = searchParams.get('token_hash') || searchParams.get('token');
        const type = searchParams.get('type');
        const next = searchParams.get('next') ?? (type === 'recovery' ? '/update-password' : '/library');

        // Check if there is an active Supabase client
        if (supabase) {
          let session = null;
          let user = null;

          // 1. PKCE Authorization Code Exchange
          if (code) {
            setStatusText('Exchanging authorization code...');
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              console.warn('exchangeCodeForSession error:', error.message);
              // Check if session was already established
              const { data: currentSessionData } = await supabase.auth.getSession();
              if (currentSessionData?.session) {
                session = currentSessionData.session;
                user = session.user;
              } else {
                throw error;
              }
            } else {
              session = data.session;
              user = data.user;
            }
          } 
          // 2. Token Hash / OTP verification (e.g., magic link, invite, recovery)
          else if (tokenHash && type) {
            setStatusText('Verifying security token...');
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: type as any,
            });
            if (error) throw error;
            session = data.session;
            user = data.user;
          } 
          // 3. Check current session or hash params
          else {
            const { data } = await supabase.auth.getSession();
            session = data.session;
            user = session?.user || null;
          }

          // If session or user is available, synchronize profile
          if (user) {
            setStatusText('Setting up your profile...');
            const uname =
              user.user_metadata?.username ||
              user.user_metadata?.name ||
              user.user_metadata?.full_name ||
              user.user_metadata?.user_name ||
              user.email?.split('@')[0] ||
              'User';

            const userEmail = user.email || `${uname.toLowerCase()}@user.muzikoo`;

            loginUser(uname, userEmail);

            await upsertUserProfile(user.id, {
              username: uname,
              display_name: user.user_metadata?.full_name || user.user_metadata?.name || uname,
              email: userEmail,
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || undefined,
            });

            recordRegisteredUser({
              id: user.id,
              username: uname,
              email: userEmail,
            });

            await refreshSupabaseData();
          }
        } else {
          // Sandbox fallback mode
          setStatusText('Completing sandbox sign in...');
          loginUser('MusicListener', 'listener@muzikoo.com');
        }

        // Handle popup window flow
        if (typeof window !== 'undefined' && window.opener && window.opener !== window) {
          try {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
            window.close();
            return;
          } catch (e) {
            console.warn('Popup postMessage notice:', e);
          }
        }

        setStatus('success');
        setStatusText('Sign in complete! Redirecting to library...');

        // Smooth redirect to target destination
        setTimeout(() => {
          router.replace(next);
        }, 600);
      } catch (err: any) {
        console.error('OAuth Callback Error:', err);
        setStatus('error');
        setErrorMessage(err.message || 'An unexpected error occurred while completing authentication.');
      }
    }

    processOAuthCallback();
  }, [searchParams, supabase, loginUser, refreshSupabaseData, router]);

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden select-none">
      {/* Decorative ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8 backdrop-blur-md relative z-10 text-center space-y-6 shadow-2xl"
      >
        {/* Status Icon */}
        <div className="flex justify-center">
          {status === 'loading' && (
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-blue-500/20 animate-ping opacity-50" />
              <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 relative z-10">
                <span className="material-icons-round text-3xl text-zinc-950 animate-spin">
                  sync
                </span>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <span className="material-icons-round text-3xl text-emerald-400">
                check_circle
              </span>
            </div>
          )}

          {status === 'error' && (
            <div className="w-16 h-16 bg-rose-500/20 border border-rose-500/30 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/10">
              <span className="material-icons-round text-3xl text-rose-400">
                error_outline
              </span>
            </div>
          )}
        </div>

        {/* Status Title & Message */}
        <div className="space-y-2">
          <h1 className="font-sans font-extrabold text-2xl text-white tracking-tight">
            {status === 'loading' && 'Authenticating'}
            {status === 'success' && 'Welcome to Muzikoo'}
            {status === 'error' && 'Authentication Issue'}
          </h1>
          <p className="text-zinc-400 text-sm max-w-xs mx-auto leading-relaxed">
            {status === 'loading' && statusText}
            {status === 'success' && statusText}
            {status === 'error' && (errorMessage || 'We could not complete your sign in.')}
          </p>
        </div>

        {/* Action Button for Error State */}
        {status === 'error' && (
          <div className="pt-2 space-y-3">
            <Link
              href="/signin"
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 px-6 rounded-xl text-xs transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-lg shadow-blue-500/10"
            >
              <span className="material-icons-round text-sm">arrow_back</span>
              Return to Sign In
            </Link>
            <div>
              <Link
                href="/"
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Go to Explore Page
              </Link>
            </div>
          </div>
        )}

        {/* Animated Loading Bar */}
        {status === 'loading' && (
          <div className="w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
            />
          </div>
        )}
      </motion.div>
    </div>
  );
}
