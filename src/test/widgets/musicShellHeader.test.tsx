import { render, screen } from "@testing-library/react";
import MusicShellHeader from "@/widgets/musicShell/musicShellHeader";
import { useIsAndroidPhone } from "@/shared/hooks/useIsAndroidPhone";
import { APK_DOWNLOAD_URL } from "@/features/appPromo/config";

jest.mock("@/shared/hooks/useIsAndroidPhone");

const mockedUseIsAndroidPhone = useIsAndroidPhone as jest.MockedFunction<
  typeof useIsAndroidPhone
>;

const baseProps = {
  query: "",
  view: "pop" as const,
  catalogCounts: { pop: 3, edm: 5 },
  onQueryChange: jest.fn(),
  onViewChange: jest.fn(),
};

describe("MusicShellHeader search/download swap", () => {
  afterEach(() => jest.clearAllMocks());

  it("shows the App Download button and hides search on an Android phone", () => {
    mockedUseIsAndroidPhone.mockReturnValue(true);
    render(<MusicShellHeader {...baseProps} />);

    const link = screen.getByRole("link", { name: /App Download/ });
    expect(link).toHaveAttribute("href", APK_DOWNLOAD_URL);
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });

  it("shows the search box and no download button otherwise", () => {
    mockedUseIsAndroidPhone.mockReturnValue(false);
    render(<MusicShellHeader {...baseProps} />);

    expect(screen.getByRole("searchbox")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /App Download/ }),
    ).not.toBeInTheDocument();
  });
});
