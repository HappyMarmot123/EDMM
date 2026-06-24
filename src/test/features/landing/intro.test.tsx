import { render } from "@testing-library/react";
import Intro from "@/features/landing/components/intro";

beforeEach(() => {
  window.sessionStorage.clear();
});

it("does not render intro content when already seen this session", () => {
  window.sessionStorage.setItem("edmm:once:intro", "1");

  const { container } = render(<Intro />);

  expect(container.querySelector("[data-testid='intro-root']")).toBeNull();
});
