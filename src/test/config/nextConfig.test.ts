import nextConfig from "../../../next.config";

describe("next image configuration", () => {
  it("allows Cloudinary artwork hosts", () => {
    const remotePatterns = nextConfig.images?.remotePatterns ?? [];

    expect(remotePatterns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          protocol: "https",
          hostname: "res.cloudinary.com",
        }),
      ])
    );
  });

  it("keeps Wikimedia fallback host configured", () => {
    const remotePatterns = nextConfig.images?.remotePatterns ?? [];

    expect(remotePatterns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          protocol: "https",
          hostname: "upload.wikimedia.org",
        }),
      ])
    );
  });
});
