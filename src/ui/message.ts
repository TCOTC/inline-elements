import { escapeHtml } from "../util";

/**
 * 将异常格式化为面向用户的文案
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * 在 contentList 中显示普通提示（加载中、无结果等）
 */
export function showMessage(container: HTMLElement, message: string): void {
  container.innerHTML = `<div id="message">${escapeHtml(message)}</div>`;
}

/**
 * 在 contentList 中显示错误消息
 */
export function showError(container: HTMLElement, message: string): void {
  container.innerHTML = `<div id="errorMessage">${escapeHtml(message)}</div>`;
}
