import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.warn('[api/admin/users] NEXT_PUBLIC_SUPABASE_URL is not defined. Admin user management API will not work.');
}

if (!serviceRoleKey) {
  console.warn('[api/admin/users] SUPABASE_SERVICE_ROLE_KEY is not defined. Admin user management API will not work.');
}

const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

type Permissions = {
  news: boolean;
  events: boolean;
  leadership: boolean;
  gallery: boolean;
  users: boolean;
  reports: boolean;
};

type IncomingUser = {
  full_name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  bio?: string;
  role: 'super_admin' | 'admin' | 'moderator';
  department?: string;
  position?: string;
  permissions: Permissions;
  status: 'active' | 'inactive' | 'suspended';
};

export async function POST(request: Request) {
  if (!supabaseAdmin) {
    const missingVars: string[] = [];
    if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!serviceRoleKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
    
    const isServiceRoleKeyMissing = missingVars.includes('SUPABASE_SERVICE_ROLE_KEY');
    
    const errorMessage = isServiceRoleKeyMissing 
      ? {
          title: 'Service Role Key Required',
          summary: 'The Supabase Service Role Key is missing. This is required to create admin users.',
          steps: [
            'Go to your Supabase Dashboard',
            'Navigate to Settings > API',
            'Copy the service_role key (keep it secret!)',
            'Add it to your .env.local file as: SUPABASE_SERVICE_ROLE_KEY=your-key',
            'Restart your development server'
          ],
          note: 'This key provides elevated permissions needed for user management.'
        }
      : {
          title: 'Configuration Required',
          summary: `Missing environment variables: ${missingVars.join(', ')}`,
          steps: [
            'Add the missing variables to your .env.local file',
            'Restart your development server'
          ]
        };
    
    return NextResponse.json({ 
      error: 'Configuration Required',
      message: errorMessage,
      missingVariables: missingVars,
      helpUrl: 'https://supabase.com/dashboard/project/_/settings/api'
    }, { status: 500 });
  }

  try {
    const { user, password, createdBy }: { user: IncomingUser; password?: string; createdBy?: string | null } =
      await request.json();

    if (!user || !user.email || !user.full_name) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // For super_admin, use default password if not provided
    const finalPassword = password || (user.role === 'super_admin' ? 'adminmamsa' : null);
    
    if (!finalPassword) {
      return NextResponse.json({ error: 'Password is required for non-super-admin users.' }, { status: 400 });
    }

    // Log password creation (without exposing the actual password)
    console.log(`[api/admin/users] Creating user ${user.email} with role ${user.role}, password ${finalPassword ? 'provided' : 'missing'}`);

    const normalizedPermissions: Permissions =
      user.role === 'super_admin'
        ? {
            news: true,
            events: true,
            leadership: true,
            gallery: true,
            users: true,
            reports: true,
          }
        : {
            news: Boolean(user.permissions?.news),
            events: Boolean(user.permissions?.events),
            leadership: Boolean(user.permissions?.leadership),
            gallery: Boolean(user.permissions?.gallery),
            users: Boolean(user.permissions?.users),
            reports: Boolean(user.permissions?.reports),
          };

    // Create user in Supabase Auth with password
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: finalPassword,
      email_confirm: true,
      user_metadata: {
        full_name: user.full_name,
        role: user.role,
      },
    });

    if (authError || !authData?.user) {
      console.error('[api/admin/users] Failed to create auth user:', authError);
      return NextResponse.json({ 
        error: authError?.message ?? 'Failed to create authentication user.',
        details: authError 
      }, { status: 400 });
    }

    console.log(`[api/admin/users] Successfully created auth user ${authData.user.id} for ${user.email}`);

    const insertPayload = {
      user_id: authData.user.id,
      full_name: user.full_name,
      email: user.email,
      avatar_url: user.avatar_url ?? null,
      phone: user.phone ?? null,
      bio: user.bio ?? null,
      role: user.role,
      department: user.department ?? null,
      position: user.position ?? null,
      permissions: normalizedPermissions,
      status: user.status ?? 'active',
      created_by: createdBy ?? null,
    };

    // Use upsert (ON CONFLICT DO UPDATE) because the database trigger might have already created a record
    // This ensures we update the record with complete data if the trigger created it first
    const { data: adminUser, error: insertError } = await supabaseAdmin
      .from('admin_users')
      .upsert(insertPayload, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select('*')
      .single();

    if (insertError || !adminUser) {
      console.error('[api/admin/users] Failed to upsert admin user profile:', insertError);
      // Clean up: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ 
        error: insertError?.message ?? 'Failed to store admin profile.',
        details: insertError 
      }, { status: 400 });
    }

    console.log(`[api/admin/users] Successfully created admin user profile ${adminUser.id} for ${user.email}`);
    
    // Note: Passwords are stored in Supabase Auth (auth.users table), NOT in admin_users table
    // The admin_users table only stores profile information
    // To verify password was set correctly, check Supabase Auth dashboard or test login

    return NextResponse.json({ 
      data: adminUser,
      message: 'User created successfully. Password has been set in Supabase Auth.'
    }, { status: 201 });
  } catch (error) {
    console.error('[api/admin/users] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 }
    );
  }
}

