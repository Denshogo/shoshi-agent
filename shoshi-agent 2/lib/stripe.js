export const PLANS = {
  light:    { name: 'ライトプラン',      price: 2980, priceId: process.env.NEXT_PUBLIC_PRICE_LIGHT,    mockPrice: 4980, mockPriceId: process.env.NEXT_PUBLIC_PRICE_MOCK_LIGHT,    ichijoLimit: 10,   reportLimit: 30   },
  standard: { name: 'スタンダードプラン', price: 4980, priceId: process.env.NEXT_PUBLIC_PRICE_STANDARD, mockPrice: 3980, mockPriceId: process.env.NEXT_PUBLIC_PRICE_MOCK_STANDARD, ichijoLimit: 30,   reportLimit: 9999 },
  premium:  { name: 'プレミアムプラン',   price: 9800, priceId: process.env.NEXT_PUBLIC_PRICE_PREMIUM,  mockPrice: 0,    mockPriceId: null,                                          ichijoLimit: 9999, reportLimit: 9999 },
}

export function getStripe() {
  const Stripe = require('stripe')
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}
