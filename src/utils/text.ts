/**
 * 移除文本首尾的空白字符（包括零宽字符和普通空白字符）
 * @param text 原始文本
 * @returns 处理后的文本
 */
export function trimText(text: string | null | undefined): string {
  if (!text) {
    return '';
  }
  // 直接移除首尾的所有空白字符（包括零宽字符）
  return text.replace(/^[\s\u200B-\u200D\uFEFF\u2060]+|[\s\u200B-\u200D\uFEFF\u2060]+$/g, '');
}
