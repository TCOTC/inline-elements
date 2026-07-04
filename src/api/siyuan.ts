import { WIDGET_ATTR_PREFIX } from "../config/constants";

/**
 * 设置块属性（用于保存挂件块配置）
 */
export async function setBlockAttrs(blockId: string | null, attrs: Record<string, string>) {
  if (window.parent.siyuan.isPublish) {
    // 发布服务，不写入数据
    return;
  }
  if (!blockId) {
    console.warn('inline-elements widget: Failed to setBlockAttrs, blockId is null');
    return;
  }

  // 为属性名添加前缀
  const prefixedAttrs: Record<string, string> = {};
  for (const [key, value] of Object.entries(attrs)) {
    prefixedAttrs[`${WIDGET_ATTR_PREFIX}${key}`] = value;
  }

  try {
    const response = await fetch('/api/attr/setBlockAttrs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: blockId,
        attrs: prefixedAttrs
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.code !== 0) {
      throw new Error(result.msg || "setBlockAttrs failed");
    }
    return result;
  } catch (error) {
    console.warn('inline-elements widget: Failed to setBlockAttrs, error:', error);
    throw error;
  }
}

/**
 * 执行 SQL 查询
 * @param sql SQL 语句
 * @returns 查询结果
 */
export async function querySQL(sql: string) {
  try {
    const response = await fetch("/api/query/sql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        stmt: sql
      })
    });

    const result = await response.json();

    if (result.code === 0) {
      return result.data; // 返回查询结果
    } else {
      throw new Error(result.msg);
    }
  } catch (error) {
    console.warn("inline-elements widget: Failed to querySQL, error:", error);
    throw error;
  }
}

/**
 * 获取块 DOM
 * @param blockId 块 ID
 * @returns 块 DOM
 */
export async function getBlockDOM(blockId: string) {
  try {
    const response = await fetch("/api/block/getBlockDOM", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: blockId
      })
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.warn("inline-elements widget: Failed to getBlockDOM, error:", error);
    throw error;
  }
}

/**
 * 获取块预览 HTML
 * @param blockId 块 ID
 * @returns 预览 HTML
 */
export async function getBlockPreview(blockId: string) {
  try {
    const response = await fetch("/api/export/preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: blockId
      })
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.warn("inline-elements widget: Failed to getBlockPreview, error:", error);
    throw error;
  }
}
