/**
 * @typedef {Object} MonthlyStudyReportItem
 * @property {string=} date
 * @property {string=} text
 */

/**
 * @typedef {Object} MonthlyWeakPointItem
 * @property {string=} subject
 * @property {string=} topic
 * @property {string=} note
 */

/**
 * @typedef {Object} MonthlyReportGenerateRequest
 * @property {string} userId
 * @property {string} phase
 * @property {(string|MonthlyStudyReportItem)[]} recentStudyReports
 * @property {(string|MonthlyWeakPointItem)[]} recentWeakPoints
 * @property {number|string} availableHoursPerWeek
 * @property {number|string} targetExamYear
 */

/**
 * @typedef {Object} MonthlyReportGenerateResponse
 * @property {string} reportText
 */

/**
 * @typedef {Object} DailyPlanMistakeItem
 * @property {string=} subject
 * @property {string=} topic
 * @property {string=} note
 */

/**
 * @typedef {Object} DailyPlanGenerateRequest
 * @property {string} userId
 * @property {string} phase
 * @property {number|string} availableMinutesToday
 * @property {string} recentStudyReportText
 * @property {string} selfReviewText
 * @property {(string|DailyPlanMistakeItem)[]} recentMistakes
 * @property {string[]|string} reviewNotes
 */

/**
 * @typedef {Object} DailyPlanGenerateResponse
 * @property {string} dailyPlanText
 */

/**
 * @typedef {Object} WeeklyReviewReportItem
 * @property {string=} date
 * @property {string=} text
 */

/**
 * @typedef {Object} WeeklyReviewMistakeItem
 * @property {string=} subject
 * @property {string=} topic
 * @property {string=} note
 */

/**
 * @typedef {Object} WeeklyReviewCandidateItem
 * @property {string=} subject
 * @property {string=} topic
 * @property {string=} reason
 */

/**
 * @typedef {Object} WeeklyReviewGenerateRequest
 * @property {string} userId
 * @property {string} phase
 * @property {(string|WeeklyReviewReportItem)[]} pastWeekReports
 * @property {(string|WeeklyReviewMistakeItem)[]} recurringMistakes
 * @property {(string|WeeklyReviewCandidateItem)[]} reviewCandidates
 */

/**
 * @typedef {Object} WeeklyReviewGenerateResponse
 * @property {string} weeklyReviewText
 */

/**
 * @typedef {Object} QuestionPromptGenerateRequest
 * @property {string} phase
 * @property {string[]|string} topics
 * @property {'daily'|'weekly'} purpose
 */

/**
 * @typedef {Object} QuestionPromptGenerateResponse
 * @property {string} promptText
 */

/**
 * @typedef {Object} StudyReportPromptGenerateRequest
 * @property {string[]|string} studiedTopics
 * @property {string[]|string} mistakeLog
 * @property {string[]|string} shallowPoints
 * @property {string[]|string} textReviewed
 * @property {number|string} studyMinutes
 */

/**
 * @typedef {Object} StudyReportPromptGenerateResponse
 * @property {string} promptText
 */

/**
 * @typedef {Object} StudyReportSubmitRequest
 * @property {string} userId
 * @property {unknown} taskResults
 * @property {unknown} selfEvaluation
 * @property {string} aiReportText
 * @property {string[]|string} textReviewed
 * @property {number|string} studyMinutes
 */

/**
 * @typedef {Object} StudyReportSubmitResponse
 * @property {boolean} ok
 * @property {Object=} saved
 */

export function normalizeMonthlyReportRequest(input = {}) {
  return {
    userId: typeof input.userId === 'string' ? input.userId.trim() : '',
    phase: typeof input.phase === 'string' ? input.phase.trim() : '',
    recentStudyReports: Array.isArray(input.recentStudyReports) ? input.recentStudyReports : [],
    recentWeakPoints: Array.isArray(input.recentWeakPoints) ? input.recentWeakPoints : [],
    availableHoursPerWeek: input.availableHoursPerWeek ?? '',
    targetExamYear: input.targetExamYear ?? '',
  }
}

export function validateMonthlyReportRequest(input) {
  const errors = []

  if (!input.userId) errors.push('userId is required')
  if (!input.phase) errors.push('phase is required')
  if (input.availableHoursPerWeek === '') errors.push('availableHoursPerWeek is required')
  if (input.targetExamYear === '') errors.push('targetExamYear is required')

  return errors
}

export function normalizeDailyPlanRequest(input = {}) {
  return {
    userId: typeof input.userId === 'string' ? input.userId.trim() : '',
    phase: typeof input.phase === 'string' ? input.phase.trim() : '',
    availableMinutesToday: input.availableMinutesToday ?? '',
    recentStudyReportText: typeof input.recentStudyReportText === 'string' ? input.recentStudyReportText.trim() : '',
    selfReviewText: typeof input.selfReviewText === 'string' ? input.selfReviewText.trim() : '',
    recentMistakes: Array.isArray(input.recentMistakes) ? input.recentMistakes : [],
    reviewNotes: Array.isArray(input.reviewNotes)
      ? input.reviewNotes
      : typeof input.reviewNotes === 'string' && input.reviewNotes.trim()
        ? [input.reviewNotes.trim()]
        : [],
  }
}

export function validateDailyPlanRequest(input) {
  const errors = []

  if (!input.userId) errors.push('userId is required')
  if (!input.phase) errors.push('phase is required')
  if (input.availableMinutesToday === '') errors.push('availableMinutesToday is required')
  if (!input.recentStudyReportText) errors.push('recentStudyReportText is required')
  if (!input.selfReviewText) errors.push('selfReviewText is required')

  return errors
}

export function normalizeWeeklyReviewRequest(input = {}) {
  return {
    userId: typeof input.userId === 'string' ? input.userId.trim() : '',
    phase: typeof input.phase === 'string' ? input.phase.trim() : '',
    pastWeekReports: Array.isArray(input.pastWeekReports) ? input.pastWeekReports : [],
    recurringMistakes: Array.isArray(input.recurringMistakes) ? input.recurringMistakes : [],
    reviewCandidates: Array.isArray(input.reviewCandidates) ? input.reviewCandidates : [],
  }
}

export function validateWeeklyReviewRequest(input) {
  const errors = []

  if (!input.userId) errors.push('userId is required')
  if (!input.phase) errors.push('phase is required')
  if (!input.pastWeekReports.length) errors.push('pastWeekReports is required')
  if (!input.reviewCandidates.length) errors.push('reviewCandidates is required')

  return errors
}

export function normalizeQuestionPromptRequest(input = {}) {
  const rawTopics = Array.isArray(input.topics)
    ? input.topics
    : typeof input.topics === 'string' && input.topics.trim()
      ? [input.topics.trim()]
      : []

  return {
    phase: typeof input.phase === 'string' ? input.phase.trim() : '',
    topics: rawTopics.map(topic => String(topic).trim()).filter(Boolean),
    purpose: typeof input.purpose === 'string' ? input.purpose.trim() : '',
  }
}

export function validateQuestionPromptRequest(input) {
  const errors = []
  const validPurposes = ['daily', 'weekly']

  if (!input.phase) errors.push('phase is required')
  if (!input.topics.length) errors.push('topics is required')
  if (!validPurposes.includes(input.purpose)) errors.push('purpose must be one of: daily, weekly')

  return errors
}

function normalizeStringList(value) {
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean)
  }

  if (typeof value === 'string' && value.trim()) {
    return [value.trim()]
  }

  return []
}

export function normalizeStudyReportPromptRequest(input = {}) {
  return {
    studiedTopics: normalizeStringList(input.studiedTopics),
    mistakeLog: normalizeStringList(input.mistakeLog),
    shallowPoints: normalizeStringList(input.shallowPoints),
    textReviewed: normalizeStringList(input.textReviewed),
    studyMinutes: input.studyMinutes ?? '',
  }
}

export function validateStudyReportPromptRequest(input) {
  const errors = []

  if (!input.studiedTopics.length) errors.push('studiedTopics is required')
  if (!input.textReviewed.length) errors.push('textReviewed is required')
  if (input.studyMinutes === '') errors.push('studyMinutes is required')

  return errors
}

export function normalizeStudyReportSubmitRequest(input = {}) {
  return {
    userId: typeof input.userId === 'string' ? input.userId.trim() : '',
    taskResults: input.taskResults ?? null,
    selfEvaluation: input.selfEvaluation ?? null,
    aiReportText: typeof input.aiReportText === 'string' ? input.aiReportText.trim() : '',
    textReviewed: normalizeStringList(input.textReviewed),
    studyMinutes: input.studyMinutes ?? '',
  }
}

export function validateStudyReportSubmitRequest(input) {
  const errors = []

  if (!input.userId) errors.push('userId is required')
  if (input.taskResults == null) errors.push('taskResults is required')
  if (input.selfEvaluation == null || input.selfEvaluation === '') errors.push('selfEvaluation is required')
  if (!input.aiReportText) errors.push('aiReportText is required')
  if (!input.textReviewed.length) errors.push('textReviewed is required')
  if (input.studyMinutes === '') errors.push('studyMinutes is required')

  return errors
}
