import { render, screen } from "@testing-library/react";
import NavSidebar from "@/widgets/navSidebar";

describe("NavSidebar", () => {
  it("renders main navigation links", () => {
    render(<NavSidebar />);

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Search" })).toHaveAttribute(
      "href",
      "/search",
    );
  });
});
