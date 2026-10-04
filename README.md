# Sharp Fitness Full-Stack Website

A React + Vite / Express / Sequelize / PostgreSQL site based on the original Sharp Fitness landing page, with Stripe-backed paid access and a private trainer/client portal.

## What changed for the personalized coaching workflow

- Cody has a trainer/admin role and `/trainer` dashboard.
- Client accounts show only files assigned to that client.
- Cody can upload videos, PDFs, Word docs, spreadsheets, images, etc. to a paid client.
- Uploads go directly from Cody's browser to private S3 storage through a short-lived signed URL, so large videos do not pass through the Render server.
- Clients receive only short-lived signed viewing/download links and must be logged in with an active paid purchase.
- Consultation requests are saved in PostgreSQL before email is attempted, so a mail failure cannot lose the lead.
- New consultation requests appear in Cody's trainer dashboard and can also send a Resend email notification.

## Local setup

```bash
npm install
cp backend/.env.example backend/.env
npm run db:migrate
npm run ensure:trainer
```

Run in two terminals:

```bash
npm run dev:backend
npm run dev:frontend
```

Frontend: `http://localhost:3000`  
Backend: `http://localhost:8000`

## Trainer account

Set `TRAINER_PASSWORD` in `backend/.env` locally and in Render for production. The production startup script runs `ensure:trainer`, which creates or upgrades `TRAINER_EMAIL` as the trainer account.

Never commit the real trainer password.

## Private uploads (S3)

Set:

- `S3_BUCKET`
- `S3_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

The bucket should remain private. The application uses signed PUT URLs for uploads and signed GET URLs for client access.

Because browser uploads go directly to S3, the S3 bucket needs CORS allowing your local/production site origins for `PUT` and the `Content-Type` header. A minimal AWS S3 CORS example is:

```json
[
  {
    "AllowedHeaders": ["Content-Type"],
    "AllowedMethods": ["PUT"],
    "AllowedOrigins": ["http://localhost:3000", "https://YOUR-RENDER-DOMAIN.onrender.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

Do not make the bucket public.

## Consultation emails

The consultation form POSTs to `/api/contact`. Every request is stored in `ContactRequests` first. Then the backend attempts a notification through Resend.

Configure:

- `RESEND_API_KEY` — API key created in Resend
- `RESEND_FROM` — sender address, for example `Sharp Fitness <notifications@yourdomain.com>`
- `CONTACT_NOTIFICATION_TO` — Cody's notification address (defaults to `codysharp011@outlook.com`)

No Outlook password is required. If Resend is not configured or sending fails, the lead still remains visible in `/trainer` and the dashboard shows that email delivery did not occur. For production, verify a domain in Resend and use an address on that domain for `RESEND_FROM`.

## Stripe

Set:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Stripe webhooks activate purchases/subscriptions and therefore client access.

## Render

`render.yaml` provisions the web service and PostgreSQL database and prompts for secrets. It also requires storage/Resend settings before private file uploads and email notifications work.


## Access / entitlement rules

Sharp Fitness uses **delivery entitlement** rather than deleting access when someone stops paying:

- **$20 one-time program:** personalized 16-week program. Cody can add new private material for 112 days after the completed purchase. Every video/document delivered during that period remains in the client's account permanently.
- **$100/month online coaching:** Cody can add new private material while the Stripe subscription is active. When the subscription ends, no new coaching material can be added under that subscription, but everything already delivered remains available permanently.
- **$200/month 1-on-1 coaching:** same retention rule as online coaching: monthly billing controls ongoing service/new material, not access to prior material.
- A `ClientFile` is therefore a permanent client entitlement once assigned. File access checks ownership, not current subscription status.

This distinction is important: **stopping payment ends future service, not the client's historical library.**
