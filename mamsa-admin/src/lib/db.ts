import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('Missing DATABASE_URL. Set DATABASE_URL in your environment before starting the app.');
}

const sql = postgres(databaseUrl);

export default sql;