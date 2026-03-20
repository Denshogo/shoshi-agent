# 司法書士試験 AI秘書エージェント

## デプロイ手順

### STEP 1: このファイルをGitHubにアップ

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/あなたのID/shoshi-agent.git
git push -u origin main
```

### STEP 2: Supabase SQLを実行

Supabase Dashboard → SQL Editor → `supabase_setup.sql` の内容を貼り付けて実行

### STEP 3: Vercelにデプロイ

1. vercel.com → New Project → GitHubリポジトリを選択
2. Environment Variables に以下を設定：

| Key | Value |
|-----|-------|
| NEXT_PUBLIC_SUPABASE_URL | https://yierkydzcwryeqdyetzy.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | （Supabase の anon key） |
| SUPABASE_SERVICE_ROLE_KEY | （Supabase の service_role key） |
| STRIPE_SECRET_KEY | （Stripe の sk_live_... または sk_test_...） |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | （Stripe の pk_live_...） |
| STRIPE_WEBHOOK_SECRET | （後で設定） |
| NEXT_PUBLIC_PRICE_LIGHT | （Stripe の Price ID） |
| NEXT_PUBLIC_PRICE_STANDARD | （Stripe の Price ID） |
| NEXT_PUBLIC_PRICE_PREMIUM | （Stripe の Price ID） |
| NEXT_PUBLIC_PRICE_MOCK_LIGHT | （Stripe の Price ID） |
| NEXT_PUBLIC_PRICE_MOCK_STANDARD | （Stripe の Price ID） |
| ANTHROPIC_API_KEY | （Anthropic の API Key） |
| LLM_PROVIDER | `anthropic` など |
| LLM_MODEL_REASONING_TOP | 月次レポート用の最上位推論モデル |
| LLM_MODEL_REASONING | 日次/週次判断用の推論モデル |
| LLM_MODEL_STANDARD | 作問/レポート整理用の通常モデル |
| NEXT_PUBLIC_APP_URL | https://あなたのプロジェクト.vercel.app |

3. Deploy → URLが発行される

### STEP 4: StripeのWebhookを設定

Stripe Dashboard → Webhooks → Add endpoint
- URL: `https://あなたのURL.vercel.app/api/webhook`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Signing secret を `STRIPE_WEBHOOK_SECRET` に設定してVercelで再デプロイ

### STEP 5: StripeのURLを更新

Stripe Dashboard → ビジネスの詳細 → ウェブサイト → Vercel URL に変更

## APIルーティング

このリポジトリの API は Next.js の `pages/api` による file-based routing です。追加した API はファイル配置だけで有効になります。

- `POST /api/monthly-report/generate`
- `POST /api/daily-plan/generate`
- `POST /api/weekly-review/generate`
- `POST /api/question-prompt/generate`
- `POST /api/study-report-prompt/generate`
- `POST /api/study-report/submit`

## 起動と確認

```bash
npm install
npm run dev
```

起動後、別ターミナルから以下のように確認できます。

```bash
curl -X POST http://localhost:3000/api/monthly-report/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"user_123",
    "phase":"基礎固めフェーズ",
    "recentStudyReports":[{"date":"2026-03-20","text":"民法の代理でミスが多い"}],
    "recentWeakPoints":[{"subject":"民法","topic":"代理","note":"無権代理と相続"}],
    "availableHoursPerWeek":18,
    "targetExamYear":2026
  }'
```

`ANTHROPIC_API_KEY` が未設定でも、LLM 部分は mock fallback で応答します。
