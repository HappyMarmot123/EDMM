import { fireEvent, render, screen } from "@testing-library/react";
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

  it("applies cursor-pointer by default", () => {
    render(<PlayerControlButton aria-label="Cursor check" />);
    expect(screen.getByRole("button", { name: "Cursor check" })).toHaveClass(
      "cursor-pointer",
    );
  });

  it("keeps the hover surface by default and removes it when opted out", () => {
    render(
      <>
        <PlayerControlButton aria-label="Default surface" />
        <PlayerControlButton aria-label="No surface" hoverSurface={false} />
      </>
    );
    expect(screen.getByRole("button", { name: "Default surface" })).toHaveClass(
      "hover:bg-white/10",
    );
    expect(
      screen.getByRole("button", { name: "No surface" }),
    ).not.toHaveClass("hover:bg-white/10");
  });

  it("blurs after a pointer click only when opted in", () => {
    const onClick = jest.fn();
    render(
      <PlayerControlButton
        aria-label="Blurring"
        blurOnPointerClick
        onClick={onClick}
      />
    );
    const button = screen.getByRole("button", { name: "Blurring" });
    button.focus();
    // detail > 0 → 포인터 유래 클릭
    fireEvent.click(button, { detail: 1 });
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(button).not.toHaveFocus();
  });

  it("keeps focus on keyboard activation even with blurOnPointerClick", () => {
    render(<PlayerControlButton aria-label="Keyboard" blurOnPointerClick />);
    const button = screen.getByRole("button", { name: "Keyboard" });
    button.focus();
    fireEvent.click(button, { detail: 0 }); // Enter/Space 활성화는 detail 0
    expect(button).toHaveFocus();
  });
});
