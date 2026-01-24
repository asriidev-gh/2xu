import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Read environment variables inside the function
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@2xu.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

    // Debug: Log all environment variables that start with ADMIN
    console.log('All ADMIN env vars:', {
      ADMIN_EMAIL: process.env.ADMIN_EMAIL,
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? '***SET***' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
      allEnvKeys: Object.keys(process.env).filter(key => key.includes('ADMIN'))
    });

    const { email, password } = await request.json();

    // Trim whitespace from inputs
    const trimmedEmail = email?.trim();
    const trimmedPassword = password?.trim();

    // Debug logging
    console.log('Login attempt:', { 
      receivedEmail: trimmedEmail, 
      expectedEmail: ADMIN_EMAIL,
      emailMatch: trimmedEmail === ADMIN_EMAIL,
      receivedPasswordLength: trimmedPassword?.length,
      expectedPasswordLength: ADMIN_PASSWORD?.length
    });

    // Validate credentials
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.error('Admin credentials not configured!');
      return NextResponse.json(
        { error: 'Server configuration error. Please contact administrator.' },
        { status: 500 }
      );
    }

    if (trimmedEmail === ADMIN_EMAIL && trimmedPassword === ADMIN_PASSWORD) {
      // Set session cookie
      const cookieStore = await cookies();
      cookieStore.set('admin_session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });

      return NextResponse.json(
        { success: true, message: 'Login successful' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to process login' },
      { status: 500 }
    );
  }
}

