-- CreateIndex
CREATE INDEX "job_matches_jobId_idx" ON "public"."job_matches"("jobId");

-- CreateIndex
CREATE INDEX "job_matches_resumeId_idx" ON "public"."job_matches"("resumeId");

-- CreateIndex
CREATE INDEX "job_matches_overallMatchScore_idx" ON "public"."job_matches"("overallMatchScore");

-- CreateIndex
CREATE INDEX "job_matches_skillsMatchScore_idx" ON "public"."job_matches"("skillsMatchScore");

-- CreateIndex
CREATE INDEX "job_matches_experienceMatchScore_idx" ON "public"."job_matches"("experienceMatchScore");

-- CreateIndex
CREATE INDEX "job_matches_matchedAt_idx" ON "public"."job_matches"("matchedAt");

-- CreateIndex
CREATE INDEX "jobs_title_idx" ON "public"."jobs"("title");

-- CreateIndex
CREATE INDEX "jobs_skills_idx" ON "public"."jobs"("skills");

-- CreateIndex
CREATE INDEX "jobs_experience_idx" ON "public"."jobs"("experience");

-- CreateIndex
CREATE INDEX "jobs_education_idx" ON "public"."jobs"("education");

-- CreateIndex
CREATE INDEX "jobs_location_idx" ON "public"."jobs"("location");

-- CreateIndex
CREATE INDEX "jobs_createdAt_idx" ON "public"."jobs"("createdAt");

-- CreateIndex
CREATE INDEX "jobs_updatedAt_idx" ON "public"."jobs"("updatedAt");

-- CreateIndex
CREATE INDEX "resumes_userId_idx" ON "public"."resumes"("userId");

-- CreateIndex
CREATE INDEX "resumes_parseStatus_idx" ON "public"."resumes"("parseStatus");

-- CreateIndex
CREATE INDEX "resumes_uploadedAt_idx" ON "public"."resumes"("uploadedAt");

-- CreateIndex
CREATE INDEX "resumes_experience_idx" ON "public"."resumes"("experience");

-- CreateIndex
CREATE INDEX "resumes_skills_idx" ON "public"."resumes"("skills");

-- CreateIndex
CREATE INDEX "resumes_name_idx" ON "public"."resumes"("name");

-- CreateIndex
CREATE INDEX "resumes_email_idx" ON "public"."resumes"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "public"."users"("role");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "public"."users"("createdAt");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");
