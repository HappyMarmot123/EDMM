import { render, screen } from "@testing-library/react";
import AppDownloadButton from "@/features/appPromo/appDownloadButton";
import { APK_DOWNLOAD_URL } from "@/features/appPromo/config";

describe("AppDownloadButton", () => {
  it("renders a download link to the APK with safe target attributes", () => {
    render(<AppDownloadButton />);
    const link = screen.getByRole("link", { name: /App Download/ });
    expect(link).toHaveAttribute("href", APK_DOWNLOAD_URL);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
