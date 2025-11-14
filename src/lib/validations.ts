import { z } from 'zod';

// Common validation patterns
const kenyanPhoneRegex = /^(?:\+254|254|0)[17]\d{8}$/;
const idNumberRegex = /^\d{6,8}$/;

// Auth validations
export const signInSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, { message: "Name must be at least 2 characters" }).max(100),
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Potential Riders validation
export const potentialRiderSchema = z.object({
  full_name: z.string().trim().min(2, { message: "Name must be at least 2 characters" }).max(100),
  id_number: z.string().trim().regex(idNumberRegex, { message: "ID number must be 6-8 digits" }),
  age: z.number().int().min(18, { message: "Rider must be at least 18 years old" }).max(100),
  postal_address: z.string().trim().min(5, { message: "Address must be at least 5 characters" }).max(200),
  primary_phone: z.string().trim().regex(kenyanPhoneRegex, { message: "Invalid Kenyan phone number" }),
  secondary_phone: z.string().trim().regex(kenyanPhoneRegex, { message: "Invalid Kenyan phone number" }).optional().or(z.literal('')),
  tertiary_phone: z.string().trim().regex(kenyanPhoneRegex, { message: "Invalid Kenyan phone number" }).optional().or(z.literal('')),
  introducer_name: z.string().trim().max(100).optional().or(z.literal('')),
  introducer_id: z.string().trim().max(20).optional().or(z.literal('')),
  introducer_phone: z.string().trim().regex(kenyanPhoneRegex, { message: "Invalid Kenyan phone number" }).optional().or(z.literal('')),
  introducer_residential_area: z.string().trim().max(200).optional().or(z.literal('')),
  introducer_previous_bike: z.string().trim().max(100).optional().or(z.literal('')),
  preferred_bike_make: z.string().trim().max(100).optional().or(z.literal('')),
  probable_financing_date: z.string().optional().or(z.literal('')),
});

// Financed Riders validation
export const financedRiderSchema = z.object({
  full_name: z.string().trim().min(2, { message: "Name must be at least 2 characters" }).max(100),
  id_number: z.string().trim().regex(idNumberRegex, { message: "ID number must be 6-8 digits" }),
  age: z.number().int().min(18, { message: "Rider must be at least 18 years old" }).max(100),
  postal_address: z.string().trim().min(5, { message: "Address must be at least 5 characters" }).max(200),
  primary_phone: z.string().trim().regex(kenyanPhoneRegex, { message: "Invalid Kenyan phone number" }),
  secondary_phone: z.string().trim().regex(kenyanPhoneRegex, { message: "Invalid Kenyan phone number" }).optional().or(z.literal('')),
  tertiary_phone: z.string().trim().regex(kenyanPhoneRegex, { message: "Invalid Kenyan phone number" }).optional().or(z.literal('')),
  residential_area: z.string().trim().min(2, { message: "Residential area is required" }).max(200),
  operation_slot: z.string().trim().min(2, { message: "Operation slot is required" }).max(100),
  next_of_kin_name: z.string().trim().min(2, { message: "Next of kin name is required" }).max(100),
  next_of_kin_phone: z.string().trim().regex(kenyanPhoneRegex, { message: "Invalid Kenyan phone number" }),
  next_of_kin_id: z.string().trim().min(1, { message: "Next of kin ID is required" }).max(20),
  next_of_kin_relationship: z.string().trim().min(2, { message: "Relationship is required" }).max(50),
  referee_name: z.string().trim().max(100).optional().or(z.literal('')),
  referee_id: z.string().trim().max(20).optional().or(z.literal('')),
  referee_phone: z.string().trim().regex(kenyanPhoneRegex, { message: "Invalid Kenyan phone number" }).optional().or(z.literal('')),
  bike_id: z.string().uuid({ message: "Please select a bike" }),
  start_date: z.string().min(1, { message: "Start date is required" }),
  daily_remittance: z.number().positive({ message: "Daily remittance must be positive" }).max(100000),
  operation_slot_cost: z.number().min(0).max(100000),
  total_investment: z.number().positive({ message: "Total investment must be positive" }).max(10000000),
  expected_operation_days: z.number().int().positive({ message: "Expected days must be positive" }).max(3650),
});

// Bikes validation
export const bikeSchema = z.object({
  make: z.string().trim().min(2, { message: "Make must be at least 2 characters" }).max(50),
  chassis_no: z.string().trim().min(5, { message: "Chassis number is required" }).max(50),
  engine_no: z.string().trim().min(5, { message: "Engine number is required" }).max(50),
  registration_no: z.string().trim().max(20).optional().or(z.literal('')),
  colour: z.string().trim().min(2, { message: "Colour is required" }).max(30),
  purchase_date: z.string().min(1, { message: "Purchase date is required" }),
  purchase_price: z.number().positive({ message: "Purchase price must be positive" }).max(10000000),
  status: z.enum(['available', 'financed', 'maintenance', 'sold']),
});

// Payments validation
export const paymentSchema = z.object({
  rider_id: z.string().uuid({ message: "Please select a rider" }),
  amount: z.number().positive({ message: "Amount must be positive" }).max(1000000),
  payment_date: z.string().min(1, { message: "Payment date is required" }),
  payment_method: z.enum(['mpesa', 'cash', 'bank_transfer', 'cheque']),
  transaction_reference: z.string().trim().max(100).optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

// Expenses validation
export const expenseSchema = z.object({
  category: z.enum(['fuel', 'maintenance', 'insurance', 'office', 'marketing', 'utilities', 'staff', 'other']),
  description: z.string().trim().min(5, { message: "Description must be at least 5 characters" }).max(200),
  amount: z.number().positive({ message: "Amount must be positive" }).max(10000000),
  expense_date: z.string().min(1, { message: "Expense date is required" }),
  reference_no: z.string().trim().max(50).optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

// SMS Notifications validation
export const smsSchema = z.object({
  rider_id: z.string().uuid({ message: "Please select a rider" }).optional().or(z.literal('')),
  recipient_phone: z.string().trim().regex(kenyanPhoneRegex, { message: "Invalid Kenyan phone number" }),
  message_type: z.enum(['payment_reminder', 'welcome', 'warning', 'general']),
  message: z.string().trim().min(10, { message: "Message must be at least 10 characters" }).max(160, { message: "SMS message cannot exceed 160 characters" }),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type PotentialRiderInput = z.infer<typeof potentialRiderSchema>;
export type FinancedRiderInput = z.infer<typeof financedRiderSchema>;
export type BikeInput = z.infer<typeof bikeSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type SmsInput = z.infer<typeof smsSchema>;
