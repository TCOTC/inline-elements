import { i18n } from "./i18n";

// 用函数包裹，方便直接 return
function main(): void {
// ==================== 全局变量定义 ====================
const WIDGET_ATTR_PREFIX = "custom-inline-elements-widget-"; // 挂件属性前缀

// 当前选中的内联元素类型，默认为 "mark"（标记）
let filterType: string = "mark";
const filterTypeList: Set<string> = new Set(["mark", "strong", "tag", "em", "u", "code", "inline-math", "inline-memo"]);

// 控制是否包含嵌入块内容的标志位，默认为 false（不包含）
let isEmbedBlocks: boolean = false;

// TODO: 删除这个 randomId；后面要改成靠 SQL 查询数据
// 当页面中有多个相同的小部件时，通过随机 id 来区分不同的实例
const randomId: string = "id_" + Math.random().toString(36).substr(2, 9);
document.body.id = randomId;

// ==================== 获取 DOM 元素并设置语言 ====================
// 获取挂件块本身
let isPreviewMode = false; // 是否是导出预览模式
let widgetBlockId: string | null = null;
let widgetBlock: Element | null = window.frameElement?.closest("[data-node-id], [id]") || null;
if (widgetBlock) {
  widgetBlockId = widgetBlock?.getAttribute("data-node-id") || null;
  if (!widgetBlockId) {
    widgetBlockId = widgetBlock?.getAttribute("id") || null;
    isPreviewMode = true;
  }
}
// ID 应该是 20251005012849-g0wv4xn 这样的 14 位数字加横杠加 7 位随机字符，否则认为没有获取到正确的挂件块，避免 SQL 注入
const isWidgetBlockId = !!widgetBlockId && /^[0-9]{14}-[a-z0-9]{7}$/.test(widgetBlockId);

// 设置语言
let i18nType = widgetBlock?.closest("html")?.getAttribute("lang") || "en_US";
if (!i18n[i18nType]) i18nType = "en_US";
document.documentElement.lang = i18nType;

// 获取挂件内的各个元素
const filterTypeElement = document.getElementById("filterType") as HTMLSelectElement | null;
const embedBlocksElement = document.getElementById("embedBlocks") as HTMLSelectElement | null;
const refreshListElement = document.getElementById("refreshList") as HTMLButtonElement | null;
const contentListElement = document.getElementById("contentList") as HTMLElement | null;

// 未获取到必要的挂件元素时显示错误消息并退出
if (!widgetBlock || !isWidgetBlockId || !filterTypeElement || !embedBlocksElement || !refreshListElement || !contentListElement) {
  document.body.innerHTML = `<div id="errorMessage">${i18n[i18nType].errorMessage}</div>`;
  console.error("未获取到必要的挂件元素:", widgetBlock, isWidgetBlockId, filterTypeElement, embedBlocksElement, refreshListElement, contentListElement);
  return;
}

// 加载挂件配置
let filterTypeInit = false;
let embedBlocksInit = false;
const filterTypeAttr = widgetBlock.getAttribute(`${WIDGET_ATTR_PREFIX}filter-type`);
if (filterTypeAttr && filterTypeList.has(filterTypeAttr)) {
  // 验证 filterTypeAttr 是否在 filterTypeList 中，避免 SQL 注入
  filterType = filterTypeAttr;
  filterTypeElement.value = filterTypeAttr;
} else {
  filterTypeInit = true;
  setTimeout(() => {
    if (filterTypeInit) {
      setBlockAttrs(widgetBlockId, {
        "filter-type": filterType
      });
    }
  }, 1000); // 插入挂件块后 1 秒才能有效设置属性
}
const embedBlocksAttr = widgetBlock.getAttribute(`${WIDGET_ATTR_PREFIX}embed-blocks`);
if (embedBlocksAttr) {
  isEmbedBlocks = embedBlocksAttr === "true";
  embedBlocksElement.value = embedBlocksAttr;
} else {
  embedBlocksInit = true;
  setTimeout(() => {
    if (embedBlocksInit) {
      setBlockAttrs(widgetBlockId, {
        "embed-blocks": isEmbedBlocks ? "true" : "false"
      });
    }
  }, 1000);
}

// 设置元素文案
filterTypeElement.querySelectorAll(":scope > option").forEach((option: Element) => {
  const text = i18n[i18nType]["text-" + (option as HTMLOptionElement).value];
  option.textContent = text;
});
embedBlocksElement.querySelectorAll(":scope > option").forEach((option: Element) => {
  const text = i18n[i18nType]["embedBlocks-" + (option as HTMLOptionElement).value];
  option.textContent = text;
});
refreshListElement.title = i18n[i18nType]["refreshList"];


// ==================== 事件监听器设置 ====================
// 为行级元素类型下拉选择框添加变化事件监听器
filterTypeElement.addEventListener("change", function (): void {
  if (filterTypeInit) {
    filterTypeInit = false;
  }

  // 更新选中的内联元素类型
  filterType = filterTypeElement.value;

  setBlockAttrs(widgetBlockId, {
    "filter-type": filterType
  });

  genList();
});
// 为嵌入块状态下拉选择框添加变化事件监听器
embedBlocksElement.addEventListener("change", function (): void {
  if (embedBlocksInit) {
    embedBlocksInit = false;
  }

  // 根据选择的值更新是否包含嵌入块的标志位
  isEmbedBlocks = embedBlocksElement.value === "true";
  
  setBlockAttrs(widgetBlockId, {
    "embed-blocks": isEmbedBlocks ? "true" : "false"
  });
  
  genList();
});
// 为刷新按钮添加点击事件监听器
refreshListElement.addEventListener("click", function (): void {
  // 重新生成列表内容
  genList();
});

// 初始化
genList();

// ==================== 核心功能函数 ====================

/**
 * 生成汇总列表
 */
async function genList(): Promise<void> {
  // 清空之前的内容列表
  contentListElement!.innerHTML = "";

  // 获取文档 ID
  let documentId: string | null = null;
  if (!widgetBlock?.closest(".protyle-wysiwyg__embed")) {
    const protyleContent = widgetBlock?.closest(".protyle-content");
    if (protyleContent) {
      documentId = protyleContent.querySelector(".protyle-top .protyle-title")?.getAttribute("data-node-id") || null;
    }
  }
  if (!documentId) {
    const documentIdResult = await querySQL(`SELECT root_id FROM blocks WHERE id = '${widgetBlockId}' LIMIT 1`);
    documentId = documentIdResult[0].root_id;
  }

  // 根据 isEmbedBlocks 标志位选择不同的接口获取文档内容
  let documentHTML: string;
  
  // 设置加载提示超时
  const loadingTimeout = setTimeout(() => {
    contentListElement!.innerHTML = `<div id="message">${i18n[i18nType]["loadingMessage"]}</div>`;
  }, 400);
  
  try {
    if (isEmbedBlocks) {
      // 包含嵌入块：使用预览接口获取完整的 HTML
      const previewResult = await getBlockPreview(documentId);
      documentHTML = previewResult.data.html;
    } else {
      // 不包含嵌入块：使用普通 DOM 接口
      const documentDOMResult = await getBlockDOM(documentId);
      documentHTML = documentDOMResult.data.dom;
    }
    
    // 清除加载提示超时
    clearTimeout(loadingTimeout);
    
    // 检查 HTML 大小，如果过大则显示警告
    if (documentHTML.length > 100000) { // 约 100KB
      // 显示加载提示
      contentListElement!.innerHTML = `<div id="message">${i18n[i18nType]["loadingMessage"]}</div>`;
    }
  } catch (error) {
    // 清除加载提示超时
    clearTimeout(loadingTimeout);
    throw error;
  }
  
  // 使用文档片段高性能解析 DOM，使用 TreeWalker 遍历并合并相邻的元素的文本，生成列表项
  const parser = new DOMParser();
  const doc = parser.parseFromString(documentHTML, 'text/html');
  
  // 合并相邻的元素的文本内容（忽略元素之间的空白字符）
  const mergedItems: Array<{text: string, blockId: string}> = [];
  let currentItem: {text: string, blockId: string} | null = null;
  let lastElement: Element | null = null;
  let processedCount = 0;
  const maxProcessCount = 10000; // 限制最大处理元素数量
  
  // 创建 TreeWalker 来遍历所有 span 元素
  const walker = doc.createTreeWalker(
    doc.body,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: function(node: Node) {
        // 检查是否是目标类型的 span 元素
        if (node instanceof Element && node.tagName === 'SPAN' && node.getAttribute('data-type')?.includes(filterType)) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      }
    }
  );
  
  // 使用异步处理避免界面卡死
  const processElements = async () => {
    let element: Element | null;
    let batchCount = 0;
    const batchSize = 50; // 每批处理 50 个元素
    
    while (element = walker.nextNode() as Element) {
      // 检查是否超过最大处理数量
      if (processedCount >= maxProcessCount) {
        console.warn(`已达到最大处理数量限制 (${maxProcessCount})，停止处理`);
        break;
      }
      
      const text = element.textContent?.trim();
      if (!text) continue;
      
      // 查找包含当前内联元素的块元素（通过 data-node-id 属性）
      const blockElement = isEmbedBlocks ? element.closest("[id]") : element.closest("[data-node-id]");
      if (!blockElement) continue;
      
      const blockId = isEmbedBlocks ? blockElement.id : blockElement.getAttribute("data-node-id");
      if (!blockId) continue;
      
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
    
    // 生成列表项
    generateListItems(mergedItems);
  };
  
  // 开始异步处理
  processElements();
}

/**
 * 生成列表项
 * @param mergedItems 合并后的项目列表
 */
function generateListItems(mergedItems: Array<{text: string, blockId: string}>): void {
  // 清空之前的内容列表
  contentListElement!.innerHTML = "";
  
  // 检查是否有查询结果
  if (mergedItems.length === 0) {
    // 没有查询结果时显示提示消息
    const noResultsDiv = document.createElement("div");
    noResultsDiv.id = "message";
    noResultsDiv.textContent = i18n[i18nType]["noResultsMessage"];
    contentListElement!.appendChild(noResultsDiv);
    return;
  }
  
  // 使用 DocumentFragment 提升性能
  const fragment = document.createDocumentFragment();
  
  for (const item of mergedItems) {
    if (isPreviewMode) {
      // 导出预览模式不需要链接，因为点击也无法跳转
      // 创建列表项并添加文本
      const listItem = document.createElement("li");
      listItem.textContent = item.text;
      fragment.appendChild(listItem);
    } else {
      // 创建链接元素
      const link = document.createElement("a");
      link.textContent = item.text;
      link.href = `siyuan://blocks/${item.blockId}`;
      
      // 创建列表项并添加链接
      const listItem = document.createElement("li");
      listItem.appendChild(link);
      
      // 将列表项添加到 DocumentFragment
      fragment.appendChild(listItem);
    }
  }
  
  // 一次性将所有元素添加到 DOM 中
  contentListElement!.appendChild(fragment);
}

/**
 * 设置块属性（用于保存挂件块配置）
 */
async function setBlockAttrs(blockId: string | null, attrs: Record<string, string>) {
  if (window.parent.siyuan.isPublish) {
    // 发布服务，不写入数据
    return;
  }
  if (!blockId) {
    console.error('Failed to setBlockAttrs: blockId is null');
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
      return result;
  } catch (error) {
      console.error('Failed to setBlockAttrs:', error);
      throw error;
  }
}

/**
 * 执行 SQL 查询
 * @param sql SQL 语句
 * @returns 查询结果
 */
async function querySQL(sql: string) {
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
      console.error("Failed to querySQL:", error);
      throw error;
  }
}

/**
 * 获取块 DOM
 * @param blockId 块 ID
 * @returns 块 DOM
 */
async function getBlockDOM(blockId: string) {
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
    console.error("Failed to getBlockDOM:", error);
    throw error;
  }
}

/**
 * 获取块预览 HTML
 * @param blockId 块 ID
 * @returns 预览 HTML
 */
async function getBlockPreview(blockId: string) {
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
    console.error("Failed to getBlockPreview:", error);
    throw error;
  }
}
}

main();