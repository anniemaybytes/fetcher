export abstract class Fetcher {
  public static registered: { [type: string]: any } = {}; // public for testing only

  public type: string;
  public aborted: boolean;
  public length: number;
  public fetched = 0;

  protected constructor(type: string) {
    this.type = type;
    this.aborted = false;
  }

  public static createFetcher(type: string, options: any) {
    if (!Fetcher.registered[type]) throw new Error(`Fetcher type ${type} does not exist`);
    const fetcher: Fetcher = new Fetcher.registered[type](options);
    return fetcher;
  }

  public static registerFetcherType(type: string, cls: any) {
    Fetcher.registered[type] = cls;
  }

  abstract fetch(): Promise<string>;

  abstract abortFetch(): Promise<void>;
}
