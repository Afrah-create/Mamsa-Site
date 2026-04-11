import type { ResultSetHeader } from 'mysql2';
import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';
import { apiEnvelope } from '@/lib/api-envelope';

export async function PUT(request: Request, context: { params: Promise<{ id: string; paymentId: string }> }) {
  await requireAdmin();

  try {
    const { id, paymentId } = await context.params;
    const studentId = Number(id);
    const payId = Number(paymentId);
    if (!Number.isFinite(studentId) || !Number.isFinite(payId)) {
      return apiEnvelope(false, { status: 400, error: 'Invalid id', message: 'Validation failed' });
    }

    const existing = await sql<{ id: number; student_id: number }[]>`
      SELECT id, student_id FROM student_payments WHERE id = ${payId} LIMIT 1
    `;
    if (!existing[0] || existing[0].student_id !== studentId) {
      return apiEnvelope(false, { status: 404, error: 'Payment not found', message: 'Not found' });
    }

    const body = await request.json();

    const rowsBefore = await sql<Record<string, unknown>[]>`
      SELECT * FROM student_payments WHERE id = ${payId} LIMIT 1
    `;
    const prev = rowsBefore[0] as Record<string, unknown>;

    const amount = body.amount !== undefined ? Number(body.amount) : Number(prev.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return apiEnvelope(false, { status: 400, error: 'amount must be a positive number', message: 'Validation failed' });
    }

    const currency =
      body.currency !== undefined ? String(body.currency).trim().slice(0, 8) : String(prev.currency ?? 'UGX');
    const paymentDate =
      body.payment_date !== undefined || body.paymentDate !== undefined
        ? String(body.payment_date ?? body.paymentDate).trim()
        : String(prev.payment_date);
    const expiryDate =
      body.expiry_date !== undefined || body.expiryDate !== undefined
        ? String(body.expiry_date ?? body.expiryDate).trim()
        : String(prev.expiry_date);
    const paymentMethod =
      body.payment_method !== undefined || body.paymentMethod !== undefined
        ? (body.payment_method ?? body.paymentMethod)
        : prev.payment_method;
    const transactionRef =
      body.transaction_ref !== undefined || body.transactionRef !== undefined
        ? (body.transaction_ref ?? body.transactionRef)
        : prev.transaction_ref;
    const notes = body.notes !== undefined ? body.notes : prev.notes;

    let statusRaw = String(prev.status ?? 'pending').toLowerCase();
    if (body.status !== undefined) {
      statusRaw = String(body.status).trim().toLowerCase();
    }
    if (statusRaw !== 'active' && statusRaw !== 'expired' && statusRaw !== 'pending') {
      return apiEnvelope(false, {
        status: 400,
        error: "status must be 'active', 'expired', or 'pending'",
        message: 'Validation failed',
      });
    }

    await sql`
      UPDATE student_payments
      SET
        amount = ${amount},
        currency = ${currency},
        payment_date = ${paymentDate},
        expiry_date = ${expiryDate},
        payment_method = ${paymentMethod},
        transaction_ref = ${transactionRef},
        status = ${statusRaw},
        notes = ${notes}
      WHERE id = ${payId} AND student_id = ${studentId}
    `;

    if (statusRaw === 'active') {
      await sql`
        UPDATE skilled_students SET is_active = 1, updated_at = ${new Date().toISOString()}
        WHERE id = ${studentId}
      `;
    }

    const rows = await sql<Record<string, unknown>[]>`
      SELECT * FROM student_payments WHERE id = ${payId} LIMIT 1
    `;

    return apiEnvelope(true, { data: rows[0], message: 'Payment updated' });
  } catch (error) {
    console.error('[api/admin/skilled-students/.../payments/[paymentId]][PUT]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to update payment',
    });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string; paymentId: string }> }) {
  await requireAdmin();

  try {
    const { id, paymentId } = await context.params;
    const studentId = Number(id);
    const payId = Number(paymentId);
    if (!Number.isFinite(studentId) || !Number.isFinite(payId)) {
      return apiEnvelope(false, { status: 400, error: 'Invalid id', message: 'Validation failed' });
    }

    const result = (await sql`
      DELETE FROM student_payments WHERE id = ${payId} AND student_id = ${studentId}
    `) as unknown as ResultSetHeader;
    const affected = result.affectedRows ?? 0;

    if (!affected) {
      return apiEnvelope(false, { status: 404, error: 'Payment not found', message: 'Not found' });
    }

    return apiEnvelope(true, { data: { id: payId, deleted: true }, message: 'Payment deleted' });
  } catch (error) {
    console.error('[api/admin/skilled-students/.../payments/[paymentId]][DELETE]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to delete payment',
    });
  }
}
