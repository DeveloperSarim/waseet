import { z } from 'zod'

// No password at registration — a temp password is generated when the admin approves.
export const registerSchema = z.object({
  email: z.string().email().toLowerCase(),
  fullName: z.string().min(2).max(120), // realtor: person name · developer: company name
  phone: z.string().min(6).max(24).optional(),
  country: z.enum(['SA', 'AE', 'PK']).optional(),
  city: z.string().max(80).optional(),
  avatarKey: z.string().max(300).optional(),
  // developer company details captured at sign-up
  contactName: z.string().max(120).optional(),
  website: z.string().max(200).optional(),
  // realtor professional details captured at sign-up
  agency: z.string().max(160).optional(),
  specialization: z.string().max(200).optional(),
  languages: z.string().max(160).optional(),
  experience: z.string().max(80).optional(),
  licenseType: z.string().max(80).optional(),
  licenseNumber: z.string().max(80).optional(),
  licenseExpiry: z.string().max(40).optional(),
  idType: z.string().max(80).optional(),
  idNumber: z.string().max(80).optional(),
})

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
})

export const forgotSchema = z.object({
  email: z.string().email().toLowerCase(),
})

export const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, 'At least 8 characters').max(128),
})

export const updateMeSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  phone: z.string().min(6).max(24).optional(),
  country: z.enum(['SA', 'AE', 'PK']).optional(),
  city: z.string().max(80).optional(),
  companyName: z.string().max(160).optional(),
  contactName: z.string().max(120).optional(),
  website: z.string().max(200).optional(),
  bio: z.string().max(1000).optional(),
  agency: z.string().max(160).optional(),
  specialization: z.string().max(200).optional(),
  languages: z.string().max(160).optional(),
  experience: z.string().max(80).optional(),
  licenseType: z.string().max(80).optional(),
  licenseNumber: z.string().max(80).optional(),
  licenseExpiry: z.string().max(40).optional(),
  idType: z.string().max(80).optional(),
  idNumber: z.string().max(80).optional(),
  bankName: z.string().max(120).optional(),
  iban: z.string().max(60).optional(),
  bankCountry: z.string().max(60).optional(),
  notificationPrefs: z.record(z.any()).optional(),
}).refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' })

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'At least 8 characters').max(128),
})
