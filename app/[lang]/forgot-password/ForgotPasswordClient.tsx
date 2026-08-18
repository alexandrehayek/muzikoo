'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePlayer } from '@/context/PlayerContext';
import { motion, AnimatePresence } from 'motion/react';

export default function ForgotPasswordClient() {
  const { supabase } = usePlayer();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      if (supabase) {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
          redirectTo: `${origin}/auth/callback?next=/update-password`,
        });

        if (resetErr) {
          throw resetErr;
        }

        setSuccessMsg(`A password reset email has been sent to ${trimmedEmail}. Please check your inbox and click the link to reset your password.`);
      } else {
        // Sandbox mode simulation
        await new Promise((resolve) => setTimeout(resolve, 800));
        setSuccessMsg(`[Sandbox Mode] A password reset email has been sent to ${trimmedEmail}. Check your inbox for instructions.`);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="w-full max-w-md space-y-6 bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 bg-gradient-to-tr from-blue-500 to-cyan-600 rounded-xl items-center justify-center shadow-lg shadow-blue-500/10 mb-2">
            <span className="material-icons-round text-2xl text-zinc-950 block">lock_reset</span>
          </div>
          <h1 className="font-sans font-extrabold text-2xl text-white tracking-tight">
            Forgot your password?
          </h1>
          <p className="text-zinc-400 text-xs max-w-xs mx-auto leading-relaxed">
            Enter your email and we&apos;ll send you a link to reset your password
          </p>
        </div>

        {/* Form */}
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

          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="block text-zinc-400 text-xs font-semibold" htmlFor="forgot-email-input">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500">
                <span className="material-icons-round text-base block">mail</span>
              </div>
              <input
                id="forgot-email-input"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-blue-500/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-0 transition-all disabled:opacity-50"
                required
              />
            </div>
          </div>

          {/* Security / Info Banner */}
          <div className="bg-zinc-950/40 rounded-xl p-3 border border-zinc-900 flex gap-2.5 items-start">
            <span className="material-icons-round text-blue-500 text-base shrink-0 mt-0.5">shield</span>
            <span className="text-[10px] text-zinc-500 leading-normal">
              {supabase
                ? 'Password resets are handled securely through your Supabase account verification.'
                : 'Sandbox Mode is active. A simulated reset notification will be returned.'}
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            id="send-reset-email-btn"
            style={{ color: '#ffffff' }}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span style={{ color: '#ffffff' }}>Sending password reset email...</span>
              </>
            ) : (
              <span style={{ color: '#ffffff' }}>Send password reset email</span>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="pt-4 text-center border-t border-zinc-800/80">
          <p className="text-xs text-zinc-400">
            Already have an account?{' '}
            <Link href="/signin" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
