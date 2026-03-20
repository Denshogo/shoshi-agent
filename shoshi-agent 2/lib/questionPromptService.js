import { TASK_TYPES } from './modelRouter'
import { runTaskPrompt } from './llmClient'
import { buildQuestionPromptGenerationPrompt, buildQuestionPromptText } from './questionPromptBuilder'

const QUESTION_PROMPT_MAX_TOKENS = 1400

export async function generateQuestionPrompt(input) {
  const fallbackPromptText = buildQuestionPromptText(input)

  const result = await runTaskPrompt({
    taskType: TASK_TYPES.questionPrompt,
    prompt: buildQuestionPromptGenerationPrompt(input),
    maxTokens: QUESTION_PROMPT_MAX_TOKENS,
  })

  return {
    promptText: result.isMock ? fallbackPromptText : result.text,
  }
}
