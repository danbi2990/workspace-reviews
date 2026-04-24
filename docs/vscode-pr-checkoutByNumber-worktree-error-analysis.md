# `pr.checkoutByNumber` worktree 에러 원인 분석

확인 기준 저장소:

- 임시 clone: `/tmp/vscode-pull-request-github`
- HEAD: `6596edeb3d9e329f8587538bce38e9d6508a90bf`

## 상황 요약

사용자가 특정 PR 브랜치를 로컬 worktree에 먼저 checkout해서 리뷰하던 상태에서, 같은 PR을 대상으로 `pr.checkoutByNumber` 명령을 다시 실행했을 때 에러가 발생했다.

## 결론

가장 가능성이 높은 원인은 다음이다.

- 그 PR 브랜치가 이미 다른 worktree에 checkout되어 있었는데
- `pr.checkoutByNumber`가 이를 worktree-aware하게 처리하지 못하고
- 현재 저장소에서 같은 브랜치를 다시 `checkout`하려고 해서 Git이 실패했다

즉, "이미 다른 worktree에서 사용 중인 브랜치를 다시 checkout하려 해서 발생한 에러"일 가능성이 매우 높다.

## 코드 흐름 근거

### 1. `pr.checkoutByNumber`는 최종적으로 `ReviewManager.switch(pr)`를 호출한다

- [commands.ts](/tmp/vscode-pull-request-github/src/commands.ts:1788)
- [reviewManager.ts](/tmp/vscode-pull-request-github/src/view/reviewManager.ts:1269)

`pr.checkoutByNumber`는 PR을 고른 뒤 직접 worktree를 열거나 worktree를 탐색하지 않고, `ReviewManager.switch(pr)`로 넘긴다.

### 2. `switch()`는 먼저 기존 PR 브랜치 재사용 경로를 탄다

- [reviewManager.ts](/tmp/vscode-pull-request-github/src/view/reviewManager.ts:1279)

`switch()`는 가장 먼저 `checkoutExistingPullRequestBranch(pr, progress)`를 시도한다. 즉 예전에 같은 PR을 checkout했던 로컬 브랜치가 있으면 그 브랜치를 다시 쓰려는 설계다.

### 3. 기존 PR 브랜치 재사용 로직은 worktree를 확인하지 않는다

- [pullRequestGitHelper.ts](/tmp/vscode-pull-request-github/src/github/pullRequestGitHelper.ts:161)
- [pullRequestGitHelper.ts](/tmp/vscode-pull-request-github/src/github/pullRequestGitHelper.ts:178)

`checkoutExistingPullRequestBranch()`는 git config에서 아래 키를 읽어서:

- `branch.<branch>.github-pr-owner-number`

현재 PR에 대응하는 브랜치를 찾은 뒤, worktree 상태 확인 없이 바로 아래를 호출한다.

- `repository.checkout(branchName)`

이 부분이 핵심이다. 이미 다른 worktree에서 checkout 중인 브랜치라면 여기서 Git이 거절한다.

### 4. 확장에는 worktree를 찾는 코드가 있지만 이 경로에서는 쓰지 않는다

- [folderRepositoryManager.ts](/tmp/vscode-pull-request-github/src/github/folderRepositoryManager.ts:2521)

`FolderRepositoryManager.getWorktreeForBranch()`는 특정 브랜치가 어느 worktree에 연결되어 있는지 찾을 수 있다. 하지만 이 로직은 `pr.checkoutByNumber` 경로에 연결되어 있지 않다.

실제로 worktree 관련 처리는 브랜치 삭제 쪽에서는 사용된다.

- [pullRequestReviewCommon.ts](/tmp/vscode-pull-request-github/src/github/pullRequestReviewCommon.ts:348)
- [pullRequestReviewCommon.ts](/tmp/vscode-pull-request-github/src/github/pullRequestReviewCommon.ts:411)

즉, 삭제 경로는 worktree를 의식하지만 checkout 경로는 그렇지 않다.

## 추정되는 실제 실패 시나리오

가장 자연스러운 재현 흐름은 이렇다.

1. 예전에 해당 PR을 checkout하면서 `branch.<branch>.github-pr-owner-number` 메타데이터가 저장된다.
2. 그 브랜치를 별도 worktree에서 checkout해서 리뷰 중이다.
3. 메인 저장소나 다른 repo manager에서 같은 PR에 대해 `pr.checkoutByNumber`를 실행한다.
4. 확장은 "이 PR은 기존 로컬 브랜치가 있다"고 판단한다.
5. `checkoutExistingPullRequestBranch()`가 그 브랜치를 현재 저장소에서 다시 checkout하려고 한다.
6. Git이 "이미 다른 worktree에서 사용 중인 브랜치"라며 checkout을 거부한다.
7. 확장은 이 경우를 별도 worktree 에러로 처리하지 않아 일반적인 switching error로 보여준다.

## 왜 에러 메시지가 어색했을 가능성이 큰가

- [reviewManager.ts](/tmp/vscode-pull-request-github/src/view/reviewManager.ts:1296)
- [reviewManager.ts](/tmp/vscode-pull-request-github/src/view/reviewManager.ts:1308)
- [utils.ts](/tmp/vscode-pull-request-github/src/common/utils.ts:160)

`ReviewManager.switch()`는 `DirtyWorkTree`나 `LocalChangesOverwritten`만 특별 취급한다. worktree 관련 checkout 실패는 별도 분기 없이 아래 형태로 빠질 가능성이 높다.

- `Error switching to pull request: ...`

즉 사용자는 친절한 "이미 다른 worktree에 checkout되어 있습니다" 같은 메시지 대신, Git에서 올라온 일반 오류 메시지를 봤을 가능성이 높다.

## 추가 관찰: 리포 선택 UI도 혼동을 만들 수 있다

- [commands.ts](/tmp/vscode-pull-request-github/src/commands.ts:1703)

리포 선택 QuickPick은 `owner/repo`만 보여준다. 메인 repo와 worktree repo가 같은 GitHub 리포를 가리키면, 사용자 입장에서는 어떤 folder manager를 고르는지 구분하기 어렵다.

그래서:

- worktree 쪽 manager를 골랐으면 문제 없이 열렸을 수 있고
- 메인 repo 쪽 manager를 골랐다면 같은 브랜치를 다시 checkout하려다 실패했을 가능성이 있다

## 최종 판단

현재 정보만으로도 원인은 꽤 강하게 추정 가능하다.

- 높은 확률의 원인: 이미 다른 worktree에 checkout된 PR 브랜치를 다시 checkout하려 한 것
- 직접적인 취약 지점: `checkoutExistingPullRequestBranch()`가 `getWorktreeForBranch()` 같은 worktree 확인 로직 없이 `repository.checkout(branchName)`를 호출하는 점

## 확정에 가장 유용한 추가 증거

당시 실제 에러 문구가 아래 계열이었다면 사실상 확정이다.

- `already checked out`
- `is already used by worktree`
- `checked out at`

## 한 줄 요약

`pr.checkoutByNumber`는 기존 PR 브랜치를 재사용하려고 하지만, 그 브랜치가 이미 다른 worktree에 checkout되어 있는 경우를 제대로 처리하지 못해 checkout 단계에서 실패했을 가능성이 매우 높다.
