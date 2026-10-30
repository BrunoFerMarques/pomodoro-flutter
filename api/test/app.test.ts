import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';

import { listen } from './helpers.js';

let api: Awaited<ReturnType<typeof listen>>;

before(async () => {
  // app.ts lê CORS_ORIGIN ao ser importado, por isso o import dinâmico
  process.env.CORS_ORIGIN = 'https://permitido.com, https://outro.com';
  const { app } = await import('../app.js');
  api = await listen(app);
});

after(async () => {
  await api.close();
});

describe('GET /health', () => {
  test('responde ok', async () => {
    const res = await fetch(`${api.baseUrl}/health`);

    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: 'ok' });
  });
});

describe('CORS', () => {
  async function allowedOrigin(origin: string) {
    const res = await fetch(`${api.baseUrl}/health`, { headers: { Origin: origin } });
    return res.headers.get('access-control-allow-origin');
  }

  test('libera origens do CORS_ORIGIN', async () => {
    assert.equal(await allowedOrigin('https://permitido.com'), 'https://permitido.com');
    assert.equal(await allowedOrigin('https://outro.com'), 'https://outro.com');
  });

  test('libera localhost em qualquer porta', async () => {
    assert.equal(await allowedOrigin('http://localhost:54321'), 'http://localhost:54321');
  });

  test('bloqueia outras origens', async () => {
    assert.equal(await allowedOrigin('https://malicioso.com'), null);
    assert.equal(await allowedOrigin('http://localhost.malicioso.com:80'), null);
  });
});

describe('erros', () => {
  test('JSON inválido retorna 400', async () => {
    const res = await fetch(`${api.baseUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ invalido',
    });

    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { error: 'JSON inválido' });
  });
});
