import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  
  // Default target route: if recovery type, redirect to /update-password
  let next = requestUrl.searchParams.get('next') ?? (type === 'recovery' ? '/update-password' : '/library');

  if (error || errorDescription) {
    return NextResponse.redirect(
      new URL(`/update-password?error=${encodeURIComponent(error || '')}&error_description=${encodeURIComponent(errorDescription || '')}`, request.url)
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    if (code) {
      await supabase.auth.exchangeCodeForSession(code);
    } else if (tokenHash && type) {
      await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as any });
    }
  }

  // Redirect to the target application route
  return NextResponse.redirect(new URL(next, request.url));
}
