// 国际象棋棋子：使用 Cburnett 的经典矢量图形（维基共享资源，CC BY-SA 3.0）。
// 12 个 SVG 放在 public/pieces/，按 <类型><lt|dt>.svg 命名：
//   lt = 浅色（白方），dt = 深色（黑方）。例如 chess-klt.svg 是白王。

/**
 * 生成一枚棋子的 <img>。
 * color: "w" 白方 / "b" 黑方
 */
export function pieceSvg(type, color, size = 100) {
  const tone = color === "w" ? "lt" : "dt";
  const src = `/pieces/chess-${type}${tone}.svg`;
  const px = Math.round(size);
  return `<img class="ch__img" src="${src}" width="${px}" height="${px}" alt="" loading="lazy" decoding="async">`;
}
