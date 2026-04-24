# VS Code PR 확장 요구사항 재정리 메모

## 핵심 목표

- 이미 로컬 worktree/branch에서 리뷰 중인 pull request가 있는 상태에서도 확장이 자연스럽게 동작해야 한다.
- 중요한 흐름은 "PR을 다시 checkout"하는 것이 아니라, "이미 존재하는 로컬 branch/worktree를 PR과 연결"하거나 "그 연결을 해제"하는 것이다.

## 배경 문제

- 같은 GitHub 저장소가 여러 worktree로 열려 있을 때 `pr.checkoutByNumber`의 동작이 헷갈린다.
- 이미 다른 worktree에서 checkout 중인 branch를 다시 checkout하려고 하면서 `WorktreeBranchAlreadyUsed` 에러가 날 수 있다.
- 그래서 checkout 기반 흐름보다 metadata 기반 흐름이 더 중요하다.

## 원하는 discovery 커맨드

- `pr.discoverWorkspacePullRequests`라는 커맨드를 추가한다.
- 현재 VS Code workspace folder들을 스캔한다.
- 폴더 이름이 `-pr-<number>`로 끝나는 항목만 대상으로 삼는다.
- 각 폴더에 대해 현재 branch를 확인한다.
- 그 branch에 PR metadata를 등록한다.
- 이 과정에서 checkout은 절대 수행하면 안 된다.
- 목적은 이미 존재하는 로컬 리뷰 branch/worktree에 대해 PR 인식을 복구하는 것이다.

## 원하는 unassociate 커맨드

- branch에 등록된 PR metadata를 제거하는 커맨드가 필요하다.
- 목적은 branch/worktree는 유지하고 PR 연결만 제거하는 것이다.
- 이렇게 해야 discovery/association 흐름을 다시 테스트할 수 있다.
- 제거 대상은 PR 관련 git config metadata여야 한다.
- 이 과정에서도 checkout은 절대 수행하면 안 된다.

## 중요한 UX 제약

- 여기서 사용자가 말한 "PR 사이드바"는 `Pull Requests and Issues` 뷰가 아니다.
- 의도한 대상은 `GitHub Pull Requests: Changes in Pull Requests` 사이드바다.
- 내부적으로는 `prStatus:github` 뷰를 기준으로 생각해야 한다.
- 메뉴 배치나 context 동작도 `pr:github`가 아니라 `prStatus:github`를 기준으로 설계해야 한다.

## picker 요구사항

- picker는 사용자가 실제로 보고 있는 내용과 최대한 일치해야 한다.
- 중복 항목이 나오면 안 된다.
- workspace의 모든 repo/worktree를 넓게 보여주는 방식은 원하지 않는다.
- 최소한 사용자가 현재 작업 중인 PR 관련 문맥으로 필터링되어야 한다.

## 동작 요구사항

- 메뉴가 의도한 UI에서 실제로 보여야 한다.
- picker에서 항목을 선택하면 실제로 association이 제거되어야 한다.
- unassociate 실행 후에는 PR 관련 metadata가 진짜로 사라져야 한다.
- 결과는 사용자가 보고 있는 PR 관련 뷰에서 확인 가능해야 한다.

## 검증 요구사항

- 구현에는 스스로 확인할 수 있는 피드백 루프가 포함되어야 한다.
- dedupe나 metadata 제거 같은 핵심 로직은 테스트로 검증해야 한다.
- 사용자가 직접 실행해서 명백한 문제를 찾아줘야만 알 수 있는 상태면 안 된다.

## 아직 결정이 필요한 구현 방향

- 전체 UX를 `prStatus:github` 중심으로 맞출지
- `discover`와 `unassociate` 둘 다 같은 뷰를 주요 문맥으로 사용할지
- `unassociate`를 먼저 제대로 고치고 `discover`는 나중에 다시 정리할지
