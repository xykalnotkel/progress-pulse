export type AllowedMediaMime =
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "image/gif"
  | "video/mp4"
  | "video/webm"
  | "video/quicktime";

function ascii(bytes: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

export function detectMediaMime(bytes: Uint8Array): AllowedMediaMime | null {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    ascii(bytes, 1, 3) === "PNG" &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) return "image/png";

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") {
    return "image/webp";
  }

  if (bytes.length >= 6 && ["GIF87a", "GIF89a"].includes(ascii(bytes, 0, 6))) {
    return "image/gif";
  }

  if (
    bytes.length >= 4 &&
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3
  ) return "video/webm";

  if (bytes.length >= 12 && ascii(bytes, 4, 4) === "ftyp") {
    const brand = ascii(bytes, 8, 4);
    return brand === "qt  " ? "video/quicktime" : "video/mp4";
  }

  return null;
}

export function declaredMimeMatches(detected: AllowedMediaMime, declared: string) {
  if (detected === declared) return true;
  return (
    (detected === "video/mp4" && declared === "video/quicktime") ||
    (detected === "video/quicktime" && declared === "video/mp4")
  );
}
