export async function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function timeoutPromise(promise: Promise<any>, timeout: number, err: any) {
  let timer: NodeJS.Timeout;
  return Promise.race([
    new Promise((resolve, reject) => (timer = setTimeout(() => reject(err), timeout))),
    promise.finally(() => clearTimeout(timer)),
  ]);
}
