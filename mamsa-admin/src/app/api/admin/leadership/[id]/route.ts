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
      FROM leadership
      WHERE id = ${numericId}
      LIMIT 1
    `;

    const imageValue = body.image ?? body.image_url ?? null;
    let image = imageValue ?? existing[0]?.image_url ?? null;
    if (isBase64Image(imageValue)) {
      if (isLocalUploadPath(existing[0]?.image_url)) {
        await deleteImage(existing[0].image_url);
      }

      image = await saveImage(imageValue, 'leadership');
    }

    const socialLinksJson = toMysqlJson(body.social_links ?? null);
    await sql`
      UPDATE leadership
      SET name = ${body.name},
          position = ${body.position ?? null},
          bio = ${body.bio ?? null},
          image_url = ${image},
          email = ${body.email ?? null},
          phone = ${body.phone ?? null},
          department = ${body.department ?? null},
          year = ${body.year ?? null},
          social_links = ${socialLinksJson},
          status = ${body.status ?? 'active'},
          order_position = ${body.order_position ?? 0},
          updated_by = ${body.updated_by ?? null},
          updated_at = ${new Date().toISOString()}
      WHERE id = ${numericId}
    `;

    const rows = await sql<Record<string, unknown>[]>`
      SELECT *
      FROM leadership
      WHERE id = ${numericId}
      LIMIT 1
    `;

    return NextResponse.json({ data: rows[0] ?? null });
  } catch (error) {
    console.error('[api/admin/leadership][PATCH] Unexpected error:', error);
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
      FROM leadership
      WHERE id = ${numericId}
      LIMIT 1
    `;

    await sql`DELETE FROM leadership WHERE id = ${numericId}`;

    await deleteImage(existing[0]?.image_url);

    return NextResponse.json({ data: true });
  } catch (error) {
    console.error('[api/admin/leadership][DELETE] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
