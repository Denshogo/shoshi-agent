-- =============================================
-- Supabase セットアップ SQL
-- Supabase Dashboard > SQL Editor に貼り付けて実行
-- =============================================

-- 1. profiles テーブル（プラン・Stripe情報）
CREATE TABLE IF NOT EXISTS profiles (
  id                     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan                   TEXT CHECK (plan IN ('light','standard','premium')),
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  stripe_status          TEXT DEFAULT 'inactive',
  ichijo_count           INT DEFAULT 0,
  ichijo_reset_at        TIMESTAMPTZ,
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- 2. user_settings テーブル（試験日など）
CREATE TABLE IF NOT EXISTS user_settings (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_date  DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. reports テーブル（レポート履歴）
CREATE TABLE IF NOT EXISTS reports (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  text       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS reports_user_id_idx ON reports(user_id, created_at DESC);

-- 4. last_result テーブル（最新AI分析結果）
CREATE TABLE IF NOT EXISTS last_result (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  result_json JSONB,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RLS (Row Level Security) の設定
-- =============================================

ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports       ENABLE ROW LEVEL SECURITY;
ALTER TABLE last_result   ENABLE ROW LEVEL SECURITY;

-- profiles: 自分のデータのみ読み書き可能
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- user_settings: 自分のデータのみ
CREATE POLICY "settings_select" ON user_settings FOR SELECT USING (auth.uid() = id);
CREATE POLICY "settings_insert" ON user_settings FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "settings_update" ON user_settings FOR UPDATE USING (auth.uid() = id);

-- reports: 自分のデータのみ
CREATE POLICY "reports_select" ON reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reports_insert" ON reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reports_delete" ON reports FOR DELETE USING (auth.uid() = user_id);

-- last_result: 自分のデータのみ
CREATE POLICY "last_result_select" ON last_result FOR SELECT USING (auth.uid() = id);
CREATE POLICY "last_result_insert" ON last_result FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "last_result_update" ON last_result FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "last_result_upsert" ON last_result FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- Service Role 用ポリシー（Webhook が更新するため）
-- =============================================

-- profiles: Service Role は全操作可能
CREATE POLICY "profiles_service_upsert" ON profiles FOR ALL
  USING (true)
  WITH CHECK (true);
