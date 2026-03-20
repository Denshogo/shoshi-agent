function formatList(title, items = [], emptyLabel) {
  const body = items.length
    ? items.map((item, index) => `- ${title}${index + 1}: ${item}`).join('\n')
    : `- ${emptyLabel}`

  return body
}

export function buildStudyReportPromptText({
  studiedTopics = [],
  mistakeLog = [],
  shallowPoints = [],
  textReviewed = [],
  studyMinutes,
}) {
  return `あなたは司法書士試験の学習ログ整理アシスタントです。以下の学習記録を整理し、日本語で受験生向けの学習レポートを作成してください。

【今回の学習条件】
- 総学習時間: ${studyMinutes} 分

【今回学習した論点】
${formatList('学習論点', studiedTopics, '学習論点なし')}

【ミス記録】
${formatList('ミス', mistakeLog, 'ミス記録なし')}

【理解が浅い点】
${formatList('浅い点', shallowPoints, '理解が浅い点なし')}

【読んだ教材・見直した内容】
${formatList('教材', textReviewed, '教材記録なし')}

【依頼】
上記を整理して、受験生がそのまま日報として使える文章を作成してください。

【出力条件】
- 出力はレポート本文のみ
- 今日何をやったか、どこが弱かったか、次回何を優先すべきかが分かる形にしてください
- 学習時間に対して妥当な振り返りにしてください
- 箇条書きではなく、自然な日本語のレポート文としてまとめてください
- 抽象論だけでなく、ミスや理解不足を踏まえた次回の重点を明確にしてください`
}

export function buildStudyReportPromptGenerationPrompt(input) {
  const seedPrompt = buildStudyReportPromptText(input)

  return `あなたは司法書士試験アプリ「秘書エージェント」の学習レポート整理プロンプト設計担当です。
以下の条件を満たす、外部AIへそのまま貼り付けられる日本語の全文プロンプトを作成してください。

【出力条件】
- 出力はコピペ用の全文プロンプト本文のみ
- 前置き、解説、補足は不要
- 外部AIが学習記録を自然な日報文に整理できる十分な具体性を持たせてください
- ミス、理解が浅い点、次回の重点を必ず整理させる指示を含めてください
- そのまま貼って実行できる完成形にしてください

【入力情報】
- studyMinutes: ${input.studyMinutes}
- studiedTopics:
${formatList('学習論点', input.studiedTopics, '学習論点なし')}
- mistakeLog:
${formatList('ミス', input.mistakeLog, 'ミス記録なし')}
- shallowPoints:
${formatList('浅い点', input.shallowPoints, '理解が浅い点なし')}
- textReviewed:
${formatList('教材', input.textReviewed, '教材記録なし')}

【たたき台】
${seedPrompt}`
}
