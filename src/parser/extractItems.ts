import { trimText } from "../utils/text";
import { createWalker } from "./createWalker";
import type { MergedItem, WidgetContext } from "../context/types";

/**
 * 异步遍历、相邻合并、batch 让出主线程
 */
export async function extractItems(docHTML: string, ctx: WidgetContext): Promise<MergedItem[]> {
  // 使用文档片段高性能解析 DOM，使用 TreeWalker 遍历并合并相邻的元素的文本，生成列表项
  const parser = new DOMParser();
  const doc = parser.parseFromString(docHTML, "text/html");

  // 合并相邻的元素的文本内容（忽略元素之间的空白字符）
  const mergedItems: MergedItem[] = [];
  let currentItem: MergedItem | null = null;
  let lastElement: Element | null = null;
  let processedCount = 0;
  const maxProcessCount = 10000; // 限制最大处理元素数量

  const walker = createWalker(doc, ctx.settings);

  // 使用异步处理避免界面卡死
  let element: Element | null;
  let batchCount = 0;
  const batchSize = 50; // 每批处理 50 个元素

  while (element = walker.nextNode() as Element) {
    // 检查是否超过最大处理数量
    if (processedCount >= maxProcessCount) {
      console.warn(`inline-elements widget: Reached the maximum processing limit (${maxProcessCount}), stopping processing`);
      break;
    }

    const text = trimText(element.textContent);
    if (!text) {
      continue;
    }

    // 查找包含当前内联元素的块元素（通过 data-node-id 属性）
    const blockElement = element.closest("[data-node-id]");
    if (!blockElement) {
      continue;
    }

    const blockId = blockElement.getAttribute("data-node-id");
    if (!blockId) {
      continue;
    }

    // 检查当前元素是否与上一个元素相邻（TreeWalker 按文档顺序遍历）
    const isAdjacent = currentItem !== null && lastElement !== null &&
      lastElement.parentElement === element.parentElement &&
      lastElement.nextSibling === element;

    if (isAdjacent) {
      // 如果相邻，则合并文本
      currentItem!.text += text;
    } else {
      // 保存上一个项（如果存在）
      if (currentItem) {
        mergedItems.push(currentItem);
      }
      // 开始新项
      currentItem = { text, blockId };
    }

    lastElement = element;
    processedCount++;
    batchCount++;

    // 每处理一批元素后，让出控制权给浏览器
    if (batchCount >= batchSize) {
      batchCount = 0;
      // 使用 requestIdleCallback 或 setTimeout 让出控制权
      await new Promise(resolve => {
        if (window.requestIdleCallback) {
          window.requestIdleCallback(() => resolve(undefined));
        } else {
          setTimeout(resolve, 0);
        }
      });
    }
  }

  // 添加最后一个项
  if (currentItem) {
    mergedItems.push(currentItem);
  }

  return mergedItems;
}
