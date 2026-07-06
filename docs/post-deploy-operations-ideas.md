# 운영 배포 이후 작업 아이디어 제안

## 1. 문서 목적

이 문서는 EDMM V2 웹사이트의 운영 배포 이후 단계에서 검토할 작업 후보를 정리한다.

현재 단계는 `아이디어 제안`이다. 구현, 상세 설계, 코드베이스 기반 태스크 분리는 아직 진행하지 않는다.

## 2. 진행 단계

1. `아이디어 제안`
2. `스크리닝`
3. `기획설계`
4. `코드베이스 기반 문서 구체화`
5. `문서 검토`
6. `작업 Task 분리`
7. `구현 진행`

## 3. 현재 프로젝트 맥락

- 제품: EDMM V2, Spotify-inspired 반응형 웹 음악 플레이어
- 프레임워크: Next.js 16 App Router
- 런타임: React 19
- 주요 상태 관리: TanStack Query, Zustand
- 로컬 데이터: Dexie 기반 IndexedDB
- 주요 UI 특성: 글로벌 오디오 플레이어, 데스크톱/모바일 fullscreen player, 시각화 canvas, 반응형 레이아웃, 트랙 리스트 virtualization
- 현재 README 기준 이미 개선된 축: LCP, CLS, INP, 프레임 안정성, 반응형 동작, 부작용 감소

## 4. 아이디어 제안 원칙

- 먼저 측정 가능성을 만든다. 성능 개선, 에러 개선, 사용자 트래킹은 운영 데이터가 없으면 우선순위가 흔들린다.
- 사용자 경험에 직접 영향을 주는 실패 경로를 우선한다. 음악 재생, 검색, fullscreen, IndexedDB, 네트워크 실패가 핵심이다.
- 개인정보와 사용자 신뢰를 해치지 않는 범위에서 트래킹한다. 이벤트 설계는 PII 비수집을 기본값으로 둔다.
- 구현 전에 운영 기준을 먼저 정의한다. 예: Core Web Vitals 예산, 에러 알림 기준, 이벤트 네이밍 규칙, 배포 체크리스트.

## 5. 운영 이후 작업 아이디어

### 5.1 성능 체크 및 성능 예산

#### 아이디어

- Core Web Vitals 측정 체계 도입: LCP, CLS, INP, FCP, TTFB
- 실제 사용자 환경 기준 RUM 데이터 수집
- Next.js bundle 분석 및 페이지/컴포넌트 단위 번들 예산 설정
- media-heavy fullscreen UI, visualizer, animation 영역의 lazy loading 점검
- 이미지와 artwork 로딩 전략 점검
- React Query 캐시 정책과 stale time 점검
- Dexie 초기화, catalog hydration, recent plays 로딩 비용 측정
- 트랙 리스트 virtualization의 대량 데이터 성능 회귀 체크
- 모바일 저사양 기기 기준 애니메이션/visualizer 프레임 안정성 체크

#### 기대 효과

- 배포 이후 사용자 환경에서 체감 성능 병목을 확인할 수 있다.
- 성능 개선 작업이 감이 아니라 지표 기반으로 전환된다.
- 이후 리팩터링이나 기능 추가 시 성능 회귀를 방지할 기준이 생긴다.

#### 다음 단계 후보

- `성능 기준선 측정`을 첫 번째 스크리닝 후보로 둔다.
- 성능 예산은 초기에는 엄격하게 잡기보다 경고 기준부터 시작한다.

### 5.2 예외처리 및 에러 고도화

#### 아이디어

- 앱 전역 Error Boundary와 route/widget 단위 Error Boundary 분리
- 오디오 재생 실패, artwork 로딩 실패, 검색 실패, IndexedDB 실패를 도메인 에러로 분류
- API/비동기 요청 에러를 공통 형식으로 정규화
- 사용자에게 보여줄 에러 메시지와 개발자용 로그 메시지 분리
- 재시도 가능한 에러와 즉시 중단해야 하는 에러 구분
- 오프라인/네트워크 불안정 상태 fallback 처리
- Dexie schema migration 실패 또는 IndexedDB 접근 실패 복구 UX 설계
- 재생 큐/최근 재생 데이터 손상 시 안전한 초기화 경로 제공
- 에러 발생 시 release version, route, user action context를 함께 기록

#### 기대 효과

- 운영 중 발생하는 장애를 재현 가능한 정보로 바꿀 수 있다.
- 사용자에게 원인 불명의 실패 화면 대신 복구 가능한 경로를 제공할 수 있다.
- 도메인별 실패 경로가 명확해져 테스트 범위도 구체화된다.

#### 다음 단계 후보

- `에러 분류 체계`와 `사용자 표시 메시지 정책`을 먼저 설계한다.
- 이후 Sentry 같은 에러 수집 도구 도입 여부를 스크리닝한다.

### 5.3 관측성, 로깅, 알림

#### 아이디어

- 클라이언트 에러 수집 도구 도입 검토
- Web Vitals, JavaScript error, unhandled promise rejection 수집
- 배포 버전, 브라우저, viewport, route, feature area 태깅
- critical path 이벤트 로그 정의: app boot, catalog load, search, track select, play, fullscreen open
- 운영 대시보드 구성: 성능, 에러율, 주요 UX 이벤트
- 장애 알림 기준 정의: 특정 에러 급증, Web Vitals 악화, 배포 직후 에러율 상승
- console 로그 정리 및 운영 로그 레벨 정책 수립

#### 기대 효과

- 배포 이후 문제가 발생했을 때 사용자의 신고에만 의존하지 않게 된다.
- 성능 개선, 에러 개선, 사용자 트래킹을 같은 운영 지표 흐름에서 볼 수 있다.
- 릴리즈별 품질 비교가 가능해진다.

#### 다음 단계 후보

- `관측성 최소 세트`를 먼저 만든다.
- 최소 세트는 error tracking, Web Vitals, release tagging으로 시작한다.

### 5.4 사용자 트래킹 및 제품 분석

#### 아이디어

- 이벤트 taxonomy 설계
- 검색 이벤트: query submitted, result clicked, empty result
- 재생 이벤트: track selected, play started, pause, seek, next, previous
- fullscreen 이벤트: opened, closed, mobile drag close
- 큐 이벤트: queue changed, repeat/shuffle changed
- UX 이벤트: keyboard shortcut used, bottom tab changed, aside collapsed
- retention proxy 이벤트: recent plays loaded, returning session
- funnel 설계: landing -> catalog loaded -> search -> track selected -> play started
- 개인정보 비수집 원칙 정의: track id, route, action 중심으로 수집하고 직접 식별 정보는 제외
- consent 필요 여부 검토

#### 기대 효과

- 사용자가 실제로 어떤 흐름에서 음악을 재생하는지 알 수 있다.
- 구현 리소스를 많이 쓰는 기능이 실제 사용되는지 검증할 수 있다.
- 성능과 에러가 사용자 행동에 미치는 영향을 연결해서 볼 수 있다.

#### 다음 단계 후보

- `이벤트 네이밍 규칙`과 `수집 금지 데이터`를 먼저 문서화한다.
- 도구 선택은 PostHog, Plausible, GA4, Vercel Analytics 등을 비교한 뒤 결정한다.

### 5.5 배포, 릴리즈, 회귀 방지

#### 아이디어

- 배포 전 smoke checklist 작성
- preview deployment 기준 수동 확인 항목 정의
- build, lint, test, coverage, bundle size를 릴리즈 게이트로 정리
- 성능 회귀 체크를 CI 또는 수동 릴리즈 체크에 포함
- rollback 기준과 절차 문서화
- 환경변수 검증 로직 도입
- dependency audit 및 보안 업데이트 루틴 정의
- release note template 작성

#### 기대 효과

- 배포 품질이 개인 기억이나 수동 감각에 의존하지 않는다.
- 버그fix 이후 새로운 회귀가 생기는 위험을 줄인다.
- 운영 작업의 반복 비용이 낮아진다.

#### 다음 단계 후보

- `배포 전 체크리스트`를 빠르게 만들고 이후 자동화 여부를 판단한다.

### 5.6 접근성 및 사용자 환경 안정성

#### 아이디어

- 키보드 접근성 회귀 체크
- focus trap, focus restore, fullscreen close focus 처리 점검
- slider, button, tab, tooltip의 ARIA 상태 확인
- reduced motion 환경에서 visualizer/animation 동작 정책 정의
- 모바일 touch target 크기와 drag interaction 안정성 점검
- color contrast와 artwork 기반 색상 추출 결과의 가독성 점검

#### 기대 효과

- 음악 플레이어의 핵심 조작이 다양한 입력 환경에서 안정적으로 동작한다.
- 성능 개선과 애니메이션 개선이 접근성을 해치지 않게 된다.

#### 다음 단계 후보

- `핵심 플레이어 조작 접근성 체크리스트`를 우선 후보로 둔다.

### 5.7 데이터 품질과 로컬 저장소 안정성

#### 아이디어

- 트랙 metadata 누락/중복/깨짐 대응
- album artwork fallback 정책
- IndexedDB schema versioning 정책
- local cache invalidation 기준
- 최근 재생 목록 손상 복구
- catalog hydration 실패 시 fallback UI
- offline 상태에서 가능한 기능과 불가능한 기능 구분

#### 기대 효과

- 음악 플레이어의 핵심 데이터가 깨졌을 때도 앱 전체가 실패하지 않는다.
- 로컬 캐시와 IndexedDB를 운영 관점에서 안전하게 다룰 수 있다.

#### 다음 단계 후보

- `IndexedDB 실패/복구 시나리오`를 스크리닝 후보로 둔다.

## 6. 추천 우선순위 초안

### P0: 운영 가시성 기반 만들기

- Web Vitals 수집
- 클라이언트 에러 수집
- release/version tagging
- 최소 운영 대시보드

#### 이유

성능 개선, 에러 고도화, 사용자 트래킹은 먼저 측정 체계가 있어야 우선순위를 판단할 수 있다.

### P1: 핵심 실패 경로 안정화

- 오디오 재생 실패 처리
- 검색 실패 처리
- artwork 로딩 실패 처리
- IndexedDB 실패 및 복구 처리
- 전역/부분 Error Boundary

#### 이유

EDMM의 핵심 경험은 검색, 선택, 재생, fullscreen 조작이다. 이 흐름의 실패 처리가 우선이다.

### P2: 사용자 행동 분석 MVP

- 이벤트 taxonomy
- 재생 funnel
- 검색 funnel
- fullscreen usage
- keyboard shortcut usage

#### 이유

사용자가 실제로 쓰는 기능과 이탈 지점을 알아야 이후 기능 개선의 우선순위를 정할 수 있다.

### P3: 릴리즈 운영 체계

- smoke checklist
- bundle/performance budget
- preview deployment checklist
- rollback checklist
- dependency/security routine

#### 이유

운영 품질을 장기적으로 유지하려면 반복 가능한 릴리즈 기준이 필요하다.

## 7. 스크리닝 기준 초안

각 후보 작업은 다음 항목으로 평가한다.

| 기준 | 설명 | 점수 방향 |
| --- | --- | --- |
| 사용자 영향 | 핵심 재생 경험, 탐색, 검색, 안정성에 미치는 영향 | 높을수록 우선 |
| 운영 근거 | README, 코드 구조, 실제 측정 데이터, 배포 로그 등으로 뒷받침되는 정도 | 높을수록 우선 |
| 구현 크기 | 작업 규모와 사이드이펙트 가능성 | 낮을수록 우선 |
| 선행 가치 | 이후 작업의 판단 근거가 되는 정도 | 높을수록 우선 |
| 개인정보 위험 | 사용자 식별 가능성, consent 필요성, 보관 정책 부담 | 낮을수록 우선 |
| 회귀 위험 | 기존 재생/검색/fullscreen 흐름을 깨뜨릴 가능성 | 낮을수록 우선 |

## 8. 스크리닝으로 넘길 1차 후보

1. `Web Vitals + 클라이언트 에러 수집 최소 세트`
2. `에러 분류 체계와 사용자 표시 메시지 정책`
3. `오디오/검색/IndexedDB 핵심 실패 경로 fallback`
4. `사용자 이벤트 taxonomy MVP`
5. `배포 전 smoke checklist`
6. `bundle 분석과 성능 예산 초안`
7. `접근성 회귀 체크리스트`

## 9. 현재 단계 가드레일

| 가드레일 | 상태 | 근거 |
| --- | --- | --- |
| 범위 | PASS | 현재 문서는 운영 배포 이후 작업의 아이디어 제안에 한정한다. 구현, 코드 수정, 상세 설계는 포함하지 않는다. |
| 근거 | PASS | README와 package.json 기준으로 Next.js, React, TanStack Query, Zustand, Dexie, 음악 플레이어 도메인, 성능 개선 이력을 반영했다. |
| 모순 | PASS | 기존 README의 성능 개선 방향과 충돌하지 않고, 운영 측정/예외처리/트래킹을 후속 단계로 제안한다. |
| 가독성 | PASS | 작업 후보를 성능, 예외처리, 관측성, 트래킹, 배포, 접근성, 데이터 안정성으로 분리했다. |

## 10. 다음 단계 진입 전 확인 필요사항

`스크리닝` 단계로 넘어가려면 아래 항목이 필요하다. 현재 문서 작성 단계는 PASS지만, 다음 단계는 이 정보가 없으면 BLOCKED 처리한다.

1. 운영 배포 환경: Vercel 기준인지, 별도 인프라가 있는지
2. 사용자 트래킹 도구 선호: GA4, Vercel Analytics, Plausible, PostHog, 직접 수집 중 선택 필요
3. 에러 수집 도구 선호: Sentry, LogRocket, Highlight, 직접 수집 중 선택 필요
4. 개인정보/쿠키 consent 적용 수준
5. 우선 목표: 포트폴리오 완성도, 실제 사용자 운영 안정성, 성능 점수 개선, 제품 분석 중 무엇이 1순위인지

## 11. 권장 다음 액션

다음 단계는 `스크리닝`이다. 우선 `Web Vitals + 클라이언트 에러 수집 최소 세트`와 `에러 분류 체계`를 가장 먼저 비교하는 것이 합리적이다.

이유는 두 작업이 이후 성능 개선, 예외처리, 사용자 트래킹, 릴리즈 운영의 판단 근거가 되기 때문이다.

## 12. 스크리닝 입력값

사용자가 선택한 우선순위는 다음과 같다.

1. `운영 안정성`
2. `성능 점수 개선`
3. `완성도`

이번 스크리닝에서는 사용자 행동 분석보다 운영 안정성과 성능 기준선 확보를 우선한다. 사용자 트래킹은 포트폴리오 완성도에는 도움이 되지만, 현재 우선순위에서는 핵심 안정화와 성능 측정 이후로 둔다.

## 13. 스크리닝 방식

각 후보는 아래 기준으로 판단한다.

| 기준 | 가중치 | 판단 방식 |
| --- | ---: | --- |
| 운영 안정성 | 5 | 장애 탐지, 실패 복구, 배포 안정성에 직접 기여하는가 |
| 성능 점수 개선 | 4 | Core Web Vitals, bundle, 렌더링 안정성 개선에 기여하는가 |
| 완성도 | 3 | 포트폴리오/제품 완성도와 운영 문서화 수준을 높이는가 |
| 구현 리스크 | -3 | 기존 재생, 검색, fullscreen, IndexedDB 흐름을 깨뜨릴 가능성이 큰가 |
| 선행 가치 | 4 | 이후 작업의 판단 근거나 공통 기반이 되는가 |

정량 점수는 절대값이 아니라 상대 우선순위 비교용이다.

## 14. 후보별 스크리닝 결과

| 순위 | 후보 | 판정 | 상대 점수 | 근거 |
| ---: | --- | --- | ---: | --- |
| 1 | Web Vitals + 클라이언트 에러 수집 최소 세트 | PASS | 92 | 운영 안정성과 성능 점수 개선의 공통 기반이다. 릴리즈별 성능/에러 변화를 볼 수 있어 선행 가치가 가장 높다. |
| 2 | 에러 분류 체계와 사용자 표시 메시지 정책 | PASS | 88 | 에러 고도화의 기준점이다. 구현 전 정책 문서만으로도 완성도를 높이고, 이후 Error Boundary와 fallback 설계의 근거가 된다. |
| 3 | 오디오/검색/IndexedDB 핵심 실패 경로 fallback | PASS | 84 | EDMM의 핵심 경험 실패를 직접 줄인다. 다만 코드 변경 범위가 커질 수 있어 정책 수립 이후 진행하는 편이 안전하다. |
| 4 | 배포 전 smoke checklist | PASS | 81 | 구현 리스크가 낮고 운영 완성도에 즉시 기여한다. 성능 점수 자체를 올리지는 않지만 회귀 방지 효과가 크다. |
| 5 | bundle 분석과 성능 예산 초안 | PASS | 76 | 성능 점수 개선에 직접 연결된다. 다만 측정 체계가 없으면 일회성 분석으로 끝날 수 있어 Web Vitals 기반 이후가 적절하다. |
| 6 | 접근성 회귀 체크리스트 | PASS | 69 | 완성도와 품질에 기여한다. 현재 우선순위에서는 운영 장애나 성능 점수보다 후순위다. |
| 7 | 사용자 이벤트 taxonomy MVP | HOLD | 58 | 제품 분석에는 필요하지만 이번 우선순위에서 사용자 행동 분석이 빠졌다. 안정성/성능 기반 이후 재검토한다. |

## 15. 스크리닝 결론

이번 라운드에서 바로 기획설계로 넘길 묶음은 아래 4개다.

1. `Web Vitals + 클라이언트 에러 수집 최소 세트`
2. `에러 분류 체계와 사용자 표시 메시지 정책`
3. `오디오/검색/IndexedDB 핵심 실패 경로 fallback`
4. `배포 전 smoke checklist`

`bundle 분석과 성능 예산 초안`은 1번의 측정 체계가 잡힌 뒤 진행한다. 성능 예산은 측정 기준 없이 먼저 잡으면 실제 사용자 환경과 어긋날 수 있다.

`사용자 이벤트 taxonomy MVP`는 이번 라운드에서는 보류한다. 운영 안정성, 성능 점수, 완성도라는 현재 우선순위에서는 에러/성능 관측과 실패 경로 개선이 더 직접적이다.

## 16. 권장 기획설계 순서

### 16.1 Phase 1: 운영 관측 최소 기반

- Web Vitals 수집 범위 정의
- 클라이언트 에러 수집 범위 정의
- release/version tagging 정책
- 수집 금지 데이터 정의
- 운영 대시보드에 필요한 최소 필드 정의

### 16.2 Phase 2: 에러 정책과 실패 경로 설계

- 에러 카테고리 정의: audio, search, indexedDB, artwork, network, unknown
- 사용자 표시 메시지와 개발자 로그 메시지 분리
- 재시도 가능/불가능 에러 구분
- Error Boundary 적용 위치 후보 정의
- fallback UI 원칙 정의

### 16.3 Phase 3: 배포 전 회귀 방지

- smoke checklist 작성
- 핵심 경로 수동 검증 항목 작성
- 성능 점수 확인 항목 작성
- 에러 대시보드 확인 항목 작성
- rollback 판단 기준 작성

### 16.4 Phase 4: 성능 분석과 예산화

- bundle 분석
- Core Web Vitals 목표치 초안
- mobile 기준 성능 체크
- visualizer/fullscreen lazy loading 점검
- 성능 회귀 기준 설정

## 17. 기획설계 진입 전 확인 필요사항

스크리닝 자체는 완료되었지만, 다음 단계인 `기획설계`는 아래 정보가 없으면 BLOCKED다.

1. 배포 환경이 Vercel인지 여부
2. 에러 수집 도구를 도입할지 여부
3. Web Vitals/Analytics 도구를 도입할지 여부
4. 개인정보/쿠키 consent를 어느 수준까지 적용할지

현재 우선순위상 권장 기본값은 다음과 같다.

- 배포 환경: README 링크 기준 Vercel로 가정
- 에러 수집: Sentry 또는 Vercel Observability 계열 검토
- Web Vitals: Vercel Analytics 또는 직접 `web-vitals` 수집 검토
- 사용자 행동 트래킹: 이번 라운드에서는 보류

## 18. 스크리닝 단계 가드레일

| 가드레일 | 상태 | 근거 |
| --- | --- | --- |
| 범위 | PASS | 사용자가 지정한 우선순위인 운영 안정성, 성능 점수 개선, 완성도에 맞춰 기존 아이디어를 선별했다. 구현과 상세 코드 설계는 포함하지 않았다. |
| 근거 | PASS | README/package.json에서 확인한 EDMM V2의 Next.js, React, TanStack Query, Zustand, Dexie, 오디오 플레이어, 검색, fullscreen, 성능 개선 이력을 기준으로 판단했다. |
| 모순 | PASS | 사용자 행동 분석을 완전히 제거하지 않고 HOLD로 분리했다. 현재 우선순위와 충돌하지 않도록 안정성/성능 기반 이후로 배치했다. |
| 가독성 | PASS | 후보별 판정, 상대 점수, 결론, 권장 기획설계 순서를 분리해 다음 단계로 넘길 수 있게 정리했다. |

## 19. 다음 단계 상태

`스크리닝`: PASS

`기획설계`: BLOCKED

BLOCKED 이유는 관측성 도구와 배포 환경에 대한 선택이 아직 확정되지 않았기 때문이다. 기획설계에서는 어떤 도구를 쓰는지에 따라 데이터 흐름, 에러 필드, 개인정보 처리, 구현 위치가 달라진다.

## 20. 기획설계 입력값 확정

사용자가 다음 기준을 확정했다.

1. 배포 환경은 `Vercel` 기준으로 진행한다.
2. 성능 체크는 `Lighthouse CI + Vercel Speed Insights` 조합으로 진행한다.
3. 구현 전 성능 baseline과 구현 후 성능 결과를 비교한다.

이번 기획설계의 범위는 성능 측정 및 운영 관측 기반으로 한정한다. 에러 수집 도구, 사용자 행동 분석 도구, 쿠키 consent 정책은 아직 확정되지 않았으므로 이번 task 분리에서는 제외한다.

## 21. 기획설계 결과

### 21.1 목표

운영 배포 이후 성능을 감으로 판단하지 않고, 구현 전/후 같은 기준으로 측정할 수 있는 체계를 만든다.

### 21.2 측정 체계

- `Lighthouse CI`: 로컬 production build 기준의 반복 가능한 lab 성능 측정
- `Vercel Speed Insights`: Vercel production 환경의 실제 Web Vitals 관측
- 측정 대상 route: `/`, `/search?view=all`, `/search?view=recent`
- 측정 시점: 구현 전 baseline, 구현 후 comparison

### 21.3 PASS 기준 초안

- Lighthouse performance score가 route별로 baseline 대비 5점 초과 하락하지 않는다.
- CLS는 `0.1` 이하를 유지한다.
- LCP는 `2500ms` 이하이거나 baseline 대비 개선되어야 한다.
- Accessibility, Best Practices, SEO에 새로운 심각한 경고를 만들지 않는다.
- Vercel Speed Insights에서 production Web Vitals 회귀가 확인되지 않는다.

### 21.4 제외 범위

- Sentry, LogRocket, Highlight 등 에러 수집 도구 도입
- GA4, PostHog, Plausible 등 사용자 행동 분석 도구 도입
- 쿠키/consent banner 구현
- 실제 성능 최적화 코드 변경

이번 단계는 측정 체계 구축과 task 분리까지다. 최적화 구현은 후속 단계에서 baseline을 확보한 뒤 진행한다.

## 22. 코드베이스 기반 문서 구체화

확인한 코드베이스 근거는 다음과 같다.

| 항목 | 확인 내용 | 설계 반영 |
| --- | --- | --- |
| App Router | `src/app/layout.tsx`가 root layout이다. | Vercel Speed Insights는 root layout 경계에 연결한다. |
| Provider 구조 | `src/app/appProviders.tsx`가 TanStack Query, AudioPlayerProvider, ToggleProvider, AudioPlayerWidget을 감싼다. | 측정 컴포넌트는 product provider와 분리해 `src/app/performanceInsights.tsx`로 둔다. |
| Error route | `src/app/error.tsx`가 이미 존재한다. | 에러 수집 도구는 미확정이므로 이번 범위에서 제외한다. |
| 주요 route | `/`, `/search`, `/track/[id]`가 존재하고 `/track/[id]`는 `/search?track=<id>`로 redirect한다. | Lighthouse CI는 안정적인 route인 `/`, `/search?view=all`, `/search?view=recent`를 우선 측정한다. |
| 테스트 | Jest, Testing Library, jsdom 환경이 있다. | Lighthouse config와 Speed Insights wrapper를 Jest로 최소 검증한다. |
| 기존 성능 문서 | `docs/plans/2026-06-23-phase6-performance.md`가 있다. | 이번 문서는 최적화 구현 계획이 아니라 성능 측정/관측 체계 계획으로 분리한다. |
| 기존 패키지 | `@vercel/speed-insights`, `@lhci/cli`는 현재 확인된 dependency 목록에 없다. | 구현 task에서 dependency 추가를 별도 작업으로 분리한다. |

## 23. 문서 검토

| 가드레일 | 상태 | 근거 |
| --- | --- | --- |
| 범위 | PASS | 이번 문서는 Vercel 기준 성능 측정/관측 체계와 구현 전후 비교 task 분리에 한정한다. |
| 근거 | PASS | README, package.json, `src/app/layout.tsx`, `src/app/appProviders.tsx`, `src/app/error.tsx`, route 파일, Jest 설정을 기준으로 구체화했다. |
| 모순 | PASS | 기존 성능 최적화 문서와 충돌하지 않도록 측정 인프라 계획으로 분리했다. |
| 가독성 | PASS | 기획설계, 코드베이스 근거, 문서검토, task 분리를 단계별로 분리했다. |

## 24. 작업 Task 분리

세부 구현 계획 문서:

`docs/superpowers/plans/2026-07-04-vercel-performance-observability.md`

분리된 task는 다음과 같다.

1. `Lighthouse CI config + route coverage test`
2. `Vercel Speed Insights root layout integration`
3. `Vercel performance measurement SOP`
4. `Lighthouse result summary writer`
5. `Before-implementation baseline recording`
6. `After-implementation comparison recording`

## 25. 현재 단계 상태

`아이디어 제안`: PASS

`스크리닝`: PASS

`기획설계`: PASS

`코드베이스 기반 문서 구체화`: PASS

`문서검토`: PASS

`작업 Task 분리`: PASS

`구현 진행`: BLOCKED

BLOCKED 이유는 아직 구현 시작 승인을 받지 않았기 때문이다. 다음 단계에서 구현을 시작하면 baseline 측정을 먼저 수행해야 하며, baseline 없이 최적화 코드를 먼저 변경하면 성능 전/후 비교 기준이 사라진다.

## 26. Sentry 도입 확정

사용자가 Sentry 도입을 확정했다.

### 26.1 입력값

- 도구: `Sentry`
- 사용 플랜: 무료 플랜만 사용
- DSN: Vercel 환경변수 `NEXT_PUBLIC_SENTRY_DSN`으로 관리
- 제공된 DSN: `https://db19876b95d69420736d17e300512dfd@o4511675546664960.ingest.us.sentry.io/4511675552038912`

### 26.2 무료 플랜 기준 설정

| 항목 | 결정 |
| --- | --- |
| Error Monitoring | 포함 |
| Tracing | 포함, production sampling `0.05` |
| Session Replay | error-only replay 포함, normal session replay 제외 |
| User Feedback | 제외 |
| Profiling | 제외 |
| Sentry Logs | 제외 |
| Source Map Upload | `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` 제공 전까지 제외 |
| sendDefaultPii | `false` |
| 사용자 행동 분석 | 제외 |

### 26.3 설계 방향

Sentry는 기존 `Vercel + Lighthouse CI + Speed Insights` 성능 관측 계획과 분리한다. 성능 측정 체계는 lab/production Web Vitals를 다루고, Sentry는 runtime error 관측과 App Router error capture를 담당한다.

도입 위치는 Next.js App Router 공식 흐름에 맞춘다.

- `src/instrumentation-client.ts`
- `src/sentry.server.config.ts`
- `src/sentry.edge.config.ts`
- `src/instrumentation.ts`
- `src/app/error.tsx`
- `src/app/global-error.tsx`
- `next.config.ts`

### 26.4 작업 Task 분리

세부 구현 계획 문서:

`docs/superpowers/plans/2026-07-04-sentry-error-observability.md`

분리된 task는 다음과 같다.

1. `Sentry free-plan options`
2. `Client/server/edge runtime initialization`
3. `Next.js config wrapping with Sentry`
4. `App Router error capture`
5. `Sentry free-plan operation SOP`

추가 결정:

- `replaysSessionSampleRate`: `0`
- `replaysOnErrorSampleRate`: `0.2`
- Replay privacy: `maskAllText`, `maskAllInputs`, `blockAllMedia` 모두 활성화

## 27. Sentry 단계 가드레일

| 가드레일 | 상태 | 근거 |
| --- | --- | --- |
| 범위 | PASS | Sentry 도입은 무료 플랜의 Error Monitoring, 낮은 sampling의 Tracing, error-only replay로 제한했다. |
| 근거 | PASS | Sentry 공식 Next.js App Router 수동 설정 흐름과 현재 프로젝트의 `src/app` 구조를 기준으로 task를 분리했다. |
| 모순 | PASS | 기존 성능 관측 계획에서 제외했던 에러 수집 도구를 별도 Sentry 계획으로 분리해 범위 충돌을 피했다. |
| 가독성 | PASS | 무료 플랜 포함/제외 기능, 설계 위치, task 문서를 분리해 정리했다. |

## 28. 업데이트된 현재 단계 상태

`Sentry 도입 기획설계`: PASS

`Sentry 코드베이스 기반 문서 구체화`: PASS

`Sentry 문서검토`: PASS

`Sentry 작업 Task 분리`: PASS

`Sentry 구현 진행`: BLOCKED

BLOCKED 이유는 아직 구현 시작 승인을 받지 않았기 때문이다. 구현을 시작하면 Sentry DSN은 코드에 직접 작성하지 않고 Vercel 및 로컬 환경변수 `NEXT_PUBLIC_SENTRY_DSN`으로만 설정한다.
