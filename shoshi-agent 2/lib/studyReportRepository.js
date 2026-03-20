import { getSupabaseAdmin } from './supabaseAdmin'

function buildSavedObject(input) {
  const timestamp = new Date().toISOString()

  return {
    id: crypto.randomUUID(),
    userId: input.userId,
    taskResults: input.taskResults,
    selfEvaluation: input.selfEvaluation,
    aiReportText: input.aiReportText,
    textReviewed: input.textReviewed,
    studyMinutes: input.studyMinutes,
    submittedAt: timestamp,
  }
}

function buildInsertPayload(savedObject) {
  return {
    id: savedObject.id,
    user_id: savedObject.userId,
    task_results: savedObject.taskResults,
    self_evaluation: savedObject.selfEvaluation,
    ai_report_text: savedObject.aiReportText,
    text_reviewed: savedObject.textReviewed,
    study_minutes: Number(savedObject.studyMinutes),
    submitted_at: savedObject.submittedAt,
  }
}

async function saveToSupabase(savedObject) {
  const supabaseAdmin = getSupabaseAdmin()

  if (!supabaseAdmin) {
    return null
  }

  const payload = buildInsertPayload(savedObject)
  const { data, error } = await supabaseAdmin
    .from('study_reports')
    .insert(payload)
    .select()
    .single()

  if (error) {
    throw error
  }

  return {
    id: data.id,
    userId: data.user_id,
    taskResults: data.task_results,
    selfEvaluation: data.self_evaluation,
    aiReportText: data.ai_report_text,
    textReviewed: data.text_reviewed,
    studyMinutes: data.study_minutes,
    submittedAt: data.submitted_at,
    storage: 'supabase',
  }
}

export async function saveStudyReportRecord(input) {
  const savedObject = buildSavedObject(input)

  try {
    const persisted = await saveToSupabase(savedObject)

    if (persisted) {
      return persisted
    }
  } catch (error) {
    // TODO: Remove mock fallback once the study_reports table is provisioned in Supabase.
  }

  return {
    ...savedObject,
    storage: 'mock',
  }
}
