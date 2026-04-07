/**
 * 売上金額を読みやすい形式にフォーマット
 * - 億単位で割り切れる場合: ¥2億
 * - それ以外の大きな数値:   ¥13,980万
 * - 小さな数値:             ¥9,800
 */
export const fmtM = v => {
  const n = Number(v);
  if (n >= 100000000 && n % 100000000 === 0) return `¥${(n / 100000000).toFixed(0)}億`;
  if (n >= 10000) return `¥${Math.round(n / 10000).toLocaleString()}万`;
  return `¥${n.toLocaleString()}`;
};
