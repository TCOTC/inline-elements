import { i18n } from "./i18n";

// ==================== 全局变量定义 ====================
const WIDGET_ATTR_PREFIX = "custom-inline-elements-widget-"; // 挂件属性前缀

// 当前选中的内联元素类型，默认为 "mark"（标记）
let filterType: string = "mark";

// 控制是否包含嵌入块内容的标志位
let isEmbedBlocks: boolean = false;

// TODO: 删除这个 randomId；后面要改成靠 SQL 查询数据
// 为 iframe 设置随机 id，防止多窗口窜数据
// 当页面中有多个相同的小部件时，通过随机 id 来区分不同的实例
const randomId: string = "id_" + Math.random().toString(36).substr(2, 9);
document.body.id = randomId;

// ==================== 获取 DOM 元素并设置语言 ====================
// 挂件块本身
const widgetBlock: Element | null = window.frameElement?.closest("[data-node-id]") || null;
const widgetBlockId: string | null = widgetBlock?.getAttribute("data-node-id") || null;

// 设置语言
const i18nType = widgetBlock?.closest("html")?.getAttribute("lang") || "en_US";
const isI18nSupported = !!i18n[i18nType];
document.documentElement.lang = isI18nSupported ? i18nType : "en_US";

// 获取行级元素类型下拉选择框
const filterTypeElement = document.getElementById("filterType") as HTMLSelectElement | null;
if (isI18nSupported) {
  filterTypeElement?.querySelectorAll(":scope > option").forEach((child: Element) => {
    const text = i18n[i18nType]["text-" + (child as HTMLOptionElement).value];
    if (text) {
      (child as HTMLOptionElement).textContent = text;
    }
  });
}

// 获取嵌入块选择下拉框
const embedBlocksElement = document.getElementById("embedBlocks") as HTMLSelectElement | null;
if (isI18nSupported) {
  embedBlocksElement?.querySelectorAll(":scope > option").forEach((child: Element) => {
    const text = i18n[i18nType]["embedBlocks-" + (child as HTMLOptionElement).value];
    if (text) {
      (child as HTMLOptionElement).textContent = text;
    }
  });
}

// ==================== 事件监听器设置 ====================
// 为嵌入块选择下拉框添加变化事件监听器
if (embedBlocksElement) {
  embedBlocksElement.addEventListener("change", function (): void {
    // 根据选择的值更新是否包含嵌入块的标志位
    isEmbedBlocks = embedBlocksElement.value === "true";
    
    // 设置挂件块属性
    setBlockAttrs(widgetBlockId, {
      "embed-blocks": embedBlocksElement.value
    });
    
    // 重新初始化内容列表
    init();
  });
}

// 为下拉选择框添加变化事件监听器
if (filterTypeElement) {
  filterTypeElement.addEventListener("change", function (): void {
    // 更新选中的内联元素类型
    filterType = filterTypeElement.value;
    
    // 设置挂件块属性
    setBlockAttrs(widgetBlockId, {
      "filter-type": filterTypeElement.value
    });
    
    // 重新初始化内容列表
    init();
  });
}


// ==================== 程序入口 ====================
// 页面加载完成后立即执行初始化函数
loadBlockAttrs();
init();


// ==================== 类型定义 ====================
// 扩展 Element 接口，添加 contentWindow 属性（用于嵌入块）
interface ElementWithContentWindow extends Element {
  contentWindow?: Window;
}

// ==================== 属性读取函数 ====================
/**
 * 从挂件块读取属性并更新变量
 */
function loadBlockAttrs(): void {
  if (!widgetBlock) {
    return;
  }

  // 读取嵌入块设置
  const embedBlocksAttr = widgetBlock.getAttribute(`${WIDGET_ATTR_PREFIX}embed-blocks`);
  if (embedBlocksAttr) {
    isEmbedBlocks = embedBlocksAttr === "true";
    // 更新下拉框显示
    if (embedBlocksElement) {
      embedBlocksElement.value = isEmbedBlocks ? "true" : "false";
    }
  }
  
  // 读取筛选类型设置
  const filterTypeAttr = widgetBlock.getAttribute(`${WIDGET_ATTR_PREFIX}filter-type`);
  if (filterTypeAttr) {
    filterType = filterTypeAttr;
    // 更新下拉框显示
    if (filterTypeElement) {
      filterTypeElement.value = filterType;
    }
  }
}

// ==================== 核心功能函数 ====================
/**
 * 初始化函数 - 主要功能入口
 * 1. 清空内容列表
 * 2. 查找当前页面中的思源笔记编辑器区域
 * 3. 根据用户选择筛选内联元素
 * 4. 生成可点击的链接列表
 */
function init(): void {
  // 获取内容列表容器元素
  const contentListElement: HTMLElement | null = document.getElementById("contentList");
  if (!contentListElement) {
    console.error("contentList element not found");
    return;
  }
  
  // 清空之前的内容列表
  contentListElement.innerHTML = "";
  let elements: NodeListOf<Element>;

  // ==================== 查找思源笔记编辑器区域 ====================
  // 在父窗口中查找所有思源笔记的编辑器区域（protyle 类）
  let pageDoms: Element[] = Array.from(window.parent.document.querySelectorAll(
    "[class='fn__flex-1 protyle']"
  ));

  // 如果找到多个编辑器区域，需要进一步筛选
  if (pageDoms.length > 1) {
    // 通过查找包含当前小部件的嵌入块来定位正确的编辑器区域
    pageDoms = pageDoms.filter(function (el: Element): boolean {
      // 查找嵌入块元素
      const embedElement = el.querySelector(
        "[data-src='/widgets/controlPanel/']"
      ) as ElementWithContentWindow;
      
      // 验证这个嵌入块是否包含当前小部件实例（通过随机 id 区分）
      return (
        embedElement !== null &&
        embedElement.contentWindow !== undefined &&
        embedElement.contentWindow.document.querySelector(`[id='${randomId}']`) !== null
      );
    });
  }

  // 如果无法确定唯一的编辑器区域，则退出
  if (pageDoms.length !== 1) {
    console.log("can not found");
    return;
  }

  // ==================== 筛选内联元素 ====================
  // 根据用户设置决定是否包含嵌入块中的内容
  if (isEmbedBlocks) {
    // 包含嵌入块：查找所有指定类型的内联元素
    elements = pageDoms[0].querySelectorAll(
      `span[data-type~=${filterType}]`
    );
  } else {
    // 不包含嵌入块：排除嵌入块内的内联元素
    elements = pageDoms[0].querySelectorAll(
      `span[data-type~=${filterType}]:not(.protyle-wysiwyg__embed *)`
    );
  }

  // ==================== 生成链接列表 ====================
  // 遍历找到的所有内联元素，为每个元素创建可点击的链接
  for (let i = 0; i < elements.length; i++) {
    // 获取元素的文本内容
    const content: string | null = elements[i].textContent;
    if (!content) {
      continue; // 跳过没有文本内容的元素
    }

    // 创建链接元素
    const link: HTMLAnchorElement = window.parent.document.createElement("a");
    link.textContent = content;

    // 查找包含当前内联元素的块元素（通过 data-node-id 属性）
    const firstDataParent: Element | null = elements[i].closest("[data-node-id]");
    if (!firstDataParent) {
      continue; // 如果找不到父块元素，跳过
    }
    
    // 获取块的 ID 并设置链接地址
    const nodeId: string | null = firstDataParent.getAttribute("data-node-id");
    if (nodeId) {
      // 使用思源笔记的协议链接格式，点击可跳转到对应块
      link.href = `siyuan://blocks/${nodeId}`;
    }

    // 创建列表项并添加链接
    const listItem: HTMLLIElement = window.parent.document.createElement("li");
    listItem.appendChild(link);

    // 将列表项添加到内容列表中
    contentListElement.appendChild(listItem);
  }
}

// 设置块属性
async function setBlockAttrs(blockId: string | null, attrs: Record<string, string>) {
  // 判断是否是发布服务，或者传入的参数是否存在
  if (window.parent.siyuan.isPublish || !blockId) {
    console.error('设置块属性失败: 处于发布服务，或者 blockId 为空');
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
      console.log('设置成功:', result);
      return result;
  } catch (error) {
      console.error('设置块属性失败:', error);
      throw error;
  }
}