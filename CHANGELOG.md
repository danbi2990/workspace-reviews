# Changelog

All notable changes to Workspace Reviews will be documented in this file.

## Unreleased

### Changed

- Group repositories by workspace folder in the sidebar.
- Show changed files directly under the workspace folder when it is the only repository in that folder.
- Keep nested repository labels short instead of prefixing them with the workspace folder name.

## 0.0.14

### Added

- Added Marketplace metadata and extension icon for the first Marketplace release.

### Changed

- Updated README installation guidance for Marketplace publishing.

## 0.0.13

### Added

- Added CI workflow for compile and test validation.
- Added package ignore rules for test-only files.

## 0.0.12 and Earlier

### Added

- Added the Workspace Reviews sidebar for reviewing changes against a base branch across workspace repositories.
- Added merge-base based diff comparison with committed, staged, unstaged, and untracked changes.
- Added tree-based changed file browsing, file decorations, base branch overrides, collapse-all, and send-path-to-terminal commands.
