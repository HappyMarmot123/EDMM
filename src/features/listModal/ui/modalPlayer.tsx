import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { CldImage } from "next-cloudinary";
import { motion } from "framer-motion";
import AudioVisualizer from "@/features/listModal/components/audioVisualizer";
import LoginSection from "@/features/listModal/components/loginSection";
import { useListModal } from "@/features/listModal/hook/useListModal";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";
import TrackSeekBar from "@/shared/components/trackSeekBar";
import { LikeButton } from "@/shared/components/likeButton";
import { TrackInfo } from "@/shared/types/dataType";
import { useAuth } from "@/shared/providers/authProvider";

export default function ModalPlayer() {
  const {
    currentTrack,
    isPlaying,
    isBuffering,
    analyserNode,
    currentTime,
    duration,
    togglePlayPause,
    nextTrack,
    prevTrack,
    favoriteAssetIds,
    toggleFavorite,
    isMuted,
    localVolume,
    showVolumeSlider,
    handleVolumeChange,
    handleVolumeChangeEnd,
    handleVolumeMouseEnter,
    handleVolumeMouseLeave,
    toggleMute,
  } = useListModal();
  const { role } = useAuth();
  const { seek } = useAudioPlayer();

  if (!currentTrack) return null;

  const initFavorite = (track: TrackInfo) => {
    return favoriteAssetIds.has(track.assetId);
  };

  return (
    <div className="h-full p-4 sm:p-8 flex flex-col items-center border-r border-white/10 md:col-span-2">
      <div className="flex flex-col items-center flex-grow w-full">
        <section aria-label="현재 재생트랙" className="w-full mb-8 sm:mb-16">
          <div
            className="relative flex flex-col items-center justify-center pt-8 overflow-hidden"
            style={
              {
                "--reflection-height": "40px",
                "--reflection-opacity": "0.3",
                maskImage:
                  "linear-gradient(to bottom, black 0%, black calc(100% - var(--reflection-height)), transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, black 0%, black calc(100% - var(--reflection-height)), transparent 100%)",
              } as React.CSSProperties
            }
          >
            <div
              className="absolute bottom-0 w-full bg-no-repeat bg-center bg-cover"
              style={{
                height: "var(--reflection-height)",
                backgroundImage: `url(${currentTrack?.artworkId})`,
                transform: "scaleY(-1)",
                filter: "blur(2px) opacity(var(--reflection-opacity))",
                WebkitTransform: "scaleY(-1)",
              }}
            />
            {analyserNode && (
              <div className="absolute z-0">
                <AudioVisualizer
                  analyserNode={analyserNode}
                  isPlaying={isPlaying}
                  width={600}
                  height={200}
                />
              </div>
            )}
            {isBuffering ? (
              <div className="grid place-items-center w-56 h-56 bg-white/10 animate-pulse rounded-xl">
                <div className="w-8 h-8 border-4  border-white border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <motion.div
                key={currentTrack.assetId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.75 }}
                className="w-56 h-56 rounded-xl perspective-1000 z-10 overflow-hidden shadow-[0_-5px_25px_rgba(255,255,255,0.3)]"
              >
                <CldImage
                  src={currentTrack.artworkId as string}
                  className="select-none w-full h-full object-cover"
                  width={224}
                  height={224}
                  alt={currentTrack.album || "Album Art"}
                  priority
                  draggable={false}
                />
              </motion.div>
            )}
          </div>
        </section>

        <div className="w-full max-w-md">
          <motion.h2
            key={`${currentTrack?.assetId}-name`}
            animate={{ y: isPlaying ? [0, -2, 0] : 0 }}
            transition={{
              duration: 1.5,
              repeat: isPlaying ? Infinity : 0,
              ease: "easeInOut",
            }}
            className="text-3xl font-bold mb-2 truncate"
          >
            {currentTrack?.name}
          </motion.h2>
          <motion.h3
            key={`${currentTrack?.assetId}-producer`}
            animate={{ y: isPlaying ? [0, 2, 0] : 0 }}
            transition={{
              duration: 1.5,
              repeat: isPlaying ? Infinity : 0,
              ease: "easeInOut",
              delay: 0.2,
            }}
            className="text-xl text-gray-300 mb-4 truncate"
          >
            {currentTrack?.producer}
          </motion.h3>

          <TrackSeekBar
            currentTime={currentTime}
            duration={duration}
            seek={seek}
          />

          <section aria-label="재생 컨트롤" className="mt-6">
            <div className="flex items-center justify-between w-full">
              <motion.div
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="p-2 rounded-full transition bg-white/10"
              >
                <LikeButton
                  track={currentTrack}
                  role={role}
                  isFavorite={initFavorite(currentTrack)}
                  toggleFavorite={toggleFavorite}
                />
              </motion.div>

              <div className="flex items-center justify-center space-x-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                  onClick={prevTrack}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
                >
                  <SkipBack width={20} fill="white" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                  onClick={togglePlayPause}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition"
                >
                  {isPlaying ? (
                    <Pause width={20} fill="white" />
                  ) : (
                    <Play width={20} fill="white" />
                  )}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                  onClick={nextTrack}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
                >
                  <SkipForward width={20} fill="white" />
                </motion.button>
              </div>

              <div
                className="flex items-center relative z-50"
                onMouseEnter={handleVolumeMouseEnter}
                onMouseLeave={handleVolumeMouseLeave}
              >
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                  onClick={toggleMute}
                  className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <VolumeX size={20} fill="white" />
                  ) : (
                    <Volume2 size={20} fill="white" />
                  )}
                </motion.button>
                {showVolumeSlider && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg flex flex-col items-center justify-center"
                    style={{
                      height: "120px",
                      width: "-webkit-fill-available",
                      padding: "1rem",
                    }}
                  >
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : localVolume}
                      onChange={handleVolumeChange}
                      onMouseUp={handleVolumeChangeEnd}
                      onTouchEnd={handleVolumeChangeEnd}
                      className="w-[80px] h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer origin-center transform -rotate-90 
                                 [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-lg [&::-webkit-slider-runnable-track]:bg-white/20
                                 [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-lg [&::-moz-range-track]:bg-white/20
                                 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white/50 [&::-webkit-slider-thumb]:cursor-pointer 
                                 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white/50 [&::-moz-range-thumb]:cursor-pointer"
                      style={{ width: "80px" }}
                    />
                  </motion.div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
      <LoginSection />
    </div>
  );
}
