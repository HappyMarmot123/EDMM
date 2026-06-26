# EDMM Cloudinary + Spotify Shell 개편: 1단계 스크리닝

작성일: 2026-06-26

## 요청된 진행 순서

이 문서는 요청된 순차 진행 중 1단계 산출물입니다.

1. 아이디어 제안 및 스크리닝
2. 기획설계
3. 코드베이스 기반 문서구체화
4. 문서검토
5. 작업 Task 분리
6. Subagent-driven 구현진행

## 요청 범위

- Cloudinary를 다시 사용해 음원 리소스를 조회하고 음원 리스트를 보여준다.
- 기존 외부 음악 API는 사용하지 않는다.
- 랜딩페이지 백그라운드 별 개수를 조금 줄인다.
- 랜딩페이지 별 영역은 전체 너비가 아니라 80% 너비로 제한하고 오른쪽에 배치한다.
- Favorite 페이지와 Search 페이지를 하나로 머지한다.
- Spotify 웹앱 구조를 따른다: header, main, footer/player, 오른쪽 aside detail.
- 플레이어 컨트롤러의 큰 레이아웃은 유지하되, 세부 UI/UX를 Spotify 참고 방향으로 개선한다.

## 현재 코드베이스 확인 결과

### 데이터와 API

- 현재 런타임 음악 데이터는 Audius에서 온다.
  - `src/features/search/hooks/useTrackSearch.ts`는 `/api/audius/search`를 호출한다.
  - `src/features/discover/hooks/useTrending.ts`는 `/api/audius/trending`을 호출한다.
  - `src/app/api/audius/stream/[id]/route.ts`는 재생 스트림을 프록시한다.
- 가사도 별도 외부 API 경로를 사용한다.
  - `src/features/lyrics/hooks/useLyrics.ts`는 `/api/lyrics`를 호출한다.
  - `src/app/api/lyrics/route.ts`는 lyrics client를 호출한다.
- 런타임 Cloudinary API 코드는 현재 없다. Cloudinary 참조는 과거 coverage, 과거 문서, 로컬 환경 설정에만 남아 있다.
- `.env.local`에는 Cloudinary 설정이 이미 있고, `.gitignore`에 의해 Git 추적 대상에서 제외된다.
- 설정된 Cloudinary 음원 폴더를 실제 Admin Search로 확인한 결과:
  - `total_count`: 1
  - `resource_type`: `video`
  - `format`: `mp3`
  - `duration`: 초 단위
  - sample asset에 context, metadata, tag는 없음

Cloudinary의 audio asset은 `video` resource type으로 조회된다. 현재 `Track.durationMs`는 밀리초 단위이므로 Cloudinary `duration` 값을 변환해야 한다.

참고 문서:

- Cloudinary Admin API는 media assets/resources를 관리하며 rate limit이 있다: https://cloudinary.com/documentation/admin_api
- Cloudinary Search API는 public ID, filename, folder, tag, context 같은 필드 기반 expression 검색을 지원한다: https://cloudinary.com/documentation/search_method
- Cloudinary Node SDK는 `cloud_name`, `api_key`, `api_secret` 구성을 사용하며 API secret은 공개되면 안 된다: https://cloudinary.com/documentation/node_integration

### 도메인 모델

- `src/entities/track/model.ts`는 현재 `Track.source`를 `"audius"`로 제한한다.
- 재생 가능 여부는 `Track.streamUrl` 존재 여부에 의존한다.
- `src/shared/providers/audioPlayerProvider.tsx`에서 `Track`을 `TrackInfo`로 변환한다.
- track cache는 favorite, recent, detail hydration에 쓰이는 전체 Track row를 저장한다.

필요한 모델 변경:

- `source: "cloudinary"`를 허용한다.
- Cloudinary adapter를 추가해 `public_id`, `asset_id`, `secure_url`, `duration`, `format`, `context`, `metadata`를 `Track`으로 정규화한다.
- public ID 변경에 강한 안정 ID가 필요하다. Cloudinary `asset_id`가 있으면 `cloudinary:${asset_id}`를 Track ID로 쓰고, `public_id`는 metadata에 보존하는 쪽이 안전하다.

### 페이지와 쉘 구조

- `/`는 `Landing`만 렌더링한다.
- `AppProviders`는 모든 route content 위에 `AudioPlayerWidget`을 전역으로 마운트한다.
- `/search`는 `AudioPlayerShell`을 통해 `SearchView`를 렌더링한다.
- `/library`는 `AudioPlayerShell`을 통해 `LibraryView`를 렌더링한다.
- `/track/[id]`는 `AudioPlayerShell`을 통해 `TrackDetailView`를 full page로 렌더링한다.
- `AudioPlayerShell`은 현재 `playTrack`만 전달하는 render-prop bridge다.
- `NavSidebar`는 존재하지만 현재 active app shell의 일부는 아니다.

권장 방향:

- 라우트별 wrapper를 줄이고 음악 라우트는 하나의 app shell로 묶는다.
- top header, center main, right detail aside, bottom player footer 구조를 사용한다.
- 랜딩페이지는 app shell 밖에 둔다.
- `/search`를 통합 music page로 사용하고, `/library`는 `/search`의 favorites 섹션으로 redirect 또는 alias 처리한다.

### Search와 Favorite

- `SearchView`는 browse card와 Audius copy를 가진 full-page 검색 경험이다.
- `LibraryView`는 Dexie에서 favorite/recent ID를 읽고 `trackCacheRepo`로 cached track을 hydrate한다.
- `TrackList`는 이미 play와 favorite toggle을 지원한다.

머지 방향:

- 통합 페이지는 하나의 list surface 안에서 다음 상태를 다뤄야 한다.
  - 전체 Cloudinary tracks
  - Cloudinary tracks 내 검색 결과
  - Favorites
  - Recent plays, 단 화면이 복잡해지지 않을 때만 포함
- Favorites는 여전히 cached track row에 의존한다. Cloudinary list를 fetch하면 바로 track cache에 저장해야 한다.

### Track Detail

- `TrackDetailView`는 현재 full-page layout을 전제로 하고 local cache에서 track을 읽는다.
- 또한 외부 lyrics API를 호출한다.
- 요구사항상 detail page는 오른쪽 aside에 배치되어야 한다.

스크리닝 결과:

- detail 개념은 유지하되 `TrackDetailAside`로 재설계한다.
- lyrics는 Cloudinary metadata로 제공되지 않는 한 active detail UI에서 제거한다.
- 직접 `/track/[id]` 접근은 unified shell을 열고 aside를 채우거나 `/search?track=<id>`로 redirect한다.

### 랜딩 배경

- `DustySnow` 기본값은 `count = 150`이다.
- star position은 `vw`를 쓰고, `.rose-starfield`는 현재 viewport 전체를 덮는다.
- reduced motion에서는 이미 최대 54개로 줄인다.

저위험 변경:

- 기본 count를 약 96개로 낮춘다.
- `.rose-starfield`를 `left: auto; right: 0; width: 80%;`로 둔다.
- star `left` 값은 `vw`가 아니라 starfield 내부 기준 0-100%로 생성한다.

### Player UI

- desktop player는 하단 fixed 영역으로 전역 배치되어 있다.
- 큰 구조는 이미 요구 방향과 유사하다.
  - artwork
  - track metadata
  - playback controls
  - progress
  - volume
- 현재 문제는 visual hierarchy, interaction polish, disabled state, seek/volume styling, Spotify식 control rhythm 쪽이다.

권장 플레이어 방향:

- desktop에서는 bottom player footer를 유지한다.
- 안정적인 3-zone grid를 사용한다.
  - left: artwork, title, artist, favorite/detail action
  - center: transport controls + seek bar
  - right: volume + secondary actions
- Spotify를 참고하되 EDMM 톤에 맞춰 과한 장식은 줄인다. 명확한 원형 play button, 비활성 previous/next, hover thumb이 있는 seek bar, 일관된 slider, compact typography를 적용한다.
- persistent player에서는 회전 앨범아트 애니메이션을 제거하는 편이 정보형 음악 앱에 더 적합하다.
- mobile mini-player도 desktop과 같은 시각 언어로 맞춘다.

## 스크리닝한 접근안

### A안: Cloudinary 데이터 소스만 최소 교체

Audius hook/route를 Cloudinary hook/route로 바꾸되 `/search`, `/library`, `/track/[id]`, 현재 player 구조는 대부분 유지한다.

장점:

- 가장 빠르다.
- 라우팅 리스크가 가장 낮다.
- 독립 테스트가 쉽다.

단점:

- Spotify식 통합 shell 요구사항을 충분히 만족하지 못한다.
- Search/Favorite이 계속 분리된 개념으로 남는다.
- Track detail이 full page로 남는다.
- Player 개선이 얕아질 가능성이 높다.

판정: 요구사항 충족도가 낮아 제외.

### B안: Cloudinary 소스 + 통합 Spotify-like Shell 단계적 개편

Cloudinary 데이터 레이어를 먼저 만들고, 음악 라우트를 하나의 app shell로 묶은 뒤 Search/Favorite 통합, right detail aside, player footer 개선을 진행한다.

장점:

- 요청된 요구사항을 모두 충족한다.
- 단계별 테스트가 가능하다.
- 기존 track cache, favorites, recent plays, audio provider, player primitive를 재사용한다.
- 전체 재작성보다 리스크가 낮다.

단점:

- 라우팅, 레이아웃, 테스트가 함께 바뀌므로 조율이 필요하다.
- Track detail을 full-page에서 aside로 바꿔야 한다.
- 기존 Audius/lyrics 테스트는 교체 또는 retire가 필요하다.

판정: 추천.

### C안: Spotify clone 수준의 전면 재작성

music app shell, data layer, pages, detail, player를 거의 처음부터 다시 만든다.

장점:

- 시간과 범위 제한이 없다면 개념적으로 가장 깨끗하다.
- 과거 route 전제를 한 번에 제거할 수 있다.

단점:

- 회귀 리스크가 가장 높다.
- 이미 동작하는 재사용 가능한 조각을 버리게 된다.
- 현재 요청의 순차적 문서화/구현 흐름에 비해 범위가 과하다.

판정: 범위 리스크로 제외.

## 추천안

B안을 기준으로 다음 단계인 기획설계로 진행한다.

설계 승인 이후 Subagent-driven 구현 단계에서는 다음 독립 작업으로 나누는 것이 적절하다.

1. Cloudinary API adapter와 Track 정규화
2. Music shell layout과 route consolidation
3. 통합 Search/Favorites list 동작
4. Right-side track detail aside
5. Player UI/UX polish
6. Landing starfield 조정
7. 외부 API retirement와 test cleanup

## 핵심 리스크

- 설정된 Cloudinary 폴더에는 현재 audio asset이 1개뿐이라 리스트가 매우 짧다.
- sample asset에 context, metadata, tag가 없어 artist/title/album 추출은 파일명 fallback에 의존해야 한다.
- Cloudinary Admin/Search API는 rate-limited이므로 Next server route에서 짧은 캐시가 필요하다.
- Cloudinary secret은 반드시 server-only로 유지해야 한다.
- Audius를 제거하면 외부 discovery catalog가 사라진다. 검색은 Cloudinary 소유 asset 안에서의 필터링이 된다.
- Lyrics를 제거하면 Cloudinary metadata로 제공되지 않는 한 detail aside에 lyrics를 표시하지 않는다.

## 다음 승인 지점

B안으로 2단계 기획설계를 진행할지 승인하거나 수정 방향을 지정한다.
