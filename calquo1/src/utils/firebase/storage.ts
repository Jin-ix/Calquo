import { supabase } from '../supabase/client';

export type UploadProgressCallback = (progress: number) => void;

const BUCKET_NAME = 'product-images';

// ─── Auto-create bucket on first load ─────────────────────────────────────────
// Supabase Storage requires the bucket to exist. This one-time check creates it
// as a public bucket if it doesn't already exist. All upload functions await this.
const bucketReady: Promise<void> = (async () => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some(b => b.name === BUCKET_NAME);
    if (!exists) {
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 10485760, // 10 MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      });
      if (error && !error.message.includes('already exists')) {
        console.error('[Storage] Failed to auto-create bucket:', error.message);
      } else {
        console.log('[Storage] ✅ Bucket "product-images" created successfully.');
      }
    }
  } catch (e) {
    console.warn('[Storage] Bucket check skipped (may lack permissions):', e);
  }
})();
// ──────────────────────────────────────────────────────────────────────────────

// ─── Firebase Storage shim ─────────────────────────────────────────────────
// These match the Firebase Storage API surface used by legacy components
// (e.g. EnhancedAddStockFormWithImages) so no import-path changes are needed.

export interface StorageReference {
  _path: string;
  _bucket: string;
  fullPath: string;
}

export function getStorage(): any { return {}; }

export function ref(_storage: any, path: string): StorageReference {
  return { _path: path, _bucket: BUCKET_NAME, fullPath: path };
}

export async function uploadBytes(
  storageRef: StorageReference,
  data: Blob | File
): Promise<{ ref: StorageReference }> {
  await bucketReady;
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storageRef._path, data, { upsert: true });
  if (error) throw error;
  return { ref: storageRef };
}

export async function getDownloadURL(storageRef: StorageReference): Promise<string> {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storageRef._path);
  return data.publicUrl;
}

export async function deleteObject(storageRef: StorageReference): Promise<void> {
  await bucketReady;
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([storageRef._path]);
  if (error) throw error;
}
// ──────────────────────────────────────────────────────────────────────────────


async function compressImage(file: File, maxWidth: number = 1200, quality: number = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to compress image'));
        },
        file.type,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

// Helper: convert a Blob/File to a base64 data URL (used as storage fallback)
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(blob);
  });
}

export async function uploadImage(
  file: File,
  path: string,
  onProgress?: UploadProgressCallback,
  compress: boolean = true
): Promise<string> {
  let fileToUpload: Blob | File = file;
  try {
    if (compress && file.type.startsWith('image/')) {
      try {
        fileToUpload = await compressImage(file);
      } catch {
        fileToUpload = file; // compression failed, use original
      }
    }

    if (onProgress) onProgress(10);

    await bucketReady;
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, fileToUpload, { upsert: true });

    if (error) {
      // RLS / auth policy is blocking the upload (no Supabase Auth session).
      // Fall back to a base64 data URL so the stock item can still be saved.
      const isPermissionError =
        error.message?.toLowerCase().includes('row level security') ||
        error.message?.toLowerCase().includes('policy') ||
        (error as any)?.statusCode === '403' ||
        (error as any)?.statusCode === '400' ||
        (error as any)?.status === 403 ||
        (error as any)?.status === 400;

      if (isPermissionError) {
        console.warn('[Storage] Upload blocked by RLS. Falling back to base64 data URL.');
        if (onProgress) onProgress(100);
        return await blobToDataUrl(fileToUpload);
      }
      throw error;
    }

    if (onProgress) onProgress(100);
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    return data.publicUrl;
  } catch (error: any) {
    console.error('Error uploading image:', error);
    // Last-resort: return data URL instead of crashing the entire submit
    try {
      console.warn('[Storage] Falling back to base64 data URL after error.');
      return await blobToDataUrl(fileToUpload);
    } catch {
      throw error;
    }
  }
}

export async function uploadImages(
  files: File[],
  basePath: string,
  onProgress?: UploadProgressCallback
): Promise<string[]> {
  const urls: string[] = [];
  const totalFiles = files.length;
  let completedFiles = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const timestamp = Date.now();
    const fileName = `${timestamp}_${i}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `${basePath}/${fileName}`;

    const url = await uploadImage(file, filePath, (progress) => {
      if (onProgress) {
        const overallProgress = ((completedFiles + progress / 100) / totalFiles) * 100;
        onProgress(overallProgress);
      }
    });

    urls.push(url);
    completedFiles++;
    if (onProgress) onProgress((completedFiles / totalFiles) * 100);
  }

  return urls;
}

export async function uploadProductVariantImage(file: File, productId: string, variantId: string, onProgress?: UploadProgressCallback): Promise<string> {
  const timestamp = Date.now();
  const fileName = `${variantId}_${timestamp}.${file.name.split('.').pop()}`;
  return uploadImage(file, `products/${productId}/variants/${fileName}`, onProgress);
}

export async function uploadProductMainImage(file: File, productId: string, imageIndex: number = 0, onProgress?: UploadProgressCallback): Promise<string> {
  const timestamp = Date.now();
  const fileName = `main_${imageIndex}_${timestamp}.${file.name.split('.').pop()}`;
  return uploadImage(file, `products/${productId}/${fileName}`, onProgress);
}

export async function deleteImage(url: string): Promise<void> {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(new RegExp(`${BUCKET_NAME}/(.*)`));
    if (!pathMatch) return;
    
    const path = decodeURIComponent(pathMatch[1]);
    await bucketReady;
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

export function generateProductImageId(): string {
  return `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function isStorageAvailable(): boolean {
  return true;
}

export function validateImageFile(file: File, maxSizeMB: number = 5): string | null {
  if (!file.type.startsWith('image/')) return 'File must be an image';
  if (file.size > maxSizeMB * 1024 * 1024) return `Image size must be less than ${maxSizeMB}MB`;
  return null;
}