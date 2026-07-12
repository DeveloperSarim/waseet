-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatarKey" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "notificationPrefs" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "website" TEXT;
