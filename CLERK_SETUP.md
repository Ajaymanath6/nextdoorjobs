# Clerk Authentication Setup

This application uses Clerk for Google SSO authentication alongside email/password authentication.

## Environment Variables Required

Add the following to your `.env.local` file:

```env
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Google OAuth (configured in Clerk dashboard)
# These are already configured in Clerk:
# - Client ID: 566888518892-t9ucs4u57njo5kdk1712nk9bbnaa4ip4.apps.googleusercontent.com
# - Client Secret: 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
# - Redirect URI: https://sincere-amoeba-87.clerk.accounts.dev/v1/oauth_callback
```

## Getting Your Clerk Keys

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **API Keys** section
4. Copy:
   - **Publishable Key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret Key** → `CLERK_SECRET_KEY`

## Google OAuth Setup in Clerk

1. In Clerk Dashboard, go to **User & Authentication** → **Social Connections**
2. Enable **Google**
3. Add the Google OAuth credentials:
   - Client ID: `566888518892-t9ucs4u57njo5kdk1712nk9bbnaa4ip4.apps.googleusercontent.com`
   - Client Secret: `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`
4. Set authorized redirect URI: `https://sincere-amoeba-87.clerk.accounts.dev/v1/oauth_callback`

## Database Migration

After updating the Prisma schema, run:

```bash
npx prisma migrate dev --name add_clerk_fields
```

Or if you prefer to push without migration:

```bash
npx prisma db push
```

## How It Works

1. **Google SSO**: Users click "Continue with Google" → Clerk handles OAuth → Callback syncs user to database
2. **Email/Password**: Users enter email/password → Creates account with password hash → Clerk session created
3. **Session Management**: Both methods create a session cookie for compatibility with existing auth system

## API Routes

- `/api/auth/callback/clerk` - Handles Clerk OAuth callback and syncs user to database
- `/api/auth/me` - Returns current user (supports both Clerk and cookie-based auth)
- `/api/auth/login` - Email/password login (existing)
- `/api/auth/register` - Email/password registration (existing)
