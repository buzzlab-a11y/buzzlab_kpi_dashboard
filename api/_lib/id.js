import { createHash } from 'node:crypto';

// ⚠️ collector/import_sales_meetings.py の id 算出と完全一致させること。
//    Python: hashlib.sha1(f"{tab}|{jisshi}|{name}|{closer}".encode()).hexdigest()
//      tab    = source_sheet
//      jisshi = 実施日の「生文字列」（フォームは YYYY-MM-DD）
//      name   = お名前
//      closer = 面談者の「正規化前の生値」
//    lead_channel は id に含めない（既存 id を不変に保つため）。
export function sha1(s) {
  return createHash('sha1').update(String(s), 'utf8').digest('hex');
}

export function meetingId(sourceSheet, meetingDateRaw, prospectName, closerRaw) {
  return sha1(`${sourceSheet}|${meetingDateRaw}|${prospectName}|${closerRaw}`);
}
