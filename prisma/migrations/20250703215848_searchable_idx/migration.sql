-- CreateIndex
CREATE INDEX "searchable_idx" ON "Workflow" USING GIN ("searchable" gin_trgm_ops);
