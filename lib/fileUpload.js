import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Validates uploaded file
 * @param {File} file - The file to validate
 * @returns {Object} - { valid: boolean, error?: string }
 */
export function validateFile(file) {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 5MB limit' };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed' };
  }

  return { valid: true };
}

/**
 * Saves uploaded file to public/uploads/companies/
 * @param {File} file - The file to save
 * @returns {Promise<Object>} - { success: boolean, path?: string, error?: string }
 */
export async function saveCompanyLogo(file) {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const uniqueFilename = `${randomUUID()}.${fileExtension}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'companies');
    const filePath = join(uploadDir, uniqueFilename);

    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true });

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return relative path from public directory
    const relativePath = `/uploads/companies/${uniqueFilename}`;
    return { success: true, path: relativePath };
  } catch (error) {
    console.error('Error saving file:', error);
    return { success: false, error: 'Failed to save file: ' + error.message };
  }
}

/**
 * Handles multipart form data file upload
 * @param {FormData} formData - Form data containing the file
 * @param {string} fieldName - Name of the file field (default: 'logo')
 * @returns {Promise<Object>} - { success: boolean, path?: string, error?: string }
 */
export async function handleFileUpload(formData, fieldName = 'logo') {
  const file = formData.get(fieldName);
  
  if (!file || !(file instanceof File)) {
    return { success: false, error: 'No file found in form data' };
  }

  return await saveCompanyLogo(file);
}
