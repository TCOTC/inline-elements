import { i18n, type I18nKey } from "../i18n";
import { SETTING_ATTR_DEFS, settingToAttrValue } from "../settings/settingAttrs";
import type { WidgetContext } from "../context/types";

/**
 * 设置下拉框选项和元素文案
 */
export function initControls(ctx: WidgetContext): void {
  const { elements, settings } = ctx;
  const { filterType, embedBlocks, refreshList } = elements;
  const filterTypeOptions = SETTING_ATTR_DEFS.filterType.options.map((type: string) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = i18n[`text-${type}` as I18nKey];
    return option;
  });
  filterType.append(...filterTypeOptions);
  filterType.value = settings.filterType;

  const embedBlocksOptions = SETTING_ATTR_DEFS.isEmbedBlocks.options.map((value) => {
    const option = document.createElement("option");
    const attrValue = settingToAttrValue(value);
    option.value = attrValue;
    option.textContent = i18n[`embedBlocks-${attrValue}` as I18nKey];
    return option;
  });
  embedBlocks.append(...embedBlocksOptions);
  embedBlocks.value = settingToAttrValue(settings.isEmbedBlocks);
  
  refreshList.title = i18n.refreshList;
}
