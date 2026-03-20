import { normalizeWeeklyReviewRequest, validateWeeklyReviewRequest } from '../../../lib/apiTypes'
import { generateWeeklyReview } from '../../../lib/weeklyReviewService'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const input = normalizeWeeklyReviewRequest(req.body)
  const errors = validateWeeklyReviewRequest(input)

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') })
  }

  try {
    const result = await generateWeeklyReview(input)
    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to generate weekly review' })
  }
}

// Next.js pages/api file-based routing registers this handler at /api/weekly-review/generate.
