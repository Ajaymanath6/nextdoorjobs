-- CreateTable
CREATE TABLE "job_applications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "job_position_id" INTEGER NOT NULL,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_applications_user_id_idx" ON "job_applications"("user_id");

-- CreateIndex
CREATE INDEX "job_applications_job_position_id_idx" ON "job_applications"("job_position_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_applications_user_id_job_position_id_key" ON "job_applications"("user_id", "job_position_id");

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_position_id_fkey" FOREIGN KEY ("job_position_id") REFERENCES "job_positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
