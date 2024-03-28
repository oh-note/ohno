export function throttle<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T {
  let timerId: ReturnType<typeof setTimeout> | undefined;
  let lastExecutedTime = 0;

  return function (this: any, ...args: Parameters<T>) {
    const currentTime = Date.now();

    if (currentTime - lastExecutedTime > delay) {
      func.apply(this, args);
      lastExecutedTime = currentTime;
    } else {


      if (timerId) {
        clearTimeout(timerId);
      }

      timerId = setTimeout(() => {
        func.apply(this, args);
        lastExecutedTime = currentTime;
      }, delay);
    }
  } as T;
}
