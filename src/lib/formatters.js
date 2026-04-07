/**
 * 売上金額を読みやすい形式にフォーマット
 * - 1億以上:  ¥2億 / ¥1.4億（小数点1桁、末尾の.0は省略）
 * - 1万以上:  ¥3,540万
 * - それ未満: ¥9,800
 */
export const fmtM = v => {
  const n = Number(v);
  if (n >= 100000000) {
    const oku = n / 100000000;
    const str = oku % 1 === 0 ? oku.toFixed(0) : oku.toFixed(1);
    return `¥${str}億`;
  }
  if (n >= 10000) return `¥${Math.round(n / 10000).toLocaleString()}万`;
  return `¥${n.toLocaleString()}`;
};
