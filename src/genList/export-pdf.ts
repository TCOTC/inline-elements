import type { WidgetContext } from "../context/types";
import { getMergedItems, replaceWidgetWithList } from "./renderList";

/** 导出 PDF：将 iframe 挂件块替换为无序列表块（目标块存在时末尾显示星号锚点链接） */
export async function genListExportPdf(ctx: WidgetContext): Promise<void> {
  const items = await getMergedItems(ctx);
  replaceWidgetWithList(ctx, items, true);
}
