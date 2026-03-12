import { stripe } from '../../lib/stripe'
import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { userId } = req.body
  const { data: profile } = await supabase.from('profiles').select('stripe_customer_id').eq('id', userId).single()
  if (!profile?.stripe_customer_id) return res.status(400).json({ error: '顧客情報が見つかりません' })

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app`,
  })
  res.json({ url: session.url })
}
