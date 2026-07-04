import { render, screen } from "@testing-library/react";

import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";
import {
  getLandingStartHref,
  LandingStartLink,
} from "@/features/landing/ui/landingStartLink";

jest.mock("@/shared/providers/audioPlayerProvider", () => ({
  useAudioPlayer: jest.fn(),
}));

const mockedUseAudioPlayer = useAudioPlayer as jest.MockedFunction<
  typeof useAudioPlayer
>;

describe("LandingStartLink", () => {
  beforeEach(() => {
    mockedUseAudioPlayer.mockReturnValue({ currentTrack: null } as ReturnType<
      typeof useAudioPlayer
    >);
  });

  it("links to search when no track is active", () => {
    render(<LandingStartLink />);

    expect(screen.getByRole("link", { name: "Start listening" })).toHaveAttribute(
      "href",
      "/search",
    );
  });

  it("preserves the active track id in the search link", () => {
    mockedUseAudioPlayer.mockReturnValue({
      currentTrack: { id: "track 1", title: "Readable title" },
    } as ReturnType<typeof useAudioPlayer>);

    render(<LandingStartLink />);

    expect(screen.getByRole("link", { name: "Start listening" })).toHaveAttribute(
      "href",
      "/search?track=track%201",
    );
  });

  it("falls back to a title only when an id is unavailable", () => {
    expect(getLandingStartHref({ title: "Readable title" })).toBe(
      "/search?track=Readable%20title",
    );
  });

  it("normalizes blank track keys", () => {
    expect(getLandingStartHref({ id: "   ", title: "   " })).toBe("/search");
  });
});