import { AUTH_URL, makeConfig, summarize } from './config.js';

const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
const demo = local && new URLSearchParams(location.search).get('demo') === '1';
const loading = document.querySelector('#loading');
const note = document.querySelector('#mode-note');

function message(title, text) {
  loading.replaceChildren();
  const heading = document.createElement('h1'); heading.textContent = title;
  const detail = document.createElement('p'); detail.textContent = text;
  const back = document.createElement('a'); back.href = '/write/'; back.textContent = '回到记录本 →';
  loading.append(heading, detail, back);
}

async function start() {
  if (!demo && !/^https:\/\/[^/]+$/.test(AUTH_URL)) {
    message('记录本准备好了', '还差一次站长登录配置。配置完成后，就可以在这里写作和发布。');
    if (local) {
      const link = document.createElement('a');
      link.href = `/admin/?demo=1${location.hash || '#/collections/blog/new'}`;
      link.textContent = '先试写一页（仅预览，不会上传） →';
      link.className = 'demo-link'; loading.append(link);
    }
    return;
  }
  if (demo) {
    note.textContent = '试写预览 · 不会上传，刷新后清空';
    document.body.classList.add('demo-mode');
  } else {
    note.textContent = '云端草稿也在公开仓库中 · 发布后等待网站更新';
  }
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/admin/vendor/decap-cms.js'; script.onload = resolve; script.onerror = reject;
    document.body.append(script);
  });
  window.CMS.registerEventListener({ name: 'preSave', handler: ({ entry }) => {
    let data = entry.get('data');
    if (entry.get('collection') === 'blog' && !String(data.get('description') || '').trim()) data = data.set('description', summarize(data.get('body')));
    return data;
  }});
  window.CMS.registerEventListener({ name: 'postPublish', handler: () => {
    note.textContent = demo ? '试写已保存到演示内存 · 刷新后清空' : '内容已提交 · 网站更新完成后可在博客查看';
  }});
  window.CMS.registerPreviewStyle('/admin/preview.css');
  window.CMS.init({ config: makeConfig({ demo }) });
  loading.hidden = true;
}

start().catch(() => message('记录本暂时没有打开', '编辑器加载失败，请刷新重试。如果仍然无法打开，请联系站长检查文件是否完整。'));
