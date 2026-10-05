# Sharp Fitness

Production full-stack website and client management platform built for **Sharp Fitness**, a personal training business offering online coaching, personalized workout and nutrition programs, and one-on-one coaching.

**Live Site:** https://sharpfitness.live/

> This is a real client project built and deployed for production use.

---

## Overview

Sharp Fitness combines a public-facing business website with a secure trainer/client platform.

Clients can create accounts, purchase coaching services, manage recurring billing, and access personalized training content from their dashboard.

The trainer can manage clients, review consultation requests, and securely deliver program-specific videos, documents, spreadsheets, images, and other resources.

The application also synchronizes subscription state with Stripe so access to ongoing coaching services reflects the customer's current billing status.

---

## Tech Stack

### Frontend

- React
- Vite
- Redux
- React Router
- HTML
- CSS

### Backend

- Node.js
- Express
- Sequelize
- PostgreSQL

### Services / Infrastructure

- Stripe
- AWS S3
- Resend
- Render
- Docker

---

## Key Features

### Client Accounts

- Secure account registration and authentication
- Personalized client dashboard
- Purchase and coaching history
- Access to trainer-assigned files and program materials
- Previously delivered content remains available after coaching ends

### Trainer Dashboard

- Dedicated trainer/admin account
- View registered clients
- Review active and canceled coaching programs
- View consultation requests
- Upload personalized files to eligible clients
- Select which active program an upload belongs to
- Prevent new uploads to canceled or expired subscriptions

### Stripe Billing

- Stripe Checkout integration
- One-time purchases
- Recurring monthly subscriptions
- Stripe Customer Portal
- Payment method management
- Invoice history
- Subscription cancellation
- Cancellation-at-period-end support
- Billing-period and access-end dates displayed in the client dashboard
- Stripe webhook synchronization
- Support for subscriptions created directly inside Stripe
- Automatic matching of Stripe customers to website accounts

### Subscription Synchronization

The application does not rely exclusively on checkout events.

Stripe subscriptions are also reconciled against local application data so subscriptions created or modified directly through Stripe can still appear correctly inside the client's account.

Webhook events and account reconciliation keep local purchase records synchronized with Stripe subscription state.

---

## Content Access Model

Sharp Fitness separates **ongoing service eligibility** from **ownership of previously delivered content**.

For recurring coaching subscriptions:

- Active subscriptions allow the trainer to deliver new personalized content.
- A subscription scheduled for cancellation remains active until the paid billing period ends.
- Once the subscription ends, the trainer can no longer upload new content under that program.
- Files delivered before cancellation remain available to the client.

For the one-time personalized program:

- The trainer can deliver new program material during the configured delivery period.
- Previously delivered files remain available permanently.

A `ClientFile` therefore represents content already delivered to a specific client rather than access that disappears when billing ends.

---

## Private File Delivery

Personalized client files are stored in a private S3 bucket.

Uploads are sent directly from the trainer's browser to S3 using short-lived signed PUT URLs. Large files therefore do not need to pass through the application server.

Clients receive short-lived signed GET URLs when accessing files from their account.

The S3 bucket remains private.

Typical supported content includes:

- Videos
- PDFs
- Word documents
- Spreadsheets
- Images
- Other program resources

---

## Consultation Requests

Visitors can submit consultation requests through the public website.

Requests are stored in PostgreSQL before the application attempts to send a notification email.

This ensures a temporary email-provider failure does not cause a lead to be lost.

Consultation requests remain visible inside the trainer dashboard even when email delivery fails.

Email notifications are handled through Resend.

---

## Security

Production credentials are provided through environment variables and are not stored in the repository.

Sensitive configuration includes:

- Stripe secret keys
- Stripe webhook secrets
- Database credentials
- AWS credentials
- S3 configuration
- Resend API credentials
- Trainer account password
- JWT signing secret

The repository ignores local environment files and development databases.

```gitignore
.env
backend/.env
*.sqlite
*.sqlite3
```

Never commit production credentials.

---

## Local Development

### Requirements

- Node.js
- npm

Clone the repository and install dependencies:

```bash
npm install
```

Create the backend environment file:

```bash
cp backend/.env.example backend/.env
```

Run database migrations:

```bash
npm run db:migrate
```

Seed the available programs:

```bash
npm --prefix backend run seed:products
```

Create or update the trainer account:

```bash
npm run ensure:trainer
```

Start the backend:

```bash
npm run dev:backend
```

Start the frontend in a second terminal:

```bash
npm run dev:frontend
```

Frontend:

```text
http://localhost:3000
```

Backend:

```text
http://localhost:8000
```

---

## Environment Configuration

Example configuration is available in:

```text
backend/.env.example
```

### Application

```env
NODE_ENV=development
PORT=8000
JWT_SECRET=
DATABASE_URL=
```

### Trainer Account

```env
TRAINER_EMAIL=trainer@example.com
TRAINER_PASSWORD=
TRAINER_FIRST_NAME=
TRAINER_LAST_NAME=
```

### Stripe

```env
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### S3

```env
S3_BUCKET=
S3_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

Optional S3-compatible storage settings:

```env
S3_ENDPOINT=
S3_FORCE_PATH_STYLE=false
```

### Email Notifications

```env
RESEND_API_KEY=
RESEND_FROM=
CONTACT_NOTIFICATION_TO=
```

---

## Stripe Webhooks

Stripe webhooks are used to synchronize checkout and subscription events with application access.

Handled subscription workflows include:

- Checkout completion
- Subscription creation
- Subscription updates
- Subscription cancellation
- Billing-state changes

During local development, Stripe CLI can forward webhook events to:

```text
http://localhost:8000/api/stripe/webhook
```

---

## S3 CORS

Because uploads are sent directly from the browser to S3, the bucket must allow the frontend origin to perform `PUT` requests.

Example:

```json
[
  {
    "AllowedHeaders": ["Content-Type"],
    "AllowedMethods": ["PUT"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://sharpfitness.live"
    ],
    "ExposeHeaders": ["ETag"]
  }
]
```

The bucket itself should remain private.

---

## Deployment

The application is deployed using Render.

`render.yaml` defines the production web service and PostgreSQL database while sensitive values are configured separately as environment variables.

Production deployment includes:

- Docker-based application build
- PostgreSQL database
- Automatic deployment from GitHub
- Stripe webhook integration
- Private S3 file storage
- Resend email notifications

---

## Production Testing

The application has been tested across the complete subscription and content-delivery lifecycle, including:

- Website account creation
- One-time purchases
- Monthly subscriptions
- Stripe Checkout
- Stripe Customer Portal access
- Payment method management
- Subscription cancellation
- Cancellation at the end of a billing period
- Billing and access-end dates
- Subscription renewal/re-purchase
- Multiple programs on a single account
- Subscriptions created directly in Stripe
- Stripe-to-website subscription synchronization
- Trainer upload eligibility
- Blocking uploads to canceled subscriptions
- Permanent access to previously delivered materials
- Production deployment

---

## Portfolio / Client Project

Sharp Fitness is a production client project developed for Sharp Fitness.

This repository is publicly available for portfolio and professional review purposes.

Sharp Fitness branding, photography, logos, and other business assets remain the property of their respective owner.

No license is granted for reuse of those assets.

---

## Author

**Brendan Fosse**

Full-Stack Web Developer

- GitHub: https://github.com/goonkiloz
- LinkedIn: https://www.linkedin.com/in/brendan-fosse-b502b121a/
- Portfolio: https://goonkiloz.github.io/