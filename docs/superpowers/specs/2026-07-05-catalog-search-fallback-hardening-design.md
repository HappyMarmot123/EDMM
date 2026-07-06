# 카탈로그 및 검색 실패 대비 강화 기획서

## 1. 문서 목적

이 문서는 EDMM의 핵심 화면인 `/search`에서 카탈로그와 검색이 실패했을 때 사용자 경험을 안정화하기 위한 코드베이스 기반 기획 문서다.

최근 `/search`의 초기 성능 측정과 artwork 로딩 개선은 안정화됐다. 다음 운영 품질 개선은 실패 상태에서 사용자가 검색어, 현재 view, 선택한 track 맥락을 잃지 않도록 하는 것이다.

핵심 목표는 다음과 같다.

1. `Cloudinary` 카탈로그 조회 실패 시 기존 결과, cached track, retry UI를 활용한다.
2. `IndexedDB`의 track cache와 recent plays 실패를 비차단 상태로 유지한다.
3. 검색어, 현재 view, selected track detail을 실패 후에도 최대한 보존한다.
4. 사용자 메시지는 짧고 복구 행동이 명확해야 한다.
5. `Sentry`에는 개인정보와 raw query 없이 실패 context만 전달한다.

## 2. 현재 단계

| 단계 | 상태 | 근거 |
| --- | --- | --- |
| 아이디어 제안 | PASS | `/search`는 핵심 탐색 화면이며 성능 안정화 이후 실패 UX 보강 효과가 크다. |
| 스크리닝 | PASS | 운영 안정성, 성능 점수 개선, 완성도 우선순위에 모두 부합한다. |
| 기획설계 | PASS | fallback 정책, 사용자 메시지, `Sentry` context, 테스트 범위를 분리했다. |
| 코드베이스 기반 문서구체화 | PASS | `Cloudinary` hook/API, `MusicShell`, `IndexedDB` repo, recent plays, seed utils, 기존 test를 근거로 정리했다. |
| 문서검토 | PASS | 범위, 근거, 모순, 가독성 가드레일을 문서 하단에 명시했다. |
| 작업 Task 분리 | PASS | 구현 가능한 단위로 task를 분리했다. |
| 구현진행 | PASS | fallback 상태 모델, 사용자 메시지, recent/cache unavailable 구분, `Sentry` 안전 context, 회귀 테스트를 구현했다. |

## 3. 범위

### 3.1 포함 범위

| 포함 영역 | 설명 |
| --- | --- |
| 카탈로그 조회 실패 fallback | `/api/cloudinary/tracks` 계열 요청 실패 시 사용자-facing fallback을 강화한다. |
| 검색 결과 fallback | 검색 중 refetch 실패 시 검색어와 이전 visible results를 보존한다. |
| Recent view fallback | `IndexedDB` recent plays 또는 cached tracks 읽기 실패 시 빈 상태와 안내를 안정화한다. |
| 선택 track fallback | deep link `?track=` 또는 row selection 후 cache/detail 복구 실패 시 detail aside 상태를 명확히 한다. |
| 사용자 메시지 정책 | `Catalog unavailable`, empty state, retry copy를 일관화한다. |
| `Sentry` 안전 context | `catalog_fetch_failed`, `indexeddb_unavailable`, `search_fallback_used` 계열 context를 query 원문 없이 기록한다. |
| 회귀 테스트 | fallback 상태가 핵심 UX를 깨지 않는지 테스트를 보강한다. |

### 3.2 제외 범위

| 제외 영역 | 이유 |
| --- | --- |
| Fullscreen/audio runtime performance | 별도 문서로 분리되어 있으며 이번 우선순위에서는 뒤로 이동했다. |
| Playback error UI | 다음 에러/메시지 핸들링 단계에서 다룬다. |
| 전역 Error Boundary 개편 | catalog/search surface 안의 recoverable fallback에 집중한다. |
| 사용자 행동 analytics taxonomy | `Sentry` 안전 error context만 포함하고 product analytics는 제외한다. |
| `Cloudinary` API 검색 로직 재작성 | provider query 자체가 아니라 실패 UX와 복구 흐름이 목적이다. |

## 4. 코드베이스 근거

| 영역 | 파일 | 관찰 내용 | 설계 반영 |
| --- | --- | --- | --- |
| Search route | `src/app/search/page.tsx`, `src/app/search/searchPageClient.tsx`, `src/views/search/index.tsx` | `/search`는 query param의 `view`, `track` 값을 client shell로 넘기는 구조다. | 실패해도 URL 기반 선택 맥락을 유지해야 한다. |
| Music shell 상태 | `src/widgets/musicShell/index.tsx` | `useCloudinaryTracks`의 `isLoading`, `isError`, `refetch`, `data`를 받아 list 상태로 전달한다. `recentState`는 cached tracks 기반이다. | fetch 실패와 recent 실패를 같은 empty state로 뭉개지 않고 구분한다. |
| Track list fallback | `src/widgets/musicShell/musicTrackList.tsx` | 이미 `Catalog unavailable` error panel과 empty message, retry handler를 받는 구조가 있다. | 기존 UI surface를 유지하되 copy와 stale result 정책을 강화한다. |
| 카탈로그 query | `src/features/cloudinary/hooks/useCloudinaryTracks.ts` | `TanStack Query`로 `Cloudinary` track list를 가져오고 성공 시 `cacheTrack`을 비동기로 수행한다. 실패 시 throw되고 query error 상태가 된다. | hook 레벨에서 stale successful tracks를 보존하거나 shell 레벨에서 previous visible results를 유지한다. |
| `Cloudinary` API | `src/app/api/cloudinary/tracks/route.ts`, `src/app/api/cloudinary/tracks/video/route.ts`, `src/app/api/cloudinary/tracks/image/route.ts` | provider 실패는 `{ error }` JSON과 500 또는 502로 응답한다. | client는 raw error message를 사용자에게 노출하지 않는다. `Sentry`에도 raw provider payload를 보내지 않는다. |
| Track cache | `src/shared/db/repositories/trackCacheRepo.ts` | `cacheTrack`은 실패해도 reject하지 않고 debug log만 남긴다. `getCachedTrack` 실패는 `undefined`, `getCachedTracks` 실패는 `[]`로 처리한다. | `IndexedDB` 실패는 catalog browsing을 막지 않는다. 단, 사용자 메시지와 `Sentry` warning context를 추가할 수 있다. |
| Recent plays | `src/shared/db/repositories/recentPlaysRepo.ts`, `src/features/library/hooks/useRecentPlays.ts` | recent read 실패는 빈 배열로 흡수된다. `useLiveQuery` 기본값도 빈 배열이다. | Recent view는 실패와 실제 empty를 구분하기 어렵다. 최소한 UI copy는 "recent unavailable"과 "no recent plays"를 분리할 수 있게 설계한다. |
| Seed resolution | `src/widgets/musicShell/trackSeedUtils.ts`, `src/widgets/musicShell/useMusicShellTrackSeed.ts` | selected track과 latest recent track은 visible tracks, cached track, first playable fallback 순으로 복구된다. cache lookup 실패는 deterministic fallback으로 흡수된다. | deep link detail 복구 실패 시 loading 상태와 unavailable 상태를 명확히 분리한다. |
| 기존 error policy | `docs/observability/error-handling-policy.md` | catalog/search fallback, query length만 전송, raw query 금지, retry copy 원칙이 이미 정의됐다. | 이번 문서는 해당 정책의 `/search` 구현 설계로 연결한다. |
| 기존 test | `src/test/widgets/musicShell.test.tsx` | loading/empty, catalog search, recent cached track, deep link cache, artwork skeleton 테스트가 존재한다. | fallback hardening은 기존 test에 시나리오를 추가하는 방향이 안전하다. |
| DB repo tests | `src/shared/db/repositories/__tests__/trackCacheRepo.test.ts`, `src/shared/db/repositories/__tests__/recentPlaysRepo.test.ts` | `IndexedDB` read/write 실패를 reject하지 않는 정책이 테스트로 고정되어 있다. | 실패를 throw 기반으로 바꾸지 않고 UI/observability 레이어에서 보강한다. |

## 5. 사용자 경험 원칙

| 원칙 | 적용 방식 |
| --- | --- |
| 맥락 보존 | 검색어, view, selected track detail, 이전 visible results를 가능한 유지한다. |
| 비차단 fallback | catalog fetch 실패가 audio player, selected detail, recent cache 탐색을 막지 않는다. |
| 짧은 메시지 | 사용자는 provider 이름이나 raw exception을 보지 않는다. |
| 명확한 행동 | retry, clear search, all view 이동, cached recent 계속 보기 중 하나를 제공한다. |
| 개인정보 최소화 | search query 원문은 `Sentry`로 보내지 않고 query length와 empty 여부만 기록한다. |

## 6. 접근안

### 6.1 접근안 A: Shell 레벨 fallback 강화

`MusicShell`에서 query 성공 결과를 기억하고, fetch 실패 시 이전 visible tracks를 fallback으로 보여준다. `MusicTrackList`의 기존 error UI를 확장해 retry와 fallback 상태 copy를 제공한다.

장점은 변경 범위가 작고 현재 UI 구조와 맞는다는 점이다. 단점은 data hook 자체의 재사용성이 크게 개선되지는 않는다는 점이다.

이번 단계의 권장안이다.

### 6.2 접근안 B: Query hook 레벨 stale fallback

`useCloudinaryTracks`에서 마지막 성공 데이터를 유지하고 fallback metadata를 함께 반환한다. Shell은 이를 단순히 표시한다.

장점은 데이터 정책이 hook에 모인다는 점이다. 단점은 `TanStack Query` 상태와 별도 fallback state가 섞여 hook 책임이 커진다는 점이다.

추후 catalog query 재사용 화면이 늘면 검토한다.

### 6.3 접근안 C: 전역 error/message framework 선행

error taxonomy constants, message mapper, `Sentry` helper를 먼저 만들고 `/search` fallback을 그 위에 얹는다.

장점은 구조적으로 깔끔하다는 점이다. 단점은 사용자가 원하는 핵심 화면 UX 개선보다 기반 공사가 앞선다는 점이다.

이번 단계에서는 최소 helper만 사용하고 전역화는 다음 에러/메시지 핸들링 절차로 넘긴다.

## 7. 권장 설계

권장안은 접근안 A다.

`/search`는 이미 하나의 shell 안에서 catalog, recent, selection, detail aside, track list를 조합하고 있다. 따라서 실패 UX도 shell에서 사용자 맥락을 보존하는 쪽이 가장 작고 안전하다.

| 설계 항목 | 방향 |
| --- | --- |
| 카탈로그 조회 실패 | 이전 성공 catalog result가 있으면 목록을 유지하고 상단 또는 list panel에 non-blocking warning을 표시한다. 이전 결과가 없으면 기존 `Catalog unavailable` panel을 강화한다. |
| 검색 refetch 실패 | 검색어는 유지한다. 이전 결과가 있으면 "마지막으로 불러온 결과를 표시 중" 상태로 둔다. 이전 결과가 없으면 retry와 clear search action을 제공한다. |
| Recent view 실패 | `IndexedDB` 실패는 blocking error로 올리지 않는다. 최근 재생 목록이 비어 있으면 "최근 재생이 없습니다"와 "최근 재생을 불러올 수 없습니다"를 구분할 수 있는 상태 값을 도입한다. |
| 선택 track 실패 | deep link track이 visible/cache 모두에서 복구되지 않으면 detail aside에서 "세부 정보를 불러올 수 없습니다"와 search로 돌아가는 행동을 제공한다. catalog list 자체는 유지한다. |
| Retry | `refetch`를 유지한다. retry 중에는 기존 result를 지우지 않는다. |
| `Sentry` | catalog fetch 실패와 `IndexedDB` unavailable은 sanitized context만 보낸다. query 원문, raw URL, provider response body는 제외한다. |

## 8. 상태 모델

| 상태 | 의미 | 사용자 표시 |
| --- | --- | --- |
| `loading_initial` | 최초 catalog load 중이며 표시할 previous data가 없다. | Loading skeleton/status |
| `ready` | catalog 또는 recent data가 정상 표시된다. | 정상 list |
| `refreshing_with_data` | refetch 중이지만 이전 결과가 있다. | 기존 list 유지, subtle loading |
| `catalog_error_empty` | catalog 실패이며 표시할 이전 결과가 없다. | Catalog unavailable, Retry |
| `catalog_error_with_stale_data` | catalog 실패지만 이전 성공 결과가 있다. | 기존 list, warning, Retry |
| `search_empty` | 정상 응답이지만 검색 결과가 없다. | No matching tracks, Clear search |
| `recent_empty` | recent play가 실제로 없다. | No recent plays yet |
| `recent_unavailable` | recent/cache read가 실패했거나 unavailable로 판단된다. | Recent plays unavailable, All view 이동 |
| `selected_track_unavailable` | deep link/selection track detail 복구 실패 | Details unavailable, list는 유지 |

## 9. `Sentry` 안전 context

| 이벤트 | 포함 가능 | 금지 |
| --- | --- | --- |
| `catalog_fetch_failed` | route, view, resourceType, hasQuery, queryLength, hasStaleData, status family | query 원문, `Cloudinary` URL, raw response |
| `search_fallback_used` | route, view, hasQuery, queryLength, resultCount | query 원문 |
| `indexeddb_unavailable` | operation, route, view | stored payload, track title, raw Dexie error body |
| `selected_track_unavailable` | route, hasTrackId, selectedTrackId hash 또는 redacted id policy | raw media URL, artwork URL |

현재 error policy 기준으로 track id는 허용되어 있으나, 이 작업에서는 search query 원문 전송 금지를 고정한다.

## 10. 작업 Task 분리

### Task 1. Search fallback 상태 모델 추가

- `MusicShell`에 previous successful catalog tracks를 보존하는 state 또는 ref를 추가한다.
- catalog query가 실패해도 previous visible tracks가 있으면 list를 비우지 않는다.
- initial load 실패와 refetch 실패를 구분한다.

성공 기준은 검색 refetch 실패 시 기존 목록과 선택 상태가 유지되는 것이다.

### Task 2. Catalog unavailable UI copy 개선

- `MusicTrackList`의 error panel copy를 error-empty와 stale-data 상황으로 분리한다.
- retry action copy를 명확히 한다.
- raw provider error를 화면에 노출하지 않는다.

성공 기준은 사용자가 "다시 시도" 또는 "이전 결과 계속 보기"를 이해할 수 있는 것이다.

### Task 3. Search empty state 개선

- 정상 empty result와 fetch failure를 분리한다.
- query가 있을 때는 "검색 결과 없음"과 clear search action을 제공한다.
- query가 없을 때는 기존 catalog empty copy를 유지한다.

성공 기준은 empty와 error가 같은 문구로 보이지 않는 것이다.

### Task 4. Recent/cache fallback 상태 구분

- `getCachedTracks` 실패가 현재는 `[]`로 흡수되므로 UI에서 실제 empty와 failure를 구분하기 어렵다.
- repo 정책을 깨지 않고 shell/hook 레벨에서 unavailable 상태를 추론하거나 별도 safe result helper를 추가한다.
- Recent view에서는 catalog browse를 막지 않고 All view 이동 행동을 제공한다.

성공 기준은 Recent 실패가 `/search` 전체 실패처럼 보이지 않는 것이다.

### Task 5. 선택 track fallback copy 정리

- deep link `?track=`이 visible/cache 어디에서도 복구되지 않을 때 detail aside 메시지를 명확히 한다.
- loading 중 unavailable 메시지가 먼저 뜨지 않도록 기존 테스트 의도를 유지한다.
- `fallbackToFirstPlayable`이 selection 맥락을 부적절하게 덮어쓰지 않는지 확인한다.

성공 기준은 detail aside가 loading, unavailable, selectable states를 구분하는 것이다.

### Task 6. Sanitized `Sentry` capture 연결

- `Sentry` helper 또는 local function으로 `/search` 실패 context를 sanitizing한다.
- `catalog_fetch_failed`에는 query length와 empty 여부만 포함한다.
- `IndexedDB` unavailable은 operation name 중심으로 기록한다.

성공 기준은 `Sentry` payload에 query 원문, media URL, artwork URL이 들어가지 않는 것이다.

### Task 7. 회귀 테스트 보강

- stale data 없는 catalog initial failure
- stale data 있는 catalog refetch failure
- search empty와 search error 구분
- recent/cache unavailable이 All catalog를 막지 않는지 확인
- deep-linked selected track unavailable 상태에서도 list 사용 가능 확인
- `Sentry` context에 query text가 제외되는지 확인

성공 기준은 fallback UX 정책이 테스트로 고정되는 것이다.

## 11. 구현 순서

1. Fallback 상태 모델을 `MusicShell`에 추가한다.
2. `MusicTrackList` error/empty copy를 상태별로 분리한다.
3. Search empty와 catalog error를 분리한다.
4. Recent/cache unavailable 표시 정책을 추가한다.
5. Selected track detail fallback copy를 정리한다.
6. Sanitized `Sentry` capture를 최소 범위로 연결한다.
7. 회귀 테스트를 보강한다.

이 순서는 사용자-visible UX부터 안정화하고, `Sentry` 연결을 마지막에 붙이는 흐름이다. `Sentry`를 먼저 붙이면 아직 정리되지 않은 상태 모델을 이벤트로 고정할 위험이 있다.

## 12. PASS 기준

- `/search` catalog fetch 실패 시 검색어와 view가 유지된다.
- 이전 결과가 있으면 fetch 실패로 목록이 즉시 사라지지 않는다.
- retry 중에도 selected track detail이 불필요하게 초기화되지 않는다.
- 정상 empty state와 error state가 구분된다.
- Recent view 실패는 All catalog 탐색을 막지 않는다.
- deep link track 복구 실패는 detail aside에서만 안내되고 list는 사용 가능하다.
- `Sentry` context는 query 원문, raw URL, provider response body를 포함하지 않는다.
- 기존 `/search` 성능 개선의 artwork preload 정책을 회귀시키지 않는다.

## 13. BLOCKED 기준

- 실패 원인 구분을 위해 raw provider response 또는 raw query 전송이 필요하다고 판단되는 경우
- `TanStack Query` 상태만으로 initial failure와 refetch failure를 안정적으로 구분할 수 없는 경우
- `IndexedDB` repo가 실패를 `[]`로 흡수하는 정책 때문에 UI 상태 구분이 불가능한 경우
- stale result 유지가 사용자를 오도할 정도로 query와 결과의 관계를 흐리는 경우

BLOCKED가 발생하면 구현을 멈추고 상태 모델 또는 privacy 정책 결정을 요청한다.

## 14. 에러/메시지 핸들링 절차로 넘어가는 조건

다음 조건이 충족되면 다음 단계인 에러/메시지 핸들링 절차로 넘어간다.

- Catalog/search fallback 상태 모델이 구현되어 있다.
- 사용자-facing copy가 error policy와 일치한다.
- `Sentry` 안전 context 규칙이 `/search`에 적용되어 있다.
- 회귀 테스트가 주요 fallback 상태를 커버한다.
- `/search` 핵심 성능 측정 기준이 큰 폭으로 회귀하지 않는다.

## 15. 문서 가드레일

| 가드레일 | 상태 | 근거 |
| --- | --- | --- |
| 범위 | PASS | `/search`의 catalog/search/recent/selected track fallback에 한정했다. Playback, fullscreen, 전역 error boundary는 제외했다. |
| 근거 | PASS | `Cloudinary` hook/API, `MusicShell`, `IndexedDB` repo, seed utils, 기존 test, error policy를 근거로 task를 도출했다. |
| 모순 | PASS | 기존 성능 개선과 충돌하지 않고, cache 실패를 비차단으로 처리하는 기존 repo 정책도 유지한다. |
| 가독성 | PASS | 목적, 범위, 근거, 접근안, 상태 모델, task, PASS/BLOCKED 기준을 분리했다. |

## 16. 다음 액션

이 문서가 승인되면 구현 계획을 작성한다.

권장 구현 계획 문서:

`docs/superpowers/plans/2026-07-05-catalog-search-fallback-hardening.md`

## 17. 구현 결과

- Catalog/search fallback 상태 모델을 구현했다.
- 사용자-facing copy가 error policy와 일치한다.
- `Sentry` 안전 context 규칙을 `/search`에 적용했다.
- 회귀 테스트가 주요 fallback 상태를 커버한다.
- `/search` 성능 측정 기준은 큰 폭으로 회귀하지 않았다.
