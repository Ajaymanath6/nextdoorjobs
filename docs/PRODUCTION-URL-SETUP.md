# Set production URL so email links use your domain

Email notifications (e.g. "View message") must point to your live site, not localhost. Follow these steps.

---

## Step 1: Choose your production URL

Use your real domain **with `https://`**, no trailing slash.

Examples:
- `https://mapmygig.com`
- `https://www.mapmygig.com`
- `https://your-app.vercel.app` (if you don’t use a custom domain yet)

---

## Step 2a: If you deploy on **Vercel**

1. Open [Vercel Dashboard](https://vercel.com/dashboard) and sign in.
2. Select your **project** (NextDoorJobs / mapmygig).
3. Go to **Settings** → **Environment Variables**.
4. Click **Add New** (or **Add**).
5. Set:
   - **Name:** `NEXT_PUBLIC_APP_URL`
   - **Value:** `https://mapmygig.com` (or your domain).
   - **Environment:** choose **Production** (and optionally Preview if you want).
6. Click **Save**.
7. **Redeploy** the app so the new variable is used:
   - Go to **Deployments**.
   - Open the **⋯** menu on the latest deployment → **Redeploy** (or push a new commit).

**Optional:** Vercel sets `VERCEL_URL` automatically. The app already falls back to `https://${VERCEL_URL}` if `NEXT_PUBLIC_APP_URL` is not set. For a **custom domain** (e.g. mapmygig.com), you should still set `NEXT_PUBLIC_APP_URL=https://mapmygig.com` so links use that domain.

---

## Step 2b: If you deploy elsewhere (Railway, Render, Docker, VPS, etc.)

1. In your hosting panel or server config, find where **environment variables** are set (e.g. Railway project variables, Render env, `docker run -e`, or a `.env` file on the server).
2. Add or edit:
   ```bash
   NEXT_PUBLIC_APP_URL=https://mapmygig.com
   ```
   Use your real domain with `https://`, no trailing slash.
3. Restart or redeploy the app so the new variable is loaded.

**Important:**  
- Do **not** commit `.env.production` or production secrets to git.  
- Prefer setting env vars in the hosting dashboard or CI/CD, not in the repo.

---

## Step 3: Confirm

1. Deploy with the new variable.
2. Trigger an action that sends an email (e.g. send a message so a notification email goes out).
3. In the email, click **View message** (or similar).  
   The link should open **your domain** (e.g. `https://mapmygig.com/...`), not `http://localhost:3000`.

---

## Local development

Keep using localhost locally. In `.env.local` you can leave:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

or omit it; the code falls back to `http://localhost:3000` in dev. Production should always set `NEXT_PUBLIC_APP_URL` to your live URL.
