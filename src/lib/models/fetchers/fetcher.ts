export abstract class Fetcher {
  public static registered: { [type: string]: any } = {}; // public for testing only
  type: string;
  path: string;
  aborted: boolean;
  length: number;
  fetched = 0;

  constructor(type: string, path: string) {
    this.type = type;
    this.path = path;
    this.aborted = false;
  }

  public static createFetcher(type: string, path: string, options: any) {
    if (!Fetcher.registered[type]) throw new Error(`Fetcher type ${type} does not exist`);
    const fetcher: Fetcher = new Fetcher.registered[type](path, options);
    return fetcher;
  }

  public static registerFetcherType(type: string, cls: any) {
    Fetcher.registered[type] = cls;
  }

  abstract fetch(): Promise<void>;

  abstract abortFetch(): Promise<void>;
}
