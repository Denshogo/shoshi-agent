function formatWeeklyReportItem(item, index) {
  if (typeof item === 'string') {
    return `- 週報${index + 1}: ${item}`
  }

  if (!item || typeof item !== 'object') {
    return `- 週報${index + 1}: 情報なし`
  }

  const parts = []
  if (item.date) parts.push(`日付: ${item.date}`)
  if (item.text) parts.push(`内容: ${item.text}`)

  return `- 週報${index + 1}: ${parts.join(' | ') || '情報なし'}`
}

function formatRecurringMistakeItem(item, index) {
  if (typeof item === 'string') {
    return `- 反復ミス${index + 1}: ${item}`
  }

  if (!item || typeof item !== 'object') {
    return `- 反復ミス${index + 1}: 情報なし`
  }

  const parts = []
  if (item.subject) parts.push(`科目: ${item.subject}`)
  if (item.topic) parts.push(`論点: ${item.topic}`)
  if (item.note) parts.push(`内容: ${item.note}`)

  return `- 反復ミス${index + 1}: ${parts.join(' | ') || '情報なし'}`
}

function formatReviewCandidateItem(item, index) {
  if (typeof item === 'string') {
    return `- 候補${index + 1}: ${item}`
  }

  if (!item || typeof item !== 'object') {
    return `- 候補${index + 1}: 情報なし`
  }

  const parts = []
  if (item.subject) parts.push(`科目: ${item.subject}`)
  if (item.topic) parts.push(`論点: ${item.topic}`)
  if (item.reason) parts.push(`理由: ${item.reason}`)

  return `- 候補${index + 1}: ${parts.join(' | ') || '情報なし'}`
}

export function buildWeeklyReviewPrompt({
  userId,
  phase,
  pastWeekReports = [],
  recurringMistakes = [],
  reviewCandidates = [],
}) {
  const reportsBlock = pastWeekReports.length
    ? pastWeekReports.map(formatWeeklyReportItem).join('\n')
    : '- 週報なし'

  const recurringMistakesBlock = recurringMistakes.length
    ? recurringMistakes.map(formatRecurringMistakeItem).join('\n')
    : '- 反復ミスなし'

  const reviewCandidatesBlock = reviewCandidates.length
    ? reviewCandidates.map(formatReviewCandidateItem).join('\n')
    : '- 復習候補なし'

  return `あなたは司法書士試験アプリ「秘書エージェント」の週次レビュー担当です。
以下の受験生情報を読み、今週の振り返りと次週の戦術調整文を日本語で作成してください。

【出力条件】
- 出力は受験生向けの実務的な週次レビュー本文だけにしてください
- 今週の学習傾向を踏まえ、次週の戦術調整を明確に示してください
- 反復ミスをもとに、復習問題生成のために重点化すべき論点判断を含めてください
- 抽象論ではなく、何を減らし何を増やすかが分かる具体的な本文にしてください

【受験生情報】
- userId: ${userId}
- 現在フェーズ: ${phase}

【過去1週間のレポート】
${reportsBlock}

【反復ミス】
${recurringMistakesBlock}

【復習候補】
${reviewCandidatesBlock}

【依頼】
週次レビュー文を作成してください。少なくとも以下を自然な本文の中に含めてください。
- 今週の学習状況の要約
- 次週の戦術調整
- 継続すべき点と修正すべき点
- 復習問題生成のために重点化すべき論点やテーマの判断
- 次週に避けるべき進め方や注意点`
}
