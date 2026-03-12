import { stripe, PLANS } from '../../lib/stripe'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { planKey, userId, email } = req.body
  const plan = PLANS[planKey]
  if (!plan) return res.status(400).json({ error: '無効なプランです' })

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: plan.priceId, quantity: 1 }],
      customer_email: email,
      metadata: { userId, planKey },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
      cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    })
    res.json({ url: session.url })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
