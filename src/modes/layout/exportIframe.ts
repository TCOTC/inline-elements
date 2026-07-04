import type { WidgetContext } from "../../context/types";

/**
 * 导出图片/PDF 时调整 iframe 尺寸
 */
export function layoutExportIframe(ctx: WidgetContext): void {
  const { widgetBlock, mode } = ctx;
  // 获取 html 元素包含外边距的实际高度，并适当增加高度以避免出现滚动条
  const bodyHeight = document.documentElement.getBoundingClientRect().height;
  document.documentElement.style.overflow = "hidden"; // 设置 html 元素不显示滚动条，替代已弃用的 iframe.setAttribute("scrolling", "no")
  const iframe = widgetBlock.querySelector("iframe") as HTMLIFrameElement;
  iframe.style.border = "none"; // 会产生滚动条
  if (mode === "export-img") {
    iframe.style.height = `${bodyHeight - 5}px`; // 导出图片时，减去 5 像素，避免底部出现重复的 iframe 内容（导出时会显示滚动条，但导出后不会显示滚动条）
  } else {
    iframe.style.height = `${bodyHeight + 4}px`; // 导出 PDF 时，增加 4 像素，避免导出之后出现滚动条（导出之前可能不显示滚动条，但导出之后会显示滚动条）
  }
}
