import { db } from "../../edmmDB";
import {
  getEqualizerPreset,
  setEqualizerPreset,
} from "../audioSettingsRepo";

afterEach(async () => {
  jest.restoreAllMocks();
  await db.delete();
  await db.open();
});

describe("audioSettingsRepo", () => {
  it("defaults to flat preset when no setting exists", async () => {
    await expect(getEqualizerPreset()).resolves.toBe("flat");
  });

  it("stores and loads a valid equalizer preset", async () => {
    await setEqualizerPreset("edm");

    expect(await getEqualizerPreset()).toBe("edm");
    expect(await db.audioSettings.get("equalizer.preset")).toEqual({
      key: "equalizer.preset",
      value: "edm",
    });
  });

  it("falls back to flat when stored preset is invalid", async () => {
    await db.audioSettings.put({ key: "equalizer.preset", value: "invalid" });

    await expect(getEqualizerPreset()).resolves.toBe("flat");
  });

  it("falls back to flat when reading settings fails", async () => {
    jest
      .spyOn(db.audioSettings, "get")
      .mockRejectedValueOnce(new Error("IndexedDB unavailable"));

    await expect(getEqualizerPreset()).resolves.toBe("flat");
  });

  it("does not throw when writing settings fails", async () => {
    jest
      .spyOn(db.audioSettings, "put")
      .mockRejectedValueOnce(new Error("Quota exceeded"));

    await expect(setEqualizerPreset("bass")).resolves.toBeUndefined();
  });
});
