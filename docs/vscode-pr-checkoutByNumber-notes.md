# `pr.checkoutByNumber` 동작 정리

확인 기준 저장소:

- 임시 clone: `/tmp/vscode-pull-request-github`
- HEAD: `6596edeb3d9e329f8587538bce38e9d6508a90bf`

## 요약

`pr.checkoutByNumber`는 직접 git checkout 전체를 수행하는 명령이라기보다, 어떤 PR을 checkout할지 고른 뒤 실제 checkout 로직으로 넘기는 진입점이다.

핵심 흐름:

1. 워크스페이스의 GitHub 리포 목록 중 active remote 기반으로 대상 리포를 고른다.
2. QuickPick에서 PR 목록을 보여주거나 PR 번호/URL을 직접 입력받는다.
3. 입력값으로 `PullRequestModel`을 만든다.
4. `ReviewManager.switch(prModel)`로 넘겨 실제 checkout을 수행한다.

## 명령 등록 위치

- [commands.ts](/tmp/vscode-pull-request-github/src/commands.ts:1695)

`pr.checkoutByNumber` 등록부에서 하는 일:

- 각 `FolderRepositoryManager`에 대해 active GitHub remote만 추려서 선택 가능한 리포 목록을 만든다. [commands.ts](/tmp/vscode-pull-request-github/src/commands.ts:1697)
- 선택한 리포의 PR 목록을 가져와 QuickPick에 뿌린다. [commands.ts](/tmp/vscode-pull-request-github/src/commands.ts:1741)
- 사용자가 입력한 값은 `123`, `#123`, GitHub PR URL 형식을 허용한다.
- URL의 owner/repo가 방금 선택한 리포와 다르면 거절한다. [commands.ts](/tmp/vscode-pull-request-github/src/commands.ts:1679)
- 최종적으로 `manager.fetchById(...)`로 `PullRequestModel`을 만든 뒤 `ReviewManager.switch(prModel)` 호출로 끝난다. [commands.ts](/tmp/vscode-pull-request-github/src/commands.ts:1780), [commands.ts](/tmp/vscode-pull-request-github/src/commands.ts:1788)

## PR 목록 조회

- [githubRepository.ts](/tmp/vscode-pull-request-github/src/github/githubRepository.ts:696)

`getPullRequestNumbers()`는 GraphQL로 PR 목록을 가져오며, 현재 구현은 `first: 100`으로 요청한다. 받아온 결과는 커맨드 쪽에서 PR 번호 내림차순으로 정렬해서 표시한다. [commands.ts](/tmp/vscode-pull-request-github/src/commands.ts:1745)

## 실제 checkout 시작점

- [reviewManager.ts](/tmp/vscode-pull-request-github/src/view/reviewManager.ts:1269)

`ReviewManager.switch(pr)`의 실제 흐름:

1. 먼저 `checkoutExistingPullRequestBranch(pr, progress)`를 시도한다. [reviewManager.ts](/tmp/vscode-pull-request-github/src/view/reviewManager.ts:1279)
2. 기존 PR 브랜치를 못 찾으면 `fetchAndCheckout(pr, progress)`를 호출한다. [reviewManager.ts](/tmp/vscode-pull-request-github/src/view/reviewManager.ts:1281)
3. 설정값 `githubPullRequests.pullPullRequestBranchBeforeCheckout`가 `pullAndMergeBase` 또는 `pullAndUpdateBase`면 base를 head에 반영하는 추가 단계까지 간다. [reviewManager.ts](/tmp/vscode-pull-request-github/src/view/reviewManager.ts:1285)

## 기존 PR 브랜치 재사용 로직

- [pullRequestGitHelper.ts](/tmp/vscode-pull-request-github/src/github/pullRequestGitHelper.ts:161)

`checkoutExistingPullRequestBranch()`는 git config 전체를 읽고, 아래 메타데이터와 일치하는 브랜치를 찾는다.

- 메타데이터 키: `branch.<branch>.github-pr-owner-number`
- 값 형식: `owner#repo#prNumber` [pullRequestGitHelper.ts](/tmp/vscode-pull-request-github/src/github/pullRequestGitHelper.ts:302)

찾으면:

1. 그 브랜치를 바로 checkout한다. [pullRequestGitHelper.ts](/tmp/vscode-pull-request-github/src/github/pullRequestGitHelper.ts:178)
2. 설정값에 따라 fetch를 한 번 더 한다. [pullRequestGitHelper.ts](/tmp/vscode-pull-request-github/src/github/pullRequestGitHelper.ts:185)
3. upstream이 있고 local이 behind 상태면 `pull()`까지 한다. [pullRequestGitHelper.ts](/tmp/vscode-pull-request-github/src/github/pullRequestGitHelper.ts:193)

즉 예전에 같은 PR을 checkout했던 브랜치가 있으면 그 브랜치를 재사용하는 구조다.

## 새로 fetch + checkout 하는 로직

- [pullRequestGitHelper.ts](/tmp/vscode-pull-request-github/src/github/pullRequestGitHelper.ts:81)

### 같은 저장소 PR인 경우

1. PR head branch를 먼저 fetch한다. [pullRequestGitHelper.ts](/tmp/vscode-pull-request-github/src/github/pullRequestGitHelper.ts:102)
2. 로컬에 같은 이름의 브랜치가 있으면 remote 추적 브랜치와 commit이 같은지 비교한다. [pullRequestGitHelper.ts](/tmp/vscode-pull-request-github/src/github/pullRequestGitHelper.ts:109)
3. commit이 다르면 사용자의 기존 브랜치를 덮어쓰지 않고 `pr/<author>/<number>` 형식의 새 브랜치를 만들어 checkout한다. [pullRequestGitHelper.ts](/tmp/vscode-pull-request-github/src/github/pullRequestGitHelper.ts:112), [pullRequestGitHelper.ts](/tmp/vscode-pull-request-github/src/github/pullRequestGitHelper.ts:373)
4. 로컬 브랜치가 아예 없으면 remote commit에서 같은 이름의 로컬 브랜치를 만들고 checkout한다. [pullRequestGitHelper.ts](/tmp/vscode-pull-request-github/src/github/pullRequestGitHelper.ts:146)

### fork PR이거나 matching remote가 없는 경우

1. fork remote가 없으면 새 remote를 만든다. [pullRequestGitHelper.ts](/tmp/vscode-pull-request-github/src/github/pullRequestGitHelper.ts:45), [pullRequestGitHelper.ts](/tmp/vscode-pull-request-github/src/github/pullRequestGitHelper.ts:343)
2. `head.ref:pr/<author>/<number>` 형식으로 fetch한다. [pullRequestGitHelper.ts](/tmp/vscode-pull-request-github/src/github/pullRequestGitHelper.ts:68)
3. 그 브랜치를 checkout하고 upstream을 연결한다. [pullRequestGitHelper.ts](/tmp/vscode-pull-request-github/src/github/pullRequestGitHelper.ts:75)

## PR와 브랜치 연결 메타데이터

- [pullRequestGitHelper.ts](/tmp/vscode-pull-request-github/src/github/pullRequestGitHelper.ts:415)

checkout이 끝나면 `associateBranchWithPullRequest()`가 실행되어 아래 git config를 기록한다.

- `branch.<branch>.github-pr-owner-number = owner#repo#prNumber`

이 기록 덕분에 다음번 동일 PR checkout 시 `checkoutExistingPullRequestBranch()` 경로를 탈 수 있다.

## 사용자 브랜치 보호 동작

이 구현에서 중요한 점은, 로컬에 이미 같은 이름의 브랜치가 있어도 remote PR head와 commit이 다르면 그 브랜치를 덮어쓰지 않는다는 점이다. 대신 `pr/<author>/<number>` 같은 유니크한 브랜치를 만들어 PR checkout에 사용한다.

이 동작은 테스트로도 보장되고 있다.

- [pullRequestGitHelper.test.ts](/tmp/vscode-pull-request-github/src/test/github/pullRequestGitHelper.test.ts:48)

테스트가 검증하는 내용:

- 기존 로컬 브랜치는 그대로 보존된다.
- PR checkout용 새 브랜치가 remote commit으로 생성된다.
- 최종 HEAD는 새 PR 브랜치를 가리킨다.

## 한 줄 결론

`pr.checkoutByNumber`는 "번호나 URL로 PR을 찾아 review mode로 전환"하는 명령이고, 실제 checkout 정책은 아래 순서로 동작한다.

1. 예전에 checkout한 동일 PR 브랜치가 있으면 그 브랜치를 재사용
2. 없으면 PR head를 fetch해서 checkout
3. 기존 로컬 브랜치와 충돌하면 절대 덮어쓰지 않고 `pr/<author>/<number>` 브랜치를 새로 생성
