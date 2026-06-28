# Cloudinary 리소스 타입 분리/API 캐시 정책 작업 (2026-06-26)

- 작성일: 2026-06-26
- 범위: Cloudinary 트랙 조회 API 분리 + 캐시 정책 정리 + 이미지 조회 결과 화면 반영
- 방식: Subagent-Driven

## 1) 아이디어 제안 및 스크리닝

- 원본 이슈: `/api/cloudinary/tracks`가 `resourceType=video`로 고정되어 있어 이미지 타입 조회가 빠짐.
- 해결 방향:
  - `video`/`image` 별도 라우트 제공
  - `resourceType` 파라미터 지원은 계속 유지해 범용 호출 가능하게 유지
  - 이미지 조회 결과는 기존 트랙 목록 UI에서 아트워크로 표시 가능하도록 보장
- 리스크:
  - 라우트 분기 시 캐시 정책과 키가 어긋나면 stale 응답/과도한 API 호출 가능
  - 페이지 쿼리 파라미터와 내부 상태가 어긋나면 동일 리스트의 반복 호출 우려

## 2) 기획설계

- API 레이어
  - `GET /api/cloudinary/tracks/video`
  - `GET /api/cloudinary/tracks/image`
  - 기존 `GET /api/cloudinary/tracks`는 `resourceType`/`filterPlayable` 쿼리를 받는 범용 라우트로 유지
- 캐시 정책
  - video: 60초
  - image: 300초
  - all: 120초
  - `buildCloudinaryCacheHeader`로 `Cache-Control` 통일
- 클라이언트 훅
  - 기본 조회는 `/api/cloudinary/tracks/video`
  - `resourceType: "image"`면 `/api/cloudinary/tracks/image`
  - `resourceType: "all"`은 `/api/cloudinary/tracks?resourceType=all`
- UI
  - `/search` 진입 시 `resourceType` 쿼리 지원 (`video|image|all`)
  - 상태 전달을 `MusicShell`로 전달해 리스트 조회 타입 전환
- 노출
  - 이미지 트랙은 `artworkUrl`를 이미지 URL로 매핑해 썸네일 렌더링

## 3) 코드베이스 기반 문서구체화

- `src/app/api/cloudinary/tracks/video/route.ts` 신규 추가
- `src/app/api/cloudinary/tracks/image/route.ts` 신규 추가
- `src/app/api/cloudinary/tracks/route.ts` 캐시 헤더 및 옵션 정규화 정합
- `src/shared/api/cloudinary/cloudinaryAdapter.ts`
  - image 타입 시 기본 아트워크를 `secure_url`로 보완
- `src/shared/api/cloudinary/cloudinaryClient.ts`
  - 리소스 타입별 캐시 정책 상수/조회/헤더 생성
- `src/features/cloudinary/hooks/useCloudinaryTracks.ts`
  - 리소스 타입별 엔드포인트 라우팅
- `src/app/search/page.tsx`, `src/app/search/searchPageClient.tsx`, `src/views/search/index.tsx`, `src/widgets/musicShell/index.tsx`
  - `resourceType` 전달 경로 정비 및 셸 상태 반영
- 테스터블 아티팩트
  - `src/test/app/api/cloudinary/tracks.route.test.ts`
  - `src/test/app/api/cloudinary/tracks-type-routes.test.ts`
  - `src/test/features/cloudinary/useCloudinaryTracks.test.tsx`
  - `src/shared/api/cloudinary/__tests__/cloudinaryClient.test.ts`

## 4) 문서검토

- 기존 외부 음악 API 제거 정책은 기존 흐름과 충돌이 없어 유지됨
- `/search`에 리소스타입 제어를 추가해 기본 화면은 기존(기본 video) 동작 유지
- 캐시 TTL/`max-results`는 타입별 상수 정책으로 분리되어 확장/운영 편의성 확보

## 5) 작업 Task 분리

- Task A: API 분기 구축
  - `/image`, `/video` 라우트 추가
  - 범용 라우트 캐시헤더 정책 반영
- Task B: 클라이언트 라우팅
  - `useCloudinaryTracks`에서 타입별 경로 분기
  - 기존 호출부 호환성 유지(기본값은 video)
- Task C: 검색 페이지 타입 전달
  - `search` 페이지 `resourceType` 쿼리 파싱 및 셸 전달
- Task D: 테스트/문서 정합
  - 라우트/훅/클라이언트 캐시 정책 테스트 추가/갱신

## 6) 구현진행

- [x] `/api/cloudinary/tracks/image` 및 `/api/cloudinary/tracks/video` 라우트 분기
- [x] `/api/cloudinary/tracks` 범용 라우트 캐시 헤더 적용
- [x] 이미지 리소스의 아트워크 기본값 반영
- [x] `resourceType`별 훅 라우팅 및 쿼리 파라미터 정렬
- [x] `/search`에서 resourceType 쿼리 전달 경로 정렬
- [x] 캐시 정책/헤더/타입 라우트 테스트 보강

## 7) 다음 작업

- `resourceType` 토글 버튼 라벨/아이콘 UX를 Spotify 유사성에 맞춰 정교화
- 조회 성능이 필요한 경우 `resourceType=image`에 대해 `max_results`/페이지 정책 분리 재조정
