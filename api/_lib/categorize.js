// 面談の状況(生文字列)から status_category を判定する。
// ⚠️ collector/import_sales_meetings.py の categorize() と分岐順を完全一致させること。
//    どちらかを変えたら必ず両方を直す（集計の定義がズレるため）。
export function categorize(status, paymentStatus, contractDate) {
  const s = status || '';
  if (s.includes('クーリングオフ')) return 'cooling_off';
  if (s.includes('成約')) return 'contract';
  if (s.includes('失注')) return 'lost';
  if (s.includes('キャンセル')) return 'cancel';
  if (s.includes('飛び') || s.includes('不参加') || s.includes('ノーショー')) return 'noshow';
  if (s.includes('検討') || s.includes('保留')) return 'pending';
  if (s.includes('ブラックリスト')) return 'blacklist';
  if (s.includes('無効')) return 'invalid';
  if (contractDate) return 'contract';
  if (paymentStatus && ['入金', '決済完了', '完了', '着金'].some((k) => paymentStatus.includes(k))) return 'contract';
  return 'other';
}
