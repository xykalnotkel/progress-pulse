import { isCloudinaryDeliveryUrl } from "@/lib/url-validation";

/**
 * Media delivery helpers.
 *
 * All Cloudinary media is stored once and delivered optimized:
 * - images: `f_auto` (browser picks AVIF/WebP) + `q_auto` (compression)
 * - videos: `q_auto` (quality)
 *
 * The transformation is baked into the stored URL so every consumer (feed,
 * detail pages, share links) gets the small version automatically. URLs that
 * are not from Cloudinary, or that already carry a transformation, pass
 * through untouched.
 */
export function optimizeMediaUrl(url: string): string {
  if (!url || !isCloudinaryDeliveryUrl(url)) return url;

  const imageMarker = "/image/upload/";
  const videoMarker = "/video/upload/";

  if (url.includes(imageMarker)) {
    const parts = url.split(imageMarker);
    if (parts.length !== 2) return url;
    const rest = parts[1];
    // No transformation yet => right after the marker comes "/v<timestamp>/".
    if (/^v\d+\//.test(rest)) return `${parts[0]}${imageMarker}f_auto,q_auto/${rest}`;
    return url;
  }

  if (url.includes(videoMarker)) {
    const parts = url.split(videoMarker);
    if (parts.length !== 2) return url;
    const rest = parts[1];
    if (/^v\d+\//.test(rest)) return `${parts[0]}${videoMarker}q_auto/${rest}`;
    return url;
  }

  return url;
}

export function optimizeMediaList(urls: string[]): string[] {
  return (urls ?? []).map(optimizeMediaUrl);
}
