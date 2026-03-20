import { normalizeQuestionPromptRequest, validateQuestionPromptRequest } from '../../../lib/apiTypes'
import { generateQuestionPrompt } from '../../../lib/questionPromptService'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const input = normalizeQuestionPromptRequest(req.body)
  const errors = validateQuestionPromptRequest(input)

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') })
  }

  try {
    const result = await generateQuestionPrompt(input)
    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to generate question prompt' })
  }
}

// Next.js pages/api file-based routing registers this handler at /api/question-prompt/generate.
