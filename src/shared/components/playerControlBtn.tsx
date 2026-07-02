import React from "react";
import clsx from "clsx";

export interface PlayerControlButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** hover 시 반투명 배경 원. 기본 true = 현행 동작 (모바일 사용처 무변경) */
  hoverSurface?: boolean;
  /** press 시 scale-down 피드백. 데스크톱 사용처에서만 opt-in */
  pressFeedback?: boolean;
  /** 포인터 클릭 후 포커스 해제 → 전역 재생 단축키 복원. 키보드 활성화(detail 0)는 포커스 유지 */
  blurOnPointerClick?: boolean;
}

export const PlayerControlButton: React.FC<
  React.PropsWithChildren<PlayerControlButtonProps>
> = ({
  children,
  className,
  hoverSurface = true,
  pressFeedback = false,
  blurOnPointerClick = false,
  onClick,
  ...props
}) => {
  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    onClick?.(event);
    if (blurOnPointerClick && event.detail > 0) {
      event.currentTarget.blur();
    }
  };

  return (
    <button
      {...props}
      onClick={handleClick}
      className={clsx(
        "cursor-pointer rounded-full p-2 transition-[color,background-color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fd6d94] focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-40",
        hoverSurface && "hover:bg-white/10",
        pressFeedback && "active:scale-95",
        className
      )}
    >
      {children}
    </button>
  );
};
