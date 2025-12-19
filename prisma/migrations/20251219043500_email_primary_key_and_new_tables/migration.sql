/*
  Warnings:

  - The primary key for the `admin_codes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `attempt_test_results` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `attempts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `user_id` on the `attempts` table. All the data in the column will be lost.
  - The primary key for the `auth_users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `auth_users` table. All the data in the column will be lost.
  - The primary key for the `question_assignments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `questions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `test_cases` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `student_email` to the `attempts` table without a default value. This is not possible if the table is not empty.
  - Made the column `created_at` on table `auth_users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `last_login_at` on table `auth_users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "attempt_test_results" DROP CONSTRAINT "attempt_test_results_attempt_id_fkey";

-- DropForeignKey
ALTER TABLE "attempt_test_results" DROP CONSTRAINT "attempt_test_results_test_case_id_fkey";

-- DropForeignKey
ALTER TABLE "attempts" DROP CONSTRAINT "attempts_question_id_fkey";

-- DropForeignKey
ALTER TABLE "attempts" DROP CONSTRAINT "attempts_user_id_fkey";

-- DropForeignKey
ALTER TABLE "question_assignments" DROP CONSTRAINT "question_assignments_question_id_fkey";

-- DropForeignKey
ALTER TABLE "test_cases" DROP CONSTRAINT "test_cases_question_id_fkey";

-- DropIndex
DROP INDEX "attempts_user_id_idx";

-- DropIndex
DROP INDEX "auth_users_email_key";

-- DropIndex
DROP INDEX "idx_auth_users_email";

-- DropIndex
DROP INDEX "idx_auth_users_provider";

-- AlterTable
ALTER TABLE "admin_codes" DROP CONSTRAINT "admin_codes_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "admin_codes_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "attempt_test_results" DROP CONSTRAINT "attempt_test_results_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "attempt_id" SET DATA TYPE TEXT,
ALTER COLUMN "test_case_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "attempt_test_results_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "attempts" DROP CONSTRAINT "attempts_pkey",
DROP COLUMN "user_id",
ADD COLUMN     "student_email" TEXT NOT NULL,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "question_id" SET DATA TYPE TEXT,
ALTER COLUMN "language" SET DEFAULT 'javascript',
ADD CONSTRAINT "attempts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "auth_users" DROP CONSTRAINT "auth_users_pkey",
DROP COLUMN "id",
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "last_login_at" SET NOT NULL,
ALTER COLUMN "last_login_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "role" SET DEFAULT 'student',
ADD CONSTRAINT "auth_users_pkey" PRIMARY KEY ("email");

-- AlterTable
ALTER TABLE "question_assignments" DROP CONSTRAINT "question_assignments_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "question_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "question_assignments_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "questions" DROP CONSTRAINT "questions_pkey",
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'admin',
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "questions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "test_cases" DROP CONSTRAINT "test_cases_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "question_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "test_cases_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "users";

-- CreateTable
CREATE TABLE "question_hints" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "hint_text" TEXT NOT NULL,
    "hint_level" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_hints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_rankings" (
    "student_email" TEXT NOT NULL,
    "total_score" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "questions_solved" INTEGER NOT NULL DEFAULT 0,
    "avg_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_rankings_pkey" PRIMARY KEY ("student_email")
);

-- CreateTable
CREATE TABLE "student_levels" (
    "student_email" TEXT NOT NULL,
    "current_level" INTEGER NOT NULL DEFAULT 1,
    "xp_points" INTEGER NOT NULL DEFAULT 0,
    "next_level_xp" INTEGER NOT NULL DEFAULT 100,
    "badges" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_levels_pkey" PRIMARY KEY ("student_email")
);

-- CreateTable
CREATE TABLE "solved_questions" (
    "id" TEXT NOT NULL,
    "student_email" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "solved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "solved_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "question_hints_question_id_idx" ON "question_hints"("question_id");

-- CreateIndex
CREATE INDEX "question_hints_hint_level_idx" ON "question_hints"("hint_level");

-- CreateIndex
CREATE INDEX "student_rankings_rank_idx" ON "student_rankings"("rank");

-- CreateIndex
CREATE INDEX "student_rankings_total_score_idx" ON "student_rankings"("total_score");

-- CreateIndex
CREATE INDEX "student_levels_current_level_idx" ON "student_levels"("current_level");

-- CreateIndex
CREATE INDEX "student_levels_xp_points_idx" ON "student_levels"("xp_points");

-- CreateIndex
CREATE INDEX "solved_questions_student_email_idx" ON "solved_questions"("student_email");

-- CreateIndex
CREATE INDEX "solved_questions_question_id_idx" ON "solved_questions"("question_id");

-- CreateIndex
CREATE INDEX "solved_questions_solved_at_idx" ON "solved_questions"("solved_at");

-- CreateIndex
CREATE UNIQUE INDEX "solved_questions_student_email_question_id_key" ON "solved_questions"("student_email", "question_id");

-- CreateIndex
CREATE INDEX "attempts_student_email_idx" ON "attempts"("student_email");

-- CreateIndex
CREATE INDEX "questions_domain_idx" ON "questions"("domain");

-- CreateIndex
CREATE INDEX "questions_difficulty_idx" ON "questions"("difficulty");

-- CreateIndex
CREATE INDEX "questions_source_idx" ON "questions"("source");

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_hints" ADD CONSTRAINT "question_hints_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_assignments" ADD CONSTRAINT "question_assignments_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_assignments" ADD CONSTRAINT "question_assignments_student_email_fkey" FOREIGN KEY ("student_email") REFERENCES "auth_users"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_student_email_fkey" FOREIGN KEY ("student_email") REFERENCES "auth_users"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_test_results" ADD CONSTRAINT "attempt_test_results_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_test_results" ADD CONSTRAINT "attempt_test_results_test_case_id_fkey" FOREIGN KEY ("test_case_id") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_rankings" ADD CONSTRAINT "student_rankings_student_email_fkey" FOREIGN KEY ("student_email") REFERENCES "auth_users"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_levels" ADD CONSTRAINT "student_levels_student_email_fkey" FOREIGN KEY ("student_email") REFERENCES "auth_users"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solved_questions" ADD CONSTRAINT "solved_questions_student_email_fkey" FOREIGN KEY ("student_email") REFERENCES "auth_users"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solved_questions" ADD CONSTRAINT "solved_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_admin_codes_active" RENAME TO "admin_codes_is_active_idx";

-- RenameIndex
ALTER INDEX "idx_admin_codes_code" RENAME TO "admin_codes_code_idx";

-- RenameIndex
ALTER INDEX "idx_auth_users_google_id" RENAME TO "auth_users_google_id_idx";

-- RenameIndex
ALTER INDEX "idx_auth_users_role" RENAME TO "auth_users_role_idx";

-- RenameIndex
ALTER INDEX "idx_assignments_question" RENAME TO "question_assignments_question_id_idx";

-- RenameIndex
ALTER INDEX "idx_assignments_source" RENAME TO "question_assignments_source_idx";

-- RenameIndex
ALTER INDEX "idx_assignments_student" RENAME TO "question_assignments_student_email_idx";

-- RenameIndex
ALTER INDEX "idx_assignments_type" RENAME TO "question_assignments_assignment_type_idx";
