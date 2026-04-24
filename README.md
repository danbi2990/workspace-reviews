# Workspace Reviews

Workspace Reviews is a VS Code extension for reviewing the current working
state of each Git repository in a multi-root workspace against a chosen base
branch.

The extension is built for a workspace-first review flow:

- one repository entry per workspace repo
- a merged change tree for committed and uncommitted work
- per-file diff review against a merge-base-backed comparison point
- lightweight repository actions directly from the sidebar

## What It Does

Workspace Reviews adds its own Activity Bar view with a `Repositories` tree.
For each Git repository in the current workspace, it:

- detects a base branch automatically
- resolves a comparison base using `git merge-base`
- combines committed, staged, unstaged, and untracked changes into one tree
- groups changed files by directory
- colors files and folders using Git-style decorations
- opens a diff from the comparison base to the current working state

The goal is to make "what changed in this workspace?" easy to inspect without
opening a pull request first or checking out review branches in a separate UI.

## Current Features

- Multi-root workspace support through the built-in Git extension
- One review entry per detected repository
- Automatic base branch detection with per-repository override
- Merge-base-backed review diffs
- Unified change tree instead of separate committed/staged/unstaged sections
- Repository, folder, and file context menus
- `Open Repository Tree` command to expand a chosen repository from the Command
  Palette
- `Collapse All` command scoped to the Workspace Reviews tree
- `Send Path to Terminal` command for repositories, folders, and files
- Default keybinding for path sending:
  - `cmd+l` on macOS
  - `ctrl+l` elsewhere
  - active only when the Workspace Reviews tree has focus

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

## Current Limitations

- Keybinding-driven actions in the custom tree are still selection-based.
  Focused-but-not-selected items are not reliably available through the public
  VS Code TreeView API.
- Inline review comments, viewed state, and pull request submission flows are
  out of scope for now.
- The extension currently relies on the built-in Git extension being available.
