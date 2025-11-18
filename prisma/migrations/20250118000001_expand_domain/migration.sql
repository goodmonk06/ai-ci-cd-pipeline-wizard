-- AlterTable
ALTER TABLE "repo_profiles" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "repo_profiles" ADD COLUMN "tags" TEXT NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "pipeline_templates" ADD COLUMN "description" TEXT;
ALTER TABLE "pipeline_templates" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'ci-cd';
ALTER TABLE "pipeline_templates" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "pipeline_templates" ADD COLUMN "version" TEXT NOT NULL DEFAULT '1.0.0';
ALTER TABLE "pipeline_templates" ADD COLUMN "downloads" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "pipeline_templates" ADD COLUMN "rating" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "generation_jobs" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'completed';
ALTER TABLE "generation_jobs" ADD COLUMN "errorMessage" TEXT;
ALTER TABLE "generation_jobs" ADD COLUMN "durationMs" INTEGER;
ALTER TABLE "generation_jobs" ADD COLUMN "tokensUsed" INTEGER;

-- CreateTable
CREATE TABLE "config_presets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "framework" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "configJson" TEXT NOT NULL,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_presets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "repo_profiles_status_idx" ON "repo_profiles"("status");
CREATE INDEX "repo_profiles_framework_idx" ON "repo_profiles"("framework");

-- CreateIndex
CREATE INDEX "pipeline_templates_category_idx" ON "pipeline_templates"("category");
CREATE INDEX "pipeline_templates_provider_idx" ON "pipeline_templates"("provider");
CREATE INDEX "pipeline_templates_isPublic_idx" ON "pipeline_templates"("isPublic");

-- CreateIndex
CREATE INDEX "generation_jobs_status_idx" ON "generation_jobs"("status");
CREATE INDEX "generation_jobs_repoProfileId_idx" ON "generation_jobs"("repoProfileId");
CREATE INDEX "generation_jobs_createdAt_idx" ON "generation_jobs"("createdAt");

-- CreateIndex
CREATE INDEX "config_presets_framework_idx" ON "config_presets"("framework");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_entityType_idx" ON "audit_logs"("entityType");
CREATE INDEX "audit_logs_entityId_idx" ON "audit_logs"("entityId");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
