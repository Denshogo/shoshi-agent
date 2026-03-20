const PURPOSE_CONFIG = {
  daily: {
    label: '日次演習',
    objective: '今日の学習内容の定着と弱点補強',
    volumeGuide: '5〜8問程度を目安に、短時間で解き切れる量',
  },
  weekly: {
    label: '週次演習',
    objective: '1週間の総復習と反復ミスの再点検',
    volumeGuide: '8〜12問程度を目安に、重要論点を横断できる量',
  },
}

function formatTopics(topics = []) {
  return topics.map((topic, index) => `- 論点${index + 1}: ${topic}`).join('\n')
}

export function buildQuestionPromptText({ phase, topics = [], purpose }) {
  const config = PURPOSE_CONFIG[purpose] || PURPOSE_CONFIG.daily
  const topicsBlock = formatTopics(topics)

  return `あなたは司法書士試験の作問アシスタントです。以下の条件に従って、日本語で演習問題を作成してください。

【作問の目的】
${config.label}用です。目的は「${config.objective}」です。

【受験生の前提】
- 現在フェーズ: ${phase}

【重点論点】
${topicsBlock}

【作問条件】
- 司法書士試験レベルを前提にしてください
- 出題は上記の重点論点から外れないでください
- 暗記確認だけでなく、理解と判断を要する問題を含めてください
- 問題量は ${config.volumeGuide} にしてください
- 似た問いを重複させず、論点の切り口を少しずつ変えてください
- 受験生が復習しやすいように、各問題に正答と簡潔な解説を付けてください

【出力形式】
各問題について、次の順で出してください。
1. 問題番号
2. 問題文
3. 正答
4. 解説
5. この問題で確認したい論点

外部向けの説明や前置きは不要です。すぐに問題作成を始めてください。`
}

export function buildQuestionPromptGenerationPrompt(input) {
  const seedPrompt = buildQuestionPromptText(input)
  const config = PURPOSE_CONFIG[input.purpose] || PURPOSE_CONFIG.daily

  return `あなたは司法書士試験アプリ「秘書エージェント」の作問プロンプト設計担当です。
以下の条件を満たす、外部AIへそのまま貼り付けられる日本語の全文プロンプトを作成してください。

【出力条件】
- 出力はコピペ用の全文プロンプト本文のみ
- 前置き、解説、補足、囲み文字は不要
- ${config.label}用であることが分かる内容にしてください
- 重点論点に対して、外部AIがそのまま問題作成に入れる具体性を持たせてください
- 問題の正答と解説まで出力させる指示を含めてください

【入力情報】
- phase: ${input.phase}
- purpose: ${input.purpose}
- topics:
${formatTopics(input.topics)}

【たたき台】
${seedPrompt}`
}
