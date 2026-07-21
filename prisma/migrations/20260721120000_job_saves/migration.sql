-- CreateTable
CREATE TABLE "job_saves" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "job_position_id" INTEGER NOT NULL,
    "saved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_saves_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_saves_user_id_idx" ON "job_saves"("user_id");

-- CreateIndex
CREATE INDEX "job_saves_job_position_id_idx" ON "job_saves"("job_position_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_saves_user_id_job_position_id_key" ON "job_saves"("user_id", "job_position_id");

-- AddForeignKey
ALTER TABLE "job_saves" ADD CONSTRAINT "job_saves_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_saves" ADD CONSTRAINT "job_saves_job_position_id_fkey" FOREIGN KEY ("job_position_id") REFERENCES "job_positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
