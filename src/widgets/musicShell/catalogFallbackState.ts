import type { Track } from "@/entities/track";
import type { MusicView } from "./musicShellHeader";

export type CatalogFallbackStatus =
  | "loading_initial"
  | "ready"
  | "refreshing_with_data"
  | "catalog_error_empty"
  | "catalog_error_with_stale_data"
  | "search_empty"
  | "recent_empty"
  | "recent_unavailable";

export interface CatalogFallbackCopy {
  tone: "warning" | "error";
  title: string;
  description: string;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
}

export type CatalogFallbackNotice = CatalogFallbackCopy;

export type CatalogFallbackInput = {
  activeView: MusicView;
  currentTracks: Track[];
  previousCatalogTracks: Track[];
  isCatalogLoading: boolean;
  isCatalogError: boolean;
  hasSearchQuery: boolean;
  recentUnavailable: boolean;
};

export type CatalogFallbackState = {
  status: CatalogFallbackStatus;
  visibleTracks: Track[];
  emptyMessage: string;
  isShowingStaleData: boolean;
  notice: CatalogFallbackNotice | null;
};

export function resolveCatalogFallbackState({
  activeView,
  currentTracks,
  previousCatalogTracks,
  isCatalogLoading,
  isCatalogError,
  hasSearchQuery,
  recentUnavailable,
}: CatalogFallbackInput): CatalogFallbackState {
  if (activeView === "recent") {
    if (recentUnavailable) {
      return {
        status: "recent_unavailable",
        visibleTracks: [],
        emptyMessage: "최근 재생 목록을 불러올 수 없습니다.",
        isShowingStaleData: false,
        notice: {
          tone: "warning",
          title: "최근 재생 목록을 불러올 수 없습니다",
          description: "카탈로그 전체 목록은 계속 탐색할 수 있습니다.",
          secondaryActionLabel: "전체 보기",
        },
      };
    }

    if (currentTracks.length === 0) {
      return {
        status: "recent_empty",
        visibleTracks: [],
        emptyMessage: "최근 재생한 트랙이 없습니다.",
        isShowingStaleData: false,
        notice: null,
      };
    }

    return {
      status: "ready",
      visibleTracks: currentTracks,
      emptyMessage: "최근 재생한 트랙이 없습니다.",
      isShowingStaleData: false,
      notice: null,
    };
  }

  if (isCatalogError) {
    if (previousCatalogTracks.length > 0) {
      return {
        status: "catalog_error_with_stale_data",
        visibleTracks: previousCatalogTracks,
        emptyMessage: "",
        isShowingStaleData: true,
        notice: {
          tone: "warning",
          title: hasSearchQuery
            ? "검색 결과를 새로 불러오지 못했습니다"
            : "카탈로그를 새로 불러오지 못했습니다",
          description: "마지막으로 불러온 결과를 계속 표시합니다.",
          primaryActionLabel: "다시 시도",
        },
      };
    }

    return {
      status: "catalog_error_empty",
      visibleTracks: [],
      emptyMessage: "카탈로그를 불러올 수 없습니다.",
      isShowingStaleData: false,
      notice: {
        tone: "error",
        title: "카탈로그를 불러올 수 없습니다",
        description: "네트워크 상태를 확인한 뒤 다시 시도해 주세요.",
        primaryActionLabel: "다시 시도",
      },
    };
  }

  if (isCatalogLoading && currentTracks.length === 0) {
    return {
      status: "loading_initial",
      visibleTracks: [],
      emptyMessage: "트랙을 불러오는 중입니다.",
      isShowingStaleData: false,
      notice: null,
    };
  }

  if (isCatalogLoading && currentTracks.length > 0) {
    return {
      status: "refreshing_with_data",
      visibleTracks: currentTracks,
      emptyMessage: "",
      isShowingStaleData: false,
      notice: {
        tone: "warning",
        title: "카탈로그를 새로 확인하는 중입니다",
        description: "현재 목록은 계속 사용할 수 있습니다.",
      },
    };
  }

  if (currentTracks.length === 0 && hasSearchQuery) {
    return {
      status: "search_empty",
      visibleTracks: [],
      emptyMessage: "검색 결과가 없습니다.",
      isShowingStaleData: false,
      notice: null,
    };
  }

  return {
    status: "ready",
    visibleTracks: currentTracks,
    emptyMessage: "현재 보기에 표시할 트랙이 없습니다.",
    isShowingStaleData: false,
    notice: null,
  };
}
