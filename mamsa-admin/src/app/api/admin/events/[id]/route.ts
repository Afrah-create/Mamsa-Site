import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';
import { isBase64Image, isCloudinaryPublicId } from '@/lib/cloudinary';
import { cloudinary } from '@/lib/cloudinary-server';

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

    let featuredImage = body.featured_image ?? existing[0]?.featured_image ?? null;
    if (isBase64Image(body.featured_image ?? null)) {
      if (isCloudinaryPublicId(existing[0]?.featured_image)) {
        await cloudinary.uploader.destroy(existing[0].featured_image as string);
      }

      const uploaded = await cloudinary.uploader.upload(body.featured_image, {
        folder: 'mamsa/events',
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      });
      featuredImage = uploaded.public_id;
    }

    const rows = await sql`
      UPDATE events
      SET title = ${body.title},
          description = ${body.description ?? null},
          date = ${body.date ?? null},
          time = ${body.time ?? null},
          location = ${body.location ?? null},
          status = ${body.status ?? 'upcoming'},
          featured_image = ${featuredImage},
          organizer = ${body.organizer ?? null},
          updated_at = ${new Date().toISOString()}
      WHERE id = ${numericId}
      RETURNING *
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

    if (isCloudinaryPublicId(existing[0]?.featured_image)) {
      await cloudinary.uploader.destroy(existing[0].featured_image as string);
    }

    return NextResponse.json({ data: true });
  } catch (error) {
    console.error('[api/admin/events][DELETE] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
