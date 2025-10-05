/**
To-dos:
- [x] 确认能解决 https://github.com/hqweay/widget-inline-extractor/issues 里的问题
- [x] 支持在导出预览模式使用
- [x] 支持在导出图片/PDF时使用：隐藏 iframe 边框、隐藏控制面板
- [x] 测试在发布服务是否正常工作、不报错
- [x] 暗黑模式的样式，需要从 iframe 外获取颜色变量实际值，genList 的时候也要刷新一次
- [ ] 支持所有行级元素：两个接口获取到的行级元素格式不同，需要单独适配
- [ ] 移除所有 console.log
- [ ] 测试在移动端能否正常使用
- [ ] 把主空间里使用到 widget-inline-extractor 挂件的地方，改为使用本挂件
- [ ] 支持汇总带 颜色/背景色 的元素：需要多加一个下拉框，很多颜色
- [ ] 在其他浏览器测试以上功能是否正常工作
*/

import { i18n } from "./i18n";

// 用函数包裹，方便直接 return
async function main(): Promise<void> {
// ==================== 全局变量定义 ====================
const WIDGET_ATTR_PREFIX = "custom-inline-elements-widget-"; // 挂件属性前缀

const filterTypesList: string[] = ["mark", "strong", "tag", "em", "u", "s", "inline-memo", "a", "block-ref", "code", "inline-math", "sup", "sub", "kbd"];
// 通过 JS 生成 option 元素；按实际使用情况排一下序；两个接口获取到的行级元素格式不同
// mark        标记　　   <span data-type="mark">text</span>
// strong      粗体　　   <span data-type="strong">text</span>
// tag         标签　　   <span data-type="tag">&ZeroWidthSpace;text</span>                                           |  [x]  <em>#text#</em>
// em	         斜体　　   <span data-type="em">text</span>
// u           下划线　   <span data-type="u">text</span>
// s           删除线　   <span data-type="s">text</span>
// inline-memo 备注　　   <span data-type="inline-memo" data-inline-memo-content="memo">text</span>                   |  [x]  导出预览接口没有行级备注元素
// a           超链接　   <span data-type="a" data-href="link">text</span>                                            |  [ ]  <a href="link" data-type="a">text</a>（块超链接跟块引用的一样），v3.3.5 之后是 <a href="link" data-type="a">text</a>
// block-ref   块引用　   <span data-type="block-ref" data-id="20250924233731-pl5p9zc" data-subtype="s">text</span>   |  [ ]  <a href="siyuan://blocks/20250924233731-pl5p9zc">text</a> // TODO: 这里在等 https://github.com/siyuan-note/siyuan/issues/16017 修改
// code	       行级代码   <span data-type="code">&ZeroWidthSpace;text</span>                                          |  <span data-type="code">text</span>
// inline-math 行级公式   <span data-type="inline-math">
// sup         上标　　   <span data-type="sup">text</span>
// sub         下标　　   <span data-type="sub">text</span>
// kbd         键盘　　   <span data-type="kbd">&ZeroWidthSpace;text</span>                                           |  <span data-type="kbd">text</span>
const embedBlocksList: string[] = ["false", "true"];

// 当前选中的内联元素类型，默认为 "mark"（标记）
let filterType: string = filterTypesList[0];
// 控制是否包含嵌入块内容的标志位，默认为 false（不包含）
let isEmbedBlocks: boolean = false;

// ==================== 获取 DOM 元素并设置语言 ====================
// 获取挂件块本身
let isPreviewMode = false; // 是否是导出预览模式
let widgetBlockId: string | null = null;
let widgetBlock: Element | null = window.frameElement?.closest("[data-node-id], [id]") || null;
if (widgetBlock) {
  widgetBlockId = widgetBlock?.getAttribute("data-node-id") || null;
  // 导出图片/PDF时同时存在 data-node-id 和 id 属性，所以这个情况下就不算导出预览模式
  if (!widgetBlockId) {
    widgetBlockId = widgetBlock?.getAttribute("id") || null;
    isPreviewMode = true;
  }
}
// ID 应该是 20251005012849-g0wv4xn 这样的 14 位数字加横杠加 7 位随机字符，否则认为没有获取到正确的挂件块，避免 SQL 注入
const isWidgetBlockId = !!widgetBlockId && /^[0-9]{14}-[a-z0-9]{7}$/.test(widgetBlockId);

// 设置语言
const htmlElement = widgetBlock?.closest("html");
let i18nType = htmlElement?.getAttribute("lang") || "en_US";
if (!i18n[i18nType]) i18nType = "en_US";
document.documentElement.lang = i18nType;

// 获取挂件内的各个元素
const filterTypeElement = document.getElementById("filterType") as HTMLSelectElement | null;
const embedBlocksElement = document.getElementById("embedBlocks") as HTMLSelectElement | null;
const refreshListElement = document.getElementById("refreshList") as HTMLButtonElement | null;
const contentListElement = document.getElementById("contentList") as HTMLElement | null;

// 未获取到必要的挂件元素时显示错误消息并退出
if (!widgetBlock || !isWidgetBlockId || !htmlElement || !filterTypeElement || !embedBlocksElement || !refreshListElement || !contentListElement) {
  document.body.innerHTML = `<div id="errorMessage">${i18n[i18nType].errorMessage}</div>`;
  console.error("inline-elements widget: Necessary widget elements not retrieved:", {widgetBlock, isWidgetBlockId, htmlElement, filterTypeElement, embedBlocksElement, refreshListElement, contentListElement});
  return;
}

// 复制属性，因为主题的样式选择器依赖这些属性
// 把 htmlElement 上的所有属性复制到 document.documentElement 上
for (const attr of htmlElement.attributes) {
  document.documentElement.setAttribute(attr.name, attr.value);
}
// 把 bodyElement 上的所有属性复制到 document.body 上
const bodyElement = htmlElement.querySelector("body");
if (bodyElement) {
for (const attr of bodyElement.attributes) {
    document.body.setAttribute(attr.name, attr.value);
  }
}

let isExportMode = false; // 是否是导出图片/PDF模式
let isExportIMG = !!widgetBlock?.closest(".export-img"); // 是否是导出图片模式
let isExportPDF = !!widgetBlock?.closest("#preview"); // 是否是导出 PDF 模式
if (isExportIMG || isExportPDF) {
  isExportMode = true;
}

await copyThemeStyle();

// 加载挂件配置
let filterTypeInit = false;
let embedBlocksInit = false;
const filterTypeAttr = widgetBlock.getAttribute(`${WIDGET_ATTR_PREFIX}filter-type`);
if (filterTypeAttr && filterTypesList.includes(filterTypeAttr)) {
  // 验证 filterTypeAttr 是否在 filterTypeList 中，避免 SQL 注入
  filterType = filterTypeAttr;
} else {
  filterTypeInit = true;
  setTimeout(() => {
    if (filterTypeInit && !isExportMode) {
      setBlockAttrs(widgetBlockId, {
        "filter-type": filterType
      });
    }
  }, 1000); // 插入挂件块后 1 秒才能有效设置属性
}
const embedBlocksAttr = widgetBlock.getAttribute(`${WIDGET_ATTR_PREFIX}embed-blocks`);
if (embedBlocksAttr) {
  isEmbedBlocks = embedBlocksAttr === "true";
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

if (isExportMode) {
  // 设置导出模式样式
  document.body.classList.add("exportMode");
  // 先初始化才能获取到正确的元素高度
  await genList();
  // 获取 html 元素包含外边距的实际高度，并适当增加高度以避免出现滚动条
  const bodyHeight = document.documentElement.getBoundingClientRect().height;
  document.documentElement.style.overflow = "hidden"; // 设置 html 元素不显示滚动条，替代已弃用的 iframe.setAttribute("scrolling", "no")
  const iframe = widgetBlock.querySelector("iframe") as HTMLIFrameElement;
  iframe.style.border = "none"; // 会产生滚动条
  if (isExportIMG) {
    iframe.style.height = `${bodyHeight - 5}px`; // 导出图片时，减去 5 像素，避免底部出现重复的 iframe 内容（导出时会显示滚动条，但导出后不会显示滚动条）
  } else {
    iframe.style.height = `${bodyHeight + 4}px`; // 导出 PDF 时，增加 4 像素，避免导出之后出现滚动条（导出之前可能不显示滚动条，但导出之后会显示滚动条）
  }
} else {
  // 设置下拉框选项和元素文案
  const filterTypeOptions = filterTypesList.map((type: string) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = i18n[i18nType]["text-" + type];
    return option;
  });
  filterTypeElement.append(...filterTypeOptions);
  filterTypeElement.value = filterType;

  const embedBlocksOptions = embedBlocksList.map((value: string) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = i18n[i18nType]["embedBlocks-" + value];
    return option;
  });
  embedBlocksElement.append(...embedBlocksOptions);
  embedBlocksElement.value = isEmbedBlocks ? "true" : "false";
  
  refreshListElement.title = i18n[i18nType]["refreshList"];

  if (filterType === 'inline-memo' && isEmbedBlocks) {
    // 导出预览接口没有行级备注元素，所以必须是不包含嵌入块
    isEmbedBlocks = false;
    embedBlocksElement.value = "false";
    setBlockAttrs(widgetBlockId, {
      "embed-blocks": isEmbedBlocks ? "true" : "false"
    });
  }

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

    if (filterType === 'inline-memo') {
      isEmbedBlocks = false;
      embedBlocksElement.value = "false";
      setBlockAttrs(widgetBlockId, {
        "embed-blocks": isEmbedBlocks ? "true" : "false"
      });
    }

    genList();
  });
  // 为嵌入块状态下拉选择框添加变化事件监听器
  embedBlocksElement.addEventListener("change", function (): void {
    if (embedBlocksInit) {
      embedBlocksInit = false;
    }

    if (filterType === 'inline-memo') {
      isEmbedBlocks = false;
      embedBlocksElement.value = "false";
    } else {
      // 根据选择的值更新是否包含嵌入块的标志位
      isEmbedBlocks = embedBlocksElement.value === "true";
      
      setBlockAttrs(widgetBlockId, {
        "embed-blocks": isEmbedBlocks ? "true" : "false"
      });
    }

    genList();
  });
  // 为刷新按钮添加点击事件监听器
  refreshListElement.addEventListener("click", function (): void {
    // 重新生成列表内容
    genList();
  });

  // 初始化
  genList();
}

// ==================== 核心功能函数 ====================

/**
 * 生成汇总列表
 */
async function genList(): Promise<void> {
  // 清空之前的内容列表
  contentListElement!.innerHTML = "";
  // 复制主题样式
  await copyThemeStyle();

  // 获取文档 ID
  let documentId: string | null = null;
  if (!widgetBlock?.closest(".protyle-wysiwyg__embed")) {
    const protyleContent = widgetBlock?.closest(".protyle-content");
    if (protyleContent) {
      documentId = protyleContent.querySelector(".protyle-top .protyle-title")?.getAttribute("data-node-id") || null;
    }
  }
  if (!documentId) {
    // 在 DOM 中获取不到文档 ID 时，使用 SQL 查询获取
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
    if (!documentId) {
      throw new Error("Document ID not found");
    }
    
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
  
  // 根据 isEmbedBlocks 和 filterType 创建不同的 TreeWalker
  let walker: TreeWalker;

  const defaultWalker = () => {
    // 标准处理：只处理 span 元素
    walker = doc.createTreeWalker(
      doc.body,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: function(node: Node) {
          // 使用 SHOW_ELEMENT 时，node 一定是 Element 类型，直接访问属性
          if ((node as Element).tagName === 'SPAN' && (node as Element).getAttribute('data-type')?.includes(filterType)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        }
      }
    );
  }
  
  if (isEmbedBlocks) {
    // 嵌入块模式的兼容处理
    switch (filterType) {
      case 'tag':
        // 标签元素结构：<em>#text#</em>
        walker = doc.createTreeWalker(
          doc.body,
          NodeFilter.SHOW_ELEMENT,
          {
            acceptNode: function(node: Node) {
              // 使用 SHOW_ELEMENT 时，node 一定是 Element 类型，直接访问属性
              if ((node as Element).tagName === 'EM') {
                const text = trimText((node as Element).textContent);
                // 检查是否以 # 开头和结尾，且包含标签内容
                if (text && text.startsWith('#') && text.endsWith('#') && text.length > 2) {
                  return NodeFilter.FILTER_ACCEPT;
                }
              }
              return NodeFilter.FILTER_SKIP;
            }
          }
        );
        break;
      case 'a':
        if (isLargerThanVersion("3.3.5") >= 0) {
          // v3.3.5 及之后版本的超链接元素结构：<a href="link" data-type="a">text</a>
          walker = doc.createTreeWalker(
            doc.body,
            NodeFilter.SHOW_ELEMENT,
            {
              acceptNode: function(node: Node) {
                if ((node as Element).tagName === 'A' && (node as Element).getAttribute('data-type')?.includes(filterType)) {
                  return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_SKIP;
              }
            }
          );
        } else {
          // v3.3.5 之前版本的超链接元素结构：<a href="link">text</a>
          walker = doc.createTreeWalker(
            doc.body,
            NodeFilter.SHOW_ELEMENT,
            {
              acceptNode: function(node: Node) {
                if ((node as Element).tagName === 'A' && !(node as HTMLAnchorElement).href.startsWith('siyuan://')) {
                  return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_SKIP;
              }
            }
          );
        }
        break;
      case 'block-ref':
        if (isLargerThanVersion("3.3.5") >= 0) {
          // TODO: 这里还在等实现 https://github.com/siyuan-note/siyuan/issues/16017
          // v3.3.5 及之后版本的块引用元素结构：<a href="link" data-type="block-ref">text</a>
          walker = doc.createTreeWalker(
            doc.body,
            NodeFilter.SHOW_ELEMENT,
            {
              acceptNode: function(node: Node) {
                if ((node as Element).tagName === 'A' && (node as Element).getAttribute('data-type')?.includes(filterType)) {
                  return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_SKIP;
              }
            }
          );
        } else {
          // v3.3.5 之前版本的块引用元素跟超链接元素的结构是一样的，以 siyuan:// 开头：<a href="siyuan://xxxxx">text</a>
          walker = doc.createTreeWalker(
            doc.body,
            NodeFilter.SHOW_ELEMENT,
            {
              acceptNode: function(node: Node) {
                if ((node as Element).tagName === 'A' && (node as HTMLAnchorElement).href.startsWith('siyuan://')) {
                  return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_SKIP;
              }
            }
          );
        }
        break;
      default:
        defaultWalker();
        break;
    }
  } else {
    defaultWalker();
  }
  
  // 使用异步处理避免界面卡死
  const processElements = async () => {
    let element: Element | null;
    let batchCount = 0;
    const batchSize = 50; // 每批处理 50 个元素
    
    while (element = walker.nextNode() as Element) {
      // 检查是否超过最大处理数量
      if (processedCount >= maxProcessCount) {
        console.warn(`inline-elements widget: Reached the maximum processing limit (${maxProcessCount}), stopping processing`);
        break;
      }
      
      let text = trimText(element.textContent);
      // 根据处理模式进行不同的文本处理
      if (isEmbedBlocks && filterType === 'tag') {
        // 嵌入块模式下的标签处理：去掉首尾的 #
        if (text.startsWith('#') && text.endsWith('#')) {
          text = trimText(text.slice(1, -1)); // 去掉首尾的 #
        }
      }
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
    if (isExportMode) {
      // 在导出模式没有查询结果时隐藏挂件块
      (widgetBlock! as HTMLElement).style.display = "none";
    } else {
      // 其他情况下没有查询结果时显示提示消息
      const noResultsDiv = document.createElement("div");
      noResultsDiv.id = "message";
      noResultsDiv.textContent = i18n[i18nType]["noResultsMessage"];
      contentListElement!.appendChild(noResultsDiv);
      return;
    }
  }
  
  // 使用 DocumentFragment 提升性能
  const fragment = document.createDocumentFragment();
  
  for (const item of mergedItems) {
    if (isPreviewMode) {
      // 导出预览模式不需要链接，因为点击也无法跳转
      // 创建纯文本列表项
      const listItem = document.createElement("li");
      listItem.textContent = item.text;
      fragment.appendChild(listItem);
    } else if (isExportMode) {
      // 导出PDF时，iframe 块里的链接好像不能转换哈希锚点
      // // 创建锚点元素
      // const link = document.createElement("a");
      // link.textContent = item.text;
      // link.href = `#${item.blockId}`;
      
      // // 创建列表项并添加链接
      // const listItem = document.createElement("li");
      // listItem.appendChild(link);
      
      // // 将列表项添加到 DocumentFragment
      // fragment.appendChild(listItem);

      // 创建纯文本列表项
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
 * 复制外部的主题样式到挂件块内部
 */
async function copyThemeStyle(): Promise<void> {
  const internalDefaultStyleElement = document.head.querySelector("#themeDefaultStyle") as HTMLLinkElement | null;
  const externalDefaultStyleElement = htmlElement!.querySelector("#themeDefaultStyle") as HTMLLinkElement | null;
  if (externalDefaultStyleElement) {
    let href = externalDefaultStyleElement.getAttribute("href");
    if (href) {
      // <link id="themeDefaultStyle" rel="stylesheet" type="text/css" href="/appearance/themes/daylight/theme.css?v=3.3.4">
      if (!href.startsWith("/")) href = "/" + href;
      // 创建新的样式元素
      const newDefaultStyleElement = document.createElement("link");
      // 等待新样式表加载完成再移除旧样式表
      await new Promise<void>((resolve) => {
        newDefaultStyleElement.rel = "stylesheet";
        newDefaultStyleElement.type = "text/css";
        newDefaultStyleElement.href = isExportPDF ? href! : "../.." + href!; // 导出 PDF 时，获取到的 href 就是完整路径的
        newDefaultStyleElement.onload = () => resolve();
        newDefaultStyleElement.onerror = () => resolve(); // 即使加载失败也要继续，避免阻塞
        
        // 插入新样式元素
        if (internalDefaultStyleElement) {
          internalDefaultStyleElement.parentNode?.insertBefore(newDefaultStyleElement, internalDefaultStyleElement);
        } else {
          document.head.appendChild(newDefaultStyleElement);
        }
      });
      
      // 移除旧样式元素
      internalDefaultStyleElement?.remove();
      // 设置新样式元素的 ID
      newDefaultStyleElement.id = "themeDefaultStyle";
    }
  }
  
  const internalStyleElement = document.head.querySelector("#themeStyle") as HTMLLinkElement | null;
  const externalStyleElement = htmlElement!.querySelector("#themeStyle") as HTMLLinkElement | null;
  if (externalStyleElement) {
    let href = externalStyleElement.getAttribute("href");
    if (href) {
      // <link id="themeStyle" rel="stylesheet" type="text/css" href="/appearance/themes/Whisper/theme.css?v=1.6.0">
      if (!href.startsWith("/")) href = "/" + href;
      // 创建新的样式元素
      const newStyleElement = document.createElement("link");
      // 等待新样式表加载完成再移除旧样式表
      await new Promise<void>((resolve) => {
        newStyleElement.rel = "stylesheet";
        newStyleElement.type = "text/css";
        newStyleElement.href = isExportPDF ? href! : "../.." + href!;
        newStyleElement.onload = () => resolve();
        newStyleElement.onerror = () => resolve(); // 即使加载失败也要继续，避免阻塞
        
        // 插入新样式元素
        if (internalStyleElement) {
          internalStyleElement.parentNode?.insertBefore(newStyleElement, internalStyleElement);
        } else {
          document.head.appendChild(newStyleElement);
        }
      });
      
      // 移除旧样式元素
      internalStyleElement?.remove();
      // 设置新样式元素的 ID
      newStyleElement.id = "themeStyle";
    }
  }
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
      console.warn("inline-elements widget: Failed to querySQL, error:", error);
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
    console.warn("inline-elements widget: Failed to getBlockDOM, error:", error);
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
    console.warn("inline-elements widget: Failed to getBlockPreview, error:", error);
    throw error;
  }
}

/**
 * 移除文本首尾的空白字符（包括零宽字符和普通空白字符）
 * @param text 原始文本
 * @returns 处理后的文本
 */
function trimText(text: string | null | undefined): string {
  if (!text) return '';
  // 直接移除首尾的所有空白字符（包括零宽字符）
  return text.replace(/^[\s\u200B-\u200D\uFEFF\u2060]+|[\s\u200B-\u200D\uFEFF\u2060]+$/g, '');
}

/**
 * 比较版本号（语义化版本）
 * @param version 要比较的目标版本号
 * @returns 比较结果（1：当前版本大于目标版本，-1：当前版本小于目标版本，0：相等）
 */
function isLargerThanVersion(version: string): number {
  // 获取当前内核版本（基准对象）
  const currentVersion = window.parent.siyuan.config?.system?.kernelVersion;
  if (!currentVersion) return 0; // 无法获取时视为相等

  // 分割版本号（注意变量名语义）
  const baseParts = currentVersion.split('.').map(Number); // 基准版本（当前版本）
  const targetParts = version.split('.').map(Number);      // 目标版本（传入参数）

  const maxLength = Math.max(baseParts.length, targetParts.length);
  
  for (let i = 0; i < maxLength; i++) {
    // 缺失的版本段视为0（如 1.0 == 1.0.0）
    const baseSegment = i < baseParts.length ? baseParts[i] : 0;
    const targetSegment = i < targetParts.length ? targetParts[i] : 0;
    
    // 核心逻辑：以当前版本为基准进行比较
    if (baseSegment > targetSegment) return 1;  // 当前版本 > 目标版本
    if (baseSegment < targetSegment) return -1; // 当前版本 < 目标版本
  }
  
  return 0; // 所有分段均相等
}
}

main();