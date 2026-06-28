import { render, screen } from "@testing-library/react";
import { PlayerControlButton } from "@/shared/components/playerControlBtn";

describe("PlayerControlButton", () => {
  it("merges caller classes with the shared button styles", () => {
    render(
      <PlayerControlButton aria-label="Custom control" className="h-11 w-11">
        Control
      </PlayerControlButton>
    );

    const button = screen.getByRole("button", { name: "Custom control" });

    expect(button).toHaveClass("h-11", "w-11", "rounded-full");
  });
});
