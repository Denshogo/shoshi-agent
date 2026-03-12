import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Success() {
  const router = useRouter()
  useEffect(() => {
    const t = setTimeout(() => router.push('/app'), 3000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#06070f,#0d1117)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Hiragino Sans',sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
        <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 10 }}>ご登録ありがとうございます！</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 24 }}>3秒後にアプリへ移動します...</p>
        <button onClick={() => router.push('/app')} style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 10, padding: '12px 28px', color: '#fff', fontSize: 14, fontWeight: 700 }}>
          今すぐアプリを開く →
        </button>
      </div>
    </div>
  )
}
