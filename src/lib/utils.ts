export class Utils {
  public static async sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  public static async timeoutPromise(promise: Promise<any>, timeout: number, err: any) {
    let timer: NodeJS.Timeout;
    return Promise.race([
      new Promise((resolve, reject) => (timer = setTimeout(() => reject(err), timeout))),
      promise.finally(() => clearTimeout(timer)),
    ]);
  }
}
