import { normalizeDailyPlanRequest, validateDailyPlanRequest } from '../../../lib/apiTypes'
import { generateDailyPlan } from '../../../lib/dailyPlanService'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const input = normalizeDailyPlanRequest(req.body)
  const errors = validateDailyPlanRequest(input)

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') })
  }

  try {
    const result = await generateDailyPlan(input)
    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to generate daily plan' })
  }
}

// Next.js pages/api file-based routing registers this handler at /api/daily-plan/generate.
// TODO: Verify body.userId against authenticated user when the frontend wiring is added.
