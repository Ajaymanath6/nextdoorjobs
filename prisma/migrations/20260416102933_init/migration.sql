-- CreateEnum
CREATE TYPE "FundingSeries" AS ENUM ('Seed', 'SeriesA', 'SeriesB', 'SeriesC', 'SeriesD', 'SeriesE', 'IPO', 'Bootstrapped');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('Company', 'Individual');

-- CreateEnum
CREATE TYPE "JobCategory" AS ENUM ('EngineeringSoftwareQA', 'DataScienceAnalytics', 'UXDesignArchitecture', 'HumanResources', 'ProjectProgramManagement', 'ProductManagement', 'EngineeringHardwareNetworks', 'QualityAssurance', 'FinanceAccounting', 'ITInformationSecurity', 'MarketingCommunication', 'SalesBusinessDevelopment', 'AdministrationFacilities', 'CustomerSuccessServiceOperations', 'Consulting', 'ContentEditorialJournalism', 'LegalRegulatory', 'ResearchDevelopment', 'StrategicTopManagement', 'MobileDevelopment', 'GraphicDesign', 'SEO', 'DevOpsCloud', 'SupportCustomerCare', 'EducationTraining', 'HealthcareLifeSciences', 'SupplyChainLogistics', 'BusinessOperations', 'GrowthPartnerships', 'TechnicalWriting', 'BrandCreative', 'SAP', 'SAPDeveloper', 'SAPUXDesigner', 'SAPCustomerSupport', 'SAPBusinessDevelopment', 'SAPConsultant', 'SAPIntegration', 'SAPAnalytics', 'MotionDesigner', 'Animation');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MESSAGE', 'SYSTEM');

-- CreateTable
CREATE TABLE "pincodes" (
    "id" SERIAL NOT NULL,
    "pincode" VARCHAR(10) NOT NULL,
    "locality_name" VARCHAR(255) NOT NULL,
    "district" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pincodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_titles" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_titles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colleges" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "pincode" VARCHAR(10) NOT NULL,
    "locality" VARCHAR(255),
    "district" VARCHAR(100),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "colleges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "phone_visible_to_recruiters" BOOLEAN DEFAULT false,
    "password_hash" VARCHAR(255),
    "clerk_id" VARCHAR(255),
    "avatar_url" VARCHAR(500),
    "avatar_id" VARCHAR(50),
    "account_type" "AccountType",
    "home_latitude" DOUBLE PRECISION,
    "home_longitude" DOUBLE PRECISION,
    "home_locality" VARCHAR(255),
    "home_district" VARCHAR(100),
    "home_state" VARCHAR(100),
    "is_job_seeker" BOOLEAN DEFAULT false,
    "job_seeker_skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "job_seeker_experience" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "logoPath" VARCHAR(500),
    "website_url" VARCHAR(500),
    "fundingSeries" "FundingSeries",
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "state" VARCHAR(100) NOT NULL,
    "district" VARCHAR(100) NOT NULL,
    "pincode" VARCHAR(10),
    "userId" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_positions" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "category" "JobCategory" NOT NULL,
    "yearsRequired" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "salary_min" INTEGER,
    "salary_max" INTEGER,
    "jobDescription" TEXT NOT NULL,
    "remote_type" VARCHAR(50),
    "assist_relocation" BOOLEAN DEFAULT false,
    "seniority_level" VARCHAR(50),
    "team_size" VARCHAR(50),
    "perks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "holidays" TEXT,
    "application_url" VARCHAR(512),
    "companyId" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "extension_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3),
    "auto_deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_sessions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "company_id" INTEGER,
    "job_position_id" INTEGER,

    CONSTRAINT "onboarding_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_conversations" (
    "id" SERIAL NOT NULL,
    "onboarding_session_id" INTEGER NOT NULL,
    "step_key" VARCHAR(100) NOT NULL,
    "question_text" TEXT NOT NULL,
    "answer_text" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "onboarding_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gigs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "service_type" VARCHAR(100) NOT NULL,
    "expected_salary" VARCHAR(100),
    "experience_with_gig" VARCHAR(255),
    "customers_till_date" INTEGER,
    "state" VARCHAR(100) NOT NULL,
    "district" VARCHAR(100) NOT NULL,
    "pincode" VARCHAR(10),
    "locality" VARCHAR(255),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "instagram_link" VARCHAR(512),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gigs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gig_portfolio_images" (
    "id" SERIAL NOT NULL,
    "gig_id" INTEGER NOT NULL,
    "image_url" VARCHAR(1024) NOT NULL,
    "caption" VARCHAR(500),
    "order_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "gig_portfolio_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gig_reviews" (
    "id" SERIAL NOT NULL,
    "gig_id" INTEGER NOT NULL,
    "reviewer_user_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gig_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gig_requests" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "deadline" TIMESTAMP(3),
    "location" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gig_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "resume_file_path" VARCHAR(500),
    "first_name" VARCHAR(255),
    "last_name" VARCHAR(255),
    "email_override" VARCHAR(255),
    "current_position" VARCHAR(255),
    "years_experience" VARCHAR(50),
    "expected_salary_package" VARCHAR(100),
    "current_salary_package" VARCHAR(100),
    "current_salary_visible_to_recruiter" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_work_experiences" (
    "id" SERIAL NOT NULL,
    "resume_id" INTEGER NOT NULL,
    "company_name" VARCHAR(255),
    "company_url" VARCHAR(500),
    "position" VARCHAR(255),
    "duties" TEXT,
    "year" VARCHAR(20),
    "order_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "resume_work_experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_educations" (
    "id" SERIAL NOT NULL,
    "resume_id" INTEGER NOT NULL,
    "university_name" VARCHAR(255),
    "stream_name" VARCHAR(255),
    "marks_or_score" VARCHAR(100),
    "year_of_passing" VARCHAR(20),
    "order_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "resume_educations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" SERIAL NOT NULL,
    "recruiter_id" INTEGER NOT NULL,
    "candidate_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "body_encrypted" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "conversation_id" INTEGER,
    "sender_id" INTEGER,
    "sender_name" VARCHAR(255),
    "sender_email" VARCHAR(255),
    "sender_org_name" VARCHAR(255),
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_karma" (
    "id" SERIAL NOT NULL,
    "candidate_user_id" INTEGER NOT NULL,
    "email_clicks" INTEGER NOT NULL DEFAULT 0,
    "chat_clicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "candidate_karma_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pincodes_pincode_key" ON "pincodes"("pincode");

-- CreateIndex
CREATE INDEX "pincodes_state_idx" ON "pincodes"("state");

-- CreateIndex
CREATE INDEX "pincodes_district_idx" ON "pincodes"("district");

-- CreateIndex
CREATE UNIQUE INDEX "job_titles_title_key" ON "job_titles"("title");

-- CreateIndex
CREATE INDEX "job_titles_category_idx" ON "job_titles"("category");

-- CreateIndex
CREATE UNIQUE INDEX "colleges_name_key" ON "colleges"("name");

-- CreateIndex
CREATE INDEX "colleges_name_idx" ON "colleges"("name");

-- CreateIndex
CREATE INDEX "colleges_pincode_idx" ON "colleges"("pincode");

-- CreateIndex
CREATE INDEX "colleges_locality_idx" ON "colleges"("locality");

-- CreateIndex
CREATE INDEX "colleges_district_idx" ON "colleges"("district");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_clerk_id_key" ON "users"("clerk_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_clerk_id_idx" ON "users"("clerk_id");

-- CreateIndex
CREATE INDEX "users_account_type_idx" ON "users"("account_type");

-- CreateIndex
CREATE INDEX "users_is_job_seeker_idx" ON "users"("is_job_seeker");

-- CreateIndex
CREATE INDEX "companies_name_idx" ON "companies"("name");

-- CreateIndex
CREATE INDEX "companies_state_idx" ON "companies"("state");

-- CreateIndex
CREATE INDEX "companies_district_idx" ON "companies"("district");

-- CreateIndex
CREATE INDEX "companies_userId_idx" ON "companies"("userId");

-- CreateIndex
CREATE INDEX "job_positions_category_idx" ON "job_positions"("category");

-- CreateIndex
CREATE INDEX "job_positions_companyId_idx" ON "job_positions"("companyId");

-- CreateIndex
CREATE INDEX "job_positions_is_active_idx" ON "job_positions"("is_active");

-- CreateIndex
CREATE INDEX "onboarding_sessions_userId_idx" ON "onboarding_sessions"("userId");

-- CreateIndex
CREATE INDEX "onboarding_sessions_created_at_idx" ON "onboarding_sessions"("created_at");

-- CreateIndex
CREATE INDEX "onboarding_conversations_onboarding_session_id_idx" ON "onboarding_conversations"("onboarding_session_id");

-- CreateIndex
CREATE INDEX "onboarding_conversations_onboarding_session_id_order_index_idx" ON "onboarding_conversations"("onboarding_session_id", "order_index");

-- CreateIndex
CREATE INDEX "gigs_user_id_idx" ON "gigs"("user_id");

-- CreateIndex
CREATE INDEX "gigs_state_idx" ON "gigs"("state");

-- CreateIndex
CREATE INDEX "gigs_district_idx" ON "gigs"("district");

-- CreateIndex
CREATE INDEX "gigs_pincode_idx" ON "gigs"("pincode");

-- CreateIndex
CREATE INDEX "gig_portfolio_images_gig_id_idx" ON "gig_portfolio_images"("gig_id");

-- CreateIndex
CREATE INDEX "gig_reviews_gig_id_idx" ON "gig_reviews"("gig_id");

-- CreateIndex
CREATE INDEX "gig_reviews_reviewer_user_id_idx" ON "gig_reviews"("reviewer_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "gig_reviews_gig_id_reviewer_user_id_key" ON "gig_reviews"("gig_id", "reviewer_user_id");

-- CreateIndex
CREATE INDEX "gig_requests_user_id_idx" ON "gig_requests"("user_id");

-- CreateIndex
CREATE INDEX "gig_requests_category_idx" ON "gig_requests"("category");

-- CreateIndex
CREATE UNIQUE INDEX "resumes_user_id_key" ON "resumes"("user_id");

-- CreateIndex
CREATE INDEX "resume_work_experiences_resume_id_idx" ON "resume_work_experiences"("resume_id");

-- CreateIndex
CREATE INDEX "resume_educations_resume_id_idx" ON "resume_educations"("resume_id");

-- CreateIndex
CREATE INDEX "conversations_recruiter_id_idx" ON "conversations"("recruiter_id");

-- CreateIndex
CREATE INDEX "conversations_candidate_id_idx" ON "conversations"("candidate_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_recruiter_id_candidate_id_key" ON "conversations"("recruiter_id", "candidate_id");

-- CreateIndex
CREATE INDEX "chat_messages_conversation_id_idx" ON "chat_messages"("conversation_id");

-- CreateIndex
CREATE INDEX "chat_messages_sender_id_idx" ON "chat_messages"("sender_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_conversation_id_idx" ON "notifications"("conversation_id");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_karma_candidate_user_id_key" ON "candidate_karma"("candidate_user_id");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_positions" ADD CONSTRAINT "job_positions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_sessions" ADD CONSTRAINT "onboarding_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_sessions" ADD CONSTRAINT "onboarding_sessions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_sessions" ADD CONSTRAINT "onboarding_sessions_job_position_id_fkey" FOREIGN KEY ("job_position_id") REFERENCES "job_positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_conversations" ADD CONSTRAINT "onboarding_conversations_onboarding_session_id_fkey" FOREIGN KEY ("onboarding_session_id") REFERENCES "onboarding_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gigs" ADD CONSTRAINT "gigs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gig_portfolio_images" ADD CONSTRAINT "gig_portfolio_images_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "gigs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gig_reviews" ADD CONSTRAINT "gig_reviews_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "gigs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gig_reviews" ADD CONSTRAINT "gig_reviews_reviewer_user_id_fkey" FOREIGN KEY ("reviewer_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gig_requests" ADD CONSTRAINT "gig_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_work_experiences" ADD CONSTRAINT "resume_work_experiences_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_educations" ADD CONSTRAINT "resume_educations_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_recruiter_id_fkey" FOREIGN KEY ("recruiter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_karma" ADD CONSTRAINT "candidate_karma_candidate_user_id_fkey" FOREIGN KEY ("candidate_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
