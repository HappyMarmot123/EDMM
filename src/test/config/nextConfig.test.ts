import nextConfig from "../../../next.config";

describe("next image configuration", () => {
  it("allows Audius artwork hosts returned by search results", () => {
    const remotePatterns = nextConfig.images?.remotePatterns ?? [];

    expect(remotePatterns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          protocol: "https",
          hostname: "audius.zeogrid.com",
        }),
      ])
    );
  });

  it("keeps known Audius content CDN families documented", () => {
    const remotePatterns = nextConfig.images?.remotePatterns ?? [];

    expect(remotePatterns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          protocol: "https",
          hostname: "audius-content-*.figment.io",
        }),
      ])
    );
  });
});
