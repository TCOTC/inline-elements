import { escapeHtml } from "../util";
import type { MergedItem, WidgetContext } from "../context/types";
import { getMergedItems, renewBlockIdSuffix } from "./renderList";

/** 导出 HTML 预览：解析汇总项后将 iframe 挂件块替换为 typography 无序列表 */
export async function genListPreview(ctx: WidgetContext): Promise<void> {
  const items = await getMergedItems(ctx);
  replaceWidgetWithPreviewList(ctx, items);
}

function replaceWidgetWithPreviewList(ctx: WidgetContext, mergedItems: MergedItem[]): void {
  const { widgetBlock, widgetBlockId } = ctx;

  if (mergedItems.length === 0) {
    widgetBlock.remove();
    return;
  }

  widgetBlock.outerHTML = buildPreviewListHtml(mergedItems, widgetBlockId);
}

function buildPreviewListHtml(items: MergedItem[], listId: string): string {
  const partCount = items.length + 2;
  const parts = new Array<string>(partCount);
  const itemId = renewBlockIdSuffix(listId);

  for (let i = 0; i < items.length; i++) {
    const text = escapeHtml(items[i].text);
    parts[i + 1] = `<li id="${itemId}"><p id="${itemId}">${text}</p></li>`;
  }

  parts[0] = `<ul id="${listId}">`;
  parts[partCount - 1] = "</ul>";
  return parts.join("");
}
