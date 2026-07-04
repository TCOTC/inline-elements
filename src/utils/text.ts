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
