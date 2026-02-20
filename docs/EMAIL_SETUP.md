# Email setup (MapMyGig message notifications)

Step-by-step guide to send notification emails (e.g. when a recruiter messages you) using Gmail SMTP.

---

## 1. Add SMTP variables to `.env.local`

1. Open (or create) the file **`.env.local`** in your project root (same folder as `package.json`).
2. Copy the **Email** block from **`.env.example`** into `.env.local`:

```env
# Email (optional - for recruiter/candidate message notifications)
# Use a transactional provider (SendGrid, Resend, Gmail SMTP). For Gmail: enable 2FA, create App Password.
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_app_password
SMTP_FROM=MapMyGig <noreply@yourdomain.com>
```

3. Replace the placeholder values with your real Gmail settings (see steps 2–4 below).  
   **Do not commit `.env.local`** — it is gitignored.

---

## 2. Enable 2-Step Verification (2FA) on your Gmail account

1. Go to [Google Account](https://myaccount.google.com/) and sign in with the Gmail address you want to use for sending.
2. Click **Security** in the left menu.
3. Under **How you sign in to Google**, click **2-Step Verification**.
4. Click **Get started** and follow the prompts (e.g. add your phone number and verify).
5. Finish until 2-Step Verification is **On**.

---

## 3. Create a Gmail App Password

1. In [Google Account → Security](https://myaccount.google.com/security), under **How you sign in to Google**, click **App passwords**.
   - If you don’t see **App passwords**, make sure 2-Step Verification is turned on (step 2).
2. At the bottom, click **Select app** → choose **Mail** (or **Other** and type e.g. “MapMyGig”).
3. Click **Select device** → choose **Other** and type e.g. “MapMyGig server”.
4. Click **Generate**.
5. Copy the **16-character password** (no spaces). You’ll use this as `SMTP_PASS` in step 4.

---

## 4. Set Gmail SMTP values in `.env.local`

In `.env.local`, set these variables (use the same Gmail address and the App Password from step 3):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.gmail@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM=MapMyGig <your.gmail@gmail.com>
```

- **SMTP_HOST**: `smtp.gmail.com`
- **SMTP_PORT**: `587`
- **SMTP_USER**: your full Gmail address (e.g. `you@gmail.com`)
- **SMTP_PASS**: the 16-character App Password (you can paste it with or without spaces; the app typically accepts both)
- **SMTP_FROM**: use the same Gmail address in the angle brackets, e.g. `MapMyGig <you@gmail.com>`

Save `.env.local`.

---

## 5. Restart the app

Restart your Next.js dev server (or redeploy) so it picks up the new env vars:

```bash
# If running locally, stop the server (Ctrl+C) then:
npm run dev
```

---

## 6. How recipients get the email

- Emails are sent **to the recipient’s email address** (the gig worker or recruiter you’re messaging).
- They will receive the notification on **whatever device they use for that email** (e.g. Gmail or Outlook on their phone).
- No extra setup is needed on the recipient’s side; they just need to use that email for MapMyGig and have email on their phone if they want notifications there.

---

## Troubleshooting

- **“Username and Password not accepted”**: Make sure you’re using an **App Password**, not your normal Gmail password, and that 2FA is on.
- **No emails sent**: Check the server console for errors; if SMTP vars are missing or wrong, the app logs that it’s skipping email.
- **Emails in spam**: Recipients may need to move the first message to Inbox or add the sender to contacts.
