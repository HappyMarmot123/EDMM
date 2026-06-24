# EDMM 대규모 개편 문서 인덱스

키 없이 사용할 수 있는 음악 서비스로 전환하기 위한 설계와 구현 계획 문서 모음입니다. 현재 코드 구현은 Phase 0~6 계획 기준으로 진행 완료 상태입니다.

## 설계서

- [EDMM 대규모 개편 설계서](specs/2026-06-23-edmm-revamp-design.md): 배경, 아키텍처, 스택 결정, 범위

## 구현 계획 및 상태

| Phase | 문서 | 핵심 산출물 | 상태 |
|---|---|---|---|
| 0 | [툴체인 버전업](plans/2026-06-23-phase0-toolchain-upgrade.md) | Next/React/TypeScript/ESLint 업그레이드 | 완료 |
| 1 | [외부 API 어댑터 + Route 프록시](plans/2026-06-23-phase1-api-adapters.md) | Track 모델, Audius/Deezer/lyrics API | 완료 |
| 2 | [Dexie 데이터 레이어](plans/2026-06-23-phase2-dexie-data-layer.md) | favorites/recent/playlists/trackCache | 완료 |
| D | [디자인 시스템](plans/2026-06-23-phaseD-design-system.md) | Neon Glassmorphism 토큰/프리미티브 | 완료 |
| 3 | [라우트/페이지 골격 + views](plans/2026-06-23-phase3-routes-pages.md) | 홈/검색/트랙 상세/보관함 | 완료 |
| 4 | [플레이어 + 오디오 엔진](plans/2026-06-23-phase4-player-audio-engine.md) | Track 기반 미니 플레이어, 큐/볼륨/시킹 | 완료 |
| 5 | [레거시 제거](plans/2026-06-23-phase5-remove-legacy.md) | auth/Supabase/Cloudinary/Drizzle/listModal 제거 | 완료 |
| 6 | [성능 패스](plans/2026-06-23-phase6-performance.md) | 랜딩 지연 로딩, 세션 1회화, Query 캐싱 | 완료 |

## 구현 방식

구현은 `superpowers:subagent-driven-development` 흐름으로 진행했습니다. 탐색/리뷰 작업을 서브에이전트에 분리하고, 메인 작업자는 통합 수정과 잔여 안정화를 수행했습니다.

## 최종 정리

- Supabase, Cloudinary, Drizzle, Spotify, Kakao OAuth, listModal 경로는 런타임 코드와 패키지 의존성에서 제거되었습니다.
- 랜딩과 데이터 fetch 경로는 Next.js 프리렌더를 고려해 무거운 연출과 브라우저 전용 API 호출을 지연 실행하도록 정리되었습니다.
- 트랙 목록, 검색, 보관함, 트랙 상세는 새 `Track` 모델과 공용 오디오 플레이어를 통해 재생 흐름을 공유합니다.
