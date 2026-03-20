const FALLBACK_MODEL = 'claude-sonnet-4-20250514'

export const TASK_TYPES = {
  monthlyReport: 'monthly_report',
  dailyPlan: 'daily_plan',
  weeklyReview: 'weekly_review',
  questionPrompt: 'question_prompt',
  studyReportPrompt: 'study_report_prompt',
}

const TASK_MODEL_TIERS = {
  [TASK_TYPES.monthlyReport]: 'highest_reasoning',
  [TASK_TYPES.dailyPlan]: 'reasoning',
  [TASK_TYPES.weeklyReview]: 'reasoning',
  [TASK_TYPES.questionPrompt]: 'standard',
  [TASK_TYPES.studyReportPrompt]: 'standard',
}

const MODEL_RESOLVERS = {
  highest_reasoning: () =>
    process.env.LLM_MODEL_REASONING_TOP ||
    process.env.LLM_MODEL_MONTHLY_REPORT ||
    process.env.LLM_MODEL_REASONING ||
    process.env.LLM_MODEL_STANDARD ||
    process.env.LLM_MODEL_DEFAULT ||
    FALLBACK_MODEL,
  reasoning: () =>
    process.env.LLM_MODEL_REASONING ||
    process.env.LLM_MODEL_STANDARD ||
    process.env.LLM_MODEL_DEFAULT ||
    FALLBACK_MODEL,
  standard: () =>
    process.env.LLM_MODEL_STANDARD ||
    process.env.LLM_MODEL_REASONING ||
    process.env.LLM_MODEL_DEFAULT ||
    FALLBACK_MODEL,
}

export function getLLMProvider() {
  return process.env.LLM_PROVIDER || 'anthropic'
}

export function getModelTierForTask(taskType) {
  if (!taskType) throw new Error('taskType is required')
  return TASK_MODEL_TIERS[taskType] || 'standard'
}

export function getModelForTask(taskType) {
  const tier = getModelTierForTask(taskType)
  return MODEL_RESOLVERS[tier]()
}

export function getModelConfig(taskType) {
  const tier = getModelTierForTask(taskType)

  return {
    taskType,
    tier,
    provider: getLLMProvider(),
    model: getModelForTask(taskType),
  }
}
