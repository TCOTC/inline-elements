export const WIDGET_NAME = "inline-elements"; // 挂件名，与挂件目录名、widget.json 的 name 一致
export const WIDGET_ATTR_PREFIX = `custom-${WIDGET_NAME}-widget-`; // 挂件块属性前缀
export const WIDGET_NAME_ATTR = "data-widget-name"; // 挂件文档上标识挂件名的属性，供第三方主题 CSS 适配

// ID 应该是 20251005012849-g0wv4xn 这样的 14 位数字加横杠加 7 位随机字符，否则认为没有获取到正确的挂件块
export const WIDGET_BLOCK_ID_PATTERN = /^[0-9]{14}-[a-z0-9]{7}$/;

/** 与 trimText 使用相同的空白字符集合 */
const WHITESPACE_ONLY = /^[\s\u200B-\u200D\uFEFF\u2060]*$/;
/** 首尾待裁剪字符（与 trimText 正则一致） */
const TRIM_EDGE_START = /^[\s\u200B-\u200D\uFEFF\u2060]/;
const TRIM_EDGE_END = /[\s\u200B-\u200D\uFEFF\u2060]$/;

/**
 * 判断字符串是否仅包含空白字符（包括零宽字符）
 */
export function isWhitespaceOnly(text: string): boolean {
  return WHITESPACE_ONLY.test(text);
}

/**
 * 移除文本首尾的空白字符（包括零宽字符和普通空白字符）
 * @param text 原始文本
 * @returns 处理后的文本
 */
export function trimText(text: string | null | undefined): string {
  if (!text) {
    return "";
  }
  // 首尾无需裁剪时直接返回，避免正则替换
  if (!TRIM_EDGE_START.test(text) && !TRIM_EDGE_END.test(text)) {
    return text;
  }
  return text.replace(/^[\s\u200B-\u200D\uFEFF\u2060]+|[\s\u200B-\u200D\uFEFF\u2060]+$/g, "");
}

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
      window.requestIdleCallback(() => resolve(undefined), { timeout: 32 }); // 最长等待时间（毫秒），超时后强制续跑
    } else {
      setTimeout(resolve, 0);
    }
  });
}

/**
 * 转义 HTML 特殊字符，避免用户内容注入 DOM
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * 在挂件文档的 html、body 元素上写入挂件标识属性
 * 主题样式会注入挂件文档内部，第三方主题据此限定选择器的适用范围
 */
export function markWidgetDocument(): void {
  document.documentElement.setAttribute(WIDGET_NAME_ATTR, WIDGET_NAME);
  document.body.setAttribute(WIDGET_NAME_ATTR, WIDGET_NAME);
}
