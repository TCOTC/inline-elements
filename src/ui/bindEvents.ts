import type { WidgetContext } from "../context/types";
import { persistSettings } from "../settings/persist";
import { attrValueToSetting } from "../settings/settingAttrs";

/**
 * 绑定控件事件监听器
 */
export function bindEvents(ctx: WidgetContext, onRefresh: () => void): void {
  const { elements, settings } = ctx;
  const { filterType, embedBlocks, refreshList } = elements;

  // 行级元素类型
  filterType.addEventListener("change", function (): void {
    // 更新选中的内联元素类型
    settings.filterType = filterType.value;
    void persistSettings(ctx);
    onRefresh();
  });

  // 嵌入块状态
  embedBlocks.addEventListener("change", function (): void {
    settings.isEmbedBlocks = attrValueToSetting("isEmbedBlocks", embedBlocks.value);
    void persistSettings(ctx);
    onRefresh();
  });

  // 刷新按钮
  refreshList.addEventListener("click", function (): void {
    onRefresh();
  });
}
