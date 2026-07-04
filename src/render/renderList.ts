import { i18n } from "../i18n";
import { escapeHtml } from "../util";
import { isExportMode, type MergedItem, type WidgetContext } from "../context/types";
import { showMessage } from "../ui/message";

/**
 * 生成列表项
 * @param mergedItems 合并后的项目列表
 */
export function renderList(ctx: WidgetContext, mergedItems: MergedItem[]): void {
  const { contentList } = ctx.elements;

  if (mergedItems.length === 0) {
    if (isExportMode(ctx.mode)) {
      // 在导出模式没有查询结果时隐藏挂件块
      // TODO 看看是不是可以直接移除挂件块
      ctx.widgetBlock.style.display = "none";
    } else {
      showMessage(contentList, i18n.noResultsMessage);
    }
    return;
  }

  const useLinks = ctx.mode === "normal";
  const itemCount = mergedItems.length;
  const parts = new Array<string>(itemCount);

  for (let i = 0; i < itemCount; i++) {
    const item = mergedItems[i];
    const text = escapeHtml(item.text);
    // 预览/导出模式使用纯文本；编辑区使用可跳转链接
    // 导出预览模式不需要链接，因为点击也无法跳转
    // TODO 导出 PDF 时，iframe 块里的链接好像不能转换哈希锚点，得看看把 iframe 块替换成无序列表块怎样
    parts[i] = useLinks
      ? `<li><a href="siyuan://blocks/${item.blockId}">${text}</a></li>`
      : `<li>${text}</li>`;
  }

  // 一次性写入 DOM，避免逐项 createElement 触发多次重排
  contentList.innerHTML = parts.join("");
}
