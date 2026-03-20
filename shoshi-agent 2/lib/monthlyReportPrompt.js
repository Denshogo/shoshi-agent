function formatStudyReportItem(item, index) {
  if (typeof item === 'string') {
    return `- レポート${index + 1}: ${item}`
  }

  if (!item || typeof item !== 'object') {
    return `- レポート${index + 1}: 情報なし`
  }

  const parts = []
  if (item.date) parts.push(`日付: ${item.date}`)
  if (item.text) parts.push(`内容: ${item.text}`)

  return `- レポート${index + 1}: ${parts.join(' | ') || '情報なし'}`
}

function formatWeakPointItem(item, index) {
  if (typeof item === 'string') {
    return `- 弱点${index + 1}: ${item}`
  }

  if (!item || typeof item !== 'object') {
    return `- 弱点${index + 1}: 情報なし`
  }

  const parts = []
  if (item.subject) parts.push(`科目: ${item.subject}`)
  if (item.topic) parts.push(`論点: ${item.topic}`)
  if (item.note) parts.push(`補足: ${item.note}`)

  return `- 弱点${index + 1}: ${parts.join(' | ') || '情報なし'}`
}

export function buildMonthlyReportPrompt({
  userId,
  phase,
  recentStudyReports = [],
  recentWeakPoints = [],
  availableHoursPerWeek,
  targetExamYear,
}) {
  const reportsBlock = recentStudyReports.length
    ? recentStudyReports.map(formatStudyReportItem).join('\n')
    : '- 直近レポートなし'

  const weakPointsBlock = recentWeakPoints.length
    ? recentWeakPoints.map(formatWeakPointItem).join('\n')
    : '- 直近弱点なし'

  return `あなたは司法書士試験アプリ「秘書エージェント」の月次戦略プランナーです。
以下の受験生情報を読み、次の1か月の戦略文を日本語で作成してください。

【出力条件】
- 出力は受験生向けの実務的な月次レポート本文だけにしてください
- 抽象論で終わらせず、優先科目・重点論点・学習配分・到達目標まで具体化してください
- 直近の学習レポートと弱点を踏まえて、今月の修正方針を明確にしてください
- 週あたりの可処分時間を前提に、無理のない戦略にしてください

【受験生情報】
- userId: ${userId}
- 現在フェーズ: ${phase}
- 週あたり学習可能時間: ${availableHoursPerWeek}
- 目標試験年度: ${targetExamYear}

【直近の学習レポート】
${reportsBlock}

【直近の弱点】
${weakPointsBlock}

【依頼】
今月の戦略文を作成してください。少なくとも以下を自然な本文の中に含めてください。
- 今月の総合方針
- 優先すべき科目・論点
- 週あたりの学習配分の考え方
- 今月中に到達すべき具体的な到達目標
- 失速や抜け漏れを防ぐための注意点`
}
