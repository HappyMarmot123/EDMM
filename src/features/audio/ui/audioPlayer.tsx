"use client";

import { useState, useRef, useEffect } from "react";
import PlayerTrackDetails from "@/features/audio/components/playerTrackDetails";
import PlayerControlsSection from "@/features/audio/components/playerControlsSection";
import AlbumArtwork from "@/features/audio/components/albumArtwork";
import Draggable, {
  DraggableEvent,
  type DraggableBounds,
} from "react-draggable";
import { useToggle } from "@/shared/providers/toggleProvider";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";
import { useViewport } from "@/shared/hooks/useViewport";

/* 
  TODO: 
  Audio PlayerOpen Source = https://codepen.io/singhimalaya/pen/QZKqOX
  react-draggable Docs = https://www.npmjs.com/package/react-draggable#technical-documentation
 
  Next.js는 기본적으로 React Strict Mode를 사용합니다.

  React Strict 모드에서 실행하는 경우 ReactDOM.findDOMNode()는 더 이상 사용되지 않습니다.
  안타깝게도 <Draggable>이 제대로 작동하려면 기본 DOM 노드에 대한 원시 접근이 필요합니다.
  경고를 피하려면 다음 예제와 같이 `nodeRef`를 전달하세요.

  const nodeRef = React.useRef(null);
  return (
  <Draggable nodeRef={nodeRef}>
  <div ref={nodeRef}>예제 대상</div>
  </Draggable>
*/

// Root here
export default function AudioPlayer() {
  const { currentTrack, isPlaying, isBuffering, currentTime, duration, seek } =
    useAudioPlayer();
  const { openToggle } = useToggle();
  const { isMobile } = useViewport();
  const seekBarContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const draggableRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState<DraggableBounds | undefined>(undefined);
  const defaultPositionRef = useRef({ x: 100, y: 640 });
  const [draggableKey, setDraggableKey] = useState(Date.now());

  const currentProgress = duration > 0 ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    if (isMobile) return;
    const playerElement = draggableRef.current;
    if (playerElement) {
      const updateBounds = () => {
        const elWidth = playerElement.offsetWidth;
        const elHeight = playerElement.offsetHeight;
        const initialTopBound = 60;
        const initialRightBound = 30;
        const initialBottomBound = 10;
        const initialLeftBound = 0;

        setBounds({
          left: initialLeftBound,
          top: initialTopBound,
          right: window.innerWidth - elWidth - initialRightBound,
          bottom: window.innerHeight - elHeight - initialBottomBound,
        });
      };

      updateBounds();
      window.addEventListener("resize", updateBounds);
      return () => window.removeEventListener("resize", updateBounds);
    }
  }, [isMobile]);

  const handleDrag = (e: DraggableEvent) => {
    isDragging.current = true;

    if (
      e.target instanceof HTMLElement &&
      e.target.classList.contains("no-drag")
    ) {
      return false;
    }
  };

  if (!currentTrack) {
    return null;
  }

  if (isMobile) {
    return (
      <div
        id="player-container-mobile"
        className="fixed bottom-0 left-0 w-full h-[80px] bg-white z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]"
        aria-label="Audio Player"
      >
        <section
          id="seek-bar-container-mobile"
          ref={seekBarContainerRef}
          className="absolute top-0 left-0 w-full h-[6px] cursor-pointer group"
        >
          <div className="w-full h-full bg-gray-200">
            <div
              id="seek-bar-mobile"
              className="h-full bg-[#fd6d94] transition-all duration-100 ease-linear"
              style={{ width: `${currentProgress}%` }}
            >
              <span className="absolute right-0 top-1/2 -mt-1 h-3 w-3 bg-white border-2 border-[#fd6d94] rounded-full opacity-0 group-hover:opacity-100"></span>
            </div>
          </div>
        </section>
        <div
          id="player-mobile"
          className="relative h-full flex items-center px-4 justify-between"
        >
          <div className="flex items-center flex-1 min-w-0">
            <AlbumArtwork
              isPlaying={isPlaying}
              isBuffering={isBuffering}
              currentTrackInfo={currentTrack}
              onClick={() => {
                if (!isDragging.current) {
                  openToggle();
                }
              }}
              isMobile={isMobile}
            />
            <PlayerTrackDetails
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              currentProgress={currentProgress}
              seekBarContainerRef={seekBarContainerRef}
              seek={seek}
              isMobile={isMobile}
              currentTrackInfo={currentTrack}
            />
          </div>
          <PlayerControlsSection
            currentTrackInfo={currentTrack}
            isMobile={isMobile}
          />
        </div>
      </div>
    );
  }

  return (
    <Draggable
      key={draggableKey}
      bounds={bounds}
      defaultPosition={defaultPositionRef.current}
      nodeRef={draggableRef as React.RefObject<HTMLElement>}
      handle=".draggable-handle"
      cancel=".no-drag"
      onDrag={handleDrag}
      onStop={(e) => {
        setTimeout(() => {
          isDragging.current = false;
        }, 0);
      }}
    >
      <div
        ref={draggableRef}
        id="player-container"
        className="fixed w-full max-w-md h-[80px] z-50 select-none"
        aria-roledescription="Draggable audio player"
        aria-label="Audio Player"
      >
        <div
          id="player"
          className="relative h-full z-[3] draggable-handle cursor-grab active:cursor-grabbing"
          role="button"
          aria-label="Drag to move player"
        >
          <PlayerTrackDetails
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            currentProgress={currentProgress}
            seekBarContainerRef={seekBarContainerRef}
            seek={seek}
          />
          <div
            id="player-content"
            className="relative h-full bg-white shadow-[0_15px_40px_rgba(0,0,0,0.2)] rounded-[15px] z-[2]"
          >
            <AlbumArtwork
              isPlaying={isPlaying}
              isBuffering={isBuffering}
              currentTrackInfo={currentTrack}
              onClick={() => {
                if (!isDragging.current) {
                  openToggle();
                }
              }}
              isMobile={isMobile}
            />
            <PlayerControlsSection currentTrackInfo={currentTrack} />
          </div>
        </div>
      </div>
    </Draggable>
  );
}
