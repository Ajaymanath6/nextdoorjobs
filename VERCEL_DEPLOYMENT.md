# Vercel deployment checklist

If you see **500 errors** after deploying, set these in Vercel:

**Project → Settings → Environment Variables** (for Production, and optionally Preview):

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (e.g. Neon). Use for Build and Runtime. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key (starts with `pk_live_` for production). |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key (starts with `sk_live_`). Never expose in client. |
| `NEXT_PUBLIC_CLERK_JS_URL` | No | If you see "Failed to load Clerk, failed to load script: https://clerk.*/npm/..." set this to `https://unpkg.com/@clerk/clerk-js@5/dist/clerk.browser.js` so the script loads from CDN. |
| `NEXT_PUBLIC_CLERK_PROXY_URL` or `NEXT_PUBLIC_APP_URL` | For custom domain | If you see "Network error at https://clerk.*/v1/client/..." set `NEXT_PUBLIC_CLERK_PROXY_URL` to your app URL + `/__clerk` (e.g. `https://your-app.vercel.app/__clerk`) or set `NEXT_PUBLIC_APP_URL` (e.g. `https://your-app.vercel.app`). Then in **Clerk Dashboard → Domains → Frontend API → Advanced**, set Proxy URL to the same (e.g. `https://your-app.vercel.app/__clerk`). |

After adding or changing env vars, **redeploy** (Deployments → … → Redeploy).

**Check the real error:** Vercel → your project → Deployments → click the deployment → **Functions** tab, or **Runtime Logs**, to see which route returned 500 and the stack trace.

---

**"Automatic publicPath is not supported in this browser"**  
This usually comes from a **browser extension** (e.g. `content.js`), not from your app. Try opening the site in an incognito/private window or with extensions disabled to confirm.
