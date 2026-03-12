import { stripe } from '../../lib/stripe'
import { supabase } from '../../lib/supabase'

export const config = { api: { bodyParser: false } }

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const rawBody = await getRawBody(req)
  const sig = req.headers['stripe-signature']
  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (e) {
    return res.status(400).send('Webhook Error: ' + e.message)
  }

  const upsertSub = async (sub) => {
    const userId = sub.metadata?.userId
    if (!userId) return
    await supabase.from('subscriptions').upsert({
      user_id: userId,
      stripe_customer_id: sub.customer,
      stripe_subscription_id: sub.id,
      plan: sub.metadata?.planId || 'light',
      status: sub.status,
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    if (session.mode === 'subscription') {
      const sub = await stripe.subscriptions.retrieve(session.subscription)
      sub.metadata = { ...sub.metadata, userId: session.metadata.userId, planId: session.metadata.planId }
      await upsertSub(sub)
    }
  } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    await upsertSub(event.data.object)
  }

  res.json({ received: true })
}
