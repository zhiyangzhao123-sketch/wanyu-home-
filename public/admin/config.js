// Public configuration only. Never put a GitHub token or OAuth client secret here.
export const AUTH_URL = 'https://wanyu-diary-auth.papersheep123.workers.dev';
const date = (name = 'pubDate', label = '记录日期') => ({ name, label, widget: 'datetime', date_format: 'YYYY-MM-DD', time_format: false, format: 'YYYY-MM-DD', picker_utc: false });
const body = { name: 'body', label: '今天想写些什么？', widget: 'markdown', modes: ['rich_text', 'raw'], minimal: true, buttons: ['bold', 'italic', 'link', 'heading-two', 'quote', 'bulleted-list', 'numbered-list'], editor_components: ['image'], hint: '直接写就好。选中文字可以加粗，照片可以通过图片按钮添加。' };

export function makeConfig({ demo = false } = {}) {
  return {
    load_config_file: false,
    backend: demo ? { name: 'test-repo' } : {
      name: 'github', repo: 'zhiyangzhao123-sketch/wanyu-home-', branch: 'main',
      base_url: AUTH_URL, auth_endpoint: 'auth', auth_scope: 'public_repo',
      commit_messages: { create: '新增 {{collection}}：{{slug}}', update: '更新 {{collection}}：{{slug}}', delete: '删除 {{collection}}：{{slug}}', uploadMedia: '添加照片：{{path}}', deleteMedia: '删除照片：{{path}}' },
    },
    locale: 'zh_Hans', site_url: 'https://linwanyu.top', display_url: 'https://linwanyu.top',
    logo: { src: '/admin/flower.svg', show_in_header: true },
    media_folder: 'public/images/diary', public_folder: '/images/diary',
    publish_mode: 'editorial_workflow',
    slug: { encoding: 'unicode', clean_accents: false, sanitize_replacement: '-' },
    collections: [
      {
        name: 'blog', label: '日记', label_singular: '日记', folder: 'src/content/blog', extension: 'md', format: 'frontmatter', create: true, delete: false,
        slug: '{{year}}-{{month}}-{{day}}-{{slug}}', summary: '{{title}} · {{pubDate}}', sortable_fields: ['pubDate', 'title'],
        description: '写一页生活。草稿不会展示在博客上，但云端草稿仍存放在公开仓库里。',
        editor: { preview: false }, preview_path: 'blog/{{slug}}/',
        fields: [
          { name: 'title', label: '给今天起个名字', widget: 'string' }, body, date(),
          { name: 'category', label: '放在哪一页', widget: 'select', options: ['日常', '学习日记'], default: '日常' },
          { name: 'description', label: '一句话简介', widget: 'text', required: false, hint: '留空时，会从正文自动摘取。' },
          { name: 'cover', label: '封面', widget: 'select', required: false, options: [{ label: '暖色日常', value: 'cover-01' }, { label: '午后片刻', value: 'cover-02' }, { label: '安静时光', value: 'cover-03' }] },
          { name: 'draft', widget: 'hidden', default: false },
          { name: 'pinned', label: '置顶这篇日记', widget: 'boolean', default: false, required: false },
        ],
      },
      {
        name: 'thoughts', label: '随手记', label_singular: '随手记', folder: 'src/content/thoughts', extension: 'md', format: 'frontmatter', create: true, delete: false,
        identifier_field: 'pubDate', slug: '{{year}}-{{month}}-{{day}}-{{hour}}{{minute}}{{second}}', summary: '{{pubDate}} · {{body | truncate(35)}}', sortable_fields: ['pubDate'], editor: { preview: false },
        fields: [{ ...body, label: '此刻的心情' }, date(), { name: 'mood', label: '心情', widget: 'string', required: false }, { name: 'weather', label: '天气', widget: 'string', required: false }],
      },
      {
        name: 'gallery', label: '相册', label_singular: '相册', folder: 'src/content/gallery', path: '{{slug}}/index', extension: 'md', format: 'frontmatter', create: true, delete: false,
        // New photos live beside index.md; Astro image() resolves these relative paths.
        // Existing ../../../assets/gallery/... references are preserved when editing.
        media_folder: '', public_folder: '', slug: '{{year}}-{{month}}-{{day}}-{{slug}}', summary: '{{title}} · {{date}}', sortable_fields: ['date', 'title'], editor: { preview: false },
        fields: [
          { name: 'title', label: '相册的名字', widget: 'string' },
          { name: 'photos', label: '留下的瞬间', label_singular: '照片', widget: 'list', min: 1, summary: '{{fields.caption}}', collapsed: true,
            fields: [{ name: 'src', label: '照片', widget: 'image', allow_multiple: false }, { name: 'caption', label: '写一句照片背后的故事', widget: 'string', required: false }, { ...date('date', '拍摄日期'), required: false }] },
          { name: 'cover', label: '挑一张封面', widget: 'image', allow_multiple: false },
          { name: 'description', label: '关于这些照片', widget: 'text', required: false }, date('date'),
          { name: 'dateRange', label: '跨越的日子（可不填）', widget: 'string', required: false },
        ],
      },
    ],
  };
}

export function summarize(markdown) {
  return String(markdown || '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[#>*_`~]/g, '').replace(/\s+/g, ' ').trim().slice(0, 100) || '记录生活里的一个小片刻。';
}
