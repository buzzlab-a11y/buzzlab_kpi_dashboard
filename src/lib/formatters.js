/**
 * 売上金額を億・万の組み合わせで正確に表示（四捨五入なし）
 * 例: ¥339,800,000 → ¥3億3,980万
 *     ¥200,000,000 → ¥2億
 *     ¥35,400,000  → ¥3,540万
 *     ¥9,800       → ¥9,800
 */
export const fmtM = v => {
  const n = Number(v);
  if (n >= 100000000) {
    const oku = Math.floor(n / 100000000);
    const man = (n % 100000000) / 10000;
    if (man === 0) return `¥${oku}億`;
    return `¥${oku}億${man.toLocaleString()}万`;
  }
  if (n >= 10000) {
    return `¥${(n / 10000).toLocaleString()}万`;
  }
  return `¥${n.toLocaleString()}`;
};
