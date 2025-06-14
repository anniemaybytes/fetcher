# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## v9.0.0
### Changed
- Bumped minimum supported Node version to v22.11.0
- Revert "Bump maximum number of peers in webtorrent to 150"
- Reduce maximum number of peers in webtorrent to 150
- Reduce number of active torrent downloads
- Updated webtorrent to v2.6.8

## v8.0.0
### Changed
- Bumped minimum supported Node version to v20.9.0

## v7.0.0
### Added
- Support for machine-to-machine schema for bypassing captcha challenges

### Changed
- Refactor `config.json` schema

## v6.3.0
### Changed
- Rebuild utp-native for musl compatibility in Dockerfile
- Re-land "Enable UTP support in webtorrent"

## v6.2.0
### Changed
- Revert "Enable UTP support in webtorrent" due to unusual SIGSEGVs on Alpine Linux.

## v6.1.0
### Fixed
- Fix milliseconds used in "Torrent has seen no peers for {} seconds" message
- Fix release year being treated as episode number in edge cases where multi-episode torrent is given

### Changed
- Don't report torrent percentage in error message
- Bump maximum number of peers in webtorrent to 150
- Abort torrent on noPeers even if progress >= 1
- Enable UTP support in webtorrent

## v6.0.1
### Fixed
- Option arguments must be given before target filename when executing mktorrent

## v6.0.0
### Changed
- Bumped minimum supported Node version to v18.12.0

## v5.1.0
### Added
- Retry AB torrent upload if received error during previous attempt

### Changed
- Use more friendly error messages in torrent fetcher

## v5.0.1
### Fixed
- Fix non-standard "x" chars in valid resolutions

## v5.0.0
### Changed
- Produce ESM package

## v4.1.1
### Fixed
- Parse only first (any) video and (valid) audio stream from MediaInfo

## v4.1.0
### Changed
- Use specific User-Agent
- Remove Alpine >= 3.13 restriction

## v4.0.0
### Changed
- Bumped minimum supported Node version to v16.13.0
- Bumped TypeScript target to ES2021

## v3.4.1
### Changed
- Force usage of Alpine 3.13 in Dockerfile
- Remove unused `file-loader` dependency

## v3.4.0
### Changed
- Remove deprecated use of URL library

## v3.3.1
### Fixed
- 4-digit episodes not being parsed correctly

## v3.3.0
### Added
- Support for 540p as valid resolution

## v3.2.0
### Added
- `EpisodeParser` warnings are now emitted to IRC control channel

### Fixed
- Multi-episode packs (`14-26`) detected as singular episodes (`26`)
- `torrent has X files, must have 1` error message incorrectly showing `0` as files count in 
all cases

## v3.1.0
### Changed
- Update to Webpack v5

## v3.0.0
### Changed
- Bumped minimum supported Node version to v14.15.0
- Bumped TypeScript target to ES2020

## v2.7.0
### Changed
- Torrent files are now created in temporary directory and moved after uploading on site
to avoid potential race condition with torrent client consuming it before we're done
processing episode

## v2.6.0
### Changed
- Instruct webtorrent to remove partial file on fetch failure
- Bump webtorrent to `v0.109.2` which fixes state of wire interest, improving download speed

## v2.5.3
### Fixed
- Missing audio channel mapping `{ 8: 7.1 }`

## v2.5.2
No changes; updated dependencies

## v2.5.1
### Fixed
- Resolved crash during upload caused by `got` redirection mechanism
(https://github.com/sindresorhus/got/issues/1271 https://github.com/sindresorhus/got/issues/1307)

## v2.5.0
### Changed
- Switched from `node-fetch` to `got`

## v2.4.0
### Changed
- Use webpack to version-hash assets and process Pug templates

## v2.3.1
### Fixed
- `EpisodeParser` not allowing episodes with version 0

## v2.3.0
### Added
- Support for aborting and removing episodes from state database

### Fixed
- Missing `jQuery` provider in webpack (only `$` was supported)
- Remove unused `copy-webpack-plugin` dependency left by accident
- Properly URI-encode show name
- Wait until registered before attempting to rejoin channels on IRC network

### Changed
- Don't use eval'd sourcemaps in webpack
- Use formatted name instead of save-filename in UI
- Run frontend build in parallel
- Always attempt to rejoin once joined IRC channel on reconnection

## v2.2.0
### Added
- Listen for `!reload` and `!fetch` commands in IRC control channel

### Fixed
- Ensure 0% progress is always shown on active episodes

## v2.1.0
### Added
- Emit warning when connecting to IRC network over TLS without certificate verification
- Use webpack to bundle frontend assets
- Use jQuery to hide `raw json` container

### Fixed
- Strip colors and formatting from IRC messages for release matching

### Changed
- Remove external fonts
- Do not fail when requested IRC network does not exist or can not be connected to
- Various tweaks to logging messages
- Change default temporary directory to `/tmp/fetcher`
- Change default webserver port to `3004`

## v2.0.0
### Changed
- Initial TypeScript rewrite
