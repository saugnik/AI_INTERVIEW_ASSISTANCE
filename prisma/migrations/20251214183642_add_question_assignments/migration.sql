-- CreateTable
CREATE TABLE "question_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_id" UUID NOT NULL,
    "student_email" TEXT NOT NULL,
    "assigned_by" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "question_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_assignments_student" ON "question_assignments"("student_email");

-- CreateIndex
CREATE INDEX "idx_assignments_question" ON "question_assignments"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_assignments_question_id_student_email_key" ON "question_assignments"("question_id", "student_email");

-- AddForeignKey
ALTER TABLE "question_assignments" ADD CONSTRAINT "question_assignments_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
