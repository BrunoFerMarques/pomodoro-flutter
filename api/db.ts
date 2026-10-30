import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate as runMigrations } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

import * as schema from './schema.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema });

// Aplica as migrations pendentes de migrations/. Seguro rodar toda vez que a API sobe:
// as já aplicadas ficam registradas em drizzle.__drizzle_migrations.
export async function migrate(): Promise<void> {
  await runMigrations(db, { migrationsFolder: 'migrations' });
}
