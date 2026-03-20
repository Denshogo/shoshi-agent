import { TASK_TYPES } from './modelRouter'
import { runTaskPrompt } from './llmClient'
import { buildStudyReportPromptGenerationPrompt, buildStudyReportPromptText } from './studyReportPromptBuilder'

const STUDY_REPORT_PROMPT_MAX_TOKENS = 1400

export async function generateStudyReportPrompt(input) {
  const fallbackPromptText = buildStudyReportPromptText(input)

  const result = await runTaskPrompt({
    taskType: TASK_TYPES.studyReportPrompt,
    prompt: buildStudyReportPromptGenerationPrompt(input),
    maxTokens: STUDY_REPORT_PROMPT_MAX_TOKENS,
  })

  return {
    promptText: result.isMock ? fallbackPromptText : result.text,
  }
}
