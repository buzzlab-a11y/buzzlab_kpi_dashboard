/**
 * 売上金額を読みやすい形式にフォーマット（四捨五入なし）
 * - 1億以上:  ¥2億 / ¥1.398億（末尾のゼロは省略）
 * - 1万以上:  ¥3,540万（端数がある場合は ¥3,540.5万 のように表示）
 * - それ未満: ¥9,800
 */
export const fmtM = v => {
  const n = Number(v);
  if (n >= 100000000) {
    const oku = n / 100000000;
    const str = oku % 1 === 0
      ? oku.toFixed(0)
      : parseFloat(oku.toFixed(4)).toString();
    return `¥${str}億`;
  }
  if (n >= 10000) {
    const man = n / 10000;
    const str = man % 1 === 0
      ? man.toLocaleString()
      : parseFloat(man.toFixed(2)).toLocaleString();
    return `¥${str}万`;
  }
  return `¥${n.toLocaleString()}`;
};
