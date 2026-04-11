import { requireAdmin } from '@/lib/auth';
import sql, { insertAndGetId } from '@/lib/db';
import { apiEnvelope } from '@/lib/api-envelope';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id } = await context.params;
    const studentId = Number(id);
    if (!Number.isFinite(studentId)) {
      return apiEnvelope(false, { status: 400, error: 'Invalid student id', message: 'Validation failed' });
    }

    const student = await sql<{ id: number }[]>`
      SELECT id FROM skilled_students WHERE id = ${studentId} LIMIT 1
    `;
    if (!student[0]) {
      return apiEnvelope(false, { status: 404, error: 'Student not found', message: 'Not found' });
    }

    const rows = await sql<Record<string, unknown>[]>`
      SELECT * FROM student_payments
      WHERE student_id = ${studentId}
      ORDER BY payment_date DESC, id DESC
    `;

    return apiEnvelope(true, { data: rows, message: 'Payments loaded' });
  } catch (error) {
    console.error('[api/admin/skilled-students/.../payments][GET]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to load payments',
    });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id } = await context.params;
    const studentId = Number(id);
    if (!Number.isFinite(studentId)) {
      return apiEnvelope(false, { status: 400, error: 'Invalid student id', message: 'Validation failed' });
    }

    const student = await sql<{ id: number }[]>`
      SELECT id FROM skilled_students WHERE id = ${studentId} LIMIT 1
    `;
    if (!student[0]) {
      return apiEnvelope(false, { status: 404, error: 'Student not found', message: 'Not found' });
    }

    const body = await request.json();
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return apiEnvelope(false, { status: 400, error: 'amount must be a positive number', message: 'Validation failed' });
    }

    const paymentDate = String(body.payment_date ?? body.paymentDate ?? '').trim();
    const expiryDate = String(body.expiry_date ?? body.expiryDate ?? '').trim();
    if (!paymentDate || !expiryDate) {
      return apiEnvelope(false, {
        status: 400,
        error: 'payment_date and expiry_date are required (YYYY-MM-DD)',
        message: 'Validation failed',
      });
    }

    const statusRaw = String(body.status ?? 'pending').trim().toLowerCase();
    if (statusRaw !== 'active' && statusRaw !== 'expired' && statusRaw !== 'pending') {
      return apiEnvelope(false, {
        status: 400,
        error: "status must be 'active', 'expired', or 'pending'",
        message: 'Validation failed',
      });
    }

    const currency = String(body.currency ?? 'UGX').trim().slice(0, 8) || 'UGX';
    const paymentMethod = body.payment_method ?? body.paymentMethod ?? null;
    const transactionRef = body.transaction_ref ?? body.transactionRef ?? null;
    const notes = body.notes ?? null;

    const insertId = await insertAndGetId`
      INSERT INTO student_payments (
        student_id, amount, currency, payment_date, expiry_date,
        payment_method, transaction_ref, status, notes
      )
      VALUES (
        ${studentId},
        ${amount},
        ${currency},
        ${paymentDate},
        ${expiryDate},
        ${paymentMethod},
        ${transactionRef},
        ${statusRaw},
        ${notes}
      )
    `;

    if (statusRaw === 'active') {
      await sql`
        UPDATE skilled_students SET is_active = 1, updated_at = ${new Date().toISOString()}
        WHERE id = ${studentId}
      `;
    }

    const rows = await sql<Record<string, unknown>[]>`
      SELECT * FROM student_payments WHERE id = ${insertId} LIMIT 1
    `;

    return apiEnvelope(true, { status: 201, data: rows[0], message: 'Payment recorded' });
  } catch (error) {
    console.error('[api/admin/skilled-students/.../payments][POST]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to create payment',
    });
  }
}
