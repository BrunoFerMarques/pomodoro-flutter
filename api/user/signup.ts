import { DrizzleQueryError } from 'drizzle-orm';
import type { Request, Response } from 'express';
import pg from 'pg';

import { db } from '../db.js';
import { hashPassword } from '../password.js';
import { users } from '../schema.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type NewUser = { name: string; email: string; password: string };

type ParseResult = { ok: true; user: NewUser } | { ok: false; error: string };

function parseNewUser(body: unknown): ParseResult {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'Envie name, email e password em JSON' };
  }

  const { name, email, password } = body as Record<string, unknown>;

  if (typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
    return { ok: false, error: 'Nome é obrigatório (até 100 caracteres)' };
  }
  if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return { ok: false, error: 'Email inválido' };
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return { ok: false, error: 'Senha deve ter entre 8 e 128 caracteres' };
  }

  return {
    ok: true,
    user: { name: name.trim(), email: email.trim().toLowerCase(), password },
  };
}

// POST /users  body: { name, email, password }
export async function signup(req: Request, res: Response): Promise<void> {
  const result = parseNewUser(req.body);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }

  const { name, email, password } = result.user;
  const passwordHash = await hashPassword(password);

  try {
    const [user] = await db
      .insert(users)
      .values({ name, email, passwordHash })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      });
    res.status(201).json(user);
  } catch (error) {
    // Drizzle embrulha o erro do pg em .cause. 23505 = violação de UNIQUE (email repetido)
    const cause = error instanceof DrizzleQueryError ? error.cause : error;
    if (cause instanceof pg.DatabaseError && cause.code === '23505') {
      res.status(409).json({ error: 'Email já cadastrado' });
      return;
    }
    throw error;
  }
}
