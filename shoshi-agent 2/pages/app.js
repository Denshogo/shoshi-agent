import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import { RANK_DATA_EXPORT as RANK_DATA, MINOR, TOTALS } from '../lib/agents'

const SUBJECTS = Object.keys(RANK_DATA)
const RANKS = ['S','A','B']
const RC = {S:'#f59e0b',A:'#6366f1',B:'#10b981'}

export default function AppPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [examDate, setExamDate] = useState('')
  const [reports, setReports] = useState([])
  const [draft, setDraft] = useState('')
  const [running, setRunning] = useState(false)
  const [logs, setLogs] = useState([])
  const [result, setResult] = useState(null)
  const [activeTab, setActiveTab] = useState('report')
  const [dbLoading, setDbLoading] = useState(true)
  const [showSetup, setShowSetup] = useState(false)
  const [showRank, setShowRank] = useState(false)
  const [rankSubj, setRankSubj] = useState('民法')
  const [ichijoMsgs, setIchijoMsgs] = useState([])
  const [ichijoInput, setIchijoInput] = useState('')
  const [ichijoLoading, setIchijoLoading] = useState(false)
  const [ichijoRemaining, setIchijoRemaining] = useState(null)
  const chatRef = useRef(null)
  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, [ichijoMsgs, ichijoLoading])

  const today = new Date().toLocaleDateString('ja-JP', { year:'numeric', month:'long', day:'numeric', weekday:'long' })
  const daysLeft = examDate ? Math.ceil((new Date(examDate) - new Date()) / 86400000) : null

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      setUser(session.user)
      // プラン確認
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!prof || prof.stripe_status !== 'active') { router.push('/pricing'); return }
      setProfile(prof)
      // データロード
      const { data: settings } = await supabase.from('user_settings').select('exam_date').eq('id', session.user.id).single()
      if (settings?.exam_date) setExamDate(settings.exam_date)
      else setShowSetup(true)
      const { data: reps } = await supabase.from('reports').select('*').eq('user_id', session.user.id).order('created_at', { ascending: true })
      if (reps?.length) setReports(reps.map(r => ({ id:r.id, date:r.date, text:r.text })))
      const { data: lr } = await supabase.from('last_result').select('result_json').eq('id', session.user.id).single()
      if (lr?.result_json) setResult(lr.result_json)
      setDbLoading(false)
    })
  }, [])

  const saveExamDate = async () => {
    if (!examDate) return
    await supabase.from('user_settings').upsert({ id: user.id, exam_date: examDate, updated_at: new Date().toISOString() })
    setShowSetup(false)
  }

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  const buildCtx = () => {
    return [
      `試験日: ${examDate}（残り${daysLeft ?? '未設定'}日）`,
      MINOR,
      `レポート履歴（直近3件）:\n${reports.slice(-3).map((r,i) => `[${r.date}${i===reports.slice(-3).length-1?'・本日':''}]\n${r.text}`).join('\n\n') || 'なし'}`,
    ].join('\n\n')
  }

  const handleSend = async () => {
    if (!draft.trim() || running) return
    const newReport = { id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], text: draft.trim() }
    await supabase.from('reports').insert({ id:newReport.id, user_id:user.id, date:newReport.date, text:newReport.text })
    const updatedReports = [...reports, newReport]
    setReports(updatedReports)
    setDraft('')
    setRunning(true); setLogs([]); setResult(null); setActiveTab('results')
    const log = (msg) => setLogs(p => [...p, { id: Date.now()+Math.random(), msg }])
    log('⚡ 全9体のエージェントを起動しています...')

    try {
      const token = await getToken()
      const ctx = buildCtx()
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify({ type:'run_agents', ctx })
      })
      const data = await res.json()
      if (data.error) { log('❌ ' + data.error); setRunning(false); return }
      log('✓ 全エージェント完了')
      const newResult = { ...data, reportRef: newReport.text, savedAt: new Date().toISOString() }
      setResult(newResult)
      await supabase.from('last_result').upsert({ id:user.id, result_json:newResult, updated_at:new Date().toISOString() })
      log('💾 クラウドに保存しました')
    } catch(e) { log('❌ エラー: ' + e.message) }
    setRunning(false)
  }

  const askIchijo = async () => {
    if (!ichijoInput.trim() || ichijoLoading) return
    const q = ichijoInput.trim(); setIchijoInput(''); setIchijoLoading(true)
    setIchijoMsgs(p => [...p, { role:'user', content:q }])
    try {
      const token = await getToken()
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify({ type:'ichijo', ctx: buildCtx(), question: q })
      })
      const data = await res.json()
      if (data.error) { setIchijoMsgs(p => [...p, { role:'assistant', content:'⚠️ ' + data.error }]); setIchijoLoading(false); return }
      setIchijoMsgs(p => [...p, { role:'assistant', content: data.answer }])
      setIchijoRemaining(data.remaining)
    } catch(e) { setIchijoMsgs(p => [...p, { role:'assistant', content:'エラーが発生しました。' }]) }
    setIchijoLoading(false)
  }

  const handlePortal = async () => {
    const res = await fetch('/api/portal', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ userId: user.id }) })
    const { url } = await res.json()
    window.location.href = url
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const planLabel = { light:'ライト', standard:'スタンダード', premium:'プレミアム' }

  if (dbLoading) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#06070f,#0d1117)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Hiragino Sans',sans-serif" }}>
      <div style={{ textAlign:'center', color:'rgba(255,255,255,0.4)', fontSize:13 }}><div style={{ fontSize:36, marginBottom:10 }}>⚖️</div>読み込み中...</div>
    </div>
  )

  const userId = user?.email?.replace('@shoshi-agent.app','') || ''
  const TABS = [
    { key:'report',  label:'📨 レポート送信', col:'#f43f5e' },
    { key:'results', label:'📊 分析結果',      col:'#818cf8', dot:!!result },
    { key:'ichijo',  label:'👤 一条 剛',       col:'#fbbf24' },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#06070f,#0d1117,#070c14)', fontFamily:"'Hiragino Sans','Noto Sans JP',sans-serif", color:'#fff' }}>

      {/* 試験日設定モーダル */}
      {showSetup && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div style={{ background:'#0d1117', border:'1px solid rgba(255,255,255,0.12)', borderRadius:20, padding:40, maxWidth:400, width:'100%' }}>
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div style={{ fontSize:40, marginBottom:10 }}>📅</div>
              <h2 style={{ fontSize:18, fontWeight:800, color:'#fff', marginBottom:6 }}>試験日を設定してください</h2>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>一度設定すれば次回から自動で読み込まれます</p>
            </div>
            <input type="date" value={examDate} onChange={e=>setExamDate(e.target.value)}
              style={{ width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'12px 14px', color:'#fff', fontSize:14, outline:'none', marginBottom:16, boxSizing:'border-box' }}/>
            {examDate && <div style={{ textAlign:'center', fontSize:12, color:'#a5b4fc', marginBottom:16 }}>残り {Math.ceil((new Date(examDate)-new Date())/86400000)} 日</div>}
            <button onClick={saveExamDate} disabled={!examDate}
              style={{ width:'100%', padding:13, borderRadius:10, border:'none', background:examDate?'linear-gradient(135deg,#6366f1,#8b5cf6)':'rgba(255,255,255,0.05)', color:examDate?'#fff':'rgba(255,255,255,0.2)', fontSize:14, fontWeight:700, cursor:examDate?'pointer':'not-allowed' }}>
              保存して開始 →
            </button>
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <div style={{ background:'rgba(0,0,0,0.65)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'10px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:20, backdropFilter:'blur(24px)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <span style={{ fontSize:19 }}>⚖️</span>
          <div>
            <div style={{ fontSize:13, fontWeight:800 }}>司法書士試験 秘書エージェント</div>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.28)' }}>{today}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          {daysLeft != null && <span style={{ background:daysLeft<90?'rgba(239,68,68,0.12)':'rgba(99,102,241,0.1)', border:`1px solid ${daysLeft<90?'rgba(239,68,68,0.25)':'rgba(99,102,241,0.2)'}`, borderRadius:20, padding:'3px 11px', fontSize:11, fontWeight:700, color:daysLeft<90?'#f87171':'#a5b4fc' }}>残り{daysLeft}日</span>}
          <button onClick={()=>setShowRank(p=>!p)} style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.15)', borderRadius:6, padding:'4px 9px', color:'#fbbf24', fontSize:10, fontWeight:600, cursor:'pointer' }}>📋 論点表</button>
          <button onClick={()=>setShowSetup(true)} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'4px 8px', color:'rgba(255,255,255,0.35)', fontSize:10, cursor:'pointer' }}>📅 試験日変更</button>
          <div style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 9px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:6 }}>
            <span style={{ fontSize:9, color:'rgba(255,255,255,0.3)' }}>👤 {userId}</span>
            <span style={{ fontSize:9, color:'rgba(99,102,241,0.6)', background:'rgba(99,102,241,0.08)', padding:'1px 5px', borderRadius:4 }}>{planLabel[profile?.plan]}</span>
            <button onClick={handlePortal} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.22)', fontSize:9, cursor:'pointer' }}>プラン変更</button>
            <span style={{ color:'rgba(255,255,255,0.1)' }}>|</span>
            <button onClick={handleLogout} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.22)', fontSize:9, cursor:'pointer' }}>ログアウト</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:960, margin:'0 auto', padding:'14px 16px 56px' }}>

        {/* 論点表 */}
        {showRank && (
          <div style={{ background:'rgba(245,158,11,0.04)', border:'1px solid rgba(245,158,11,0.14)', borderRadius:12, padding:14, marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, flexWrap:'wrap' }}>
              <span style={{ fontSize:12, color:'#fbbf24', fontWeight:700 }}>📋 全論点表</span>
              <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                {SUBJECTS.map(s => <button key={s} onClick={()=>setRankSubj(s)} style={{ padding:'2px 7px', borderRadius:4, border:rankSubj===s?'1px solid #fbbf24':'1px solid rgba(255,255,255,0.07)', background:rankSubj===s?'rgba(245,158,11,0.16)':'transparent', color:rankSubj===s?'#fbbf24':'rgba(255,255,255,0.3)', fontSize:10, cursor:'pointer', fontWeight:rankSubj===s?700:400 }}>{s}</button>)}
              </div>
            </div>
            {RANKS.map(r => (
              <div key={r} style={{ marginBottom:8 }}>
                <span style={{ display:'inline-block', background:`${RC[r]}13`, border:`1px solid ${RC[r]}28`, borderRadius:4, padding:'1px 6px', fontSize:10, fontWeight:700, color:RC[r], marginBottom:4 }}>{r}ランク（{RANK_DATA[rankSubj]?.[r]?.length||0}論点）</span>
                <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                  {(RANK_DATA[rankSubj]?.[r]||[]).map((item,i) => <span key={i} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:4, padding:'2px 7px', fontSize:10, color:'rgba(255,255,255,0.6)' }}>{item}</span>)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 実行ログ */}
        {running && (
          <div style={{ background:'rgba(99,102,241,0.07)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:10, padding:'12px 16px', marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#a5b4fc', marginBottom:8 }}>⚡ エージェント起動中...</div>
            {logs.map(l => <div key={l.id} style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginBottom:3 }}>{l.msg}</div>)}
          </div>
        )}

        {/* タブ */}
        <div style={{ display:'flex', gap:2, marginBottom:14, background:'rgba(255,255,255,0.04)', borderRadius:12, padding:3 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={()=>setActiveTab(t.key)}
              style={{ flex:1, padding:'11px 4px', borderRadius:9, border:'none', background:activeTab===t.key?`${t.col}1c`:'transparent', color:activeTab===t.key?t.col:'rgba(255,255,255,0.3)', fontSize:12, fontWeight:activeTab===t.key?700:400, cursor:'pointer', position:'relative' }}>
              {t.label}
              {t.dot && activeTab!==t.key && <span style={{ position:'absolute', top:7, right:10, width:6, height:6, borderRadius:'50%', background:t.col }} />}
            </button>
          ))}
        </div>

        {/* レポート送信 */}
        {activeTab==='report' && (
          <div>
            <div style={{ background:'rgba(244,63,94,0.04)', border:'1px solid rgba(244,63,94,0.18)', borderRadius:16, padding:20, marginBottom:16 }}>
              <div style={{ fontSize:15, fontWeight:800, color:'#fb7185', marginBottom:6 }}>📨 今日の課題レポートを書く</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', lineHeight:1.7, marginBottom:14 }}>
                送信するだけで <strong style={{ color:'rgba(255,255,255,0.65)' }}>全9体のエージェントが自動起動</strong> し、スケジュールと明日の計画が更新されます。
              </div>
              <textarea value={draft} onChange={e=>setDraft(e.target.value)}
                placeholder={"今日の勉強で感じた課題・苦手・気になった点を自由に書いてください\n\n例）\n・民法の代理で無権代理と相続が絡む問題が解けなかった\n・不動産登記法の印鑑証明書の要否がまだ整理できていない"}
                style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(244,63,94,0.2)', borderRadius:10, padding:'14px 16px', color:'rgba(255,255,255,0.88)', fontSize:13, lineHeight:1.8, outline:'none', resize:'vertical', minHeight:180, boxSizing:'border-box' }}/>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:14 }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.22)' }}>送信後「分析結果」タブで確認 | 結果はクラウドに自動保存</div>
                <button onClick={handleSend} disabled={!draft.trim()||running}
                  style={{ background:draft.trim()&&!running?'linear-gradient(135deg,#f43f5e,#e11d48)':'rgba(255,255,255,0.05)', border:'none', borderRadius:10, padding:'12px 28px', color:draft.trim()&&!running?'#fff':'rgba(255,255,255,0.2)', fontSize:14, fontWeight:700, cursor:draft.trim()&&!running?'pointer':'not-allowed' }}>
                  {running ? '分析中...' : '送信 → 全エージェント起動'}
                </button>
              </div>
            </div>
            {reports.length > 0 && (
              <div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontWeight:600, marginBottom:8 }}>過去のレポート（直近{Math.min(reports.length,3)}件 | 全{reports.length}件保存済み）</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {reports.slice(-3).reverse().map((r,i) => (
                    <div key={r.id} style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'12px 15px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                        <span style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>{r.date}</span>
                        {i===0 && <span style={{ fontSize:9, color:'rgba(99,102,241,0.7)', background:'rgba(99,102,241,0.08)', padding:'1px 7px', borderRadius:10 }}>最新</span>}
                      </div>
                      <div style={{ fontSize:11, lineHeight:1.7, color:'rgba(255,255,255,0.6)', whiteSpace:'pre-wrap' }}>{r.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {reports.length===0 && <div style={{ textAlign:'center', padding:'32px 0', color:'rgba(255,255,255,0.15)', fontSize:12 }}><div style={{ fontSize:40, marginBottom:10, opacity:0.2 }}>📝</div>まだレポートが送信されていません</div>}
          </div>
        )}

        {/* 分析結果 */}
        {activeTab==='results' && (
          <div>
            {!result && !running && (
              <div style={{ textAlign:'center', padding:'56px 0', color:'rgba(255,255,255,0.18)', fontSize:13 }}>
                <div style={{ fontSize:44, marginBottom:12, opacity:0.2 }}>📊</div>
                レポートを送信すると、ここに分析結果が表示されます
                <div style={{ marginTop:16 }}><button onClick={()=>setActiveTab('report')} style={{ background:'rgba(244,63,94,0.1)', border:'1px solid rgba(244,63,94,0.2)', borderRadius:8, padding:'9px 20px', color:'#fb7185', fontSize:12, fontWeight:600, cursor:'pointer' }}>レポートを書く →</button></div>
              </div>
            )}
            {running && (
              <div style={{ textAlign:'center', padding:'40px 0' }}>
                <div style={{ fontSize:38, marginBottom:12 }}>⚙️</div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', marginBottom:20 }}>9体のエージェントが実行中...</div>
                <div style={{ display:'flex', flexDirection:'column', gap:6, maxWidth:440, margin:'0 auto', textAlign:'left' }}>
                  {logs.map(l => <div key={l.id} style={{ fontSize:11, color:'rgba(255,255,255,0.45)', padding:'4px 12px', background:'rgba(255,255,255,0.03)', borderRadius:6 }}>{l.msg}</div>)}
                </div>
              </div>
            )}
            {result && !running && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.22)' }}>{result.savedAt ? `最終保存: ${new Date(result.savedAt).toLocaleString('ja-JP')}` : ''}</div>
                  <div style={{ fontSize:9, color:'rgba(99,102,241,0.6)', background:'rgba(99,102,241,0.08)', padding:'2px 8px', borderRadius:10 }}>💾 クラウド保存済み</div>
                </div>
                <div style={{ background:'rgba(244,63,94,0.04)', border:'1px solid rgba(244,63,94,0.12)', borderRadius:10, padding:'10px 14px', marginBottom:14, display:'flex', gap:10 }}>
                  <span style={{ fontSize:14, flexShrink:0 }}>📨</span>
                  <div><div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', marginBottom:4 }}>この分析の元になったレポート</div><div style={{ fontSize:11, lineHeight:1.65, color:'rgba(255,255,255,0.55)', whiteSpace:'pre-wrap' }}>{result.reportRef}</div></div>
                </div>
                {result.kanzaki && (
                  <div style={{ background:'rgba(167,139,250,0.07)', border:'2px solid rgba(167,139,250,0.35)', borderRadius:14, padding:18, marginBottom:14 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}><span style={{ fontSize:18 }}>🧠</span><div><div style={{ fontSize:14, fontWeight:800, color:'#a78bfa' }}>神崎 律 — 全体俯瞰アドバイス</div><div style={{ fontSize:9, color:'rgba(255,255,255,0.3)' }}>全9体のエージェント出力を読んだうえでの総合判断</div></div></div>
                    <div style={{ fontSize:12, lineHeight:1.9, color:'rgba(255,255,255,0.85)', whiteSpace:'pre-wrap', background:'rgba(0,0,0,0.2)', borderRadius:9, padding:14 }}>{result.kanzaki}</div>
                  </div>
                )}
                {result.sched?.monitor && (
                  <div style={{ background:'rgba(244,63,94,0.06)', border:'2px solid rgba(244,63,94,0.28)', borderRadius:14, padding:18, marginBottom:14 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}><span style={{ fontSize:18 }}>📡</span><div><div style={{ fontSize:14, fontWeight:800, color:'#fb7185' }}>進捗監視官 — 合否判定 & フィードバック</div><div style={{ fontSize:9, color:'rgba(255,255,255,0.3)' }}>スケジューラーチームから日次プランナーチームへの指示</div></div></div>
                    <div style={{ fontSize:12, lineHeight:1.9, color:'rgba(255,255,255,0.85)', whiteSpace:'pre-wrap', background:'rgba(0,0,0,0.2)', borderRadius:9, padding:14 }}>{result.sched.monitor}</div>
                  </div>
                )}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:'#818cf8', marginBottom:10 }}>📅 スケジューラーチーム</div>
                    {[{k:'tactician',label:'週次タクティシャン',icon:'🗓️',col:'#e879f9'},{k:'reversal',label:'逆算プランナー',icon:'⏳',col:'#818cf8'},{k:'allocator',label:'科目配分官',icon:'⚖️',col:'#34d399'},{k:'coverage',label:'網羅チェッカー',icon:'🗂️',col:'#fb923c'}].map(({k,label,icon,col})=>result.sched?.[k]&&(
                      <div key={k} style={{ background:`${col}05`, border:`1px solid ${col}1e`, borderRadius:10, padding:12, marginBottom:9 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:8 }}><span style={{ fontSize:11 }}>{icon}</span><span style={{ fontSize:10, fontWeight:700, color:col }}>{label}</span></div>
                        <div style={{ fontSize:10, lineHeight:1.75, color:'rgba(255,255,255,0.72)', whiteSpace:'pre-wrap', maxHeight:220, overflowY:'auto' }}>{result.sched[k]}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:'#fb923c', marginBottom:10 }}>🗒️ 日次プランナーチーム</div>
                    {[{k:'planner',label:'統合プランナー — 明日の時間割',icon:'📋',col:'#fb923c'},{k:'liaison',label:'スケジューラー連絡官',icon:'🔗',col:'#22d3ee'},{k:'outlook',label:'長期見通し分析官',icon:'🔭',col:'#4ade80'}].map(({k,label,icon,col})=>result.daily?.[k]&&(
                      <div key={k} style={{ background:`${col}05`, border:`1px solid ${col}1e`, borderRadius:10, padding:12, marginBottom:9 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:8 }}><span style={{ fontSize:11 }}>{icon}</span><span style={{ fontSize:10, fontWeight:700, color:col }}>{label}</span></div>
                        <div style={{ fontSize:10, lineHeight:1.75, color:'rgba(255,255,255,0.72)', whiteSpace:'pre-wrap', maxHeight:220, overflowY:'auto' }}>{result.daily[k]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 一条 剛 */}
        {activeTab==='ichijo' && (
          <div style={{ background:'rgba(251,191,36,0.04)', border:'1px solid rgba(251,191,36,0.18)', borderRadius:14, overflow:'hidden' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(251,191,36,0.1)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:46, height:46, borderRadius:12, background:'linear-gradient(135deg,#78350f,#d97706)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>👤</div>
                <div>
                  <div style={{ fontSize:15, fontWeight:800, color:'#fbbf24' }}>一条 剛（いちじょう たけし）</div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>司法書士試験 首席合格 ｜ 現役30年 ｜「合格に必要なことしか教えない。」</div>
                </div>
              </div>
              {ichijoRemaining !== null && <div style={{ fontSize:10, color:'rgba(251,191,36,0.6)', background:'rgba(251,191,36,0.08)', padding:'3px 9px', borderRadius:10 }}>残り{ichijoRemaining}回</div>}
            </div>
            <div ref={chatRef} style={{ padding:'14px 18px', minHeight:280, maxHeight:420, overflowY:'auto', display:'flex', flexDirection:'column', gap:10 }}>
              {ichijoMsgs.length===0 && (
                <div style={{ textAlign:'center', padding:'28px 0' }}>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.22)', lineHeight:1.8, marginBottom:14 }}>試験戦略・論点理解・捨て問の判断など何でも</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, justifyContent:'center' }}>
                    {['今の進捗を診断して','民法の法定地上権が苦手','Bランクは無視していい?','合格者と不合格者の違いは','残り期間の優先順位は','捨て問の見極め方は'].map(q => (
                      <button key={q} onClick={()=>setIchijoInput(q)} style={{ background:'rgba(251,191,36,0.07)', border:'1px solid rgba(251,191,36,0.15)', borderRadius:20, padding:'5px 12px', color:'#fbbf24', fontSize:11, cursor:'pointer' }}>{q}</button>
                    ))}
                  </div>
                </div>
              )}
              {ichijoMsgs.map((msg,i) => (
                <div key={i} style={{ display:'flex', justifyContent:msg.role==='user'?'flex-end':'flex-start' }}>
                  {msg.role==='assistant' && <div style={{ width:26, height:26, borderRadius:7, background:'linear-gradient(135deg,#78350f,#d97706)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, marginRight:8, flexShrink:0, marginTop:3 }}>👤</div>}
                  <div style={{ maxWidth:'80%', padding:'10px 14px', borderRadius:msg.role==='user'?'11px 11px 3px 11px':'11px 11px 11px 3px', background:msg.role==='user'?'rgba(99,102,241,0.18)':'rgba(251,191,36,0.07)', border:msg.role==='user'?'1px solid rgba(99,102,241,0.28)':'1px solid rgba(251,191,36,0.13)', fontSize:12, lineHeight:1.8, color:'rgba(255,255,255,0.85)', whiteSpace:'pre-wrap' }}>{msg.content}</div>
                </div>
              ))}
              {ichijoLoading && <div style={{ display:'flex', alignItems:'center', gap:8 }}><div style={{ width:26, height:26, borderRadius:7, background:'linear-gradient(135deg,#78350f,#d97706)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>👤</div><div style={{ padding:'10px 14px', borderRadius:'11px 11px 11px 3px', background:'rgba(251,191,36,0.05)', border:'1px solid rgba(251,191,36,0.1)', fontSize:12, color:'rgba(255,255,255,0.35)' }}>考えています...</div></div>}
            </div>
            <div style={{ padding:'12px 18px', borderTop:'1px solid rgba(251,191,36,0.09)', display:'flex', gap:8 }}>
              <input value={ichijoInput} onChange={e=>setIchijoInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();askIchijo()}}} placeholder="一条先生に質問する..."
                style={{ flex:1, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(251,191,36,0.18)', borderRadius:8, padding:'10px 14px', color:'#fff', fontSize:12, outline:'none' }}/>
              <button onClick={askIchijo} disabled={ichijoLoading||!ichijoInput.trim()} style={{ background:ichijoInput.trim()?'linear-gradient(135deg,#d97706,#b45309)':'rgba(255,255,255,0.05)', border:'none', borderRadius:8, padding:'10px 16px', color:ichijoInput.trim()?'#fff':'rgba(255,255,255,0.18)', fontSize:13, fontWeight:700, cursor:ichijoInput.trim()?'pointer':'not-allowed' }}>送信</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
