import { stripe } from '../../lib/stripe'
import { PLANS } from '../../lib/plans'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { planId, userId, email } = req.body
  const plan = PLANS[planId]
  if (!plan) return res.status(400).json({ error: 'Invalid plan' })
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price: plan.priceId, quantity: 1 }],
      metadata: { userId, planId },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?canceled=1`,
      locale: 'ja',
    })
    res.json({ url: session.url })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
