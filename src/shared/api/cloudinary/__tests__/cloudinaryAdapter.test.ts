import { adaptCloudinaryTrack } from "../cloudinaryAdapter";

const raw = {
  asset_id: "asset-1",
  public_id: "edmm/media-pipeline/aespa LEMONADE MV",
  resource_type: "video",
  type: "upload",
  format: "mp3",
  secure_url: "https://res.cloudinary.com/demo/video/upload/aespa.mp3",
  bytes: 6205101,
  duration: 191.28,
  created_at: "2026-06-26T00:00:00Z",
  tags: ["edmm"],
};

describe("adaptCloudinaryTrack", () => {
  it("normalizes a Cloudinary mp3 resource to Track", () => {
    expect(adaptCloudinaryTrack(raw)).toMatchObject({
      id: "cloudinary:asset-1",
      source: "cloudinary",
      title: "aespa LEMONADE MV",
      artistId: "",
      artistName: "",
      albumName: "media-pipeline",
      artworkUrl: "",
      durationMs: 191280,
      streamUrl: raw.secure_url,
      metadata: {
        publicId: raw.public_id,
        assetId: raw.asset_id,
        format: "mp3",
        resourceType: "video",
        bytes: 6205101,
        tags: ["edmm"],
      },
    });
  });

  it("uses context metadata before filename fallback", () => {
    const track = adaptCloudinaryTrack({
      ...raw,
      context: {
        custom: {
          title: "LEMONADE",
          artist: "aespa",
          album: "Single",
          artworkUrl: "https://example.com/art.jpg",
        },
      },
    });

    expect(track.title).toBe("LEMONADE");
    expect(track.artistName).toBe("aespa");
    expect(track.albumName).toBe("Single");
    expect(track.artworkUrl).toBe("https://example.com/art.jpg");
  });

  it("uses structured metadata when context custom fields are missing", () => {
    const track = adaptCloudinaryTrack({
      ...raw,
      metadata: {
        title: "Metadata Title",
        artist: "Metadata Artist",
        album: "Metadata Album",
        artworkUrl: "https://example.com/metadata-art.jpg",
      },
    });

    expect(track.title).toBe("Metadata Title");
    expect(track.artistName).toBe("Metadata Artist");
    expect(track.albumName).toBe("Metadata Album");
    expect(track.artworkUrl).toBe("https://example.com/metadata-art.jpg");
  });

  it("prefers context caption as the canonical track title", () => {
    const track = adaptCloudinaryTrack({
      ...raw,
      context: {
        alt: "Disco Lines",
        caption: "Push It",
        title: "Disco-Lines-Maesic-feat-Mason-Princess-Superstar-Push-It",
      },
    });

    expect(track.title).toBe("Push It");
    expect(track.metadata.caption).toBe("Push It");
  });

  it("uses flat context fields for title and artwork", () => {
    const track = adaptCloudinaryTrack({
      ...raw,
      context: {
        title: "Context Title",
        artist: "Context Artist",
        album: "Context Album",
        artworkUrl: "https://example.com/context-art.jpg",
      },
    });

    expect(track.title).toBe("Context Title");
    expect(track.artistName).toBe("Context Artist");
    expect(track.albumName).toBe("Context Album");
    expect(track.artworkUrl).toBe("https://example.com/context-art.jpg");
  });

  it("uses context alt as artist when artist is missing", () => {
    const track = adaptCloudinaryTrack({
      ...raw,
      context: {
        alt: "Screamarts & Blocksberg",
      },
    });

    expect(track.artistName).toBe("Screamarts & Blocksberg");
  });

  it("uses metadata.context fields when available", () => {
    const track = adaptCloudinaryTrack({
      ...raw,
      metadata: {
        context: {
          title: "Metadata Context Title",
          artist: "Metadata Context Artist",
          album: "Metadata Context Album",
          artworkUrl: "https://example.com/metadata-context-art.jpg",
        },
      },
    });

    expect(track.title).toBe("Metadata Context Title");
    expect(track.artistName).toBe("Metadata Context Artist");
    expect(track.albumName).toBe("Metadata Context Album");
    expect(track.artworkUrl).toBe("https://example.com/metadata-context-art.jpg");
  });

  it("uses public_id for the Track id when asset_id is missing", () => {
    const track = adaptCloudinaryTrack({
      ...raw,
      asset_id: undefined,
    });

    expect(track.id).toBe(`cloudinary:${raw.public_id}`);
    expect(track.metadata).toMatchObject({
      publicId: raw.public_id,
      assetId: undefined,
    });
  });

  it("uses public_id for the Track id when asset_id is empty", () => {
    const track = adaptCloudinaryTrack({
      ...raw,
      asset_id: "",
    });

    expect(track.id).toBe(`cloudinary:${raw.public_id}`);
    expect(track.metadata).toMatchObject({
      publicId: raw.public_id,
      assetId: "",
    });
  });
});
