import { TASK_TYPES } from './modelRouter'
import { runTaskPrompt } from './llmClient'
import { buildMonthlyReportPrompt } from './monthlyReportPrompt'

const MONTHLY_REPORT_MAX_TOKENS = 2200

export async function generateMonthlyReport(input) {
  const prompt = buildMonthlyReportPrompt(input)

  const result = await runTaskPrompt({
    taskType: TASK_TYPES.monthlyReport,
    prompt,
    maxTokens: MONTHLY_REPORT_MAX_TOKENS,
  })

  return {
    reportText: result.text,
  }
}

// TODO: Persist generated monthly reports when the storage schema is finalized.
