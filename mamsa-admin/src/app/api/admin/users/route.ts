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
    return NextResponse.json({ error: 'Supabase service role client is not configured.' }, { status: 500 });
  }

  try {
    const { user, password, createdBy }: { user: IncomingUser; password: string; createdBy?: string | null } =
      await request.json();

    if (!user || !user.email || !user.full_name || !password) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

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

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: user.full_name,
        role: user.role,
      },
    });

    if (authError || !authData?.user) {
      return NextResponse.json({ error: authError?.message ?? 'Failed to create authentication user.' }, { status: 400 });
    }

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

    const { data: adminUser, error: insertError } = await supabaseAdmin
      .from('admin_users')
      .insert(insertPayload)
      .select('*')
      .single();

    if (insertError || !adminUser) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: insertError?.message ?? 'Failed to store admin profile.' }, { status: 400 });
    }

    return NextResponse.json({ data: adminUser }, { status: 201 });
  } catch (error) {
    console.error('[api/admin/users] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 }
    );
  }
}

