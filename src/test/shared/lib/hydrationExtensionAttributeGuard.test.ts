import { HYDRATION_EXTENSION_ATTRIBUTE_GUARD_SCRIPT } from "@/shared/lib/hydrationExtensionAttributeGuard";

const runGuardScript = () => {
  Function(HYDRATION_EXTENSION_ATTRIBUTE_GUARD_SCRIPT)();
};

describe("HYDRATION_EXTENSION_ATTRIBUTE_GUARD_SCRIPT", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("removes known browser-extension hydration attributes before React hydrates", () => {
    document.body.innerHTML = `
      <main bis_skin_checked="1" bis_register="abc" __processed_test="true">
        <div bis_skin_checked="1"></div>
      </main>
    `;

    runGuardScript();

    expect(document.querySelector("[bis_skin_checked]")).toBeNull();
    expect(document.querySelector("[bis_register]")).toBeNull();
    expect(document.querySelector("[__processed_test]")).toBeNull();
  });

  it("removes known browser-extension hydration attributes added after install", async () => {
    document.body.innerHTML = "<main><div data-testid=\"target\"></div></main>";

    runGuardScript();
    const target = document.querySelector("[data-testid='target']");

    target?.setAttribute("bis_skin_checked", "1");
    await Promise.resolve();

    expect(target).not.toHaveAttribute("bis_skin_checked");
  });
});
