import React, { useCallback } from "react";
import { Heart } from "lucide-react";
import { LikeButtonProps } from "../types/dataType";
import { TrackFavoriteAdapter } from "../../entities/Track/trackFavoriteAdapter";
import ProtectTooltip from "../../features/auth/components/protectTooltip";

// TODO: 빌더패턴 적용
// 주어진 props에 따라 순수하게 동작해야 한다

class ClassNameBuilder {
  private classes: string[];
  constructor() {
    this.classes = [];
  }

  addBase(baseClass: string) {
    this.classes.push(baseClass);
    return this;
  }

  addCondition(condition: boolean | undefined, className: string) {
    if (condition) {
      this.classes.push(className);
    }
    return this;
  }

  build() {
    return this.classes.join(" ");
  }
}

export const LikeButton = React.memo(
  ({ track, role, isFavorite, toggleFavorite }: LikeButtonProps) => {
    if (!role) return null;
    const interact = role.favoriteInteract;

    const wrappedButtonOnClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        const unifiedTrack = TrackFavoriteAdapter.unifyTrack(track);
        toggleFavorite(unifiedTrack.id);
      },
      // toggleFavorite: 함수 변경 여부로 클로저 캐싱하여 내부 상태 데이터 최신화
      [track, toggleFavorite]
    );

    const iconClassName = new ClassNameBuilder()
      .addBase("w-4 h-4")
      .addCondition(!interact, "cursor-not-allowed")
      .addCondition(isFavorite, "text-pink-500 fill-pink-500/30")
      .addCondition(interact, "hover:text-pink-500 transition-colors")
      .build();

    const wrappedButtonClassName = new ClassNameBuilder()
      .addBase("p-1")
      .addCondition(!interact, "cursor-not-allowed")
      .build();

    return (
      <ProtectTooltip>
        <button
          disabled={!interact}
          className={wrappedButtonClassName}
          onClick={wrappedButtonOnClick}
        >
          <Heart className={iconClassName} />
        </button>
      </ProtectTooltip>
    );
  }
);
