const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME;

export const isHttpUrl = (value?: string | null) => Boolean(value && /^https?:\/\//i.test(value));

export const isBase64Image = (value?: string | null) => Boolean(value && /^data:image\//i.test(value));

export const isCloudinaryPublicId = (value?: string | null) => {
  if (!value) return false;
  if (isHttpUrl(value)) return false;
  if (isBase64Image(value)) return false;
  return true;
};

export const getPublicUrl = (publicId?: string | null) => {
  if (!publicId) return null;
  if (isHttpUrl(publicId)) return publicId;

  if (!cloudName) {
    return publicId;
  }

  const normalized = publicId.replace(/^\/+/, '');
  return `https://res.cloudinary.com/${cloudName}/image/upload/${normalized}`;
};

