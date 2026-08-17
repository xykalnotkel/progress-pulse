import { afterEach, describe, expect, it } from "vitest";
import {
  isCloudinaryDeliveryUrl,
  isConfiguredCloudinaryUrl,
  isSafeHttpsUrl,
} from "./url-validation";

const originalCloudName = process.env.CLOUDINARY_CLOUD_NAME;
afterEach(() => {
  if (originalCloudName === undefined) delete process.env.CLOUDINARY_CLOUD_NAME;
  else process.env.CLOUDINARY_CLOUD_NAME = originalCloudName;
});

describe("URL validation", () => {
  it("accepts HTTPS links without embedded credentials", () => {
    expect(isSafeHttpsUrl("https://example.com/path?q=1")).toBe(true);
    expect(isSafeHttpsUrl("http://example.com")).toBe(false);
    expect(isSafeHttpsUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHttpsUrl("https://user:pass@example.com")).toBe(false);
  });

  it("requires the exact Cloudinary delivery host and upload path", () => {
    expect(isCloudinaryDeliveryUrl("https://res.cloudinary.com/demo/image/upload/v1/a.png")).toBe(true);
    expect(isCloudinaryDeliveryUrl("https://res.cloudinary.com/demo/video/upload/v1/a.mp4")).toBe(true);
    expect(isCloudinaryDeliveryUrl("https://res.cloudinary.com.evil.test/demo/image/upload/a.png")).toBe(false);
    expect(isCloudinaryDeliveryUrl("https://res.cloudinary.com/demo/raw/upload/a.svg")).toBe(false);
  });

  it("limits persisted media to the configured Cloudinary account", () => {
    process.env.CLOUDINARY_CLOUD_NAME = "xyspace";
    expect(isConfiguredCloudinaryUrl("https://res.cloudinary.com/xyspace/image/upload/v1/a.png")).toBe(true);
    expect(isConfiguredCloudinaryUrl("https://res.cloudinary.com/other/image/upload/v1/a.png")).toBe(false);
  });
});
