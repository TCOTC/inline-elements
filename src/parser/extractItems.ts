import { isWhitespaceOnly, sleep, trimText } from "../util";
import type { MergedItem, WidgetContext } from "../context/types";

/** 单轮时间片长度（毫秒），到期后让出主线程 */
const TIME_SLICE_MS = 8;
/** 解析最长耗时（毫秒），超时后返回已解析的部分结果 */
const MAX_PARSE_MS = 10_000;
/** 每隔多少个节点检查一次耗时与是否让出主线程 */
const PERF_CHECK_INTERVAL = 64;

/**
 * 读取 span 文本；无子元素时直接取文本节点，避免 textContent 聚合子树
 */
function getSpanText(element: Element): string {
  if (element.childElementCount === 0) {
    const first = element.firstChild;
    if (first?.nodeType === Node.TEXT_NODE) {
      return trimText(first.nodeValue);
    }
    if (!first) {
      return "";
    }
  }
  return trimText(element.textContent);
}

/**
 * 检测两元素之间是否仅隔空白字符，并返回合并时应插入的间隔文本
 * @returns `null` 不可合并；`""` 紧邻合并；否则为中间空白字符的原文
 */
function getMergeGap(last: Element, current: Element): string | null {
  let node: Node | null = last.nextSibling;
  let gap = "";
  while (node) {
    if (node === current) {
      return gap;
    }
    if (node.nodeType === Node.TEXT_NODE) {
      const content = node.textContent ?? "";
      if (!isWhitespaceOnly(content)) {
        return null;
      }
      gap += content;
      node = node.nextSibling;
      continue;
    }
    return null;
  }
  return null;
}

/**
 * 异步遍历、相邻合并、时间片让出主线程
 */
export async function extractItems(docHTML: string, ctx: WidgetContext): Promise<MergedItem[]> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(docHTML, "text/html");
  const { filterType } = ctx.settings;
  // 行级公式的 LaTeX 在 data-content；循环外选定一次，避免每个元素重复分支
  const getElementText = filterType === "inline-math"
    ? (element: Element) => trimText(element.getAttribute("data-content"))
    : getSpanText;

  // 合并相邻元素的文本；中间仅隔空白字符时原样保留间隔（如 mark 与 mark strong 之间）
  const mergedItems: MergedItem[] = [];
  let currentItem: MergedItem | null = null;
  let lastElement: Element | null = null;
  let processedCount = 0;
  let visitedCount = 0;
  const parseStartTime = performance.now();
  let sliceStartTime = parseStartTime;
  let cachedBlock: Element | null = null;
  let cachedBlockId: string | undefined;

  const getBlockId = (element: Element): string | undefined => {
    if (cachedBlock?.contains(element)) {
      return cachedBlockId;
    }
    cachedBlock = element.closest("[data-node-id]");
    cachedBlockId = cachedBlock?.getAttribute("data-node-id") ?? undefined;
    return cachedBlockId;
  };

  // data-type 可为空格分隔的多类型，~= 与 split + includes 语义一致
  const spans = doc.querySelectorAll(`span[data-type~="${CSS.escape(filterType)}"]`);
  for (const element of spans) {
    visitedCount++;
    if (visitedCount % PERF_CHECK_INTERVAL === 0) {
      const now = performance.now();
      if (now - parseStartTime >= MAX_PARSE_MS) {
        // 超时后返回已解析的部分结果
        console.warn(
          `inline-elements widget: Reached the maximum parsing time (${MAX_PARSE_MS}ms), ` +
          `stopping after ${processedCount} elements`
        );
        break;
      }
      if (now - sliceStartTime >= TIME_SLICE_MS) {
        await sleep();
        sliceStartTime = performance.now();
      }
    }

    const text = getElementText(element);
    if (text) {
      const blockId = getBlockId(element);
      if (blockId) {
        const gap = lastElement ? getMergeGap(lastElement, element) : null;
        if (gap === null) {
          // 保存上一个项（如果存在）
          if (currentItem) {
            mergedItems.push(currentItem);
          }
          // 开始新项
          currentItem = { text, blockId };
        } else {
          // 如果相邻，则合并文本
          currentItem!.text += gap + text;
        }

        lastElement = element;
        processedCount++;
      }
    }
  }

  // 添加最后一个项
  if (currentItem) {
    mergedItems.push(currentItem);
  }

  return mergedItems;
}

// 旧实现（TreeWalker，仅作参考）：
// 遍历 body 下所有元素，在 acceptNode 中过滤 SPAN；约 20KB / 198 个 mark 时仅收集阶段约慢 16×。
//
// const walker = doc.createTreeWalker(
//   doc.body,
//   NodeFilter.SHOW_ELEMENT,
//   {
//     acceptNode: function (node: Node) {
//       if ((node as Element).tagName === "SPAN") {
//         const dataType = (node as Element).getAttribute("data-type");
//         if (dataType && dataType.split(" ").includes(filterType)) {
//           return NodeFilter.FILTER_ACCEPT;
//         }
//       }
//       return NodeFilter.FILTER_SKIP;
//     },
//   }
// );
//
// let element: Element | null;
// while ((element = walker.nextNode() as Element)) {
//   visitedCount++;
//   if (visitedCount % PERF_CHECK_INTERVAL === 0) {
//     const now = performance.now();
//     if (now - parseStartTime >= MAX_PARSE_MS) {
//       console.warn(
//         `inline-elements widget: Reached the maximum parsing time (${MAX_PARSE_MS}ms), ` +
//         `stopping after ${processedCount} elements`
//       );
//       break;
//     }
//     if (now - sliceStartTime >= TIME_SLICE_MS) {
//       await sleep();
//       sliceStartTime = performance.now();
//     }
//   }
//
//   const text = getSpanText(element);
//   if (text) {
//     const blockId = getBlockId(element);
//     if (blockId) {
//       const gap = lastElement ? getMergeGap(lastElement, element) : null;
//       if (gap === null) {
//         if (currentItem) {
//           mergedItems.push(currentItem);
//         }
//         currentItem = { text, blockId };
//       } else {
//         currentItem!.text += gap + text;
//       }
//       lastElement = element;
//       processedCount++;
//     }
//   }
// }
