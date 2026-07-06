# 2026-07-06 카탈로그/검색 fallback 작업 인수인계

## 1. 현재 상태

- 작업 branch: `feature/optimization-roadmap`
- 최신 작업 범위: `/search` catalog/search fallback hardening
- 현재 핵심 HEAD: `cf9f86d fix: address search fallback review findings`
- 기준 commit: `457a45f fix(perf): optimize search artwork payloads`
- 최종 review 결과: merge-ready

## 2. 완료된 작업

- 카탈로그 fetch 실패 시 이전 성공 결과를 보존한다.
- 검색 결과 없음과 카탈로그 장애 상태를 분리했다.
- 검색 결과 없음 상태에서 `검색어 지우기` action을 제공한다.
- Recent view에서 `IndexedDB` recent/cache 실패를 비차단 fallback으로 분리했다.
- selected/deep-linked track detail 복구 실패 시 한글 fallback copy를 표시한다.
- `Sentry` fallback 이벤트를 sanitized payload로 연결했다.
- `indexeddb_unavailable` 이벤트에서 `recent_plays_read`와 `track_cache_bulk_read`를 구분한다.
- stale fallback 상태에서 header count와 실제 visible list count가 어긋나지 않게 보정했다.
- `selected_track_unavailable` 이벤트를 query/id/url 없이 연결했다.

## 3. 주요 커밋

```text
cf9f86d fix: address search fallback review findings
33b486a docs: record catalog search fallback verification
b3398cc feat: capture sanitized search fallback events
b41f27e test: stabilize selected track fallback regression
6db073f fix: clarify selected track fallback copy
0d51109 feat: distinguish recent cache fallback state
a976a4b feat: clarify search fallback messages
b6e2a49 fix: reset stale snapshot on empty catalog success
c53ad80 fix: dedupe music shell fallback notices
a5048b9 feat: preserve search results on catalog errors
5df5675 fix: add CatalogFallbackCopy and Korean fallback copy
80906e8 feat: add search fallback state model
```

## 4. 검증 결과

보고된 검증 결과:

```text
npm test -- src/test/widgets/musicShell.test.tsx --runInBand
PASS, 33/33
```

```text
npm test -- src/shared/db/repositories/__tests__/trackCacheRepo.test.ts src/shared/db/repositories/__tests__/recentPlaysRepo.test.ts --runInBand
PASS, 12/12
```

```text
npm test -- src/test/ops/searchFallbackEvents.test.ts --runInBand
PASS, 1/1
```

```text
LIGHTHOUSE_PORT=4011 npm run perf:lighthouse:assert
PASS, 3 URLs, 9 total runs
```

잔여 리스크:

- `musicShell` 테스트는 PASS지만 기존 `React act(...)` warning이 남아 있다.

## 5. 다른 컴퓨터에서 재개할 때

```bash
git fetch origin
git checkout feature/optimization-roadmap
git pull
git log --oneline -5
```

기대 최신 commit:

```text
cf9f86d fix: address search fallback review findings
```

이 handoff 문서와 `docs/observability/error-handling-policy.md`를 포함한 후속 문서 commit이 push되어 있으면 그 commit도 함께 확인한다.

## 6. 현재 미비 작업

### 6.3 다음 단계

다음 작업은 에러/메시지 핸들링 절차다.

관련 문서:

```text
docs/observability/error-handling-policy.md
```

권장 순서:

1. error taxonomy constants 설계
2. playback error UI copy 정리
3. route/global error boundary copy 정리
4. Sentry event context helper 확장
5. 사용자-facing 메시지 회귀 테스트 추가

## 7. 작업 규칙

- 문서는 한글로 작성한다.
- 코드 식별자, 파일명, 이벤트명은 원문을 유지한다.
- `Sentry`에는 query 원문, media URL, artwork URL, provider raw response를 보내지 않는다.
- `/search` artwork lazy/deferred loading 최적화는 회귀시키지 않는다.
- `IndexedDB` 실패는 browsing/playback을 막지 않는 비차단 fallback이어야 한다.
