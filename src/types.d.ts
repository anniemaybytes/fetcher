// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IRCNetworkConfig {
  host: string;
  port: number;
  nick: string;
  ssl?: boolean;
  verify_certificate?: boolean;
  nickserv_password?: string;
}

export interface ConfigFile {
  state_db: string;
  storage_dir: string;
  torrent_dir: string;
  temporary_dir: string;
  tracker_url: string;
  tracker_user: string;
  tracker_pass: string;
  tracker_source: string;
  shows_file: string;
  shows_uri: string;
  http_bind: string;
  http_port: number;
  http_path: string;
  debug: boolean;
  irc_networks: {
    [network: string]: IRCNetworkConfig;
  };
  irc_control: {
    network: string;
    channel: string;
  };
}

export interface MediaInfo {
  text: string;
  audio: string;
  audiochannels: string;
  codec: string;
}

export interface ShowDef {
  form: {
    groupid: string;
  };
  formats: string[];
  releasers: {
    [releaser: string]: {
      regex: string;
      media: string;
      subbing: string;
    };
  };
}

export interface Shows {
  [showName: string]: ShowDef;
}

export interface SourceDefaults {
  res?: string;
  container?: string;
}

export interface ReleaserIRCOptions {
  network: string;
  channels: string[];
  nicks: string[];
  multiline?: number;
  matchers: string[][];
  meta?: SourceDefaults;
}

export interface ReleaserRSSOptions {
  url: string;
  meta?: SourceDefaults;
}

export interface ReleaserDef {
  name: string;
  sources: {
    'irc+http'?: ReleaserIRCOptions;
    'irc+torrent'?: ReleaserIRCOptions;
    'rss+http'?: ReleaserRSSOptions;
    'rss+torrent'?: ReleaserRSSOptions;
  }[];
}

export interface Releasers {
  [releaserKey: string]: ReleaserDef;
}

export interface HTTPFetchOptions {
  url: string;
}

export interface TorrentFetchOptions {
  uri: string;
}

export type FetchOptions = TorrentFetchOptions | HTTPFetchOptions;

export interface MessageEvent {
  nick: string;
  ident: string;
  hostname: string;
  target: string;
  message: string;
  reply: (message: string) => void;
}
