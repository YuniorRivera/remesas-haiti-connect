/**
 * Input sanitization utilities to prevent XSS and injection attacks
 */

/**
 * Sanitizes HTML by removing dangerous tags and attributes
 * For user-generated content that might contain HTML
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  
  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^s>]*/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '');
  
  return sanitized;
}

/**
 * Sanitizes plain text by removing all HTML tags
 * Use for text-only fields
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  
  // Remove all HTML tags
  return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Sanitizes filename to prevent directory traversal
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return '';
  
  // Remove directory traversal attempts
  let sanitized = filename.replace(/\.\.\//g, '');
  
  // Remove path separators
  sanitized = sanitized.replace(/[\/\\]/g, '');
  
  // Keep only safe characters: letters, numbers, dash, underscore, dot
  sanitized = sanitized.replace(/[^a-zA-Z0-9\-_.]/g, '_');
  
  // Ensure it doesn't start with a dot (hidden files)
  if (sanitized.startsWith('.')) {
    sanitized = sanitized.substring(1);
  }
  
  return sanitized;
}

/**
 * Sanitizes phone number to allow only digits, spaces, and common separators
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  
  // Allow only digits, +, -, (, ), and spaces
  return phone.replace(/[^0-9+\-() ]/g, '').trim();
}

/**
 * Sanitizes document/ID number
 */
export function sanitizeDocumentNumber(doc: string): string {
  if (!doc) return '';
  
  // Allow only alphanumeric and dash
  return doc.replace(/[^a-zA-Z0-9\-]/g, '').trim();
}

/**
 * Sanitizes name to allow only letters, spaces, and common accents
 */
export function sanitizeName(name: string): string {
  if (!name) return '';
  
  // Allow letters (including accented), spaces, apostrophes, hyphens
  return name.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s'\-]/g, '').trim();
}

/**
 * Validates and sanitizes URL
 */
export function sanitizeUrl(url: string): string | null {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitizes amount/numeric input
 */
export function sanitizeAmount(amount: string): string {
  if (!amount) return '';
  
  // Allow only digits and one decimal point
  return amount.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
}

/**
 * Prevents SQL injection by escaping single quotes
 * Note: Use parameterized queries instead when possible
 */
export function escapeSql(input: string): string {
  if (!input) return '';
  
  return input.replace(/'/g, "''");
}

/**
 * Validates file type against allowed types
 */
export function validateFileType(
  file: File,
  allowedTypes: string[]
): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  
  const fileType = file.type.toLowerCase();
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  // Check MIME type
  const isValidMimeType = allowedTypes.some(type => {
    if (type.includes('*')) {
      const baseType = type.split('/')[0];
      return fileType.startsWith(baseType + '/');
    }
    return fileType === type;
  });
  
  if (!isValidMimeType) {
    return { 
      valid: false, 
      error: `Tipo de archivo no permitido. Tipos aceptados: ${allowedTypes.join(', ')}` 
    };
  }
  
  return { valid: true };
}

/**
 * Validates file size
 */
export function validateFileSize(
  file: File,
  maxSizeMB: number
): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    return { 
      valid: false, 
      error: `Archivo muy grande. Tamaño máximo: ${maxSizeMB}MB` 
    };
  }
  
  return { valid: true };
}

/**
 * Comprehensive file validation for KYC documents
 */
export const KYC_ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf'
];

export const KYC_MAX_SIZE_MB = 5;

export function validateKycFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const typeCheck = validateFileType(file, KYC_ALLOWED_TYPES);
  if (!typeCheck.valid) {
    return typeCheck;
  }
  
  // Check file size
  const sizeCheck = validateFileSize(file, KYC_MAX_SIZE_MB);
  if (!sizeCheck.valid) {
    return sizeCheck;
  }
  
  return { valid: true };
}
