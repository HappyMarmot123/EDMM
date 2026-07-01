import { useLiveQuery } from "dexie-react-hooks";
import {
  createPlaylist,
  getPlaylists,
} from "@/shared/db";
import type { PlaylistRow } from "@/shared/db";

export function usePlaylists(): {
  playlists: PlaylistRow[];
  create: (name: string) => Promise<number>;
} {
  const playlists = useLiveQuery(getPlaylists, [], []);

  return {
    playlists,
    create: createPlaylist,
  };
}
