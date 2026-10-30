import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, test } from 'node:test';

import { verifyPassword } from '../password.js';
import { listen, startTestDatabase } from './helpers.js';

let database: Awaited<ReturnType<typeof startTestDatabase>>;
let api: Awaited<ReturnType<typeof listen>>;
let dbModule: typeof import('../db.js');

before(async () => {
  database = await startTestDatabase();
  // db.ts lê DATABASE_URL ao ser importado, por isso os imports dinâmicos
  process.env.DATABASE_URL = database.url;
  dbModule = await import('../db.js');
  const { app } = await import('../app.js');

  await dbModule.migrate();
  api = await listen(app);
});

after(async () => {
  await api.close();
  await dbModule.pool.end();
  await database.stop();
});

beforeEach(async () => {
  await dbModule.pool.query('TRUNCATE users');
});

function signup(body: unknown) {
  return fetch(`${api.baseUrl}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validUser = { name: 'Bruno', email: 'bruno@exemplo.com', password: 'senha-forte-123' };

describe('migrations', () => {
  test('rodar de novo não reaplica nem falha', async () => {
    await dbModule.migrate();

    const { rows } = await dbModule.pool.query(
      'SELECT count(*)::int AS total FROM drizzle.__drizzle_migrations',
    );
    assert.equal(rows[0].total, 1);
  });
});

describe('POST /users', () => {
  test('cria usuário e retorna 201 sem dados de senha', async () => {
    const res = await signup(validUser);
    const body = await res.json();

    assert.equal(res.status, 201);
    assert.match(body.id, /^[0-9a-f-]{36}$/);
    assert.equal(body.name, 'Bruno');
    assert.equal(body.email, 'bruno@exemplo.com');
    assert.ok(!Number.isNaN(Date.parse(body.createdAt)));
    assert.deepEqual(Object.keys(body).sort(), ['createdAt', 'email', 'id', 'name']);
  });

  test('normaliza nome e email', async () => {
    const res = await signup({ ...validUser, name: '  Bruno  ', email: '  Bruno@Exemplo.COM ' });
    const body = await res.json();

    assert.equal(res.status, 201);
    assert.equal(body.name, 'Bruno');
    assert.equal(body.email, 'bruno@exemplo.com');
  });

  test('salva a senha como hash, nunca em texto puro', async () => {
    await signup(validUser);

    const { rows } = await dbModule.pool.query(
      'SELECT password_hash FROM users WHERE email = $1',
      [validUser.email],
    );
    const stored: string = rows[0].password_hash;

    assert.notEqual(stored, validUser.password);
    assert.equal(await verifyPassword(validUser.password, stored), true);
  });

  test('email já cadastrado retorna 409', async () => {
    await signup(validUser);
    const res = await signup({ ...validUser, email: 'BRUNO@exemplo.com' });

    assert.equal(res.status, 409);
    assert.deepEqual(await res.json(), { error: 'Email já cadastrado' });
  });

  test('retorna 400 quando a requisição não tem corpo JSON', async () => {
    const res = await fetch(`${api.baseUrl}/users`, { method: 'POST' });

    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { error: 'Envie name, email e password em JSON' });
  });

  const invalidCases: Array<[string, unknown, string]> = [
    ['sem nome', { ...validUser, name: undefined }, 'Nome é obrigatório (até 100 caracteres)'],
    ['nome só com espaços', { ...validUser, name: '   ' }, 'Nome é obrigatório (até 100 caracteres)'],
    ['nome com mais de 100 caracteres', { ...validUser, name: 'a'.repeat(101) }, 'Nome é obrigatório (até 100 caracteres)'],
    ['sem email', { ...validUser, email: undefined }, 'Email inválido'],
    ['email sem @', { ...validUser, email: 'bruno.exemplo.com' }, 'Email inválido'],
    ['email sem domínio', { ...validUser, email: 'bruno@exemplo' }, 'Email inválido'],
    ['sem senha', { ...validUser, password: undefined }, 'Senha deve ter entre 8 e 128 caracteres'],
    ['senha com menos de 8 caracteres', { ...validUser, password: '1234567' }, 'Senha deve ter entre 8 e 128 caracteres'],
    ['senha com mais de 128 caracteres', { ...validUser, password: 'a'.repeat(129) }, 'Senha deve ter entre 8 e 128 caracteres'],
    ['senha que não é texto', { ...validUser, password: 12345678 }, 'Senha deve ter entre 8 e 128 caracteres'],
  ];

  for (const [description, body, error] of invalidCases) {
    test(`retorna 400 quando ${description}`, async () => {
      const res = await signup(body);

      assert.equal(res.status, 400);
      assert.deepEqual(await res.json(), { error });
    });
  }

  test('dados inválidos não criam usuário', async () => {
    await signup({ ...validUser, password: 'curta' });

    const { rows } = await dbModule.pool.query('SELECT count(*)::int AS total FROM users');
    assert.equal(rows[0].total, 0);
  });
});
