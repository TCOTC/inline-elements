import { copyThemeStyle } from "../theme/copyThemeStyle";
import { getDocHTML } from "../parser/getDoc";
import { extractItems } from "../parser/extractItems";
import { renderList } from "./renderList";
import type { WidgetContext } from "../context/types";

/**
 * 生成汇总列表
 */
export async function genList(ctx: WidgetContext): Promise<void> {
  await Promise.all([
    copyThemeStyle(ctx.htmlElement, ctx.mode),
    getDocHTML(ctx)
      .then((docHTML) => extractItems(docHTML, ctx))
      .then((mergedItems) => renderList(ctx, mergedItems)),
  ]);
}
