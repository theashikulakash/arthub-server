# ArtHub — Server (Backend API)

## Project Name
ArtHub — Online Art Marketplace (Express + MongoDB backend)

## Purpose
This is the REST API powering ArtHub, a marketplace connecting artists with buyers.
It handles authentication (JWT + social login upsert), role-based access (user / artist / admin),
artwork CRUD, comments (purchase-gated), Stripe payments for artwork purchases and subscription
tiers, and platform-wide analytics for the admin dashboard.

## Live URL
- API Base: `[Your deployed backend URL, e.g. https://arthub-server.onrender.com]`

## Key Features
- JWT authentication (email/password) + social login upsert endpoint for BetterAuth/Google
- Role-based route protection (`user`, `artist`, `admin`) via middleware
- Artwork CRUD with ownership checks
- Search, category + price filtering, sorting, and pagination on `/api/artworks`
- Purchase-gated comment system (only buyers can comment on artworks they purchased)
- Stripe Checkout for artwork purchases and subscription tier upgrades (Pro / Premium)
- Stripe webhook (raw body) + a `/verify/:sessionId` fallback endpoint for local dev
- Subscription tier purchase limits enforced server-side (Free: 3, Pro: 9, Premium: unlimited)
- Admin analytics endpoint (totals, revenue, sales by month, artworks by category)
- Centralized error handling + 404 handler so the API never throws unhandled CORS/500s

## npm Packages Used
- `express` — web framework
- `mongoose` — MongoDB Atlas ODM
- `jsonwebtoken` — JWT auth
- `bcryptjs` — password hashing
- `cors` — CORS handling for the deployed client
- `dotenv` — environment variable loading
- `morgan` — request logging
- `stripe` — payment processing
- `nodemon` (dev) — auto-restart during development

## Environment Variables
Copy `.env.example` to `.env` and fill in your own values:
```
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
CLIENT_URL=https://your-client-url.vercel.app
ADMIN_EMAIL=admin@arthub.com
ADMIN_PASSWORD=Admin@123
```

## Setup
```bash
npm install
npm run dev        # development (nodemon)
npm start           # production
node scripts/seedAdmin.js   # creates/resets the admin account from .env
```

## Admin Credentials (for grading)
- Email: `admin@arthub.com`
- Password: `Admin@123`

## Deployment Notes
- Deploy on Render / Railway / Vercel (serverless) — ensure `CLIENT_URL` matches your deployed
  frontend exactly so CORS does not block requests.
- Use the Stripe publishable key in the frontend client for checkout UI, and keep the secret key only on the backend.
- If you later enable Stripe webhooks, add the signed webhook secret to `STRIPE_WEBHOOK_SECRET` at that time.
- Whitelist your deployment's outbound IP (or `0.0.0.0/0` for simplicity) in MongoDB Atlas Network Access.
