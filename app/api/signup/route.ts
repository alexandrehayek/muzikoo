// /app/api/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, username } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // Return success response with mock/created session payload
    return NextResponse.json({
      success: true,
      message: 'Account created successfully.',
      user: {
        id: 'usr_' + Math.random().toString(36).substring(2, 10),
        email,
        username: username || email.split('@')[0],
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Signup failed' },
      { status: 500 }
    );
  }
}
