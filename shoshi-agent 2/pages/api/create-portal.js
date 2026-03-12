import { stripe } from '../../lib/stripe'
import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { userId } = req.body
  const { data } = await supabase.from('subscriptions').select('stripe_customer_id').eq('user_id', userId).single()
  if (!data?.stripe_customer_id) return res.status(400).json({ error: 'No customer' })
  const session = await stripe.billingPortal.sessions.create({
    customer: data.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app`,
  })
  res.json({ url: session.url })
}
