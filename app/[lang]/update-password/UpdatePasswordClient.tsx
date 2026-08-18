'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePlayer } from '@/context/PlayerContext';
import { motion, AnimatePresence } from 'motion/react';

export default function UpdatePasswordClient() {
  const router = useRouter();
  const { supabase, userSession, updateUserSession } = usePlayer();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [verifyingSession, setVerifyingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLinkExpired, setIsLinkExpired] = useState(false);

  // Initialize and verify authentication/recovery session from URL or Supabase
  useEffect(() => {
    let isMounted = true;

    async function checkRecoverySession() {
      if (typeof window === 'undefined') return;

      const hash = window.location.hash;
      const searchParams = new URLSearchParams(window.location.search);

      // Check for error in hash fragment (e.g. #error=access_denied&error_code=otp_expired&error_description=...)
      if (hash.includes('error=')) {
        const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
        const errorDesc = hashParams.get('error_description') || hashParams.get('error') || 'Recovery link error';
        if (isMounted) {
          setIsLinkExpired(true);
          setError(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
          setVerifyingSession(false);
        }
        return;
      }

      // Check for token_hash & type=recovery in search params
      const tokenHash = searchParams.get('token_hash') || searchParams.get('token');
      const type = searchParams.get('type');
      const code = searchParams.get('code');

      if (supabase) {
        try {
          if (tokenHash && type === 'recovery') {
            const { error: verifyErr } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'recovery',
            });
            if (verifyErr) {
              if (isMounted) {
                setIsLinkExpired(true);
                setError(verifyErr.message || 'Invalid or expired password reset token.');
              }
            }
          } else if (code) {
            const { error: codeErr } = await supabase.auth.exchangeCodeForSession(code);
            if (codeErr) {
              if (isMounted) {
                setIsLinkExpired(true);
                setError(codeErr.message || 'Failed to exchange recovery code.');
              }
            }
          } else if (hash.includes('access_token=')) {
            // Hash contains access_token from Supabase recovery redirect
            const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            if (accessToken && refreshToken) {
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
            }
          }

          // Verify if we have a valid session
          const { data: { session } } = await supabase.auth.getSession();
          if (!session && !hash.includes('access_token=')) {
            // No session yet; check if onAuthStateChange resolves it
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
              if (newSession && isMounted) {
                setVerifyingSession(false);
              }
            });
            setTimeout(() => {
              if (isMounted) setVerifyingSession(false);
            }, 1200);
            return () => subscription.unsubscribe();
          }
        } catch (e: any) {
          console.warn('Error verifying recovery session:', e);
        }
      }

      if (isMounted) {
        setVerifyingSession(false);
      }
    }

    checkRecoverySession();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!newPassword) {
      setError('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      if (supabase) {
        const { data, error: updateErr } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (updateErr) {
          throw updateErr;
        }

        // Update local session state if user is returned
        if (data?.user) {
          updateUserSession({
            email: data.user.email || userSession.email,
            isLoggedIn: true,
            supabaseUser: data.user,
          });
        }

        setSuccessMsg('Your password has been reset successfully! Redirecting to library...');
        setTimeout(() => {
          router.push('/library');
        }, 1500);
      } else {
        // Sandbox fallback mode
        await new Promise((resolve) => setTimeout(resolve, 800));
        setSuccessMsg('[Sandbox Mode] Password has been updated successfully! Redirecting...');
        setTimeout(() => {
          router.push('/library');
        }, 1500);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="w-full max-w-md space-y-6 bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-xl items-center justify-center shadow-lg shadow-emerald-500/10 mb-2">
            <span className="material-icons-round text-2xl text-zinc-950 block">vpn_key</span>
          </div>
          <h1 className="font-sans font-extrabold text-2xl text-white tracking-tight">
            Set New Password
          </h1>
          <p className="text-zinc-400 text-xs max-w-xs mx-auto leading-relaxed">
            Please enter and confirm your new secure password below
          </p>
        </div>

        {/* Expired Link State */}
        {isLinkExpired ? (
          <div className="space-y-4 pt-2">
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-xs text-rose-400 font-medium space-y-2">
              <div className="flex items-center gap-2 font-semibold text-rose-300">
                <span className="material-icons-round text-base">error_outline</span>
                <span>Reset Link Invalid or Expired</span>
              </div>
              <p className="text-rose-400/90 leading-relaxed">
                {error || 'The password reset link you used has expired or has already been used. Please request a new password reset email.'}
              </p>
            </div>

            <Link
              href="/forgot-password"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              <span className="material-icons-round text-base">replay</span>
              <span>Request New Reset Email</span>
            </Link>
          </div>
        ) : (
          /* Password Reset Form */
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-xs text-rose-400 font-medium overflow-hidden flex items-start gap-2"
                >
                  <span className="material-icons-round text-base shrink-0 mt-0.5">error</span>
                  <span>{error}</span>
                </motion.div>
              )}

              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-400 font-medium overflow-hidden flex items-start gap-2"
                >
                  <span className="material-icons-round text-base shrink-0 mt-0.5">check_circle</span>
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* New Password Input */}
            <div className="space-y-1.5">
              <label className="block text-zinc-400 text-xs font-semibold" htmlFor="new-password-input">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500">
                  <span className="material-icons-round text-base block">lock</span>
                </div>
                <input
                  id="new-password-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading || verifyingSession}
                  className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-blue-500/40 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-0 transition-all disabled:opacity-50"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  <span className="material-icons-round text-base">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Confirm New Password Input */}
            <div className="space-y-1.5">
              <label className="block text-zinc-400 text-xs font-semibold" htmlFor="confirm-password-input">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500">
                  <span className="material-icons-round text-base block">lock_reset</span>
                </div>
                <input
                  id="confirm-password-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading || verifyingSession}
                  className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-blue-500/40 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-0 transition-all disabled:opacity-50"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  <span className="material-icons-round text-base">
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Password Validation Hints */}
            <div className="bg-zinc-950/40 rounded-xl p-3 border border-zinc-800/80 space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <span
                  className={`material-icons-round text-xs ${
                    newPassword.length >= 6 ? 'text-emerald-400' : 'text-zinc-500'
                  }`}
                >
                  {newPassword.length >= 6 ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <span className={newPassword.length >= 6 ? 'text-zinc-200' : 'text-zinc-500'}>
                  Minimum 6 characters
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`material-icons-round text-xs ${
                    confirmPassword && newPassword === confirmPassword ? 'text-emerald-400' : 'text-zinc-500'
                  }`}
                >
                  {confirmPassword && newPassword === confirmPassword ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <span
                  className={
                    confirmPassword && newPassword === confirmPassword ? 'text-zinc-200' : 'text-zinc-500'
                  }
                >
                  Passwords match
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || verifyingSession || !newPassword || newPassword !== confirmPassword}
              id="update-password-btn"
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Updating password...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        )}

        {/* Footer Link */}
        <div className="pt-4 text-center border-t border-zinc-800/80">
          <p className="text-xs text-zinc-400">
            Remembered your password?{' '}
            <Link href="/signin" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
