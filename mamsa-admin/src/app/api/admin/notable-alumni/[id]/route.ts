import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';
import { toMysqlJson } from '@/lib/mysql-json';
import { deleteImage, isBase64Image, isLocalUploadPath, saveImage } from '@/lib/upload';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id } = await params;
    const numericId = Number(id);
    const body = await request.json();

    const existing = await sql<{ image_url: string | null }[]>`
      SELECT image_url
      FROM notable_alumni
      WHERE id = ${numericId}
      LIMIT 1
    `;

    let imageUrl = body.image_url ?? existing[0]?.image_url ?? null;
    if (isBase64Image(body.image_url ?? null)) {
      if (isLocalUploadPath(existing[0]?.image_url)) {
        await deleteImage(existing[0].image_url);
      }

      imageUrl = await saveImage(body.image_url as string, 'alumni');
    }

    const profileLinksJson = toMysqlJson(body.profile_links ?? null);
    await sql`
      UPDATE notable_alumni
      SET full_name = ${body.full_name},
          slug = ${body.slug ?? null},
          graduation_year = ${body.graduation_year ?? null},
          biography = ${body.biography},
          achievements = ${body.achievements ?? null},
          current_position = ${body.current_position ?? null},
          organization = ${body.organization ?? null},
          specialty = ${body.specialty ?? null},
            image_url = ${imageUrl},
          profile_links = ${profileLinksJson},
          featured = ${body.featured ?? false},
          status = ${body.status},
          order_position = ${body.order_position ?? 0},
          updated_at = ${new Date().toISOString()}
          WHERE id = ${numericId}
    `;

    const rows = await sql`
      SELECT id, full_name, slug, graduation_year, biography, achievements, current_position, organization, specialty, image_url, profile_links, featured, status, order_position, created_at
      FROM notable_alumni
      WHERE id = ${numericId}
      LIMIT 1
    `;

    return NextResponse.json({ data: rows[0] ?? null });
  } catch (error) {
    console.error('[api/admin/notable-alumni][PATCH] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id } = await params;
    const numericId = Number(id);
    const existing = await sql<{ image_url: string | null }[]>`
      SELECT image_url
      FROM notable_alumni
      WHERE id = ${numericId}
      LIMIT 1
    `;

    await sql`DELETE FROM notable_alumni WHERE id = ${numericId}`;

    await deleteImage(existing[0]?.image_url);

    return NextResponse.json({ data: true });
  } catch (error) {
    console.error('[api/admin/notable-alumni][DELETE] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
