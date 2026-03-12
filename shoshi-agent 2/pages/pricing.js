import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'

export default function Pricing() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/')
      else setUser(data.user)
    })
  }, [])

  const handleSelect = async (planKey) => {
    if (!user) return
    setLoading(planKey)
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planKey, userId: user.id, email: user.email })
    })
    const { url, error } = await res.json()
    if (error) { alert(error); setLoading(false); return }
    window.location.href = url
  }

  const plans = [
    { key:'light',    name:'ライト',    price:2980, col:'#6366f1', desc:'普段の学習管理に', features:['レポート送信・AI分析','スケジューラー9体','一条剛チャット 月10回','レポート保存 30件','模試 ¥4,980/回'] },
    { key:'standard', name:'スタンダード', price:4980, col:'#8b5cf6', popular:true, desc:'本格的に合格を目指す', features:['レポート送信・AI分析','スケジューラー9体','一条剛チャット 月30回','レポート保存 無制限','模試 ¥3,980/回','弱点論点抽出','復習カード自動登録'] },
    { key:'premium',  name:'プレミアム',  price:9800, col:'#f59e0b', desc:'最短合格を目指す', features:['レポート送信・AI分析','スケジューラー9体','一条剛チャット 無制限','レポート保存 無制限','本番レベルAI模試 毎月1回無料','弱点論点抽出','復習カード自動登録','次月計画への自動反映','成績分析ダッシュボード'] },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#06070f,#0d1117)', fontFamily:"'Hiragino Sans','Noto Sans JP',sans-serif", padding:'56px 24px 80px' }}>
      <div style={{ maxWidth:960, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:52 }}>
          <div style={{ fontSize:44, marginBottom:12 }}>⚖️</div>
          <h1 style={{ fontSize:26, fontWeight:800, color:'#fff', marginBottom:10 }}>プランを選んでください</h1>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)' }}>いつでもキャンセル・プラン変更可能です</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18 }}>
          {plans.map(plan => (
            <div key={plan.key} style={{ background: plan.popular?`${plan.col}0f`:'rgba(255,255,255,0.03)', border:`${plan.popular?2:1}px solid ${plan.popular?plan.col:'rgba(255,255,255,0.08)'}`, borderRadius:18, padding:28, position:'relative', display:'flex', flexDirection:'column' }}>
              {plan.popular && <div style={{ position:'absolute', top:-13, left:'50%', transform:'translateX(-50%)', background:plan.col, borderRadius:20, padding:'3px 14px', fontSize:11, fontWeight:700, color:'#fff', whiteSpace:'nowrap' }}>人気No.1</div>}
              <div style={{ marginBottom:'auto' }}>
                <div style={{ fontSize:11, color:plan.col, fontWeight:600, marginBottom:4 }}>{plan.desc}</div>
                <div style={{ fontSize:15, fontWeight:800, color:plan.col, marginBottom:4 }}>{plan.name}</div>
                <div style={{ fontSize:32, fontWeight:800, color:'#fff', marginBottom:20 }}>¥{plan.price.toLocaleString()}<span style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>/月</span></div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:24 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ fontSize:12, color:'rgba(255,255,255,0.65)', display:'flex', gap:7, alignItems:'flex-start' }}>
                      <span style={{ color:plan.col, flexShrink:0, marginTop:1 }}>✓</span>{f}
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => handleSelect(plan.key)} disabled={!!loading}
                style={{ width:'100%', padding:13, borderRadius:10, border:'none', background: plan.popular?`linear-gradient(135deg,${plan.col},#7c3aed)`:`${plan.col}20`, color: plan.popular?'#fff':plan.col, fontSize:14, fontWeight:700, cursor:loading?'not-allowed':'pointer', opacity:loading===plan.key?0.6:1, border: plan.popular?'none':`1px solid ${plan.col}40` }}>
                {loading===plan.key ? '処理中...' : `${plan.name}で始める →`}
              </button>
            </div>
          ))}
        </div>

        <div style={{ textAlign:'center', marginTop:32, fontSize:11, color:'rgba(255,255,255,0.25)' }}>
          クレジットカード決済（Stripe） | SSL暗号化 | いつでもキャンセル可能
        </div>
      </div>
    </div>
  )
}
