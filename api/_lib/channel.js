// 流入元・面談者の表記ゆれ正規化。
// ⚠️ collector/import_sales_meetings.py の CHANNEL_ALIASES/normalize_channel,
//    CLOSER_ALIASES/normalize_closer と一致させること。

const CHANNEL_ALIASES = {
  instagram: 'instagram', ig: 'instagram', insta: 'instagram',
  インスタ: 'instagram', インスタグラム: 'instagram',
  youtube: 'youtube', yt: 'youtube', ユーチューブ: 'youtube',
  threads: 'threads', スレッズ: 'threads', スレッド: 'threads',
  line: 'line', ライン: 'line',
  referral: 'referral', 紹介: 'referral', jv: 'referral',
  other: 'other', その他: 'other',
  unknown: 'unknown', 不明: 'unknown',
};

// 返り値は sales_meetings の CHECK 制約の値域に必ず収める（空→unknown / 未知の非空→other）。
export function normalizeChannel(value) {
  const key = String(value ?? '').replace(/\s+/g, '').toLowerCase();
  if (!key) return 'unknown';
  return CHANNEL_ALIASES[key] ?? 'other';
}

const CLOSER_ALIASES = {
  松倉優弥: '松倉',
};

// id は生の面談者名から計算するため、保存する closer フィールドのみ正規化する。
export function normalizeCloser(name) {
  if (!name) return name;
  const key = String(name).replace(/\s+/g, '');
  return CLOSER_ALIASES[key] ?? name;
}
