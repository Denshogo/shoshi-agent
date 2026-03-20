function formatMistakeItem(item, index) {
  if (typeof item === 'string') {
    return `- ミス${index + 1}: ${item}`
  }

  if (!item || typeof item !== 'object') {
    return `- ミス${index + 1}: 情報なし`
  }

  const parts = []
  if (item.subject) parts.push(`科目: ${item.subject}`)
  if (item.topic) parts.push(`論点: ${item.topic}`)
  if (item.note) parts.push(`内容: ${item.note}`)

  return `- ミス${index + 1}: ${parts.join(' | ') || '情報なし'}`
}

function formatReviewNotes(reviewNotes = []) {
  if (!reviewNotes.length) {
    return '- レビュー用メモなし'
  }

  return reviewNotes.map((note, index) => `- メモ${index + 1}: ${note}`).join('\n')
}

export function buildDailyPlanPrompt({
  userId,
  phase,
  availableMinutesToday,
  recentStudyReportText,
  selfReviewText,
  recentMistakes = [],
  reviewNotes = [],
}) {
  const mistakesBlock = recentMistakes.length
    ? recentMistakes.map(formatMistakeItem).join('\n')
    : '- 直近ミスなし'

  const reviewNotesBlock = formatReviewNotes(reviewNotes)

  return `あなたは司法書士試験アプリ「秘書エージェント」の日次計画担当です。
以下の受験生情報を読み、今日の学習計画文を日本語で作成してください。

【出力条件】
- 出力は受験生向けの実務的な日次計画本文だけにしてください
- 学習可能時間 ${availableMinutesToday} 分の範囲で完了できる現実的な計画にしてください
- タスク数は固定しないでください。必要な学習量に応じて可変で設計してください
- 直近の学習レポート、自己レビュー、ミス、復習メモを踏まえて優先順位をつけてください
- 何をどの順番でやるか、どこまで終えればよいかが分かる具体的な本文にしてください

【受験生情報】
- userId: ${userId}
- 現在フェーズ: ${phase}
- 今日の学習可能時間（分）: ${availableMinutesToday}

【直近の学習レポート】
${recentStudyReportText}

【自己レビュー】
${selfReviewText}

【直近のミス】
${mistakesBlock}

【復習メモ】
${reviewNotesBlock}

【依頼】
今日の学習計画文を作成してください。少なくとも以下を自然な本文の中に含めてください。
- 今日の最優先テーマ
- 学習可能時間を前提にした実行順
- 重点復習すべきミスや論点
- 今日中に終えるべき到達ライン
- 明日に持ち越さないための注意点`
}
