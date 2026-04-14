import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';
import { toMysqlJsonArray } from '@/lib/mysql-json';
import { isBase64Image, isLocalUploadPath } from '@/lib/upload';
import { deleteImage, saveImage } from '@/lib/upload-server';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id } = await params;
    const numericId = Number(id);
    const body = await request.json();

    const existing = await sql<{ featured_image: string | null }[]>`
      SELECT featured_image
      FROM events
      WHERE id = ${numericId}
      LIMIT 1
    `;

    const imageValue = body.image ?? body.featured_image ?? null;
    let featuredImage = imageValue ?? existing[0]?.featured_image ?? null;
    if (isBase64Image(imageValue)) {
      if (isLocalUploadPath(existing[0]?.featured_image)) {
        await deleteImage(existing[0].featured_image);
      }

      featuredImage = await saveImage(imageValue, 'events');
    }

    const tagsJson = toMysqlJsonArray(body.tags);
    await sql`
      UPDATE events
      SET title = ${body.title},
          description = ${body.description ?? null},
          date = ${body.date ?? null},
          time = ${body.time ?? null},
          location = ${body.location ?? null},
          status = ${body.status ?? 'upcoming'},
          featured_image = ${featuredImage},
            capacity = ${body.capacity ?? null},
            registration_required = ${body.registration_required ?? false},
            registration_deadline = ${body.registration_deadline ?? null},
          organizer = ${body.organizer ?? null},
            contact_email = ${body.contact_email ?? null},
            contact_phone = ${body.contact_phone ?? null},
            tags = ${tagsJson},
            updated_by = ${body.updated_by ?? null},
          updated_at = ${new Date().toISOString()}
      WHERE id = ${numericId}
    `;

    const rows = await sql<Record<string, unknown>[]>`
      SELECT *
      FROM events
      WHERE id = ${numericId}
      LIMIT 1
    `;

    return NextResponse.json({ data: rows[0] ?? null });
  } catch (error) {
    console.error('[api/admin/events][PATCH] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id } = await params;
    const numericId = Number(id);
    const existing = await sql<{ featured_image: string | null }[]>`
      SELECT featured_image
      FROM events
      WHERE id = ${numericId}
      LIMIT 1
    `;

    await sql`DELETE FROM events WHERE id = ${numericId}`;

    await deleteImage(existing[0]?.featured_image);

    return NextResponse.json({ data: true });
  } catch (error) {
    console.error('[api/admin/events][DELETE] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
