ALTER TABLE "question_assignments" ADD COLUMN     "assignment_type" TEXT NOT NULL DEFAULT 'practice',
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'admin';

CREATE INDEX "idx_assignments_type" ON "question_assignments"("assignment_type");

CREATE INDEX "idx_assignments_source" ON "question_assignments"("source");
