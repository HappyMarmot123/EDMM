import useRecentPlayStore from "@/app/store/recentPlayStore";
import { act } from "react";

describe("useRecentPlayStore", () => {
  beforeEach(() => {
    // 각 테스트 전에 스토어 상태를 초기화합니다.
    act(() => {
      useRecentPlayStore.setState({
        recentAssetIds: new Set(),
      });
    });
  });

  it("should add a new asset ID to the recent list", () => {
    act(() => {
      useRecentPlayStore.getState().addRecentAssetId("test-id-1");
    });
    const { recentAssetIds } = useRecentPlayStore.getState();
    expect(recentAssetIds).toContain("test-id-1");
    expect(recentAssetIds.size).toBe(1);
  });

  it("should not add a duplicate asset ID", () => {
    act(() => {
      useRecentPlayStore.getState().addRecentAssetId("test-id-1");
      useRecentPlayStore.getState().addRecentAssetId("test-id-1");
    });
    const { recentAssetIds } = useRecentPlayStore.getState();
    expect(recentAssetIds.size).toBe(1);
  });

  it("should place the most recent asset ID at the beginning of the set", () => {
    act(() => {
      useRecentPlayStore.getState().addRecentAssetId("test-id-1");
      useRecentPlayStore.getState().addRecentAssetId("test-id-2");
    });
    const { recentAssetIds } = useRecentPlayStore.getState();
    const arrayFromSet = Array.from(recentAssetIds);
    expect(arrayFromSet[0]).toBe("test-id-2");
  });

  it("should not exceed the maximum number of recent assets", () => {
    act(() => {
      for (let i = 0; i < 15; i++) {
        useRecentPlayStore.getState().addRecentAssetId(`test-id-${i}`);
      }
    });
    const { recentAssetIds } = useRecentPlayStore.getState();
    expect(recentAssetIds.size).toBe(10);
  });

  it("should remove the oldest asset when the list is full", () => {
    act(() => {
      for (let i = 0; i < 10; i++) {
        useRecentPlayStore.getState().addRecentAssetId(`test-id-${i}`);
      }
      useRecentPlayStore.getState().addRecentAssetId("new-id");
    });
    const { recentAssetIds } = useRecentPlayStore.getState();
    const arrayFromSet = Array.from(recentAssetIds);
    expect(arrayFromSet).not.toContain("test-id-0");
    expect(arrayFromSet[0]).toBe("new-id");
  });
});
