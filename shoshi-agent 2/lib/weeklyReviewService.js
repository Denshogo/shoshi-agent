import { TASK_TYPES } from './modelRouter'
import { runTaskPrompt } from './llmClient'
import { buildWeeklyReviewPrompt } from './weeklyReviewPrompt'

const WEEKLY_REVIEW_MAX_TOKENS = 1800

export async function generateWeeklyReview(input) {
  const prompt = buildWeeklyReviewPrompt(input)

  const result = await runTaskPrompt({
    taskType: TASK_TYPES.weeklyReview,
    prompt,
    maxTokens: WEEKLY_REVIEW_MAX_TOKENS,
  })

  return {
    weeklyReviewText: result.text,
  }
}
