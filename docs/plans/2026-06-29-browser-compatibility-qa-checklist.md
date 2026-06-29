# 브라우저 호환성 개선 QA 체크리스트 (2026-06-29)

- 대상 문서: `docs/specs/2026-06-29-browser-compatibility-improvement-design.md`
- 기준 UX: 최신 Chrome 안정 버전의 현재 EDMM V2 `/search` 경험
- 목적: 기능 단위 회귀뿐 아니라 UI 변경이 실제 사용 흐름과 체감 UX를 해치지 않는지 확인한다.

## 1. 사전 자동 검증

| 항목 | 명령 | 기대 결과 | 결과 |
| --- | --- | --- | --- |
| Focused compatibility tests | `npm test -- src/test/shared/hooks/useInView.test.tsx src/test/shared/hooks/useInfiniteScroll.test.tsx src/test/features/audio/audioVisualizer.test.tsx src/shared/db/repositories/__tests__/trackCacheRepo.test.ts src/shared/db/repositories/__tests__/recentPlaysRepo.test.ts src/test/shared/providers/audioPlayerProvider.test.tsx src/test/shared/hooks/useMediaQuery.test.tsx src/test/widgets/musicShell.test.tsx src/test/features/audio/audioPlayer.test.tsx src/test/features/landing/landingCobeOrbit.test.tsx src/test/features/audio/audioKeyboardShortcuts.test.tsx` | 관련 회귀 테스트 통과 |  |
| Full test suite | `npm test` | 전체 Jest 테스트 통과 |  |
| Lint | `npm run lint` | lint 오류 없음 |  |
| Production build | `npm run build` | Next.js 빌드 성공 |  |

## 2. 브라우저 매트릭스

| 브라우저 | 필수 확인 흐름 | 기능 판정 | UX 판정 | 비고 |
| --- | --- | --- | --- | --- |
| Chrome 최신 안정 버전 | `/search`, 재생, seek, volume, fullscreen, Recent/All 전환 |  |  | 기준 스크린샷 확보 |
| Edge 최신 안정 버전 | Chrome 기준 흐름과 동일 |  |  | 미디어 autoplay 차이 확인 |
| Firefox 최신 안정 버전 | `/search`, canvas visualizer, range input, keyboard shortcut |  |  | scrollbar, focus ring 확인 |
| Safari macOS 최신 안정 버전 | AudioContext resume, canvas fallback, backdrop blur fallback, fullscreen |  |  | autoplay 정책 확인 |
| iOS Safari | 모바일 mini player, fullscreen open/close, drag dismiss, safe-area |  |  | 하단 주소창 상태 변경 확인 |
| Android Chrome | 모바일 list scroll, mini player, fullscreen controls, bottom tab |  |  | 키보드 입력 후 viewport 확인 |

판정 기준:

- 기능 판정: 재생, 목록, 캐시, observer, visualizer, routing 같은 동작이 성공하거나 의도한 fallback으로 축소되는지 기록한다.
- UX 판정: 화면 겹침, 조작 가능성, 상태 인지, motion, 읽기 쉬움, 기준 Chrome 대비 허용 가능한 시각 차이인지 기록한다.

## 3. 핵심 사용자 흐름

| 흐름 | 확인 내용 | 기능 실패 기준 | UX 실패 기준 | 결과 |
| --- | --- | --- | --- | --- |
| `/search` 진입 | 목록, 검색 입력, All/Recent view, detail placeholder가 렌더링된다. | 화면 진입 실패, 목록/검색 불가 | 첫 화면에서 주요 CTA나 리스트가 fixed 영역에 가림 |  |
| `/search?track=<id>` 직접 진입 | detail loading 이후 track detail과 player queue가 연결된다. | detail 복원 실패, 재생 대상 누락 | loading/fallback이 빈 패널처럼 보이거나 상태를 판단하기 어려움 |  |
| 데스크톱 row 선택 | row 선택은 detail panel 갱신만 수행하고 자동 재생하지 않는다. | 선택 상태 불일치, detail 미갱신 | 선택/재생 상태가 시각적으로 구분되지 않음 |  |
| 모바일 row 선택 | row 선택이 재생으로 이어지고 mini player가 현재 곡을 표시한다. | tap 후 재생 상태 갱신 실패 | tap hit area가 작거나 bottom player가 리스트를 과도하게 가림 |  |
| 재생 제어 | play/pause, prev/next, shuffle, seek, volume이 동작한다. | control 이벤트 실패, `isPlaying` stuck | disabled/active/focus 상태가 구분되지 않음 |  |
| 데스크톱 fullscreen | overlay open/close, seek, controls, artwork fallback이 안정적이다. | overlay 닫기 불가, 컨트롤 조작 실패 | overlay가 하단 player와 겹치거나 높이가 잘림 |  |
| 모바일 fullscreen | open/close, drag dismiss, pointer cancel, safe-area padding이 안정적이다. | drag 중 오류, pointer capture 미지원 시 crash | 주소창 변화 후 close bar 또는 controls가 손가락으로 누르기 어려움 |  |
| Keyboard shortcut | Space/Arrow shortcut이 입력, slider, contentEditable 조작과 충돌하지 않는다. | 입력 중 재생 토글 발생 | focus ring이 사라져 현재 조작 위치를 알기 어려움 |  |

## 4. Viewport UX 체크

각 viewport에서 `/search` 기본 화면, track 선택 상태, player open 상태를 확인한다.

| Viewport | 확인 대상 | 통과 기준 | 결과 |
| --- | --- | --- | --- |
| 375 x 667 | iPhone SE급 | 가로 스크롤 없음, bottom tab/player가 리스트와 컨트롤을 가리지 않음 |  |
| 390 x 844 | 일반 iPhone급 | safe-area와 fullscreen close bar가 안정적이고 touch target이 충분함 |  |
| 768 x 1024 | tablet 경계 | 모바일/데스크톱 분기와 detail 표시가 의도대로 유지됨 |  |
| 1024 x 768 | 작은 데스크톱 | aside/detail, list, player가 겹치지 않고 스크롤 영역이 명확함 |  |
| 1440 x 900 | 기준 데스크톱 | Chrome 기준 UX와 레이아웃 밀도, 위계, 상태 표현이 동등함 |  |

공통 UX 실패 기준:

- 의도하지 않은 horizontal scroll이 생긴다.
- fixed bottom player나 bottom tab이 리스트 마지막 항목, 버튼, 입력 요소를 가린다.
- fullscreen overlay가 viewport보다 크거나 닫기 버튼이 보이지 않는다.
- 텍스트가 버튼/카드/패널 안에서 잘리거나 겹친다.
- active, selected, disabled, loading, error 상태를 시각적으로 구분하기 어렵다.

## 5. Fallback 시나리오

| 시나리오 | 확인 방법 | 통과 기준 | 결과 |
| --- | --- | --- | --- |
| `IntersectionObserver` 없음 | Jest mock 또는 브라우저 devtools override | lazy reveal 콘텐츠가 숨은 채 남지 않고 infinite scroll은 조용히 축소된다. |  |
| `ResizeObserver` 없음 | Jest mock 또는 브라우저 devtools override | visualizer와 landing canvas가 throw 없이 기본 크기와 resize fallback을 유지한다. |  |
| `matchMedia` 없음 | Jest mock | shell/player가 기본 레이아웃으로 렌더링되고 crash가 없다. |  |
| IndexedDB reject | repository reject mock 또는 private browsing | cache/recent 실패가 목록, detail, player 사용을 막지 않는다. |  |
| `audio.play()` reject | provider test 또는 autoplay 차단 환경 | `isPlaying`이 false로 복구되고 재생 UI가 stuck 상태로 남지 않는다. |  |
| AudioContext/analyser 없음 | provider/visualizer mock | player control은 유지되고 visualizer만 idle 또는 축소 상태로 보인다. |  |
| Canvas/CORS palette 실패 | `getImageData` throw mock | fallback palette나 기본 artwork 영역이 깨진 이미지처럼 보이지 않는다. |  |
| Reduced motion | OS 또는 devtools setting | landing animation과 fullscreen motion이 과도하게 실행되지 않는다. |  |
| Pointer capture 미지원 | API 삭제 mock 또는 구형 WebView | 모바일 fullscreen drag가 오류 없이 취소/복구된다. |  |

## 6. 시각 및 상호작용 UX 기준

| 영역 | 확인 기준 | 허용 가능한 차이 | 허용 불가 |
| --- | --- | --- | --- |
| Visualizer | analyser나 canvas fallback 상태에서도 player 주변이 빈 오류 영역처럼 보이지 않는다. | decorative animation 축소 | 재생 UI가 깨졌다고 느껴지는 공백 |
| Blur/backdrop | blur 미지원 시에도 텍스트와 아이콘 contrast가 유지된다. | blur 효과 없음 | 배경과 controls가 섞여 읽기 어려움 |
| Motion | open/close, drag, visualizer가 지연 없이 반응한다. | reduced-motion에서 animation 축소 | 닫힘 지연, 흔들림, stuck transition |
| Touch target | close bar, bottom tab, player controls가 반복 탭에 안정적이다. | 플랫폼별 touch highlight 차이 | tap과 drag가 자주 충돌 |
| Focus | keyboard 조작 중 현재 focus 위치를 알 수 있다. | 브라우저 기본 focus ring 차이 | focus 표시 제거, page scroll과 shortcut 충돌 |
| Empty/error | 네트워크, 저장소, canvas 실패가 깨진 화면으로 보이지 않는다. | fallback copy 또는 기본 artwork 표시 | 빈 패널, 무한 skeleton, 깨진 이미지 아이콘 |

## 7. 결과 기록 양식

| 날짜 | 브라우저/버전 | OS/기기 | Viewport | 흐름 | 기능 결과 | UX 결과 | 이슈 링크/메모 |
| --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |

기록 원칙:

- Chrome 기준과 다른 부분은 먼저 기능 차이인지 decorative 축소인지 분류한다.
- 기능이 통과해도 사용자가 상태를 오해할 수 있으면 UX 실패로 기록한다.
- UX 실패는 screenshot, viewport, route, 재현 단계를 함께 남긴다.
- P0/P1 코드 변경으로 해결한 fallback은 동일 mock 조건의 Jest 결과와 실제 브라우저 관찰 결과를 함께 연결한다.
