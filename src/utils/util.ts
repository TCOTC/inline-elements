/** requestIdleCallback 最长等待时间（毫秒），超时后强制续跑 */
const IDLE_CALLBACK_TIMEOUT_MS = 32;

/**
 * 异步等待
 * @param ms 延迟毫秒数；为 0 时优先在浏览器空闲时续跑
 */
export function sleep(ms = 0): Promise<void> {
  return new Promise(resolve => {
    if (ms > 0) {
      setTimeout(resolve, ms);
      return;
    }
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => resolve(undefined), { timeout: IDLE_CALLBACK_TIMEOUT_MS });
    } else {
      setTimeout(resolve, 0);
    }
  });
}
