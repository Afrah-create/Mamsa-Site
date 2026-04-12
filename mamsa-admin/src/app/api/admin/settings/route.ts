import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';
import { apiEnvelope } from '@/lib/api-envelope';

export async function GET() {
  await requireAdmin();

  try {
    const rows = await sql<{ setting_key: string; setting_value: string | null }[]>`
      SELECT setting_key, setting_value FROM settings ORDER BY setting_key ASC
    `;

    const map: Record<string, string> = {};
    for (const r of rows) {
      map[r.setting_key] = r.setting_value ?? '';
    }

    return apiEnvelope(true, { data: map, message: 'Settings loaded' });
  } catch (error) {
    console.error('[api/admin/settings][GET]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to load settings',
    });
  }
}

export async function PUT(request: Request) {
  await requireAdmin();

  try {
    const body = await request.json();
    const settings = (body.settings ?? body) as Record<string, unknown>;
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      return apiEnvelope(false, {
        status: 400,
        error: 'settings object required',
        message: 'Validation failed',
      });
    }

    for (const [key, val] of Object.entries(settings)) {
      if (typeof key !== 'string' || !key.trim()) continue;
      const value = val == null ? '' : String(val);
      await sql`
        INSERT INTO settings (setting_key, setting_value)
        VALUES (${key.trim()}, ${value})
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
      `;
    }

    const rows = await sql<{ setting_key: string; setting_value: string | null }[]>`
      SELECT setting_key, setting_value FROM settings ORDER BY setting_key ASC
    `;
    const map: Record<string, string> = {};
    for (const r of rows) {
      map[r.setting_key] = r.setting_value ?? '';
    }

    return apiEnvelope(true, { data: map, message: 'Settings saved' });
  } catch (error) {
    console.error('[api/admin/settings][PUT]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to save settings',
    });
  }
}
