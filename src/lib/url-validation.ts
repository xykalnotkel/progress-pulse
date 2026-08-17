function parsedUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function isSafeHttpsUrl(value: string) {
  const url = parsedUrl(value);
  return Boolean(
    url &&
      url.protocol === "https:" &&
      url.hostname &&
      !url.username &&
      !url.password,
  );
}

export function isCloudinaryDeliveryUrl(value: string) {
  const url = parsedUrl(value);
  if (!url || url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") {
    return false;
  }
  return /^\/[^/]+\/(?:image|video)\/upload\//.test(url.pathname);
}

export function isConfiguredCloudinaryUrl(value: string) {
  if (!isCloudinaryDeliveryUrl(value)) return false;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return false;
  return new URL(value).pathname.startsWith(`/${cloudName}/`);
}
