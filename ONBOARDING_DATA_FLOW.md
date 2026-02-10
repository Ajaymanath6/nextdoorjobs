# Onboarding & job posting – where data is stored

## When the user chooses “Post a gig” and completes the chat

1. **During the chat**  
   Each question from the bot and answer from the user is stored in the database (see tables below).

2. **When the bot says “Let me submit your job posting”**  
   That happens at the end of the flow. When the user clicks **“See your posting on the map”** (or the flow submits automatically), the app calls **handleFinalSubmit** in the onboarding UI, which:

   - **Creates a Company**  
     Sends all company details to `POST /api/onboarding/company` and creates one row in the **companies** table.

   - **Creates a Job position**  
     Sends job details to `POST /api/onboarding/job-position` and creates one row in the **job_positions** table.

   - **Links the onboarding session**  
     Calls `PATCH /api/onboarding/session` to set `companyId` and `jobPositionId` on the current **onboarding_sessions** row.

So **yes – a database record is created for that job posting** (and for the company), with all the details the user gave in the chat.

---

## Where it is stored (database tables)

| What | Table | Main fields |
|------|--------|-------------|
| **User** (from Clerk / email) | **users** | id, email, name, phone, clerk_id, avatar_url |
| **Company** (one per “post a gig” company) | **companies** | id, name, state, district, website_url, funding_series, latitude, longitude, pincode, user_id |
| **Job posting** (one per job) | **job_positions** | id, title, category, years_required, salary_min, salary_max, job_description, company_id |
| **One “Post a gig” run** | **onboarding_sessions** | id, user_id, created_at, completed_at, company_id, job_position_id |
| **Chat Q&A for that run** | **onboarding_conversations** | id, onboarding_session_id, step_key, question_text, answer_text, order_index |

Relations:

- **users** → many **companies** (user_id).
- **companies** → many **job_positions** (company_id).
- **users** → many **onboarding_sessions** (user_id).
- **onboarding_sessions** → one **company**, one **job_position** (when completed).
- **onboarding_sessions** → many **onboarding_conversations** (one row per Q&A pair).

---

## How to see it in the database

1. **Prisma Studio** (recommended for browsing):
   ```bash
   npx prisma studio
   ```
   Then open **companies**, **job_positions**, **onboarding_sessions**, **onboarding_conversations**, and **users**.

2. **SQL** (e.g. in your DB client or `psql`):
   - All job postings for a user (by email):
     ```sql
     SELECT jp.id, jp.title, jp.job_description, c.name AS company_name
     FROM job_positions jp
     JOIN companies c ON c.id = jp.company_id
     JOIN users u ON u.id = c.user_id
     WHERE u.email = 'user@example.com'
     ORDER BY jp.created_at DESC;
     ```
   - Last onboarding session and its company/job:
     ```sql
     SELECT s.id, s.user_id, s.company_id, s.job_position_id, s.created_at
     FROM onboarding_sessions s
     WHERE s.user_id = 1
     ORDER BY s.created_at DESC
     LIMIT 1;
     ```

3. **In the app**  
   On the onboarding chat screen, the **list icon** (next to the English dropdown) loads “Your job postings” from the current user’s **job_positions** (via their **companies**) and shows them in the chat (title + truncated description + 3-dots).

---

## Summary

- **Company and job posting** → stored in **companies** and **job_positions** when the user finishes the flow and the bot “submits” the job (e.g. when they click “See your posting on the map” or the flow auto-submits).
- **Chat answers** → stored in **onboarding_conversations** (and the run in **onboarding_sessions**) as the user goes through “Post a gig”.
- You can see everything in **Prisma Studio** or with SQL; the **list icon** in the chat shows the same user’s job postings inside the app.
