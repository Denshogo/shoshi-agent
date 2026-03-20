import { callAI, SCHED_SYS, DAILY_SYS, KANZAKI_SYS, ICHIJO_SYS, ALL, MINOR } from '../../lib/agents'
import { supabase } from '../../lib/supabase'
import { PLANS } from '../../lib/plans'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // 認証確認
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: '認証が必要です' })

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: '認証エラー' })

  // プラン確認
  const { data: profile } = await supabase.from('profiles').select('plan,stripe_status,ichijo_count,ichijo_reset_at').eq('id', user.id).single()
  if (!profile || profile.stripe_status !== 'active') return res.status(403).json({ error: 'サブスクリプションが必要です' })

  const { type, ctx, allOutputs } = req.body
  const apiKey = process.env.ANTHROPIC_API_KEY

  try {
    if (type === 'run_agents') {
      const light = ctx
      const full  = ctx + `\n\n【全論点データ】\n${ALL}`

      // Phase 1a
      const [rR, lR, oR] = await Promise.all([
        callAI(apiKey, SCHED_SYS.reversal,  light, 800),
        callAI(apiKey, DAILY_SYS.liaison,   light, 700),
        callAI(apiKey, DAILY_SYS.outlook,   light, 700),
      ])
      // Phase 1b
      const [aR, cR] = await Promise.all([
        callAI(apiKey, SCHED_SYS.allocator, full, 900),
        callAI(apiKey, SCHED_SYS.coverage,  full, 900),
      ])
      // Phase 2
      const schedCtx = `${light}\n\n【逆算プランナー】\n${rR}\n\n【科目配分官】\n${aR}\n\n【網羅チェッカー】\n${cR}`
      const dailyCtx = `${light}\n\n【逆算プランナー】\n${rR}\n\n【連絡官】\n${lR}\n\n【長期見通し】\n${oR}`
      const [tR, mR, pR] = await Promise.all([
        callAI(apiKey, SCHED_SYS.tactician, schedCtx, 1100),
        callAI(apiKey, SCHED_SYS.monitor,   schedCtx, 1000),
        callAI(apiKey, DAILY_SYS.planner,   dailyCtx, 1100),
      ])
      // Phase 3
      const kCtx = `${light}\n\n【スケジューラーチーム全分析】\n逆算:${rR}\n配分:${aR}\n網羅:${cR}\nタクティシャン:${tR}\n監視官:${mR}\n\n【日次プランナーチーム全分析】\n連絡官:${lR}\n見通し:${oR}\nプランナー:${pR}`
      const kR = await callAI(apiKey, KANZAKI_SYS, kCtx, 1000)

      return res.json({ sched:{reversal:rR,allocator:aR,coverage:cR,tactician:tR,monitor:mR}, daily:{liaison:lR,outlook:oR,planner:pR}, kanzaki:kR })
    }

    if (type === 'ichijo') {
      // 一条剛の使用回数チェック
      const plan = PLANS[profile.plan]
      const limit = plan?.ichijoLimit || 0
      const now = new Date()
      const resetAt = profile.ichijo_reset_at ? new Date(profile.ichijo_reset_at) : null
      const count = (!resetAt || now > resetAt) ? 0 : (profile.ichijo_count || 0)

      if (count >= limit && limit < 9999) return res.status(403).json({ error: `今月の一条剛チャットの上限（${limit}回）に達しました。プランをアップグレードしてください。` })

      const { question } = req.body
      const answer = await callAI(apiKey, ICHIJO_SYS, `【受験生の状況・全論点データ】\n${ctx}\n\n【全論点データ】\n${ALL}\n\n【質問】\n${question}`, 1000)

      // カウント更新
      const newCount = count + 1
      const newReset = (!resetAt || now > resetAt) ? new Date(now.getFullYear(), now.getMonth()+1, 1).toISOString() : resetAt.toISOString()
      await supabase.from('profiles').update({ ichijo_count: newCount, ichijo_reset_at: newReset }).eq('id', user.id)

      return res.json({ answer, remaining: limit === 9999 ? '無制限' : limit - newCount })
    }

    res.status(400).json({ error: '不明なtype' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
