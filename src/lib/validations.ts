import { z } from 'zod';
import { sanitizeText, sanitizeName, sanitizePhone, sanitizeDocumentNumber } from './sanitize';

// Auth validations with password leak check
const passwordBaseSchema = z.string()
  .min(8, { message: "Contraseña debe tener al menos 8 caracteres" })
  .max(100, { message: "Contraseña demasiado larga" })
  .regex(/[A-Z]/, { message: "Debe contener al menos una mayúscula" })
  .regex(/[a-z]/, { message: "Debe contener al menos una minúscula" })
  .regex(/[0-9]/, { message: "Debe contener al menos un número" });

export const authSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Email inválido" })
    .max(255, { message: "Email demasiado largo" }),
  password: passwordBaseSchema,
  fullName: z.string()
    .trim()
    .min(3, { message: "Nombre debe tener al menos 3 caracteres" })
    .max(100, { message: "Nombre demasiado largo" })
    .optional(),
  phone: z.string()
    .trim()
    .regex(/^\+?[0-9\s\-()]{7,20}$/, { message: "Teléfono inválido" })
    .optional(),
});

export const loginSchema = authSchema.omit({ fullName: true, phone: true });
export const signupSchema = authSchema;

// Remittance validations
export const remittanceSchema = z.object({
  emisor_nombre: z.string()
    .trim()
    .transform(sanitizeName)
    .pipe(z.string()
      .min(3, { message: "Nombre del emisor requerido" })
      .max(100, { message: "Nombre demasiado largo" })
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, { message: "Solo letras permitidas" })
    ),
  
  emisor_telefono: z.string()
    .trim()
    .transform(sanitizePhone)
    .pipe(z.string()
      .regex(/^(\+?1?\d{9,15}|[0-9\s\-()]{7,20})$/, { message: "Teléfono inválido" })
    )
    .optional()
    .or(z.literal('')),
  
  emisor_documento: z.string()
    .trim()
    .transform(sanitizeDocumentNumber)
    .pipe(z.string()
      .max(50, { message: "Documento demasiado largo" })
      .regex(/^[0-9-]+$/, { message: "Solo números y guiones" })
    )
    .optional()
    .or(z.literal('')),
  
  beneficiario_nombre: z.string()
    .trim()
    .transform(sanitizeName)
    .pipe(z.string()
      .min(3, { message: "Nombre del beneficiario requerido" })
      .max(100, { message: "Nombre demasiado largo" })
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, { message: "Solo letras permitidas" })
    ),
  
  beneficiario_telefono: z.string()
    .trim()
    .transform(sanitizePhone)
    .pipe(z.string()
      .regex(/^(\+509\s?)?[0-9\s\-()]{8,15}$/, { message: "Teléfono haitiano inválido" })
    ),
  
  beneficiario_documento: z.string()
    .trim()
    .transform(sanitizeDocumentNumber)
    .pipe(z.string()
      .max(50, { message: "Documento demasiado largo" })
    )
    .optional()
    .or(z.literal('')),
  
  principal_dop: z.number()
    .positive({ message: "Monto debe ser positivo" })
    .min(100, { message: "Monto mínimo: 100 DOP" })
    .max(1000000, { message: "Monto máximo: 1,000,000 DOP" }),
  
  payout_city: z.string()
    .trim()
    .transform(sanitizeText)
    .pipe(z.string()
      .max(100, { message: "Ciudad demasiado larga" })
    )
    .optional()
    .or(z.literal('')),
  
  channel: z.union([z.literal('MONCASH'), z.literal('SPIH')]),
});

// Fraud detection limits
export const FRAUD_LIMITS = {
  MAX_DAILY_TRANSACTIONS_PER_SENDER: 10,
  MAX_DAILY_AMOUNT_PER_SENDER_DOP: 500000, // 500k DOP
  MAX_MONTHLY_AMOUNT_PER_SENDER_DOP: 2000000, // 2M DOP
  MAX_TRANSACTIONS_SAME_BENEFICIARY_DAILY: 3,
  MIN_TIME_BETWEEN_TRANSACTIONS_MINUTES: 2,
  SUSPICIOUS_ROUND_AMOUNT_THRESHOLD: 50000, // amounts ending in 000
  MAX_VELOCITY_TRANSACTIONS_PER_HOUR: 5,
};

export type AuthFormData = z.infer<typeof authSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type RemittanceFormData = z.infer<typeof remittanceSchema>;
