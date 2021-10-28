# fetcher

fetcher is our bot for fetching and uploading airing show.

Support is present for these types of downloaders:

- Torrent (via webtorrent, both `.torrent` and magnet links)
- HTTP

Following fetchers are available:

- IRC
- RSS

## Usage

The format of `shows.json` is currently undocumented.

Following commands are available to anyone in IRC control channel:

- `!reload` - instantly reloads `shows.json` from remote
- `!fetch` - instantly refreshes all sources and releasers

In addition, HTTP server is available on port specified in config.
The interface should be protected by access control; fetcher does not implement any kind of security on it.
The web interface can be used to view detailed information about database and to abort current
downloads as well as to remove state information for specific episodes.

## Installation

fetcher requires NodeJS version 16.13 or later and [Yarn package manager](https://classic.yarnpkg.com/).
Additionally you need these external tools present in `PATH`:

- `mktorrent` >= 1.1
- `MediaInfo` CLI + Lib >= 18.03

```sh
yarn --frozen-lockfile && yarn build
node dist/index.js
```

Example systemd unit file:

```systemd
[Unit]
Description=fetcher
After=network.target

[Service]
Environment="LOG_LEVEL=info"
WorkingDirectory=/opt/fetcher
ExecStart=/usr/bin/node dist/index.js
RestartSec=10s
Restart=always
User=fetcher

[Install]
WantedBy=default.target
```

## Configuration

Configuration is done via `config.json` file with the following format:

```json
{
  "state_db": "state.ldb",
  "storage_dir": "",
  "torrent_dir": "",
  "temporary_dir": "/tmp/fetcher",
  "tracker_url": "",
  "tracker_source": "",
  "tracker_user": "",
  "tracker_pass": "",
  "shows_file": "shows.json",
  "shows_uri": "",

  "http_bind": "::",
  "http_port": 3004,
  "http_path": "",

  "irc_networks": {},

  "irc_control": {}
}
```

- `state_db` - directory where LevelDB database with all previously fetched shows and their state is saved
- `storage_dir` - directory where completed files will be moved to
- `torrent_dir` - directory where new torrent files will be created by `mktorrent`
- `temporary_dir` - temporary data directory for in-progress downloads
- `tracker_url` - tracker URL used when creating new torrents
- `tracker_source` - content of `source` flag to insert into torrent file when building using `mktorrent`
- `tracker_user` - username used to log in to AnimeBytes, used for fetching shows and uploading new torrents
- `tracker_pass` - password for user provided above
- `shows_file` - location where cached JSON file with shows definition should be stored
- `shows_uri` - URL from which bot will fetch new shows definition JSON regularly; in case it's inaccessible local cached copy will be used
- `http_bind` - IP address to bind to, use `127.0.0.1` or `::1` if you want to proxy web interface and protect it with password
- `http_port` - HTTP port on which simple monitoring interface will be exposed
- `http_path` - base path to use if server if not on top-level of domain, example: `/bar`, `/foo/bar`
- `irc_networks` - array of IRC networks bot will connect to
  - `host` - address of IRC server to connect to
  - `port` - port of the IRC server
  - `ssl` - whether to use SSL or not when connecting to IRC server
  - `verify_certificate` - whether to verify IRC server certificate
  - `nick` - nickname, realname and username to be used on IRC server; `$` will be replaced by random character
  - `nickserv_password` - optional, if present the bot will attempt to authenticate with `NickServ` upon joining
- `irc_control` - controls to which IRC network (from `irc_networks`) bot should announce its state
  - `network` - valid network name
  - `channel` - channel name

Additionally the bot expects `LOG_LEVEL` environment variable to be set to one of:

- `trace`
- `debug` (default if not provided)
- `info`
- `warn`
- `error`
