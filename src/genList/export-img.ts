import type { WidgetContext } from "../context/types";
import { getMergedItems, replaceWidgetWithList } from "./renderList";

/** 导出图片：将 iframe 挂件块替换为无序列表块 */
export async function genListExportImg(ctx: WidgetContext): Promise<void> {
  const items = await getMergedItems(ctx);
  replaceWidgetWithList(ctx, items, false);
}
