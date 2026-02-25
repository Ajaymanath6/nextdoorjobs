# Vercel: Admin environment variables (step-by-step)

To use the **admin area** (`/admin`) in production on Vercel, add these variables in the Vercel dashboard.

## Steps

1. **Open your project on Vercel**  
   Go to [vercel.com](https://vercel.com) → your team → select the **NextDoorJobs** (or your app) project.

2. **Open Environment Variables**  
   Click **Settings** (top) → in the left sidebar click **Environment Variables**.

3. **Add each variable below**  
   For each variable:
   - Click **Add New** (or **Add**).
   - Enter **Key** (name) and **Value**.
   - Choose **Environment**: tick **Production** (and **Preview** if you want admin on preview deployments).
   - Click **Save**.

### Admin-related variables (add these)

| Key | Value | Notes |
|-----|--------|--------|
| `ADMIN_OWNER_USER_ID` | `36` | Use the id from `npm run db:seed-admin-owner` (or use `ADMIN_OWNER_EMAIL` instead). |
| **or** `ADMIN_OWNER_EMAIL` | `admin-owner@internal` | If you prefer email lookup instead of ID. |
| `ADMIN_USERNAME` | Your admin login username | e.g. `admin`. |
| `ADMIN_PASSWORD` | Strong password | Use a **new** strong password for production (not the same as local). |
| `ADMIN_SESSION_SECRET` | Long random string | e.g. run `openssl rand -hex 24` and paste the result. Use a **new** secret for production. |

### Other variables you need for the app (if not already set)

- `DATABASE_URL` – Production Postgres URL (e.g. Neon pooled connection string).
- `NEXT_PUBLIC_APP_URL` – Your production URL, e.g. `https://yourdomain.com`.
- Clerk, SMTP, Razorpay, etc. as in `.env.example`.

4. **Redeploy**  
   After saving variables, trigger a new deployment (e.g. **Deployments** → **...** on latest → **Redeploy**) so the new env vars are applied.

5. **Run the seed in production (once)**  
   The admin-owner user must exist in the **production** DB. Either:
   - Run `npm run db:seed-admin-owner` locally with `DATABASE_URL` set to your **production** DB (temporarily in `.env.local`), then set it back to dev; or  
   - Use a one-off script or Vercel’s run command against the production DB; or  
   - If your production DB was migrated from dev and already has the admin-owner user (id 36), you only need to set `ADMIN_OWNER_USER_ID=36` (or `ADMIN_OWNER_EMAIL=admin-owner@internal`) in Vercel.

6. **Sign in**  
   Open `https://yourdomain.com/admin` and sign in with `ADMIN_USERNAME` and `ADMIN_PASSWORD`.

## Summary checklist

- [ ] `ADMIN_OWNER_USER_ID=36` **or** `ADMIN_OWNER_EMAIL=admin-owner@internal`
- [ ] `ADMIN_USERNAME` = your chosen admin username
- [ ] `ADMIN_PASSWORD` = strong production-only password
- [ ] `ADMIN_SESSION_SECRET` = new random string (e.g. `openssl rand -hex 24`)
- [ ] Production DB has the admin-owner user (run seed against prod DB once if needed)
- [ ] Redeploy after adding variables
- [ ] Test login at `https://yourdomain.com/admin`
