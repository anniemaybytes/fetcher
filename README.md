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

fetcher requires NodeJS v20.9 or later and [Yarn package manager](https://classic.yarnpkg.com/).
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

Configuration is done via `config.json` file with the following schema:

```json
{
  "$id": "config.schema.json",
  "$schema": "https://json-schema.org/draft/2020-12/schema",

  "type": "object",
  "properties": {
    "state_db": {
      "description": "Directory where LevelDB database with all previously fetched shows and their state is saved",
      "type": "string"
    },
    "storage": {
      "type": "object",
      "properties": {
        "persistent_dir": {
          "description": "Directory where completed files will be moved to",
          "type": "string"
        },
        "torrents_dir": {
          "description": "Directory where new .torrent files will be stored",
          "type": "string"
        },
        "transient_dir": {
          "description": "Temporary data directory for in-progress downloads",
          "type": "string"
        },
        "shows_file": {
          "description": "Location where cached JSON file with shows definition should be stored",
          "type": "string"
        }
      }
    },
    "animebytes": {
      "type": "object",
      "properties": {
        "username": {
          "description": "Username used to log in to AnimeBytes, used for fetching shows and uploading new torrents",
          "type": "string"
        },
        "password": {
          "description": "Password for user provided above",
          "type": "string"
        },
        "m2m": {
          "description": "HMAC secrets for machine-to-machine schema that allows bypassing captcha challenges",
          "type": "object",
          "properties": {
            "captcha": {
              "type": "string"
            },
            "altcha": {
              "type": "string"
            }
          },
          "required": ["captcha", "altcha"]
        },
        "base_uri": {
          "description": "Base URI (schema, domain and port) of site",
          "type": "string"
        }
      },
      "requied": ["username", "password", "m2m", "base_uri"]
    },
    "mktorrent": {
      "type": "object",
      "properties": {
        "tracker_uri": {
          "description": "Tracker URI used when creating new torrents",
          "type": "string"
        },
        "source_field": {
          "description": "Value for source field used when creating new torrents; defaults to empty",
          "type": "string"
        }
      },
      "required": ["tracker_uri"]
    },
    "http": {
      "type": "object",
      "properties": {
        "bind": {
          "description": "IP address for HTTP control plane to listen on; defaults to ::",
          "type": "string"
        },
        "port": {
          "description": "Port on which HTTP control plane will be exposed; defaults to 3004",
          "type": "integer"
        },
        "path": {
          "description": "Base path to use if server if not on top-level of domain",
          "type": "string"
        }
      }
    },
    "irc": {
      "type": "object",
      "properties": {
        "networks": {
          "description": "List of known IRC networks bot can connect to",
          "type": "object",
          "patternProperties": {
            "^\\w+$": {
              "type": "object",
              "properties": {
                "address": {
                  "description": "Address of IRC server to connect to",
                  "type": "string"
                },
                "port": {
                  "description": "Port of the IRC server",
                  "type": "integer"
                },
                "use_ssl": {
                  "description": "Whether to use SSL",
                  "type": "boolean"
                },
                "verify_ssl": {
                  "description": "whether to verify IRC server certificate",
                  "type": "boolean"
                },
                "nickname": {
                  "description": "Nickname to be used on IRC server; $ will be replaced by random character",
                  "type": "string"
                },
                "nickserv_password": {
                  "description": "Optional password to use with NickServ",
                  "type": "string"
                }
              },
              "required": ["address", "port", "use_ssl", "verify_ssl", "nickname"]
            }
          }
        },
        "control": {
          "description": "Configuration for IRC control plane",
          "type": "object",
          "properties": {
            "network": {
              "description": "Valid network name (one of configured above)",
              "type": "string"
            },
            "channel": {
              "description": "Channel name",
              "type": "string"
            }
          },
          "required": ["network", "channel"]
        }
      }
    }
  },
  "required": ["state_db", "storage", "animebytes", "mktorrent", "http", "irc"]
}
```

Additionally the bot expects `LOG_LEVEL` environment variable to be set to one of:
- `trace`
- `debug` (default if not provided)
- `info`
- `warn`
- `error`

For development and testing purposes, environment variable `DISABLE_FETCHER` can be set to
disable fetching of new episodes. All other functions will remain active.
