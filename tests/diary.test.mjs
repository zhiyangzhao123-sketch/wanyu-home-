import { test } from 'node:test';
import assert from 'node:assert/strict';
import auth from '../workers/diary-auth/worker.js';
import { makeConfig, summarize, AUTH_URL } from '../public/admin/config.js';
const env = { GITHUB_CLIENT_ID: 'test-client', GITHUB_CLIENT_SECRET: 'fake-test-secret' };
const request = (path, cookie) => new Request(`https://auth.example${path}`, { headers: cookie ? { Cookie: cookie } : {} });

test('editor uses current content schema and the dedicated auth origin', () => {
  assert.equal(AUTH_URL, 'https://wanyu-diary-auth.papersheep123.workers.dev');
  const config = makeConfig();
  assert.equal(config.backend.branch, 'main');
  assert.equal(config.backend.auth_scope, 'public_repo');
  const [blog, thoughts, gallery] = config.collections;
  assert.ok(blog.fields.some(f => f.name === 'pubDate'));
  assert.ok(thoughts.fields.some(f => f.name === 'pubDate'));
  assert.equal(gallery.path, '{{slug}}/index');
  assert.equal(gallery.media_folder, '');
  assert.equal(gallery.public_folder, '');
  assert.equal(gallery.fields.find(f => f.name === 'photos').min, 1);
  assert.equal(makeConfig({ demo: true }).backend.name, 'test-repo');
  assert.equal(summarize('![photo](/image.jpg)\n**今天**去了[公园](https://example.com)。'), '今天去了公园。');
  assert.ok(summarize(''));
});

test('OAuth blocks unconfigured, wrong method, foreign site and missing state', async () => {
  assert.equal((await auth.fetch(request('/auth'), {})).status, 503);
  assert.equal((await auth.fetch(new Request('https://auth.example/auth', { method: 'POST' }), env)).status, 405);
  assert.equal((await auth.fetch(request('/auth?provider=github&site_id=evil.example'), env)).status, 400);
  assert.equal((await auth.fetch(request('/callback?code=test'), env)).status, 400);
});

test('OAuth state binds callback to the browser and only the owner gets a token', async () => {
  const start = await auth.fetch(request('/auth?provider=github&site_id=linwanyu.top&scope=repo'), env);
  assert.equal(start.status, 302);
  const target = new URL(start.headers.get('location'));
  assert.equal(target.searchParams.get('scope'), 'public_repo');
  const state = target.searchParams.get('state');
  const cookie = start.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly; Secure; SameSite=Lax/);
  assert.equal((await auth.fetch(request(`/callback?code=test&state=${state}`, '__Host-wanyu_oauth=wrong'), env)).status, 400);
  const originalFetch = globalThis.fetch;
  let owner = false;
  let canPush = true;
  let tokenOK = true;
  let calls = 0;
  globalThis.fetch = async url => {
    calls++;
    if (url === 'https://github.com/login/oauth/access_token') return Response.json(tokenOK ? { access_token: 'SYNTHETIC_TOKEN' } : { error: 'bad_code' });
    if (url === 'https://api.github.com/user') return Response.json({ login: owner ? 'zhiyangzhao123-sketch' : 'someone-else' });
    if (url === 'https://api.github.com/repos/zhiyangzhao123-sketch/wanyu-home-') return Response.json({ permissions: { push: canPush } });
    throw new Error('Unexpected network request');
  };
  try {
    const callback = () => auth.fetch(request(`/callback?code=test&state=${state}`, cookie.split(';')[0]), env);
    const denied = await (await callback()).text();
    assert.match(denied, /authorization:github:error/); assert.ok(!denied.includes('SYNTHETIC_TOKEN')); assert.equal(calls, 2);
    owner = true; canPush = false;
    assert.ok(!(await (await callback()).text()).includes('SYNTHETIC_TOKEN'));
    canPush = true;
    const success = await callback(); const html = await success.text();
    assert.match(html, /authorization:github:success/); assert.match(html, /e.origin!==target/); assert.match(html, /e.source!==window.opener/);
    assert.match(html, /https:\/\/linwanyu.top/); assert.match(success.headers.get('set-cookie'), /Max-Age=0/);
    assert.match(success.headers.get('content-security-policy'), /default-src 'none'/);
    tokenOK = false; assert.ok(!(await (await callback()).text()).includes('SYNTHETIC_TOKEN'));
  } finally { globalThis.fetch = originalFetch; }
});
