import { render, waitFor } from "@testing-library/react";
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
    resume: jest.fn(() => Promise.resolve()),
  } as unknown as AudioContext);

const createAudioMock = () =>
  ({
    paused: true,
    currentTime: 0,
    play: jest.fn(() => Promise.resolve()),
    pause: jest.fn(),
  } as unknown as HTMLAudioElement);

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
    window.dispatchEvent(new Event("pageshow"));

    // context-first 전략: resume 1회 → play 1회
    await waitFor(() => expect(onResume).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onPlay).toHaveBeenCalledTimes(1));
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

    await waitFor(() => expect(onResume).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onPlay).toHaveBeenCalledTimes(1));
  });

  it("uses media-element-first restore strategy when configured", async () => {
    const callOrder: string[] = [];
    const audioContext = {
      state: "suspended" as AudioContextState,
      resume: jest.fn(() => {
        callOrder.push("resume");
        return Promise.resolve();
      }),
    } as unknown as AudioContext;
    const audio = {
      ...(createAudioMock() as Partial<HTMLAudioElement>),
      paused: true,
      play: jest.fn(() => {
        callOrder.push("play");
        return Promise.resolve();
      }),
    } as unknown as HTMLAudioElement;
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
    window.dispatchEvent(new Event("pageshow"));

    // media-element-first 전략: play → resume → play (mock의 paused가 true로 유지되므로 재시도 play 발생)
    await waitFor(() => expect(callOrder).toEqual(["play", "resume", "play"]));
    expect(onPlay).toHaveBeenCalledTimes(2);
    expect(onResume).toHaveBeenCalledTimes(1);
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
