-- CreateTable
CREATE TABLE "video_explanations" (
    "id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "student_email" TEXT NOT NULL,
    "explanation_text" TEXT NOT NULL,
    "video_url" TEXT,
    "video_provider" TEXT NOT NULL DEFAULT 'heygen',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "video_explanations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_explanation_requests" (
    "id" TEXT NOT NULL,
    "student_email" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_explanation_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "video_explanations_attempt_id_key" ON "video_explanations"("attempt_id");

-- CreateIndex
CREATE INDEX "video_explanations_attempt_id_idx" ON "video_explanations"("attempt_id");

-- CreateIndex
CREATE INDEX "video_explanations_student_email_idx" ON "video_explanations"("student_email");

-- CreateIndex
CREATE INDEX "video_explanations_status_idx" ON "video_explanations"("status");

-- CreateIndex
CREATE INDEX "video_explanation_requests_student_email_idx" ON "video_explanation_requests"("student_email");

-- CreateIndex
CREATE INDEX "video_explanation_requests_requested_at_idx" ON "video_explanation_requests"("requested_at");
