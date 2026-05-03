# Workspace Reviews

## Why This Exists

VS Code's built-in Source Control view is great for local work, but it is not a
great fit for pull request review. It mostly shows uncommitted working tree
changes, while review often needs a base-branch-oriented diff that answers:
"what does this branch add on top of its base?"

The official GitHub Pull Requests extension can provide that kind of review
diff, but it can be awkward in multi-root workspaces. In particular, adding or
removing specific workspace folders from the PR sidebar can be unreliable when
several repositories are open at once.

Workspace Reviews exists for that gap: reviewing changes across multiple
workspace folders with a PR-like, base-aware diff flow, without depending on the
full pull request extension workflow.

Workspace Reviews is a VS Code extension for reviewing the current working
state of each Git repository in a multi-root workspace against a chosen base
branch.

## Features

The extension adds its own Activity Bar view with a `Repositories` tree. It is
built for a workspace-first review flow:

- one repository entry per workspace repo
- automatic base branch detection with per-repository override
- merge-base-backed review diffs
- combines committed, staged, unstaged, and untracked changes into one tree
- directory-grouped changed files
- colors files and folders using Git-style decorations
- repository, folder, and file context menus
- `Open Repository Tree` command to expand a chosen repository from the Command Palette
- `Collapse All` command scoped to the Workspace Reviews tree
- `Send Path to Terminal` command for repositories, folders, and files
- default keybinding for path sending:
  - `cmd+l` on macOS
  - `ctrl+l` elsewhere
  - active only when the Workspace Reviews tree has focus

The goal is to make "what changed in this workspace?" easy to inspect without
opening a pull request first or checking out review branches in a separate UI.

## How Review Diffs Work

Diffs are opened against the repository's comparison base, not the live tip of
the selected base branch.

That means:

- committed changes are shown from the merge-base to the current branch
- local staged and unstaged edits are included in the tree
- untracked files appear as added files
- deleted files open with an empty working-copy side

This keeps the review view closer to a "what this branch and working tree add on
top of the shared base" model.

## Sidebar Actions

Repository nodes support:

- `Workspace Reviews: Open Repository Tree`
- `Workspace Reviews: Send Path to Terminal`
- `Workspace Reviews: Pick Base Branch`
- `Workspace Reviews: Clear Base Branch Override`

Folder and file nodes support:

- `Workspace Reviews: Send Path to Terminal`

When multiple items are selected, `Send Path to Terminal` joins the absolute
paths with `, ` and sends the result to the active terminal. If no terminal is
open, the extension creates one named `Workspace Reviews`.

## Usage

1. Open a workspace that contains one or more Git repositories.
2. Open the `Workspace Reviews` Activity Bar view.
3. Expand a repository under `Repositories`.
4. Select a changed file to open a review diff.
5. Use repository context actions to change or clear the base branch when needed.

Keyboard-driven tree actions use the selected tree item or selected tree items.
For example, `cmd+l` / `ctrl+l` sends the selected repository, folder, or file
path to the terminal. Focused-but-not-selected rows are not reliably exposed by
the public VS Code TreeView API.

## Configuration

### `workspaceReviews.defaultBaseBranches`

Ordered branch names used when auto-detecting the base ref for each repository.

Default:

```json
["main", "master", "develop"]
```

## Development

Install dependencies:

```bash
npm install
```

Compile:

```bash
npm run compile
```

Run tests:

```bash
npm test
```

Package the extension:

```bash
npm run package
```

The package script writes the VSIX to `dist/` and removes any previous VSIX
from that folder before creating a new one.

Install the packaged extension locally:

```bash
code --install-extension dist/workspace-reviews-*.vsix --force
```

## Current Limitations

- Keybinding-driven actions in the custom tree are selection-based.
- Inline review comments, viewed state, and pull request submission flows are
  out of scope for now.
- The extension currently relies on the built-in Git extension being available.
