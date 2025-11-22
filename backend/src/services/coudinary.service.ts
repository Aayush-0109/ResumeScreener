import { UploadApiResponse } from "cloudinary";
import cloudinary from "../config/cloudinary.js";
import { UploadedAsset, UploadInput } from "../types/resume.types.js";


function sanitizeName(name: string) {
  return name.replace(/\.[^/.]+$/, '').replace(/\s+/g, '-').toLowerCase();
}


export class Cloudinary {
  static cloudinary = cloudinary;

  static generatePublicId(userId: string, originalname: string): string {
    const base = originalname.replace(/\.[^/.]+$/, '').replace(/\s+/g, '-').toLowerCase();
    const ts = Date.now();
    return `siftly/${process.env.NODE_ENV || 'dev'}/resumes/${userId}/${ts}-${base}`;
  }
  static toDataURI(input: UploadInput) {
    const base64 = input.buffer.toString('base64');
    return `data:${input.mimetype};base64,${base64}`;
  }
  static async uploadBuffer(input: UploadInput, publicId: string): Promise<UploadedAsset> {
    const dataUri = this.toDataURI(input);
    const res = await cloudinary.uploader.upload(dataUri, {
      public_id: publicId,
      resource_type: 'raw',
      overwrite: true
    }) as UploadApiResponse;
    const baseRawUrl = res.secure_url;
    const baseName = sanitizeName(input.originalname);

    const fileUrl =
      input.mimetype === 'application/pdf'
        ? `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(baseRawUrl)}`
        : baseRawUrl;

    const downloadUrl = cloudinary.url(res.public_id, {
      resource_type: 'raw',
      secure: true,
      flags: 'attachment',
      attachment: baseName
    });

    return {
      fileName: input.originalname,
      fileUrl,
      downloadUrl,
      publicId: res.public_id,
      mimeType: input.mimetype,
      fileSize: input.buffer.length
    }
  }
  static async uploadMany(files: UploadInput[], userId: string) {
    const results = await Promise.allSettled(
      files.map(async (f) => {
        const publicId = this.generatePublicId(userId, f.originalname);
        return this.uploadBuffer(f, publicId);
      })
    );

    const created: UploadedAsset[] = [];
    const failed: Array<{ file: string; reason: string }> = [];

    results.forEach((r, idx) => {
      if (r.status === 'fulfilled') created.push(r.value);
      else failed.push({ file: files[idx].originalname, reason: r.reason?.message || 'upload_failed' });
    });

    return { created, failed };
  }

  static async deleteByPublicId(publicId: string) {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
  }

}