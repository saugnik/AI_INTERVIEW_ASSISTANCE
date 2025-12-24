CREATE TABLE "attempt_test_results" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "test_case_id" UUID NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "stdout" TEXT,
    "stderr" TEXT,
    "execution_time_ms" INTEGER,

    CONSTRAINT "attempt_test_results_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "attempts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "language" TEXT,
    "submission" TEXT NOT NULL,
    "score" DECIMAL(5,4),
    "feedback" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attempts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auth_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "google_id" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "picture" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "password_hash" TEXT,
    "auth_provider" TEXT DEFAULT 'google',

    CONSTRAINT "auth_users_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "domain" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "constraints" JSONB,
    "examples" JSONB,
    "reference_solution" TEXT,
    "starter_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_cases" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "stdin" TEXT NOT NULL,
    "stdout" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attempt_test_results_attempt_id_idx" ON "attempt_test_results"("attempt_id");

-- CreateIndex
CREATE INDEX "attempt_test_results_test_case_id_idx" ON "attempt_test_results"("test_case_id");

-- CreateIndex
CREATE INDEX "attempts_created_at_idx" ON "attempts"("created_at");

-- CreateIndex
CREATE INDEX "attempts_question_id_idx" ON "attempts"("question_id");

-- CreateIndex
CREATE INDEX "attempts_user_id_idx" ON "attempts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_users_google_id_key" ON "auth_users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_users_email_key" ON "auth_users"("email");

-- CreateIndex
CREATE INDEX "idx_auth_users_email" ON "auth_users"("email");

-- CreateIndex
CREATE INDEX "idx_auth_users_google_id" ON "auth_users"("google_id");

-- CreateIndex
CREATE INDEX "idx_auth_users_provider" ON "auth_users"("auth_provider");

-- CreateIndex
CREATE INDEX "test_cases_question_id_idx" ON "test_cases"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "attempt_test_results" ADD CONSTRAINT "attempt_test_results_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_test_results" ADD CONSTRAINT "attempt_test_results_test_case_id_fkey" FOREIGN KEY ("test_case_id") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
