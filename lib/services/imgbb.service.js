/**
 * ImgbbService - Image upload to imgbb.com
 * 
 * Uploads images to imgbb and returns public URL.
 * Uses imgbb API v1: https://api.imgbb.com/1/upload
 */
class ImgbbService {
  /**
   * Upload image to imgbb
   * @param {File|Buffer|string} image - Image file (File object, Buffer, base64 string, or URL)
   * @param {object} options - Optional: name, expiration
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  async uploadImage(image, options = {}) {
    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      return { success: false, error: "IMGBB_API_KEY not configured" };
    }

    try {
      let imageData;
      
      // Handle different input types
      if (image instanceof File) {
        // Convert File to base64
        imageData = await this.fileToBase64(image);
      } else if (Buffer.isBuffer(image)) {
        // Convert Buffer to base64
        imageData = image.toString('base64');
      } else if (typeof image === 'string') {
        // Already base64 or URL
        if (image.startsWith('data:')) {
          // Extract base64 part from data URL
          imageData = image.split(',')[1];
        } else if (image.startsWith('http://') || image.startsWith('https://')) {
          // URL - fetch and convert
          const response = await fetch(image);
          const buffer = Buffer.from(await response.arrayBuffer());
          imageData = buffer.toString('base64');
        } else {
          // Assume it's base64
          imageData = image;
        }
      } else {
        return { success: false, error: "Invalid image format" };
      }

      // Build form data
      const formData = new URLSearchParams();
      formData.append('key', apiKey);
      formData.append('image', imageData);
      if (options.name) {
        formData.append('name', options.name);
      }
      if (options.expiration) {
        formData.append('expiration', String(options.expiration));
      }

      // Call imgbb API
      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.data?.url) {
        return { success: true, url: data.data.url };
      } else {
        return { 
          success: false, 
          error: data.error?.message || data.error?.message || "Upload failed" 
        };
      }
    } catch (error) {
      console.error("Imgbb upload error:", error);
      return { success: false, error: error.message || "Failed to upload image" };
    }
  }

  /**
   * Convert File to base64 string
   * @param {File} file - File object
   * @returns {Promise<string>} - Base64 string
   */
  async fileToBase64(file) {
    // In Node.js environment (server-side), use arrayBuffer
    if (typeof window === 'undefined') {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return buffer.toString('base64');
    }
    
    // In browser environment, use FileReader
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        // Remove data URL prefix if present
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export const imgbbService = new ImgbbService();
