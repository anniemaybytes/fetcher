# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

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
