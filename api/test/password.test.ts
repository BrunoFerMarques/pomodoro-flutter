import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { hashPassword, verifyPassword } from '../password.js';

describe('hashPassword', () => {
  test('gera no formato scrypt$<salt>$<hash>', async () => {
    const stored = await hashPassword('senha-secreta');

    assert.match(stored, /^scrypt\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
    assert.ok(!stored.includes('senha-secreta'));
  });

  test('usa salt aleatório: mesma senha gera hashes diferentes', async () => {
    const first = await hashPassword('senha-secreta');
    const second = await hashPassword('senha-secreta');

    assert.notEqual(first, second);
  });
});

describe('verifyPassword', () => {
  test('aceita a senha correta', async () => {
    const stored = await hashPassword('senha-secreta');

    assert.equal(await verifyPassword('senha-secreta', stored), true);
  });

  test('recusa senha errada', async () => {
    const stored = await hashPassword('senha-secreta');

    assert.equal(await verifyPassword('senha-errada', stored), false);
  });

  test('recusa valor salvo fora do formato', async () => {
    assert.equal(await verifyPassword('senha-secreta', 'texto-puro'), false);
    assert.equal(await verifyPassword('senha-secreta', 'bcrypt$abc$def'), false);
    assert.equal(await verifyPassword('senha-secreta', 'scrypt$$'), false);
  });
});
