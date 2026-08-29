const Stripe = require('stripe');
const Artwork = require('../models/Artwork');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const TIER_PRICES = { pro: 9.99, premium: 19.99 };

// POST /api/payments/artwork-checkout  { artworkId }
const createArtworkCheckout = async (req, res) => {
  try {
    const { artworkId } = req.body;
    const artwork = await Artwork.findById(artworkId);
    if (!artwork) return res.status(404).json({ message: 'Artwork not found' });
    if (artwork.isSold) return res.status(400).json({ message: 'This artwork has already been sold' });
    if (artwork.artist.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot purchase your own artwork' });
    }

    const buyer = await User.findById(req.user._id);
    const maxPurchases = buyer.getMaxPurchases();
    if (buyer.purchaseCount >= maxPurchases) {
      return res.status(403).json({
        message: `You have reached your ${buyer.subscriptionTier} tier purchase limit. Please upgrade your subscription.`,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: artwork.title, images: [artwork.image] },
            unit_amount: Math.round(artwork.price * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'purchase',
        artworkId: artwork._id.toString(),
        buyerId: buyer._id.toString(),
      },
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/artwork/${artwork._id}`,
    });

    res.status(200).json({ url: session.url, id: session.id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create checkout session', error: error.message });
  }
};

// POST /api/payments/subscription-checkout { tier: 'pro' | 'premium' }
const createSubscriptionCheckout = async (req, res) => {
  try {
    const { tier } = req.body;
    if (!TIER_PRICES[tier]) return res.status(400).json({ message: 'Invalid subscription tier' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: `ArtHub ${tier[0].toUpperCase() + tier.slice(1)} Subscription` },
            unit_amount: Math.round(TIER_PRICES[tier] * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'subscription',
        tier,
        userId: req.user._id.toString(),
      },
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/dashboard/user`,
    });

    res.status(200).json({ url: session.url, id: session.id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create subscription checkout', error: error.message });
  }
};

// GET /api/payments/verify/:sessionId
// Called by the frontend success page as a fallback to webhook (useful in local dev without webhook forwarding)
const verifySession = async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    const existingTx = await Transaction.findOne({ stripeSessionId: session.id });
    if (existingTx) {
      return res.status(200).json({ message: 'Already processed', transaction: existingTx });
    }

    const result = await fulfillCheckout(session);
    res.status(200).json({ message: 'Payment verified and recorded', transaction: result });
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify session', error: error.message });
  }
};

// Shared fulfillment logic used by both webhook and verify-fallback
const fulfillCheckout = async (session) => {
  const { type } = session.metadata;

  if (type === 'purchase') {
    const { artworkId, buyerId } = session.metadata;
    const artwork = await Artwork.findById(artworkId);
    const buyer = await User.findById(buyerId);
    if (!artwork || !buyer) throw new Error('Artwork or buyer not found during fulfillment');

    artwork.isSold = true;
    artwork.isPublished = false;
    artwork.salesCount += 1;
    await artwork.save();

    buyer.purchaseCount += 1;
    await buyer.save();

    const transaction = await Transaction.create({
      type: 'purchase',
      user: buyer._id,
      userEmail: buyer.email,
      artwork: artwork._id,
      artworkTitle: artwork.title,
      artist: artwork.artist,
      artistName: artwork.artistName,
      amount: artwork.price,
      stripeSessionId: session.id,
      status: 'completed',
    });

    return transaction;
  }

  if (type === 'subscription') {
    const { tier, userId } = session.metadata;
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found during fulfillment');

    user.subscriptionTier = tier;
    await user.save();

    const transaction = await Transaction.create({
      type: 'subscription',
      user: user._id,
      userEmail: user.email,
      subscriptionTier: tier,
      amount: TIER_PRICES[tier],
      stripeSessionId: session.id,
      status: 'completed',
    });

    return transaction;
  }

  throw new Error(`Unknown checkout type: ${type}`);
};

// POST /api/payments/webhook  (raw body required — mounted before express.json() for this route)
const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn('STRIPE_WEBHOOK_SECRET is not configured; skipping Stripe webhook verification.');
    return res.status(200).json({ received: true, mode: 'publishable-key-project' });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    try {
      const existingTx = await Transaction.findOne({ stripeSessionId: session.id });
      if (!existingTx) {
        await fulfillCheckout(session);
      }
    } catch (err) {
      console.error('Fulfillment error:', err.message);
    }
  }

  res.status(200).json({ received: true });
};

module.exports = {
  createArtworkCheckout,
  createSubscriptionCheckout,
  verifySession,
  stripeWebhook,
};
