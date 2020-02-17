# Isla

Isla is our bot for fetching and uploading airing show.

Support is present for these types of downloaders:
- Torrent (via webtorrent)
- HTTP
- XDCC

Following fetchers are available:
- IRC
- RSS

## Installation

Isla requires NodeJS. Version 12 is recommended.
Additionally you need these external tools present in PATH:
- `mktorrent` >= 1.1
- `MediaInfo` CLI + Lib >= 17.10

```
$ npm i
$ npm run fetcher
```

Example systemd unit file:
```
[Unit]
Description=Fetcher module for Isla
After=network.target

[Service]
WorkingDirectory=/opt/fetcher
ExecStart=/usr/bin/npm run fetcher
RestartSec=10s
Restart=always
User=fetcher

[Install]
WantedBy=default.target
```

## Configuration

Configuration is done via `config.json` file. Example file:
```
{
  "state_db": "../dldir/state.ldb",
  "storage_dir": "../dldir/storage/",
  "torrent_dir": "../dldir/torrents/",
  "webtorrent_dir": "/tmp/webtorrent",
  "tracker_url": "https://tracker.example.com/announce",
  "tracker_user": "example",
  "tracker_pass": "hunter2",
  "tracker_source": "example.com",
  "shows_file": "../dldir/shows.json",
  "shows_uri": "https://example.com/airing_shows.json",

  "http_port": 8080,
  "debug": true,

  "irc_networks": {
    "rizon": {
      "host": "irc.rizon.net",
      "port": 6667,
      "nick": "example"
    },
    "ab": {
      "host": "irc.animebytes.tv",
      "port": 7000,
      "secure": true,
      "nick": "example",
      "nickserv_password": "hunter2"
    }
  },

  "irc_control": {
    "network": "ab",
    "channel": "#airing"
  }
}
```

- `state_db` - Directory where LevelDB database with all previously fetched shows and their state is saved
- `storage_dir` - Directory where completed files will be moved to
- `torrent_dir` - Directory where new torrent files will be create by `mktorrent`
- `webtorrent_dir` - Directory where webtorrent downloads files to, must be cleaned by user manually on regular basis
- `tracker_url` - Tracker URL used when creating new torrents
- `tracker_user` - Username used to log in to AnimeBytes, used for fetching shows and uploading new torrents
- `tracker_pass` - Password for user provided above
- `tracker_source` - Content of `source` flag to insert into torrent file when building using `mktorrent`
- `shows_file` - Location where cached JSON file with shows definition should be stored
- `shows_uri` - URL from which Isla will fetch new shows definition JSON regularly. In case it's inaccessible local cached copy will be used
- `http_port` - HTTP port on which simple control interface will be exposed
- `debug` - Whether to enable debugging mode
- `irc_networks` - Array of IRC networks Isla will connect to, possible values are: `host`, `port`, `nick`, `nickserv_password` as well as rest of options from [node-irc](https://node-irc.readthedocs.io/en/latest/API.html#client)
- `irc_control` - Controls to which IRC network (from defined above) Isla should announce its state. Possible array keys are `network` and `channel`.

At least one IRC network outside of `irc_control` should be present.