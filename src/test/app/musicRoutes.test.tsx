import TrackPage from "@/app/track/[id]/page";

jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  notFound: jest.fn(),
}));

describe("music route compatibility redirects", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects /track/[id] to the shell detail aside selection", async () => {
    await expect(
      TrackPage({
        params: Promise.resolve({
          id: encodeURIComponent("cloudinary:asset-1"),
        }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/search?track=cloudinary%3Aasset-1");
  });

  it("redirects invalid /track/[id] values to shell home", async () => {
    await expect(
      TrackPage({
        params: Promise.resolve({
          id: "%",
        }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/search");
  });
});
