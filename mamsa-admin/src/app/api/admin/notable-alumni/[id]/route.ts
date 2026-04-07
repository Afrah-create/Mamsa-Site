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

    const existing = await sql<{ image_url: string | null }[]>`
      SELECT image_url
      FROM notable_alumni
      WHERE id = ${numericId}
      LIMIT 1
    `;

    let imageUrl = body.image_url ?? existing[0]?.image_url ?? null;
    if (isBase64Image(body.image_url ?? null)) {
      if (isCloudinaryPublicId(existing[0]?.image_url)) {
        await cloudinary.uploader.destroy(existing[0].image_url as string);
      }

      const uploaded = await cloudinary.uploader.upload(body.image_url, {
        folder: 'mamsa/about',
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      });
      imageUrl = uploaded.public_id;
    }

    const rows = await sql`
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
          profile_links = ${body.profile_links ?? null},
          featured = ${body.featured ?? false},
          status = ${body.status},
          order_position = ${body.order_position ?? 0},
          updated_at = ${new Date().toISOString()}
          WHERE id = ${numericId}
      RETURNING id, full_name, slug, graduation_year, biography, achievements, current_position, organization, specialty, image_url, profile_links, featured, status, order_position, created_at
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

    if (isCloudinaryPublicId(existing[0]?.image_url)) {
      await cloudinary.uploader.destroy(existing[0].image_url as string);
    }

    return NextResponse.json({ data: true });
  } catch (error) {
    console.error('[api/admin/notable-alumni][DELETE] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
