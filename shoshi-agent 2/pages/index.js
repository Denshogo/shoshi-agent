import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { PLANS } from '../lib/plans'
import { useRouter } from 'next/router'

const S = {
  page: { minHeight: '100vh', background: 'linear-gradient(160deg,#06070f,#0d1117,#070c14)' },
  nav: { padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 10, background: 'rgba(0,0,0,0.6)' },
  logo: { display: 'flex', alignItems: 'center', gap: 10 },
  hero: { textAlign: 'center', padding: '80px 24px 60px' },
  badge: { display: 'inline-block', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 20, padding: '4px 14px', fontSize: 12, color: '#a5b4fc', marginBottom: 20 },
  h1: { fontSize: 'clamp(28px,5vw,52px)', fontWeight: 900, lineHeight: 1.2, marginBottom: 18, letterSpacing: '-1px' },
  sub: { fontSize: 'clamp(14px,2vw,18px)', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, maxWidth: 580, margin: '0 auto 40px' },
  plans: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, maxWidth: 980, margin: '0 auto', padding: '0 24px 80px' },
  card: (col, popular) => ({
    background: popular ? `linear-gradient(160deg, ${col}15, rgba(0,0,0,0.4))` : 'rgba(255,255,255,0.03)',
    border: `1px solid ${popular ? col + '50' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 20, padding: 28, position: 'relative',
    transform: popular ? 'scale(1.03)' : 'none',
    boxShadow: popular ? `0 0 40px ${col}20` : 'none',
  }),
  tag: (col) => ({ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: col, borderRadius: 20, padding: '3px 14px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }),
  price: { fontSize: 38, fontWeight: 900, letterSpacing: '-1px' },
  btn: (col) => ({ width: '100%', padding: '13px', borderRadius: 11, border: 'none', background: `linear-gradient(135deg, ${col}, ${col}cc)`, color: '#fff', fontSize: 14, fontWeight: 700, marginTop: 20, transition: 'opacity 0.2s' }),
  feature: { display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 10, lineHeight: 1.5 },
  mockSection: { background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 16, maxWidth: 700, margin: '0 auto 80px', padding: '32px', textAlign: 'center' },
  faq: { maxWidth: 700, margin: '0 auto', padding: '0 24px 80px' },
}

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(null)

  const handlePlan = async (planId) => {
    setLoading(planId)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      router.push('/app')
    } else {
      router.push(`/auth?plan=${planId}`)
    }
    setLoading(null)
  }

  return (
    <div style={S.page}>
      {/* Nav */}
      <nav style={S.nav}>
        <div style={S.logo}>
          <span style={{ fontSize: 24 }}>⚖️</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>AI難関資格予備校</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>司法書士試験 秘書エージェント</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => router.push('/auth?mode=login')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 18px', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>ログイン</button>
          <button onClick={() => router.push('/auth?plan=light')} style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 8, padding: '8px 18px', color: '#fff', fontSize: 13, fontWeight: 700 }}>無料で始める</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={S.hero}>
        <div style={S.badge}>🤖 9体のAIエージェントが合格まで伴走する</div>
        <h1 style={S.h1}>
          司法書士試験に<br />
          <span style={{ background: 'linear-gradient(135deg,#6366f1,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>最短ルート</span>で合格する
        </h1>
        <p style={S.sub}>
          レポートを送るだけで、スケジューラー5体と日次プランナー4体が自動起動。<br />
          S・A・Bランク全論点をカバーした最適な学習計画を毎日更新します。
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 60 }}>
          {['全11科目 S/A/Bランク論点搭載', '9体マルチエージェント', '合否判定・進捗監視', '天才アドバイザー一条 剛'].map(t => (
            <span key={t} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '5px 14px', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div style={S.plans}>
        {Object.values(PLANS).map(plan => (
          <div key={plan.id} style={S.card(plan.color, plan.popular)}>
            {plan.popular && <div style={S.tag(plan.color)}>🏆 最もおすすめ</div>}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{plan.name}</div>
              <div style={S.price}>¥{plan.price.toLocaleString()}<span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>/月</span></div>
            </div>
            <div style={{ marginBottom: 8 }}>
              {plan.features.map((f, i) => (
                <div key={i} style={S.feature}>
                  <span style={{ color: plan.color, flexShrink: 0 }}>✓</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
            <button onClick={() => handlePlan(plan.id)} disabled={loading === plan.id} style={S.btn(plan.color)}>
              {loading === plan.id ? '処理中...' : `${plan.name}で始める →`}
            </button>
          </div>
        ))}
      </div>

      {/* Mock exam section */}
      <div style={S.mockSection}>
        <div style={{ fontSize: 28, marginBottom: 12 }}>📝</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: '#fbbf24' }}>本番レベルAI模試</h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, marginBottom: 16 }}>
          実際の試験形式に準拠したAI生成問題を受験。<br />受験後は即時に成績分析・弱点論点の抽出・復習カードへの自動登録まで。
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[
            { plan: 'ライト', price: '¥4,980/回' },
            { plan: 'スタンダード', price: '¥3,980/回' },
            { plan: 'プレミアム', price: '毎月1回無料 🎉' },
          ].map(({ plan, price }) => (
            <div key={plan} style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{plan}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>{price}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>
        © 2025 AI難関資格予備校 ｜ <span onClick={() => router.push('/auth?mode=login')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>ログイン</span>
      </div>
    </div>
  )
}
