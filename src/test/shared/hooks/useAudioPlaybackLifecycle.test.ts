import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { useAudioPlaybackLifecycle } from "@/shared/hooks/useAudioPlaybackLifecycle";

const TestHost = ({
  children,
  isPlaying,
  audio,
  audioContext,
  restoreStrategy,
}: {
  children?: ReactNode;
  isPlaying: boolean;
  audio: Partial<HTMLAudioElement> & Pick<
    HTMLAudioElement,
    "pause" | "play" | "currentTime" | "paused"
  >;
  audioContext: AudioContext;
  restoreStrategy?: "context-first" | "media-element-first";
}) => {
  useAudioPlaybackLifecycle({
    isPlaying,
    audio: audio as HTMLAudioElement,
    audioContext,
    restoreStrategy,
  });

  return <>{children}</>;
};

const createAudioContextMock = () =>
  ({
    state: "suspended" as AudioContextState,
    resume: jest.fn<() => Promise<void>>(() => Promise.resolve()),
  } as AudioContext);

const createAudioMock = () =>
  ({
    paused: true,
    currentTime: 0,
    play: jest.fn<() => Promise<void>>(() => Promise.resolve()),
    pause: jest.fn(),
  } as Partial<
    HTMLAudioElement & {
      paused: boolean;
    }
  > as HTMLAudioElement);

const setVisibilityState = (value: DocumentVisibilityState) => {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => value,
  });
};

describe("useAudioPlaybackLifecycle", () => {
  it("registers pagehide/pageshow and visibilitychange listeners", () => {
    const audioContext = createAudioContextMock();
    const audio = createAudioMock();
    const addEventListenerSpy = jest.spyOn(document, "addEventListener");

    render(
      <TestHost isPlaying={true} audio={audio} audioContext={audioContext}>
        <div>test</div>
      </TestHost>,
    );

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "visibilitychange",
      expect.any(Function),
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "pagehide",
      expect.any(Function),
    );
    expect(addEventListenerSpy).not.toHaveBeenCalledWith(
      "pageshow",
      expect.any(Function),
    );
  });

  it("resumes context and playback on pageshow after background", async () => {
    const audioContext = createAudioContextMock();
    const audio = createAudioMock();
    const onPlay = audio.play as jest.Mock;
    const onResume = audioContext.resume;

    render(
      <TestHost isPlaying={true} audio={audio} audioContext={audioContext} />,
    );

    document.dispatchEvent(new Event("pagehide"));
    await window.dispatchEvent(new Event("pageshow"));

    await Promise.resolve();

    expect(onResume).toHaveBeenCalledTimes(1);
    expect(onPlay).toHaveBeenCalledTimes(2);
  });

  it("resumes playback on visibilitychange visibility restore", async () => {
    const audioContext = createAudioContextMock();
    const audio = createAudioMock();
    const onPlay = audio.play as jest.Mock;
    const onResume = audioContext.resume;

    setVisibilityState("hidden");
    render(<TestHost isPlaying={true} audio={audio} audioContext={audioContext} />);

    document.dispatchEvent(new Event("visibilitychange"));
    setVisibilityState("visible");
    document.dispatchEvent(new Event("visibilitychange"));

    await Promise.resolve();

    expect(onResume).toHaveBeenCalledTimes(1);
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it("uses media-element-first restore strategy when configured", async () => {
    const audioContext = createAudioContextMock();
    const callOrder: string[] = [];
    const audio = {
      ...createAudioMock(),
      play: jest.fn<() => Promise<void>>(() => {
        callOrder.push("play");
        return Promise.resolve();
      }),
    } as Partial<
      HTMLAudioElement & {
        paused: boolean;
      }
    > as HTMLAudioElement;
    const onResume = audioContext.resume;
    const onPlay = audio.play as jest.Mock;

    render(
      <TestHost
        isPlaying={true}
        audio={audio}
        audioContext={audioContext}
        restoreStrategy="media-element-first"
      />,
    );

    document.dispatchEvent(new Event("pagehide"));
    await window.dispatchEvent(new Event("pageshow"));

    await Promise.resolve();

    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onResume).toHaveBeenCalledTimes(1);
    expect(callOrder).toEqual(["play", "resume", "play"]);
  });

  it("does not resume when hidden then shown while not playing", async () => {
    const audioContext = createAudioContextMock();
    const audio = createAudioMock();
    const onPlay = audio.play as jest.Mock;
    const onResume = audioContext.resume;

    render(
      <TestHost isPlaying={false} audio={audio} audioContext={audioContext} />,
    );
    document.dispatchEvent(new Event("pagehide"));
    await window.dispatchEvent(new Event("pageshow"));

    await Promise.resolve();

    expect(onResume).not.toHaveBeenCalled();
    expect(onPlay).not.toHaveBeenCalled();
  });
});
