-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('LIVE', 'PENDING', 'DRAFT', 'SOLD_OUT');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'VIEWING', 'NEGOTIATING', 'CLOSED', 'LOST');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "agency" TEXT,
ADD COLUMN     "bankCountry" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "experience" TEXT,
ADD COLUMN     "iban" TEXT,
ADD COLUMN     "idNumber" TEXT,
ADD COLUMN     "idType" TEXT,
ADD COLUMN     "languages" TEXT,
ADD COLUMN     "licenseExpiry" TEXT,
ADD COLUMN     "licenseNumber" TEXT,
ADD COLUMN     "licenseType" TEXT,
ADD COLUMN     "specialization" TEXT;

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "developerId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "developerName" TEXT NOT NULL,
    "city" TEXT,
    "country" TEXT,
    "type" TEXT,
    "bedrooms" TEXT,
    "priceFrom" INTEGER,
    "priceTo" INTEGER,
    "commissionPct" DOUBLE PRECISION NOT NULL DEFAULT 3,
    "status" "ProjectStatus" NOT NULL DEFAULT 'LIVE',
    "imageKey" TEXT,
    "location" TEXT,
    "mapLink" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_projects" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "realtorId" UUID NOT NULL,
    "projectId" UUID,
    "projectName" TEXT NOT NULL,
    "developerName" TEXT,
    "unit" TEXT,
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" UUID NOT NULL,
    "realtorId" UUID NOT NULL,
    "dealRef" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "developerName" TEXT,
    "unit" TEXT,
    "closedAt" TIMESTAMP(3),
    "gross" INTEGER NOT NULL,
    "platformPct" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "net" INTEGER NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_developerId_idx" ON "projects"("developerId");

-- CreateIndex
CREATE INDEX "saved_projects_userId_idx" ON "saved_projects"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "saved_projects_userId_projectId_key" ON "saved_projects"("userId", "projectId");

-- CreateIndex
CREATE INDEX "leads_realtorId_status_idx" ON "leads"("realtorId", "status");

-- CreateIndex
CREATE INDEX "commissions_realtorId_status_idx" ON "commissions"("realtorId", "status");

-- CreateIndex
CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_projects" ADD CONSTRAINT "saved_projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_projects" ADD CONSTRAINT "saved_projects_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_realtorId_fkey" FOREIGN KEY ("realtorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_realtorId_fkey" FOREIGN KEY ("realtorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
