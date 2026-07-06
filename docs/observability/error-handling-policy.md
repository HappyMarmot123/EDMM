# 에러 처리 및 사용자 메시지 정책

## 1. 목적

이 문서는 EDMM 배포 이후 발생하는 런타임 에러의 운영 정책을 정의한다.
목표는 개인정보를 수집하지 않으면서도 실패를 관측 가능하고, 사용자에게 안전하며,
개발자가 조치할 수 있는 형태로 관리하는 것이다.

## 2. 범위

포함 범위:

- Next.js App Router 에러 바운더리에서 처리하는 라우트 단위 에러
- 클라이언트 재생, 카탈로그, 검색, 아트워크, IndexedDB 실패
- Sentry 에러 이벤트 분류와 태그 정책
- 사용자에게 표시하는 fallback 문구
- 재시도 및 복구 동작

제외 범위:

- 전체 제품 분석 이벤트 taxonomy
- Sentry 유료 플랜 기능
- Sentry와 Vercel 밖의 서버 로그 집계
- 1인 maintainer 범위를 넘는 대규모 팀용 incident response 프로세스

## 3. 에러 클래스

| Class | 예시 | Severity | 사용자 메시지 | Sentry |
| --- | --- | --- | --- | --- |
| `catalog_fetch_failed` | Cloudinary API 요청 실패, non-2xx 응답 | `warning` | 카탈로그를 불러오지 못했습니다. 다시 시도해 주세요. | route, view, query length와 함께 capture |
| `track_playback_failed` | 오디오 소스 로드 실패, 미지원 포맷 | `error` | 지금은 이 트랙을 재생할 수 없습니다. 다른 트랙을 선택해 주세요. | track id, source, browser info와 함께 capture |
| `autoplay_blocked` | 사용자 gesture 없이 브라우저가 재생을 차단 | `info` | 재생 버튼을 한 번 더 눌러 주세요. | 반복 발생 시에만 capture |
| `indexeddb_unavailable` | Dexie open/read/write 실패 | `warning` | 최근 재생 목록을 잠시 사용할 수 없습니다. | operation name과 함께 capture |
| `artwork_load_failed` | 아트워크 URL invalid 또는 이미지 요청 실패 | `info` | 차단 메시지 없음. placeholder artwork 표시. | 기본값은 breadcrumb만 기록 |
| `route_render_failed` | React render/runtime 예외 | `fatal` | 문제가 발생했습니다. 페이지를 새로고침해 주세요. | route error boundary에서 capture |
| `unexpected_client_error` | 알 수 없는 클라이언트 예외 | `error` | 문제가 발생했습니다. 다시 시도해 주세요. | sanitize된 event로 capture |

## 4. 사용자 메시지 규칙

- 짧고 비기술적인 문구를 사용한다.
- stack trace, provider name, access token, URL, raw exception text를 노출하지 않는다.
- 필요할 때는 재시도, 새로고침, 다른 트랙 선택, 계속 이용 중 하나의 다음 행동을 제시한다.
- 복구 가능한 실패에는 blocking modal을 피한다.
- `/search`처럼 player list, detail aside, player bar, fullscreen layout이 고정된 화면에서는 에러 메시지가 레이아웃 높이·폭을 바꾸면 안 된다.
- 고정 레이아웃 화면의 복구 가능한 실패는 toast, snackbar, 고정 위치 popup, 또는 layout overlay처럼 주변 배치를 밀어내지 않는 피드백을 우선 사용한다.
- inline fallback은 이미 고정 높이가 예약되어 있거나, skeleton/placeholder처럼 레이아웃 변화가 없는 영역에만 사용한다.
- 오디오 재생 실패가 선택된 트랙을 지우면 안 된다.
- 카탈로그 실패가 검색어와 현재 view를 지우면 안 된다.
- IndexedDB 실패가 재생 또는 카탈로그 탐색을 막으면 안 된다.

## 5. Sentry 이벤트 규칙

허용 이벤트 필드:

- `error_class`
- `route`
- `view`
- `track_id`
- `track_source`
- `resource_type`
- `operation`
- `retryable`
- `runtime`

금지 이벤트 필드:

- Cookies
- Request headers
- Email
- Username
- IP address
- 전체 검색어 텍스트
- 전체 media 또는 artwork URL
- raw Cloudinary response body

검색어 정책:

- 검색어 길이만 저장한다.
- 검색어가 비어 있는지 여부만 저장한다.
- 검색어 원문은 Sentry로 보내지 않는다.

트랙 정책:

- Track ID는 허용한다.
- Track title과 artist name은 이미 공개 정보이고 디버깅에 반드시 필요한 경우가 아니면 보내지 않는다.
- Media URL은 보내지 않는다.

## 6. 재시도 및 복구 정책

| 실패 | 재시도 동작 | Fallback |
| --- | --- | --- |
| Catalog fetch | 사용자가 popup/toast action 또는 retry control로 재시도 | 기존 list/detail/player layout 유지, 비차단 popup 피드백 |
| Search fetch | query는 input에 유지 | 가능한 경우 이전 visible results 유지, 비차단 popup 피드백 |
| Recent plays read | blocking retry 없음 | 기존 list layout 유지, 비차단 popup 또는 빈 상태 placeholder |
| Track playback | 사용자가 다시 play하거나 다른 track 선택 | detail aside와 player layout 유지, 비차단 popup 피드백 |
| Artwork load | retry UI 없음 | placeholder 또는 skeleton |
| Route render | 사용자가 reload하거나 다른 route로 이동 | App Router error screen |

## 7. 구현 task 분리

1. `Error taxonomy constants`

- typed error class constants를 만든다.
- 안전한 Sentry context payload helper를 만든다.
- 구조적으로 PII 필드가 들어가지 않도록 막는다.

2. `Catalog and search fallback hardening`

- refetch 실패 시 이전 visible tracks를 보존한다.
- `/search` 고정 레이아웃을 밀어내지 않는 popup/toast/overlay 피드백과 retry 문구를 추가한다.
- `catalog_fetch_failed` Sentry capture를 추가한다.

3. `Playback error UI refinement`

- playback error code를 사용자에게 안전한 문구로 매핑한다.
- autoplay blocked와 source load failed를 구분한다.
- 반복 또는 치명적인 playback failure에만 Sentry tag를 추가한다.

4. `IndexedDB fallback hardening`

- recent-play 실패를 non-blocking으로 처리한다.
- operation name을 포함한 breadcrumb 또는 warning capture를 추가한다.

5. `Route error boundary copy review`

- `error.tsx`와 `global-error.tsx` 문구를 이 정책에 맞게 정렬한다.
- reset/reload action이 계속 보이도록 유지한다.

## 8. PASS 기준

- 사용자 메시지가 행동 가능하고 비기술적이다.
- `/search`의 player list, detail aside, player bar, fullscreen layout이 에러 피드백 때문에 재배치되지 않는다.
- Sentry context에서 PII와 raw URL이 제외된다.
- 복구 가능한 실패가 관련 없는 핵심 flow를 막지 않는다.
- 검색과 재생 실패가 사용자 context를 보존한다.
- 구현된 각 fallback에 focused test coverage가 있다.

## 9. BLOCKED 기준

- 실패 경로 디버깅에 raw URL 또는 private payload를 노출하는 provider-specific data가 필요하다.
- Sentry payload를 호출 지점에서 sanitize할 수 없다.
- fallback 동작이 제품 결정 없이 core playback 또는 catalog semantics를 바꿔야 한다.

## 10. Guardrail Review

| Guardrail | Decision | Reason |
| --- | --- | --- |
| Scope | PASS | 이 문서는 에러 분류, 사용자 메시지, Sentry context, fallback task 분리에 한정한다. |
| Evidence | PASS | 현재 EDMM 운영 stack인 Next.js App Router, Sentry free-plan setup, Cloudinary catalog, audio playback, IndexedDB recent plays를 기준으로 작성했다. |
| Contradiction | PASS | 완료된 performance observability 작업과 충돌하지 않으며, runtime failure에 대한 다음 운영 계층을 추가한다. |
| Readability | PASS | Error class, 메시지 규칙, Sentry 규칙, 복구 동작, 구현 task를 분리했다. |
