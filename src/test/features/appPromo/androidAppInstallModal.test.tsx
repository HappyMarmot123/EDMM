import { fireEvent, render, screen } from "@testing-library/react";
import AndroidAppInstallModal from "@/features/appPromo/androidAppInstallModal";
import { useAndroidAppPromo } from "@/shared/hooks/useAndroidAppPromo";
import { APK_DOWNLOAD_URL } from "@/features/appPromo/config";

jest.mock("@/shared/hooks/useAndroidAppPromo");

const mockedUseAndroidAppPromo = useAndroidAppPromo as jest.MockedFunction<
  typeof useAndroidAppPromo
>;

describe("AndroidAppInstallModal", () => {
  afterEach(() => jest.clearAllMocks());

  it("renders nothing when shouldShow is false", () => {
    mockedUseAndroidAppPromo.mockReturnValue({
      shouldShow: false,
      dismiss: jest.fn(),
    });
    const { container } = render(<AndroidAppInstallModal />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a dialog with a download link when shouldShow is true", () => {
    mockedUseAndroidAppPromo.mockReturnValue({
      shouldShow: true,
      dismiss: jest.fn(),
    });
    render(<AndroidAppInstallModal />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /다운로드/ });
    expect(link).toHaveAttribute("href", APK_DOWNLOAD_URL);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("calls dismiss when the close button is clicked", () => {
    const dismiss = jest.fn();
    mockedUseAndroidAppPromo.mockReturnValue({ shouldShow: true, dismiss });
    render(<AndroidAppInstallModal />);

    fireEvent.click(screen.getByRole("button", { name: /닫기/ }));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it("calls dismiss when the download link is clicked", () => {
    const dismiss = jest.fn();
    mockedUseAndroidAppPromo.mockReturnValue({ shouldShow: true, dismiss });
    render(<AndroidAppInstallModal />);

    fireEvent.click(screen.getByRole("link", { name: /다운로드/ }));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it("calls dismiss when the overlay is clicked", () => {
    const dismiss = jest.fn();
    mockedUseAndroidAppPromo.mockReturnValue({ shouldShow: true, dismiss });
    render(<AndroidAppInstallModal />);

    fireEvent.click(screen.getByTestId("app-install-overlay"));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it("calls dismiss when Escape is pressed", () => {
    const dismiss = jest.fn();
    mockedUseAndroidAppPromo.mockReturnValue({ shouldShow: true, dismiss });
    render(<AndroidAppInstallModal />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it("does not call dismiss when Escape is pressed and shouldShow is false", () => {
    const dismiss = jest.fn();
    mockedUseAndroidAppPromo.mockReturnValue({ shouldShow: false, dismiss });
    render(<AndroidAppInstallModal />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(dismiss).not.toHaveBeenCalled();
  });
});
