import { normalizeStudyReportPromptRequest, validateStudyReportPromptRequest } from '../../../lib/apiTypes'
import { generateStudyReportPrompt } from '../../../lib/studyReportPromptService'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const input = normalizeStudyReportPromptRequest(req.body)
  const errors = validateStudyReportPromptRequest(input)

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') })
  }

  try {
    const result = await generateStudyReportPrompt(input)
    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to generate study report prompt' })
  }
}

// Next.js pages/api file-based routing registers this handler at /api/study-report-prompt/generate.
