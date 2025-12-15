-- CreateTable
CREATE TABLE "admin_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "used_by" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "admin_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_codes_code_key" ON "admin_codes"("code");

-- CreateIndex
CREATE INDEX "idx_admin_codes_code" ON "admin_codes"("code");

-- CreateIndex
CREATE INDEX "idx_admin_codes_active" ON "admin_codes"("is_active");
