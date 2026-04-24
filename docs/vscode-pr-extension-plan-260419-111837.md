# Workspace Review Extension 기획 문서

## 배경

기존 요구사항은 VS Code의 GitHub Pull Request 확장에 있는 Changes in Pull Requests 같은 리뷰 경험을 멀티 루트 워크스페이스에서도 편하게 쓰고 싶다는 문제에서 출발했다.

하지만 논의를 진행하면서 문제가 조금 더 분명해졌다.

- 불편한 것은 꼭 PR이 안 보여서만은 아니다.
- 실제로 보고 싶은 것은 "지금 내가 작업 중인 변경 전체"다.
- 여기에는 현재 브랜치의 커밋된 변경뿐 아니라 staged, unstaged, untracked 같은 로컬 미커밋 상태도 포함되어야 한다.
- 따라서 제품의 핵심 개념을 PR로 두는 것은 너무 좁고, GitHub에 과하게 종속된다.

## 핵심 목표

멀티 루트 워크스페이스에서 각 Git 저장소의 현재 작업 상태를 base 기준으로 한눈에 리뷰할 수 있는 전용 확장을 만든다.

여기서 현재 작업 상태는 아래를 모두 포함한다.

- 현재 브랜치의 base 대비 커밋된 변경
- staged 변경
- unstaged 변경
- untracked 파일
- 삭제된 파일

즉 사용자가 실제로 보고 싶은 대상은 `current working state vs base`다.

## 제품 개념

이 확장의 핵심 개념은 PR이 아니라 Review Session이다.

- Review Session
  - 하나의 workspace folder에서 현재 열어둔 리뷰 세션
- Base Target
  - 비교 기준이 되는 브랜치 또는 ref
- Current Working State
  - 현재 브랜치 HEAD 위에 working tree 상태를 덧씌운 실제 작업 상태
- Change Set
  - base와 current working state 사이의 최종 차이 집합

PR은 이 구조의 중심이 아니라 나중에 추가 가능한 입력 소스 중 하나로 취급한다.

## 왜 PR 중심이 아닌가

PR 중심으로 잡으면 처음에는 익숙해 보이지만 다음 문제가 생긴다.

- PR이 없는 로컬 작업에는 바로 쓸 수 없다.
- 멀티 루트 워크스페이스에서 "각 폴더의 현재 작업 검토"라는 사용 흐름과 어긋난다.
- GitHub 인증과 PR 메타데이터 의존성이 너무 빨리 들어온다.
- 나중에 branch vs branch, commit range, local-only review를 붙일 때 구조를 다시 뜯게 된다.

반대로 current working state vs base 중심으로 잡으면 다음 장점이 있다.

- GitHub 없이도 바로 동작할 수 있다.
- 셀프 리뷰 도구로 즉시 쓸 수 있다.
- 멀티 루트 워크스페이스와 자연스럽게 맞는다.
- PR, commit range, branch compare를 같은 모델 위에 확장할 수 있다.

## 제품 방향

### 1. 기본 비교 단위는 current working state vs base

이 확장의 첫 번째 비교 모델은 아래와 같다.

- base
  - 비교 기준 브랜치 또는 ref
- head
  - 현재 브랜치의 최신 커밋
- overlay
  - staged, unstaged, untracked를 포함한 working tree 상태

사용자에게 보여주는 최종 결과는 사실상 `base ... current working state`다.

### 2. PR은 나중에 얹는 입력 소스

향후 PR 지원을 붙이더라도 내부 모델은 유지한다.

- PR을 고르면 내부적으로는 PR의 base ref와 head ref를 세션에 주입
- 필요하면 로컬 working tree overlay를 추가 반영
- UI에만 `from PR #123` 같은 메타데이터를 표시

즉 PR도 Change Source의 한 종류일 뿐이고, 제품의 정체성은 유지된다.

### 3. 1차 목표는 읽기 중심 리뷰 경험

MVP는 작성형 리뷰 툴이 아니라 읽기 중심 리뷰 브라우저로 잡는다.

- 변경 파일 목록을 본다
- diff를 연다
- 워크스페이스 폴더별 현재 작업을 전환해가며 살펴본다
- 필요하면 base를 바꿔본다

초기 범위에서 코멘트 작성, PR submit 같은 기능은 제외한다.

## 주요 사용자 시나리오

### 시나리오 A: 현재 작업 셀프 리뷰

1. 사용자가 멀티 루트 워크스페이스를 연다.
2. 각 폴더에서 현재 브랜치와 base가 자동 감지된다.
3. 확장이 `current working state vs base` 기준의 변경 파일 목록을 보여준다.
4. 사용자는 파일별 diff를 열어 커밋 전 셀프 리뷰를 진행한다.

### 시나리오 B: 미커밋 변경까지 포함한 확인

1. 사용자가 일부 파일만 수정하고 아직 커밋하지 않았다.
2. 확장은 커밋된 브랜치 차이뿐 아니라 staged, unstaged, untracked를 모두 반영한다.
3. 사용자는 "지금 이 상태로 올리면 무엇이 바뀌는지"를 그대로 확인한다.

### 시나리오 C: base 브랜치 변경

1. 자동 감지된 base가 의도와 다르다.
2. 사용자가 base를 직접 `main`, `develop`, 특정 ref 등으로 바꾼다.
3. 변경 목록과 diff가 새 기준으로 즉시 갱신된다.

### 시나리오 D: 향후 PR 기반 세션 확장

1. 사용자가 나중에 PR을 입력 소스로 선택한다.
2. 내부적으로는 PR의 base/head가 세션에 매핑된다.
3. 필요하면 로컬 overlay까지 합쳐 동일한 리뷰 UI를 유지한다.

## 설계 원칙

### 1. 제품 개념은 PR보다 넓어야 한다

UI, 타입, 저장 구조 모두 PR 종속 표현보다 review session / change set 표현을 우선한다.

### 2. 화면은 실제 작업 상태를 반영해야 한다

브랜치 커밋 차이만 보여주면 사용자가 현재 보고 싶은 대상과 어긋난다. staged, unstaged, untracked까지 포함한 현재 작업 상태를 기준으로 한다.

### 3. 멀티 루트 워크스페이스가 1급 개념이어야 한다

repo 하나를 잘 보여주는 도구가 아니라, 여러 workspace folder를 오가며 검토할 수 있는 도구여야 한다.

### 4. 읽기 중심 경험을 먼저 완성한다

작성형 기능은 뒤로 미루고, 파일 목록과 diff 브라우징의 완성도를 우선한다.

## 내부 모델 초안

### ReviewSession

- id
- workspaceFolderUri
- repositoryRoot
- baseTarget
- sourceType
- currentBranch
- lastComputedAt

### BaseTarget

- ref
- type
  - local branch
  - remote branch
  - commit
  - tag
- autoDetected

### WorkingStateOverlay

- stagedChanges
- unstagedChanges
- untrackedFiles
- deletedFiles

### ChangeEntry

- path
- status
  - added
  - modified
  - deleted
  - renamed
  - untracked
- sourceLayer
  - committed
  - staged
  - unstaged
  - untracked
- baseUri
- targetUri

### ChangeSource

초기에는 `working-state-vs-base`만 지원한다.

향후 확장 후보:

- pull-request
- branch-vs-branch
- commit-range
- local-only

## base 브랜치 결정 전략

base는 자동 감지가 중요하고, 실패 시 사용자가 쉽게 바꿀 수 있어야 한다.

우선순위 제안:

1. 현재 브랜치의 upstream 정보와 연결된 기본 브랜치
2. 저장소의 default branch
3. 사용자 설정값
4. 감지 실패 시 quick pick

base가 애매한 저장소에서도 "동작하지 않음"보다 "선택해서 바로 사용 가능함"이 중요하다.

## UI 방향

### 새 확장을 별도로 만든다

기존 GitHub Pull Request 확장 내부에 억지로 얹기보다, 별도 확장으로 만드는 방향이 더 적합하다.

이유:

- 제품 개념 자체가 PR보다 넓다
- 기존 review mode, comment controller, activePullRequest 구조에 얽히지 않는다
- upstream 포크 유지 부담이 줄어든다
- 필요한 기능만 빠르게 MVP로 구현할 수 있다

### 사이드바 구조

권장 구조:

- Workspace Reviews
  - workspace folder 단위 루트 노드
  - 현재 세션 요약
  - 변경 파일 목록

필요하면 변경을 아래 범주로 나눌 수 있다.

- Committed
- Staged
- Unstaged
- Untracked

이 구분은 사용자에게 현재 상태를 이해시키는 데 매우 중요하다.

## MVP 범위

### 포함

- 멀티 루트 워크스페이스의 Git 저장소 감지
- workspace folder별 review session 생성
- current working state vs base 계산
- base 자동 감지
- base 수동 변경
- 변경 파일 목록 표시
- VS Code 내부 diff 열기
- staged, unstaged, untracked 반영
- 세션 상태를 워크스페이스 단위로 저장

### 제외

- GitHub PR 코멘트 작성
- review submit
- viewed / unviewed 상태
- inline discussion thread
- 자동 PR 매핑
- rename 고도화
  - 1차에서 필요하면 add/delete로 단순 처리

## 구현 전략

## 1단계: 워크스페이스와 저장소 감지

- 열린 workspace folders를 수집
- 각 폴더에서 Git 저장소 루트 확인
- 폴더별 session 생성

## 2단계: base 감지와 session 상태 저장

- 현재 브랜치와 upstream 정보 확인
- default branch 탐색
- base 자동 결정
- 사용자 override 저장

## 3단계: current working state vs base 계산

변경 계산은 두 레이어로 나눈다.

- committed diff
  - base와 현재 HEAD 사이의 차이
- local overlay
  - staged
  - unstaged
  - untracked

최종 화면은 두 레이어를 병합한 결과를 보여준다.

## 4단계: 트리 뷰와 diff 열기

- folder별 change set 노드 생성
- 상태별 grouping
- 파일 클릭 시 VS Code diff 명령 연결

## 5단계: 세션 갱신

아래 변화가 생기면 세션을 다시 계산한다.

- HEAD 변경
- index 변경
- working tree 변경
- untracked 파일 변경
- base target 변경

## 6단계: 확장 가능성 열어두기

내부 모델은 처음부터 `ChangeSource`를 가지게 해서 이후 아래를 붙일 수 있게 한다.

- PR 기반 세션
- branch vs branch
- commit range

## 변경 예상 지점

새 확장을 만든다는 가정에서, 초기에 필요한 영역은 아래와 같다.

- extension entry
  - activation, tree view 등록
- git integration layer
  - workspace folder별 repo 감지
  - branch / status / diff 계산
- session model
  - ReviewSession, BaseTarget, ChangeEntry
- tree provider
  - workspace folder 및 상태별 변경 트리
- diff command
  - 파일별 비교 열기
- persistence
  - base override 및 마지막 세션 상태 저장

## 리스크

### 1. Git 상태 병합 복잡도

committed diff와 staged/unstaged/untracked를 합칠 때 같은 파일이 여러 레이어에 걸쳐 나타날 수 있다.

대응:

- 내부적으로는 레이어를 유지
- UI에는 최종 상태와 source layer를 함께 보여준다

### 2. base 자동 감지 실패

fork, detached HEAD, upstream 미설정 저장소에서는 base를 자동으로 정하기 어렵다.

대응:

- 감지 실패를 정상 흐름으로 취급
- picker와 사용자 override를 빠르게 제공

### 3. 대규모 저장소 성능

멀티 루트 워크스페이스에서 여러 repo를 동시에 지속적으로 다시 계산하면 비용이 커질 수 있다.

대응:

- 변경 감지는 debounce
- 비가시 뷰는 lazy refresh
- session별 계산 캐시 사용

## 테스트 계획

### 기능 테스트

- 단일 repo에서 current working state가 올바르게 표시되는지 확인
- 멀티 루트 워크스페이스에서 폴더별 세션이 독립적으로 보이는지 확인
- staged, unstaged, untracked가 각각 반영되는지 확인
- base 변경 시 diff가 즉시 갱신되는지 확인
- 파일 클릭 시 VS Code 내부 diff가 열리는지 확인

### 경계 테스트

- upstream 없는 브랜치
- detached HEAD
- untracked만 있는 repo
- 삭제 파일만 있는 상태
- 큰 변경 세트

### 로컬 실행 준비

VS Code extension 작업이므로 마무리 전에는 아래를 확인한다.

- 확장이 빌드되는지
- 로컬 Extension Development Host에서 정상 실행되는지
- 필요 시 패키징 또는 재설치가 가능한지

## 단계별 실행 순서

1. 새 확장의 제품명과 view id 확정
2. workspace folder별 repo 감지 구현
3. base 자동 감지 및 override 구현
4. committed diff 계산
5. staged / unstaged / untracked overlay 병합
6. tree view 렌더링
7. 파일 diff 열기
8. 세션 저장과 갱신
9. 멀티 루트 수동 테스트
10. 빌드와 로컬 실행 검증

## 최종 판단

이 기획의 중심은 더 이상 "PR을 VS Code 사이드바에서 잘 보여주자"가 아니다.

정확한 목표는 아래에 가깝다.

- 멀티 루트 워크스페이스에서
- 각 저장소의 현재 작업 상태를
- base 기준으로
- 미커밋 변경까지 포함해
- 빠르게 리뷰할 수 있게 하자

따라서 가장 적절한 방향은:

- 기존 PR 확장을 억지로 수정하지 않고
- 새 확장을 만들고
- 핵심 비교 모델을 `current working state vs base`로 두고
- PR은 나중에 붙일 수 있는 입력 소스로 남겨두는 것

이다.

이 방향이 가장 덜 비틀리고, 실제 사용 가치도 가장 크다.
