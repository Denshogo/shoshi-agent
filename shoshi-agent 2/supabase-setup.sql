-- ① subscriptionsテーブル（Stripe連携）
create table public.subscriptions (
  user_id uuid references auth.users on delete cascade primary key,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text default 'light',
  status text default 'inactive',
  current_period_end timestamptz,
  updated_at timestamptz default now()
);

-- ② chat_logsテーブル（月間チャット回数カウント用）
create table public.chat_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now()
);

-- ③ RLS設定
alter table public.subscriptions enable row level security;
alter table public.chat_logs enable row level security;

create policy "own" on public.subscriptions for all using (auth.uid() = user_id);
create policy "own" on public.chat_logs for all using (auth.uid() = user_id);

-- ④ webhookからのupsertを許可（service_roleのみ）
create policy "service_role_all" on public.subscriptions for all to service_role using (true);
