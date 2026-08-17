import { describe, expect, it } from "vitest";
import { declaredMimeMatches, detectMediaMime } from "./file-signature";

const bytes = (...values: number[]) => new Uint8Array(values);
const text = (value: string) => [...new TextEncoder().encode(value)];

describe("detectMediaMime", () => {
  it("detects supported image signatures", () => {
    expect(detectMediaMime(bytes(0x89, ...text("PNG"), 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png");
    expect(detectMediaMime(bytes(0xff, 0xd8, 0xff, 0xdb))).toBe("image/jpeg");
    expect(detectMediaMime(bytes(...text("RIFF"), 0, 0, 0, 0, ...text("WEBP")))).toBe("image/webp");
    expect(detectMediaMime(bytes(...text("GIF89a")))).toBe("image/gif");
  });

  it("detects supported video containers", () => {
    expect(detectMediaMime(bytes(0x1a, 0x45, 0xdf, 0xa3))).toBe("video/webm");
    expect(detectMediaMime(bytes(0, 0, 0, 24, ...text("ftyp"), ...text("isom")))).toBe("video/mp4");
    expect(detectMediaMime(bytes(0, 0, 0, 24, ...text("ftyp"), ...text("qt  ")))).toBe("video/quicktime");
  });

  it("rejects unknown or spoofed content", () => {
    expect(detectMediaMime(bytes(...text("<svg onload=alert(1)>")))).toBeNull();
    expect(declaredMimeMatches("image/png", "image/jpeg")).toBe(false);
    expect(declaredMimeMatches("video/mp4", "video/quicktime")).toBe(true);
  });
});
