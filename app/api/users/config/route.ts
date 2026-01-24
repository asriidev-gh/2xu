import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Check if user is authenticated
async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return session?.value === 'authenticated';
}

export async function GET() {
  try {
    // Check authentication
    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Return configuration
    return NextResponse.json(
      { 
        deleteUserEnabled: process.env.DELETE_USER_ENABLED === 'true'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Config error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch config' },
      { status: 500 }
    );
  }
}

