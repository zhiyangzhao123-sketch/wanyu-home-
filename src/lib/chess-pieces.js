// 国际象棋棋子的矢量图形：6 种棋子，一套形状，靠颜色区分黑方和白方。
// 用 0–100 的坐标系画，页面里按格子大小缩放，避免依赖字体。

const BODY = {
  // 兵：圆头 + 梯形身 + 底座
  p: `
    <circle cx="50" cy="30" r="13"/>
    <path d="M38 44h24l-3 8H41z"/>
    <path d="M34 66q16-10 32 0l4 12H30z"/>
    <rect x="26" y="78" width="48" height="8" rx="3"/>
  `,
  // 车：城墙垛口 + 塔身
  r: `
    <path d="M28 26h10v8h8v-8h8v8h8v-8h10v18l-6 6v20l6 6v10H28V78l6-6V52l-6-6z"/>
    <rect x="24" y="78" width="52" height="8" rx="3"/>
  `,
  // 马：马头侧面
  n: `
    <path d="M34 78q-2-18 8-30 4-5 4-12 0-6 6-8 3-8 10-9 9-1 12 7l6 14q3 8-2 15-5 8-14 9l-4 14z"/>
    <circle cx="60" cy="30" r="3" fill="currentColor" opacity="0.35"/>
    <rect x="28" y="78" width="48" height="8" rx="3"/>
  `,
  // 相：尖顶 + 斜切
  b: `
    <path d="M50 18q10 6 12 18 2 12-6 20l-6 6h-0l-6-6q-8-8-6-20 2-12 12-18z"/>
    <rect x="42" y="62" width="16" height="8" rx="3"/>
    <path d="M34 70q16-6 32 0l4 10H30z"/>
    <rect x="26" y="78" width="48" height="8" rx="3"/>
  `,
  // 后：锯齿冠 + 裙摆
  q: `
    <path d="M24 34l6 16 8-16 6 18 6-20 6 20 6-18 8 16 6-16 -4 34H28z"/>
    <path d="M28 68q22-8 44 0l4 12H24z"/>
    <rect x="22" y="78" width="56" height="8" rx="3"/>
  `,
  // 王：十字 + 冠 + 底座
  k: `
    <path d="M46 14h8v8h8v8h-8v10h-8V30h-8v-8h8z"/>
    <path d="M28 50q22-12 44 0l-4 20H32z"/>
    <path d="M30 70q20-6 40 0l4 10H26z"/>
    <rect x="24" y="78" width="52" height="8" rx="3"/>
  `,
};

/**
 * 生成一枚棋子的 SVG。
 * color: "w" 白方（浅色填充 + 深色描边），"b" 黑方（深色填充 + 浅色描边）
 */
export function pieceSvg(type, color, size = 100) {
  const fill = color === "w" ? "#fbf6ec" : "#2c2620";
  const stroke = color === "w" ? "#5a4a36" : "#0f0c09";
  const shade = color === "w" ? "rgba(90,74,54,0.18)" : "rgba(255,255,255,0.12)";

  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true" focusable="false">
    <g fill="${fill}" stroke="${stroke}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
      ${BODY[type] ?? ""}
    </g>
    <ellipse cx="50" cy="86" rx="26" ry="4" fill="${shade}"/>
  </svg>`;
}
