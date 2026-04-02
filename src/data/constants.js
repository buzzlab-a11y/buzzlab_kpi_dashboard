export const COLORS = {
  navy: '#1A1A2E',
  darkNavy: '#16213E',
  darkBlue: '#0F3460',
  instagram: '#833AB4',
  pink: '#E1306C',
  orange: '#F77737',
  yellow: '#FCAF45',
  lineGreen: '#06C755',
  darkGreen: '#2E7D32',
  lightGreen: '#E8F5E9',
  lightPurple: '#F3E5FF',
  gray: '#EEEEEE',
  inputYellow: '#FFFDE7',
  white: '#FFFFFF',
  black: '#1A1A2E',
  youtube: '#FF0000',
  threads: '#000000',
  jv: '#0066CC',
};

export const MONTHS = ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

export const CHANNEL_CONFIGS = {
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    label: 'IG',
    color: COLORS.instagram,
    gradient: 'linear-gradient(135deg, #833AB4, #E1306C, #F77737)',
    listPrice: 10000,
    manager: 'レオさん',
    icon: '📸',
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    label: 'YT',
    color: COLORS.youtube,
    gradient: 'linear-gradient(135deg, #FF0000, #CC0000)',
    listPrice: 15000,
    manager: 'ケンさん',
    icon: '▶️',
  },
  threads: {
    id: 'threads',
    name: 'Threads',
    label: 'TH',
    color: '#555555',
    gradient: 'linear-gradient(135deg, #333333, #666666)',
    listPrice: 5000,
    manager: 'ケンさん（6月〜）',
    icon: '🧵',
  },
  jv: {
    id: 'jv',
    name: 'JV',
    label: 'JV',
    color: COLORS.jv,
    gradient: 'linear-gradient(135deg, #0066CC, #003399)',
    listPrice: 20000,
    manager: '自分',
    icon: '🤝',
  },
  line: {
    id: 'line',
    name: 'LINE',
    label: 'LINE',
    color: COLORS.lineGreen,
    gradient: 'linear-gradient(135deg, #06C755, #2E7D32)',
    listPrice: 3000,
    manager: '亮平さん',
    icon: '💬',
  },
};

// ロードマップデータ（目標値）
export const ROADMAP_DATA = [
  { month: '4月',  ig: { acc: 5,  lists: 0,    revenue: 0 },          yt: { acc: 1, lists: 0,     revenue: 0 },          th: { acc: 0,  lists: 0,    revenue: 0 },        jv: { lists: 0,   revenue: 0 },          total: 0,          cumulative: 0 },
  { month: '5月',  ig: { acc: 10, lists: 180,  revenue: 1800000 },     yt: { acc: 2, lists: 40,    revenue: 600000 },     th: { acc: 0,  lists: 0,    revenue: 0 },        jv: { lists: 100, revenue: 2000000 },     total: 4400000,    cumulative: 4400000 },
  { month: '6月',  ig: { acc: 15, lists: 540,  revenue: 5400000 },     yt: { acc: 3, lists: 160,   revenue: 2400000 },    th: { acc: 5,  lists: 0,    revenue: 0 },        jv: { lists: 100, revenue: 2000000 },     total: 9800000,    cumulative: 14200000 },
  { month: '7月',  ig: { acc: 20, lists: 1040, revenue: 10400000 },    yt: { acc: 4, lists: 520,   revenue: 7800000 },    th: { acc: 10, lists: 180,  revenue: 900000 },   jv: { lists: 100, revenue: 2000000 },     total: 21100000,   cumulative: 35300000 },
  { month: '8月',  ig: { acc: 25, lists: 1540, revenue: 15400000 },    yt: { acc: 5, lists: 920,   revenue: 13800000 },   th: { acc: 15, lists: 540,  revenue: 2700000 },  jv: { lists: 100, revenue: 2000000 },     total: 33900000,   cumulative: 69200000 },
  { month: '9月',  ig: { acc: 30, lists: 2040, revenue: 20400000 },    yt: { acc: 6, lists: 1320,  revenue: 19800000 },   th: { acc: 20, lists: 1040, revenue: 5200000 },  jv: { lists: 100, revenue: 2000000 },     total: 47400000,   cumulative: 116600000 },
  { month: '10月', ig: { acc: 35, lists: 2540, revenue: 25400000 },    yt: { acc: 7, lists: 1720,  revenue: 25800000 },   th: { acc: 25, lists: 1540, revenue: 7700000 },  jv: { lists: 100, revenue: 2000000 },     total: 60900000,   cumulative: 177500000 },
  { month: '11月', ig: { acc: 40, lists: 3040, revenue: 30400000 },    yt: { acc: 8, lists: 2120,  revenue: 31800000 },   th: { acc: 30, lists: 2040, revenue: 10200000 }, jv: { lists: 100, revenue: 2000000 },     total: 74400000,   cumulative: 251900000 },
  { month: '12月', ig: { acc: 45, lists: 3540, revenue: 35400000 },    yt: { acc: 9, lists: 2520,  revenue: 37800000 },   th: { acc: 35, lists: 2540, revenue: 12700000 }, jv: { lists: 100, revenue: 2000000 },     total: 87900000,   cumulative: 339800000 },
];

export const CHANNEL_ANNUAL = {
  instagram: { lists: 14460, revenue: 144600000, share: 42.6 },
  youtube:   { lists: 9320,  revenue: 139800000, share: 41.1 },
  threads:   { lists: 7880,  revenue: 39400000,  share: 11.6 },
  jv:        { lists: 800,   revenue: 16000000,  share: 4.7 },
};

export const LINE_PHASES = [
  { phase: '準備①', deadline: '4月 第2週まで', task: '保有リスト数の確認・セグメント分け（属性・温度感別）' },
  { phase: '準備②', deadline: '4月 第3週まで', task: 'ローンチ用LINEシナリオ作成（配信文章・ステップ設計）' },
  { phase: '準備③', deadline: '4月 第3週まで', task: 'オファー設計（何をいくらで売るか・特典設計）' },
  { phase: '準備④', deadline: '4月 第4週', task: 'テスト配信（一部リストに先行送信・反応確認）' },
  { phase: '本配信①', deadline: '5月 第1週', task: '第1回ローンチ配信開始（全リストへ送信）' },
  { phase: '本配信②', deadline: '5月 第2〜3週', task: 'フォロー配信・個別相談対応・成約フォロー' },
  { phase: '振り返り', deadline: '5月 第4週', task: '成約数・リスト単価の集計・改善点の洗い出し' },
  { phase: '第2回準備', deadline: '6月 第1〜2週', task: '第2回ローンチに向けたオファー改善・シナリオ更新' },
  { phase: '第2回配信', deadline: '6月 第3週〜', task: '第2回ローンチ配信・フォロー' },
];

export const WEEKLY_TASKS = {
  instagram: [
    '演者スカウト・面談\n目標: 5名確保',
    '素材撮影完了\n目標: 5名分（80本）',
    '編集入稿・完了\n目標: 12本完了',
    'エルグラム設定\nハイライト・投稿準備完了',
  ],
  youtube: [
    '台本作成（前半4本）\n目標: 4本完了',
    '台本作成（後半4本）\n目標: 計8本完了',
    '演者・編集者入稿\n目標: 8本入稿完了',
    '公開・リスト数確認\n翌月企画立案',
  ],
  threads: [
    '10ACC開設・AI投稿設定\n目標: 10ACC開設',
    '生き残りACC確認\nAI投稿稼働確認',
    'リスト獲得数チェック\n既存ACC改善',
    '月間まとめ\n翌月ACC準備',
  ],
  jv: [
    'JVパートナー候補リサーチ\n既存パートナー関係構築',
    'JVオファー・交渉\nコラボ企画準備',
    'JVライブ・コラボ実施\nリスト獲得確認',
    'JV結果分析\n翌月パートナー確保',
  ],
  line: [
    'リスト確認・セグメント分け\n配信文章作成',
    'オファー設計\nテスト配信（一部）',
    '本配信①\n成約フォロー',
    'フォロー配信\n成約数・リスト単価集計',
  ],
};

export const MONTH_KPI = {
  '4月':  { instagram: '5ACC準備完了\n（投稿は5月〜）', youtube: '台本4本作成\n（投稿は5月〜）', threads: '準備中\n（6月〜開始）', jv: 'JV準備', line: 'ローンチ準備完了\n5月配信開始' },
  '5月':  { instagram: '10ACC稼働\n180リスト目標', youtube: '2ACC稼働\n40リスト目標', threads: '準備中', jv: '100リスト\n¥2,000,000', line: '第1回ローンチ配信' },
  '6月':  { instagram: '15ACC稼働\n540リスト目標', youtube: '3ACC稼働\n160リスト目標', threads: '5ACC稼働\n0リスト目標', jv: '100リスト\n¥2,000,000', line: '成約率・リスト単価改善' },
  '7月':  { instagram: '20ACC稼働\n1,040リスト目標', youtube: '4ACC稼働\n520リスト目標', threads: '10ACC稼働\n180リスト目標', jv: '100リスト\n¥2,000,000', line: 'VIPアップセル開始' },
  '8月':  { instagram: '25ACC稼働\n1,540リスト目標', youtube: '5ACC稼働\n920リスト目標', threads: '15ACC稼働\n540リスト目標', jv: '100リスト\n¥2,000,000', line: '成約率3%目標' },
  '9月':  { instagram: '30ACC稼働\n2,040リスト目標', youtube: '6ACC稼働\n1,320リスト目標', threads: '20ACC稼働\n1,040リスト目標', jv: '100リスト\n¥2,000,000', line: 'LINEスタッフ採用検討' },
  '10月': { instagram: '35ACC稼働\n2,540リスト目標', youtube: '7ACC稼働\n1,720リスト目標', threads: '25ACC稼働\n1,540リスト目標', jv: '100リスト\n¥2,000,000', line: '✅ 2億達成確定月' },
  '11月': { instagram: '40ACC稼働\n3,040リスト目標', youtube: '8ACC稼働\n2,120リスト目標', threads: '30ACC稼働\n2,040リスト目標', jv: '100リスト\n¥2,000,000', line: '来期計画立案' },
  '12月': { instagram: '45ACC稼働\n3,540リスト目標', youtube: '9ACC稼働\n2,520リスト目標', threads: '35ACC稼働\n2,540リスト目標', jv: '100リスト\n¥2,000,000', line: '年間総括' },
};
