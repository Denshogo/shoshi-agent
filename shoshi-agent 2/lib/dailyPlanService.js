import { TASK_TYPES } from './modelRouter'
import { runTaskPrompt } from './llmClient'
import { buildDailyPlanPrompt } from './dailyPlanPrompt'

const DAILY_PLAN_MAX_TOKENS = 1800

export async function generateDailyPlan(input) {
  const prompt = buildDailyPlanPrompt(input)

  const result = await runTaskPrompt({
    taskType: TASK_TYPES.dailyPlan,
    prompt,
    maxTokens: DAILY_PLAN_MAX_TOKENS,
  })

  return {
    dailyPlanText: result.text,
  }
}
