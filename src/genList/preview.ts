import { copyThemeStyle } from "../theme/copyThemeStyle";
import type { WidgetContext } from "../context/types";
import { getMergedItems, renderIframeList } from "./renderList";

/** HTML 导出预览：刷新主题样式并在 iframe 内渲染纯文本列表 */
export async function genListPreview(ctx: WidgetContext): Promise<void> {
  await Promise.all([
    copyThemeStyle(ctx.htmlElement, ctx.mode),
    getMergedItems(ctx).then((items) => renderIframeList(ctx, items, false)),
  ]);
}
