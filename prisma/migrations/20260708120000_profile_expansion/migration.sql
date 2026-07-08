-- Profile expansion migration (applied via prisma db push)
-- Enums: SkillProficiency, EmploymentType, WorkMode, LanguageProficiency, JobLookingFor, NoticePeriod, Gender

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "home_pincode" VARCHAR(10);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "gender" "Gender";
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "date_of_birth" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "willing_to_relocate" BOOLEAN;

ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "resume_last_uploaded_at" TIMESTAMP(3);
ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "professional_headline" VARCHAR(255);
ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "about_me" TEXT;
ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "salary_currency" VARCHAR(10) DEFAULT 'INR';
ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "salary_negotiable" BOOLEAN;
ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "hourly_rate" VARCHAR(100);
ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "daily_rate" VARCHAR(100);
ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "project_rate" VARCHAR(100);
ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "looking_for" "JobLookingFor"[] DEFAULT ARRAY[]::"JobLookingFor"[];
ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "preferred_job_role" VARCHAR(255);
ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "preferred_industry" VARCHAR(255);
ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "work_mode" "WorkMode";
ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "notice_period" "NoticePeriod";
ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "notice_period_custom" VARCHAR(50);
ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "linkedin_url" VARCHAR(500);
ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "github_url" VARCHAR(500);
ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "portfolio_url" VARCHAR(500);
ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "behance_url" VARCHAR(500);
ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "dribbble_url" VARCHAR(500);
ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "other_links" TEXT;

ALTER TABLE "resume_work_experiences" ADD COLUMN IF NOT EXISTS "responsibilities" TEXT;
ALTER TABLE "resume_work_experiences" ADD COLUMN IF NOT EXISTS "key_achievements" TEXT;
ALTER TABLE "resume_work_experiences" ADD COLUMN IF NOT EXISTS "start_date" VARCHAR(10);
ALTER TABLE "resume_work_experiences" ADD COLUMN IF NOT EXISTS "end_date" VARCHAR(10);
ALTER TABLE "resume_work_experiences" ADD COLUMN IF NOT EXISTS "is_current" BOOLEAN DEFAULT false;
ALTER TABLE "resume_work_experiences" ADD COLUMN IF NOT EXISTS "employment_type" "EmploymentType";

ALTER TABLE "resume_educations" ADD COLUMN IF NOT EXISTS "degree" VARCHAR(255);
ALTER TABLE "resume_educations" ADD COLUMN IF NOT EXISTS "specialization" VARCHAR(255);
ALTER TABLE "resume_educations" ADD COLUMN IF NOT EXISTS "start_year" VARCHAR(10);
ALTER TABLE "resume_educations" ADD COLUMN IF NOT EXISTS "end_year" VARCHAR(10);

CREATE TABLE IF NOT EXISTS "resume_skills" (
  "id" SERIAL PRIMARY KEY,
  "resume_id" INTEGER NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "proficiency" "SkillProficiency" NOT NULL DEFAULT 'Intermediate',
  "order_index" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "resume_skills_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "resume_certifications" (
  "id" SERIAL PRIMARY KEY,
  "resume_id" INTEGER NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "issuing_org" VARCHAR(255),
  "year" VARCHAR(10),
  "certificate_url" VARCHAR(500),
  "order_index" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "resume_certifications_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "resume_languages" (
  "id" SERIAL PRIMARY KEY,
  "resume_id" INTEGER NOT NULL,
  "language" VARCHAR(100) NOT NULL,
  "proficiency" "LanguageProficiency" NOT NULL DEFAULT 'Intermediate',
  "order_index" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "resume_languages_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE
);
