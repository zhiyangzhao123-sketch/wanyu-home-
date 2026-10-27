// A dedicated Decap OAuth bridge. Do not deploy over any existing blog Worker.
// Secrets: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET. No credentials belong in Git.
const SITE = 'https://linwanyu.top';
const OWNER = 'zhiyangzhao123-sketch';
const REPO = `${OWNER}/wanyu-home-`;
const COOKIE = '__Host-wanyu_oauth';
const commonHeaders = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY' };
const cookie = (value, age = 600) => `${COOKIE}=${value}; Path=/; Max-Age=${age}; HttpOnly; Secure; SameSite=Lax`;
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { ...commonHeaders, 'Content-Type': 'application/json; charset=utf-8' } });
const inlineJSON = value => JSON.stringify(value).replace(/</g, '\\u003c');

function popup(payload, ok) {
  const nonce = crypto.randomUUID();
  const result = `authorization:github:${ok ? 'success' : 'error'}:${JSON.stringify(payload)}`;
  // The token is delivered only after the expected opener acknowledges the handshake.
  const script = `const target=${inlineJSON(SITE)};const message=${inlineJSON(result)};
    const receive=(e)=>{if(e.origin!==target||e.source!==window.opener||e.data!=='authorizing:github')return;
      window.removeEventListener('message',receive);window.opener.postMessage(message,target);};
    window.addEventListener('message',receive);if(window.opener)window.opener.postMessage('authorizing:github',target);`;
  return new Response(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>记录本登录</title><body><p>${ok ? '登录完成，请返回记录本。' : '登录未完成，请关闭此窗口并重试。'}</p><script nonce="${nonce}">${script}</script></body></html>`, {
    status: 200,
    headers: { ...commonHeaders, 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': cookie('', 0), 'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'` },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
    if (url.pathname === '/health') return json({ service: 'wanyu-diary-auth', configured: Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) });
    if (!['/auth', '/callback'].includes(url.pathname)) return json({ error: 'Not found' }, 404);
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) return json({ error: 'Login is not configured' }, 503);
    if (url.protocol !== 'https:') return json({ error: 'HTTPS required' }, 400);
    const callback = `${url.origin}/callback`;
    if (url.pathname === '/auth') {
      if (url.searchParams.get('provider') !== 'github' || url.searchParams.get('site_id') !== new URL(SITE).hostname) return json({ error: 'Unsupported login destination' }, 400);
      const state = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
      const target = new URL('https://github.com/login/oauth/authorize');
      target.search = new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID, redirect_uri: callback, scope: 'public_repo', state }).toString();
      return new Response(null, { status: 302, headers: { ...commonHeaders, Location: target.href, 'Set-Cookie': cookie(state) } });
    }
    const state = url.searchParams.get('state');
    const saved = request.headers.get('Cookie')?.split(';').map(s => s.trim()).find(s => s.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
    if (!state || !/^[a-f0-9]{64}$/.test(state) || state !== saved) return json({ error: 'Login expired; start again' }, 400);
    if (url.searchParams.has('error')) return popup({ message: 'GitHub 登录已取消。' }, false);
    const code = url.searchParams.get('code');
    if (!code || code.length > 512) return popup({ message: '登录信息无效，请重试。' }, false);
    try {
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(10000),
        body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, redirect_uri: callback }),
      });
      if (!tokenResponse.ok) throw new Error('token exchange failed');
      const tokenData = await tokenResponse.json();
      if (tokenData.error || !tokenData.access_token) throw new Error('no token');
      const headers = { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'wanyu-diary-auth', 'X-GitHub-Api-Version': '2022-11-28' };
      const userResponse = await fetch('https://api.github.com/user', { headers, signal: AbortSignal.timeout(10000) });
      if (!userResponse.ok) throw new Error('user lookup failed');
      const user = await userResponse.json();
      if (String(user.login).toLowerCase() !== OWNER) return popup({ message: '请使用博客站长的 GitHub 账号登录。' }, false);
      const repoResponse = await fetch(`https://api.github.com/repos/${REPO}`, { headers, signal: AbortSignal.timeout(10000) });
      if (!repoResponse.ok || !(await repoResponse.json()).permissions?.push) return popup({ message: '当前账号没有博客的写入权限。' }, false);
      return popup({ token: tokenData.access_token, provider: 'github' }, true);
    } catch {
      // Never log codes, tokens, callback URLs or upstream responses.
      return popup({ message: 'GitHub 登录暂时失败，请重新打开登录窗口。' }, false);
    }
  },
};
