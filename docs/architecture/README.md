# EDMM 아키텍처 현행 문서

기준일: 2026-06-28

## 1. 런타임 진입점

- `/`는 `src/app/page.tsx`에서 `src/widgets/landing`을 렌더링한다.
- `/search`는 현재 음악 탐색과 플레이어 선택의 주 진입점이다.
- `/search?view=all|recent`만 유효한 검색 뷰로 처리한다. 그 외 값은 `all`로 정규화된다.
- `/search?track=<trackId>`는 특정 트랙을 초기 선택 대상으로 전달한다.
- `/track/[id]`는 트랙 상세 페이지를 직접 렌더링하지 않고, id를 디코딩한 뒤 `/search?track=<id>`로 리다이렉트한다.
- `src/views/library`와 favorites 저장소는 코드에 남아 있지만 현재 `src/app` 아래의 `/library` 라우트에는 연결되어 있지 않다.

## 2. 최상위 구성

```mermaid
flowchart TD
  Root[src/app/layout.tsx] --> Providers[src/app/appProviders.tsx]
  Providers --> Tanstack[TanstackProvider]
  Providers --> AudioProvider[AudioPlayerProvider]
  Providers --> ToggleProvider[ToggleProvider]
  Providers --> PlayerWidget[src/widgets/audioPlayer]

  HomeRoute[src/app/page.tsx] --> Landing[src/widgets/landing]

  SearchRoute[src/app/search/page.tsx] --> SearchClient[src/app/search/searchPageClient.tsx]
  SearchClient --> AudioShell[src/widgets/audioPlayer/audioPlayerShell.tsx]
  AudioShell --> SearchView[src/views/search/index.tsx]
  SearchView --> MusicShell[src/widgets/musicShell/index.tsx]

  TrackRoute[src/app/track/[id]/page.tsx] --> Decode[src/app/track/[id]/trackId.ts]
  Decode --> Redirect[/search?track=id]
```

## 3. Search/MusicShell 구성

```mermaid
flowchart TD
  MusicShell[src/widgets/musicShell/index.tsx]
  MusicShell --> Header[musicShellHeader.tsx]
  MusicShell --> List[musicTrackList.tsx]
  MusicShell --> Detail[trackDetailAside.tsx]
  MusicShell --> Seed[useMusicShellTrackSeed.ts]
  MusicShell --> SeedUtils[trackSeedUtils.ts]

  MusicShell --> CloudHook[useCloudinaryTracks]
  MusicShell --> RecentHook[useRecentPlays]
  MusicShell --> TrackCache[trackCacheRepo]
  Detail --> TrackCache
  Detail --> AudioProvider[useAudioPlayer]
```

- `MusicShellHeader`는 `all`, `recent` 두 뷰만 노출한다.
- `all` 뷰는 `useCloudinaryTracks(query, { resourceType: "all" })` 결과를 사용한다.
- `recent` 뷰는 `useRecentPlays()`에서 id 목록을 받고 `getCachedTracks(ids)`로 표시 가능한 트랙을 복원한다.
- `MusicShell`은 `selectedTrackId`, `selectionSource`, `visibleTracks`, `currentTrackId`를 조합해 리스트 선택과 상세 패널 선택을 동기화한다.
- `useMusicShellTrackSeed`는 초기 딥링크 트랙과 최근 재생 트랙의 자동 시드 부수효과를 담당한다.
- `trackSeedUtils`는 선택 트랙, visible match, cache match, first playable fallback 우선순위를 순수 함수로 제공한다.

## 4. 초기 트랙 시드 흐름

```mermaid
sequenceDiagram
  autonumber
  participant Route as /search page
  participant Shell as MusicShell
  participant Seed as useMusicShellTrackSeed
  participant Cache as trackCacheRepo
  participant Player as AudioPlayerProvider
  participant Detail as TrackDetailAside

  Route->>Shell: initialView, initialTrackId 전달
  Shell->>Shell: selectionSource = initial 또는 null
  Shell->>Seed: selectedTrackId, selectedTrack, visibleTracks 전달
  Seed->>Cache: 필요 시 getCachedTrack(trackId)
  Seed->>Shell: resolve 성공 시 activateTrackInPlayer(track)
  Shell->>Player: onPlay(track, queue, false)
  Shell->>Detail: detailSelectedTrackId, fallbackTrack, isWaitingForSelectionSeed 전달
  Detail->>Cache: getCachedTrack(selectedTrackId)
```

현재 `/search?track=...` 첫 진입에서 `visibleTracks`가 아직 비어 있고 캐시도 즉시 준비되지 않은 경우가 있다. 이때 `useMusicShellTrackSeed`는 성급하게 첫 곡 fallback 또는 선택 해제를 하지 않고, visible 데이터가 준비되는 다음 렌더에서 다시 평가한다. `TrackDetailAside`도 이 초기 대기 구간에서는 `Details unavailable` 대신 로딩 상태를 유지한다.

## 5. 플레이어 경계

- `AudioPlayerShell`은 `useAudioPlayer().playTrack`을 `SearchView`에 콜백으로 전달하는 얇은 어댑터다.
- 실제 오디오 부수효과는 `AudioPlayerProvider`가 소유한다.
- `AudioPlayerProvider`는 재생 트랙, 큐, 재생 상태, duration/currentTime, volume/mute, analyser 상태를 관리한다.
- 트랙 재생 시 `trackCacheRepo.cacheTrack`과 `recentPlaysRepo.addRecentPlay`로 캐시와 최근 재생 목록을 갱신한다.
- 오디오 인스턴스와 이벤트 리스너 관리는 `audioInstanceStore`, `audioEventManager`, `audioInstance` 계층에 분리되어 있다.

## 6. 데이터 계층

- `src/shared/db/edmmDB.ts`가 Dexie 스키마를 정의한다.
- `trackCacheRepo`는 Cloudinary/API에서 얻은 `Track` 메타데이터를 캐시하고 상세 패널/최근 목록 복원에 사용한다.
- `recentPlaysRepo`는 최근 재생 id를 최신순으로 저장하고 중복을 정리한다.
- `favoritesRepo`와 `useFavorites`는 `TrackList`, `LibraryView` 등에서 사용 가능하지만 현재 `MusicShell`의 뷰 전환 축에는 포함되지 않는다.

## 7. API와 외부 데이터

- `src/app/api/cloudinary/tracks/route.ts`는 통합 트랙 조회 엔드포인트다.
- `src/app/api/cloudinary/tracks/video/route.ts`와 `image/route.ts`는 리소스 타입별 조회를 담당한다.
- `useCloudinaryTracks`는 React Query로 API 결과를 가져오고, `resourceType: "all"`일 때 비디오 트랙에 이미지 트랙을 artwork fallback으로 병합한다.
- 조회된 트랙은 가능한 경우 `trackCacheRepo.cacheTrack`으로 저장된다.

## 8. 결합도와 변경 위험

| 영역 | 결합도 | 근거 | 주요 영향 |
| --- | ---: | --- | --- |
| `MusicShell` ↔ `AudioPlayerProvider` | 5 | `onPlay`, 큐, 현재 트랙 상태가 핵심 UX를 결정 | 검색, 상세, 하단 플레이어 |
| `AudioPlayerProvider` 내부 오디오 제어 | 5 | DOM Audio/API와 이벤트 상태를 직접 관리 | 재생/일시정지/seek/volume |
| `MusicShell` ↔ `useMusicShellTrackSeed` | 4 | 초기 진입, 최근 재생, 딥링크 선택을 조정 | `/search?track=...`, 최근 재생 복원 |
| `MusicShell` ↔ `trackCacheRepo` | 4 | 최근 목록과 초기 트랙 복구가 캐시에 의존 | Detail 표시, Recent 뷰 |
| `TrackDetailAside` ↔ `trackCacheRepo/useAudioPlayer` | 3 | 캐시, fallback, 현재 재생 트랙을 조합 | 상세 패널 메타데이터 |
| `trackSeedUtils` | 2 | 순수 함수 중심 | 시드 우선순위 규칙 |
| `trackArtwork` | 2 | artwork fallback 정규화 | 썸네일 일관성 |

## 9. 리팩터링 가드레일

- 오디오 DOM/API 조작은 `AudioPlayerProvider` 밖으로 옮기지 않는다.
- 라우트 컴포넌트는 쿼리 파싱과 초기 prop 전달까지만 담당한다.
- `MusicShell`은 선택/뷰/시드 상태를 오케스트레이션하되 실제 미디어 부수효과를 직접 수행하지 않는다.
- 캐시 조회는 렌더 중 실행하지 않고 hook/effect에서 취소 가드와 함께 처리한다.
- 초기 딥링크 선택(`selectionSource="initial"`)과 사용자의 직접 선택(`selectionSource="visible"`)을 섞지 않는다.
- `visibleTracks`가 비동기로 비어 있는 로딩 구간과 실제 빈 결과를 구분한다.

## 10. 현재 보완된 초기 진입 이슈

문제 경로:

- `/search?track=<id>`로 처음 진입한다.
- `selectedTrackId`는 먼저 세팅되지만 Cloudinary 목록과 IndexedDB 캐시 조회가 아직 완료되지 않았다.
- 이전 흐름에서는 `visibleTracks=[]`인 순간에 fallback이 먼저 실행되어 선택이 해제되거나 상세 패널이 `Details unavailable`로 전환될 수 있었다.

현재 대응:

- `useMusicShellTrackSeed`는 `visibleTracks`가 아직 비어 있고 `selectedTrack`도 없으면 초기 fallback을 보류한다.
- 초기 시드 fingerprint에 visible 준비 상태를 포함해, 목록이 준비된 뒤 같은 `selectedTrackId`를 다시 평가한다.
- `TrackDetailAside`는 `isWaitingForSelectionSeed`가 true인 동안 오류 UI 대신 로딩 UI를 유지한다.
- `MusicShell`은 이 대기 상태를 `selectionSource === "initial" && !selectedTrack && isVisibleLoading`일 때만 전달한다.

## 11. 검증 우선순위

1. `/search?track=<id>` 첫 진입 중 캐시 미스와 카탈로그 로딩이 겹쳐도 Detail이 선택을 잃지 않는지 확인한다.
2. `/search` 기본 진입에서 첫 visible track이 컨트롤러 대상이 되는지 확인한다.
3. `Recent` 뷰에서 캐시 트랙을 표시하고, `All`로 전환할 때 보이지 않는 선택 상세가 정리되는지 확인한다.
4. 행 클릭은 상세 선택만 수행하고, Play 버튼은 명시적으로 재생을 시작하는지 확인한다.
5. `/track/[id]`가 `/search?track=<id>`로 정규화되는지 확인한다.

## 12. 롤백 포인트

- 초기 시드 문제가 생기면 `useMusicShellTrackSeed.ts`의 initial branch부터 확인한다.
- 상세 패널이 오래 로딩되면 `MusicShell`의 `isWaitingForSelectionSeed` 조건과 `isVisibleLoading` 계산을 확인한다.
- Recent 뷰가 비면 `useRecentPlays` 결과와 `getCachedTracks(ids)` 호출 순서를 확인한다.
- 재생 자체가 실패하면 `MusicShell`보다 먼저 `AudioPlayerProvider.playTrack`과 오디오 인스턴스 상태를 확인한다.
