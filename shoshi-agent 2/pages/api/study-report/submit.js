import { normalizeStudyReportSubmitRequest, validateStudyReportSubmitRequest } from '../../../lib/apiTypes'
import { submitStudyReport } from '../../../lib/studyReportSubmitService'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const input = normalizeStudyReportSubmitRequest(req.body)
  const errors = validateStudyReportSubmitRequest(input)

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') })
  }

  try {
    const result = await submitStudyReport(input)
    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to submit study report' })
  }
}

// Next.js pages/api file-based routing registers this handler at /api/study-report/submit.
// TODO: Verify body.userId against authenticated user before enabling production writes.
