import Stripe from 'stripe'

import PrintObject from '../../components/PrintObject'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // https://github.com/stripe/stripe-node#configuration
  apiVersion: '2022-11-15'
})

export default async function ResultPage({
  searchParams
}: {
  searchParams: { session_id: string }
}): Promise<JSX.Element> {
  if (!searchParams.session_id)
    throw new Error('Please provide a valid session_id (`cs_test_...`)')

  const checkoutSession: Stripe.Checkout.Session =
    await stripe.checkout.sessions.retrieve(searchParams.session_id, {
      expand: ['line_items', 'payment_intent']
    })

  const payment_intent = checkoutSession.payment_intent as Stripe.PaymentIntent

  return (
    <>
      <h2>Status: {payment_intent.status}</h2>
      <h3>CheckoutSession response:</h3>
      <PrintObject content={checkoutSession} />
    </>
  )
}
