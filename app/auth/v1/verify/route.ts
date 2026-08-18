import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get('token_hash') || requestUrl.searchParams.get('token');
  const type = requestUrl.searchParams.get('type') || 'recovery';
  const redirectTo = requestUrl.searchParams.get('redirect_to') || '/update-password';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (tokenHash && supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as any });
    } catch (err) {
      console.warn('verifyOtp error in proxy route:', err);
    }
  }

  // Redirect to target reset password screen with original query parameters
  const targetUrl = new URL('/update-password', request.url);
  requestUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  return NextResponse.redirect(targetUrl);
}
