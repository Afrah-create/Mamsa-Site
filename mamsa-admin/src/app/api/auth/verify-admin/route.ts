import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// This endpoint verifies if a user is an admin
// Uses service role key to bypass RLS for verification
export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ 
        error: 'Server configuration error',
        message: 'Missing Supabase configuration'
      }, { status: 500 });
    }

    // Use service role key to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if user exists in admin_users table
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('role, status, id, user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (adminError) {
      console.error('[verify-admin] Error checking admin status:', adminError);
      return NextResponse.json({ 
        error: 'Failed to verify admin status',
        details: adminError.message
      }, { status: 500 });
    }

    if (!adminData) {
      return NextResponse.json({ 
        isAdmin: false,
        error: 'User not found in admin system'
      }, { status: 200 });
    }

    // Valid admin roles
    const validRoles = ['super_admin', 'admin', 'moderator'];
    const isValidRole = validRoles.includes(adminData.role);
    const isActive = adminData.status === 'active';

    return NextResponse.json({
      isAdmin: isValidRole && isActive,
      role: adminData.role,
      status: adminData.status,
      message: !isValidRole 
        ? `Invalid role: ${adminData.role}`
        : !isActive 
        ? `Account is ${adminData.status}`
        : 'Admin verified'
    }, { status: 200 });

  } catch (error) {
    console.error('[verify-admin] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 }
    );
  }
}

