# EDMM Cloudinary + Spotify Shell 개편: 4단계 문서검토

작성일: 2026-06-26

## 검토 대상

- `docs/superpowers/specs/2026-06-26-cloudinary-spotify-shell-screening.md`
- `docs/superpowers/specs/2026-06-26-cloudinary-spotify-shell-design.md`
- `docs/superpowers/specs/2026-06-26-cloudinary-spotify-shell-codebase.md`

## 요구사항 커버리지

| 요구사항 | 문서 반영 위치 | 판정 |
| --- | --- | --- |
| Cloudinary로 음원 리소스 조회 | screening, design, codebase | 충족 |
| 음원 리스트 표시 | design, codebase | 충족 |
| 기존 외부 음악 API 미사용 | screening, design, codebase | 충족 |
| 랜딩 별 개수 감소 | screening, design, codebase | 충족 |
| 랜딩 별 80% 너비, 오른쪽 배치 | screening, design, codebase | 충족 |
| Favorite/Search 병합 | screening, design, codebase | 충족 |
| Spotify식 header-main-footer/right aside | screening, design | 충족 |
| detail page를 aside에 배치 | screening, design, codebase | 충족 |
| player controller 세부 UI/UX 개선 | screening, design, codebase | 충족 |
| Subagent-driven 구현 전제 | screening, codebase | 충족 |

## Placeholder 검사

placeholder marker, 미완성 표시, 범위 회피 표현을 세 문서에서 검색했다.

검색 결과: 없음.

## 모순 검사

확인한 내용:

- `/search`를 canonical music route로 두는 방향은 screening, design, codebase에서 일관된다.
- `/library`는 별도 페이지가 아니라 favorites view redirect/alias로 일관된다.
- `/track/[id]`는 full-page detail이 아니라 `/search?track=<id>` 기반 aside 진입으로 일관된다.
- Cloudinary resource type은 `video`로 조회하고 `mp3` format을 Track으로 정규화한다는 설명이 일관된다.
- Audius/lyrics는 active runtime path에서 제거한다는 방향이 일관된다.

판정: 문서 간 직접 모순 없음.

## 범위 검사

범위가 큰 축은 네 가지다.

1. Cloudinary 데이터 소스 복원
2. Search/Favorite/Detail route shell 재편
3. Player UI polish
4. Landing starfield 조정

각 축은 독립 Task로 나눌 수 있고, 단계별 테스트가 가능하다. 전면 재작성(C안)은 screening에서 제외했으므로 범위는 현재 요청에 맞게 제어되어 있다.

## 리스크 재확인

- Cloudinary folder에 현재 asset이 1개뿐이라 UI 검증 시 리스트 밀도는 mock/test data로 보완해야 한다.
- sample asset에 metadata가 없으므로 첫 구현은 보수적 filename fallback만 사용한다.
- Cloudinary Admin API rate limit 때문에 server-side short cache가 필요하다.
- 외부 API 제거 작업은 TypeScript import 오류를 통해 누락을 확인해야 한다.
- Player polish는 오디오 엔진 변경으로 번지지 않게 UI component 범위로 제한해야 한다.

## 검토 결론

문서 세트는 구현 계획 작성에 사용할 수 있다. 다음 단계는 `docs/superpowers/plans/2026-06-26-cloudinary-spotify-shell.md`에 작업 Task를 분리하고, Subagent-driven 실행이 가능하도록 각 Task의 파일, 테스트, 검증 명령을 명시하는 것이다.
