const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

export const getPublicUrl = (publicId: string) => {
  if (!cloudName) {
    return publicId;
  }

  const normalized = publicId.replace(/^\/+/, '');
  return `https://res.cloudinary.com/${cloudName}/image/upload/${normalized}`;
};
