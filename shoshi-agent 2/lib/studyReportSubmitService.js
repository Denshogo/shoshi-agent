import { saveStudyReportRecord } from './studyReportRepository'

export async function submitStudyReport(input) {
  const saved = await saveStudyReportRecord(input)

  return {
    ok: true,
    saved,
  }
}
