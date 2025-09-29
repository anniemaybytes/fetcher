export interface IRCNetworkConfig {
  address: string;
  port: number;
  use_ssl?: boolean;
  verify_ssl?: boolean;
  nickname: string;
  nickserv_password?: string;
}

export interface ConfigFile {
  state_db: string;
  storage: {
    persistent_dir: string;
    torrents_dir: string;
    transient_dir: string;
    shows_file: string;
  };
  animebytes: {
    username: string;
    password: string;
    m2m: {
      captcha: string;
      altcha: string;
    };
    base_uri: string;
  };
  webtorrent: {
    max_conns: number;
    utp: boolean;
    concurrency: number;
  };
  mktorrent: {
    tracker_uri: string;
    source_field: string;
  };
  http: {
    bind: string;
    port: number;
    path: string;
  };
  irc: {
    networks: {
      [network: string]: IRCNetworkConfig;
    };
    controller: {
      network: string;
      channel: string;
    };
  };
}

export interface MediaInfoInfo {
  text: string;
  audio: string;
  audiochannels: string;
  dualaudio: boolean;
  codec: string;
  extension: string;
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
