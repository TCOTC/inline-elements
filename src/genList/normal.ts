import { copyThemeStyle } from "../theme/copyThemeStyle";
import { initControls } from "../ui/initControls";
import { bindEvents } from "../ui/bindEvents";
import type { WidgetContext } from "../context/types";
import { getMergedItems, renderIframeList } from "./renderList";

/** 所见即所得编辑器：初始化控件并生成首屏列表 */
export async function runNormalMode(
  ctx: WidgetContext,
  handleError: (error: unknown) => void,
): Promise<void> {
  initControls(ctx);
  bindEvents(ctx, () => {
    void genListNormal(ctx).catch(handleError);
  });
  await genListNormal(ctx);
}

/** 所见即所得编辑器：刷新主题样式并在 iframe 内渲染可跳转列表 */
export async function genListNormal(ctx: WidgetContext): Promise<void> {
  await Promise.all([
    copyThemeStyle(ctx.htmlElement, ctx.mode),
    getMergedItems(ctx).then((items) => renderIframeList(ctx, items, true)),
  ]);
}
