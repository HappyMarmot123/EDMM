import { act, renderHook, waitFor } from "@testing-library/react";
import { db } from "@/shared/db";
import { useFavorites } from "@/features/library";
import { usePlaylists } from "@/features/library";
import { useRecentPlays } from "@/features/library";

beforeEach(async () => {
  await db.delete();
  await db.open();
});

afterEach(async () => {
  await db.delete();
  await db.open();
});

it("starts with no favorites", () => {
  const { result } = renderHook(() => useFavorites());

  expect(result.current.favoriteIds).toEqual(new Set());
  expect(result.current.isFavorite("t1")).toBe(false);
});

it("reflects toggled favorites reactively", async () => {
  const { result } = renderHook(() => useFavorites());

  await act(async () => {
    await result.current.toggle("t1");
  });

  await waitFor(() => expect(result.current.isFavorite("t1")).toBe(true));

  await act(async () => {
    await result.current.toggle("t1");
  });

  await waitFor(() => expect(result.current.isFavorite("t1")).toBe(false));
});

it("starts with no recent plays", () => {
  const { result } = renderHook(() => useRecentPlays());

  expect(result.current.recentIds).toEqual([]);
});

it("starts with no playlists", () => {
  const { result } = renderHook(() => usePlaylists());

  expect(result.current.playlists).toEqual([]);
});

it("reflects created playlists reactively", async () => {
  const { result } = renderHook(() => usePlaylists());

  await act(async () => {
    await result.current.create("Road set");
  });

  await waitFor(() => expect(result.current.playlists).toHaveLength(1));
  expect(result.current.playlists[0].name).toBe("Road set");
});
