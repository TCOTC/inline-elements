import { WIDGET_ATTR_PREFIX } from "../config/constants";
import type { WidgetContext } from "../context/types";
import { sleep } from "../utils/util";
import { persistSettings } from "./persist";
import { SETTING_ATTR_DEFS, SETTING_KEYS, loadSettingAttr } from "./settingAttrs";

/**
 * 从块属性加载挂件配置
 */
export function loadSettings(ctx: WidgetContext): void {
  const { widgetBlock, settings, mode } = ctx;
  let needsPersistDefaults = false;
  // 加载挂件配置
  for (const key of SETTING_KEYS) {
    const def = SETTING_ATTR_DEFS[key];
    const raw = widgetBlock.getAttribute(WIDGET_ATTR_PREFIX + def.attrName);
    const valid = loadSettingAttr(key, raw, settings);
    if (!valid && mode === "normal") {
      needsPersistDefaults = true;
    }
  }
  if (needsPersistDefaults) {
    void persistPendingDefaults(ctx);
  }
}

const ATTR_WRITE_RETRY_INTERVAL_MS = 50; // 与内核 FlushTxQueue 轮询间隔同量级
const ATTR_WRITE_MAX_RETRIES = 40;       // 最长约 2 秒

/**
 * 将缺失的默认配置写回块属性；块尚未入库（如刚插入挂件）时自动重试
 * 
 * 思源 v3.7.0 之后编辑器 /api/transactions 非常及时，基本上第一轮调用就成功
 */
async function persistPendingDefaults(ctx: WidgetContext): Promise<void> {
  for (let attempt = 0; attempt < ATTR_WRITE_MAX_RETRIES; attempt++) {
    try {
      await persistSettings(ctx);
      return;
    } catch (error) {
      if (attempt === ATTR_WRITE_MAX_RETRIES - 1) {
        console.warn("inline-elements widget: Failed to persist default settings:", error);
        return;
      }
      await sleep(ATTR_WRITE_RETRY_INTERVAL_MS);
    }
  }
}
