-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL,
    "start" TIMESTAMP(3),
    "complete" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectDir" TEXT NOT NULL,
    "profile" TEXT NOT NULL,
    "homeDir" TEXT NOT NULL,
    "workDir" TEXT NOT NULL,
    "container" TEXT,
    "commitId" TEXT,
    "errorMessage" TEXT,
    "repository" TEXT,
    "containerEngine" TEXT,
    "scriptFile" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "launchDir" TEXT NOT NULL,
    "runName" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "errorReport" TEXT,
    "scriptId" TEXT NOT NULL,
    "revision" TEXT,
    "exitStatus" INTEGER,
    "commandLine" TEXT NOT NULL,
    "stubRun" BOOLEAN NOT NULL,
    "nextflow" JSONB NOT NULL,
    "stats" JSONB,
    "resume" BOOLEAN NOT NULL,
    "success" BOOLEAN NOT NULL,
    "projectName" TEXT NOT NULL,
    "scriptName" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "params" JSONB NOT NULL,
    "configFiles" TEXT[],
    "configText" TEXT NOT NULL,
    "operationId" TEXT,
    "logFile" TEXT,
    "outFile" TEXT,
    "manifest" JSONB NOT NULL,
    "processNames" TEXT[],
    "metrics" JSONB[],
    "searchable" TEXT,
    "tags" TEXT[],
    "workspaceId" INTEGER,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Progress" (
    "id" TEXT NOT NULL,
    "pending" INTEGER NOT NULL,
    "ignored" INTEGER NOT NULL,
    "loadCpus" INTEGER NOT NULL,
    "loadMemory" BIGINT NOT NULL,
    "processes" JSONB[],
    "aborted" INTEGER NOT NULL,
    "succeeded" INTEGER NOT NULL,
    "peakMemory" BIGINT NOT NULL,
    "peakCpus" INTEGER NOT NULL,
    "failed" INTEGER NOT NULL,
    "running" INTEGER NOT NULL,
    "retries" INTEGER NOT NULL,
    "peakRunning" INTEGER NOT NULL,
    "cached" INTEGER NOT NULL,
    "submitted" INTEGER NOT NULL,
    "index" INTEGER,
    "name" TEXT,
    "stored" INTEGER,
    "terminated" BOOLEAN,
    "workflowId" TEXT NOT NULL,

    CONSTRAINT "Progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "workflowId" TEXT NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" SERIAL NOT NULL,
    "base_url" TEXT,
    "slack_webhook_url" TEXT,
    "slack_notification_events" TEXT[],
    "slack_notifications_enabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComputeEnvironment" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "orchestrator_endpoint" TEXT NOT NULL,
    "orchestrator_token" TEXT NOT NULL,
    "executor" TEXT NOT NULL,

    CONSTRAINT "ComputeEnvironment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pipeline" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "github_url" TEXT NOT NULL,
    "compute_overrides" JSONB,
    "run_params" JSONB,

    CONSTRAINT "Pipeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessKeys" (
    "id" SERIAL NOT NULL,
    "processKey" TEXT NOT NULL,
    "executor" TEXT NOT NULL,
    "runName" TEXT NOT NULL,
    "computeEnvironmentId" INTEGER,

    CONSTRAINT "ProcessKeys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Workflow_id_updatedAt_projectName_runName_userName_tags_wor_idx" ON "Workflow"("id", "updatedAt", "projectName", "runName", "userName", "tags", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_name_key" ON "Workspace"("name");

-- CreateIndex
CREATE INDEX "Workspace_id_idx" ON "Workspace" USING HASH ("id");

-- CreateIndex
CREATE UNIQUE INDEX "Progress_id_key" ON "Progress"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Progress_workflowId_key" ON "Progress"("workflowId");

-- CreateIndex
CREATE INDEX "Progress_id_workflowId_idx" ON "Progress"("id", "workflowId");

-- CreateIndex
CREATE INDEX "Task_taskId_workflowId_idx" ON "Task"("taskId", "workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "Task_workflowId_taskId_key" ON "Task"("workflowId", "taskId");

-- CreateIndex
CREATE UNIQUE INDEX "Pipeline_id_key" ON "Pipeline"("id");

-- CreateIndex
CREATE INDEX "ProcessKeys_runName_idx" ON "ProcessKeys"("runName");

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessKeys" ADD CONSTRAINT "ProcessKeys_computeEnvironmentId_fkey" FOREIGN KEY ("computeEnvironmentId") REFERENCES "ComputeEnvironment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateExtension pg_trgm
CREATE EXTENSION IF NOT EXISTS pg_trgm;