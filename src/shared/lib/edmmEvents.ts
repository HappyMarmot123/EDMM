import type { Track } from "@/entities/track/model";

export const EDMM_EVENTS = {
  openPlayerFullscreen: "edmm:open-player-fullscreen",
  playerTrackZoneSelect: "edmm:player-track-zone-select",
} as const;

export type EdmmEventName = (typeof EDMM_EVENTS)[keyof typeof EDMM_EVENTS];

type EdmmEventPayloadMap = {
  [EDMM_EVENTS.openPlayerFullscreen]: {
    track: Track | null;
  };
  [EDMM_EVENTS.playerTrackZoneSelect]: {
    trackId: string;
  };
};

export type EdmmCustomEvent<TName extends EdmmEventName> = CustomEvent<
  EdmmEventPayloadMap[TName]
>;

export const dispatchEdmmEvent = <TName extends EdmmEventName>(
  target: Window,
  name: TName,
  detail: EdmmEventPayloadMap[TName],
) => {
  target.dispatchEvent(new CustomEvent(name, { detail }));
};

export const addEdmmEventListener = <TName extends EdmmEventName>(
  target: Window,
  name: TName,
  listener: (event: EdmmCustomEvent<TName>) => void,
) => {
  const eventListener: EventListener = (event) => {
    listener(event as EdmmCustomEvent<TName>);
  };

  target.addEventListener(name, eventListener);

  return () => {
    target.removeEventListener(name, eventListener);
  };
};
