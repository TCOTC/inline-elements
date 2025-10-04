import { i18n } from "./i18n";

// 用函数包裹，方便直接 return
function main(): void {
// ==================== 全局变量定义 ====================
const WIDGET_ATTR_PREFIX = "custom-inline-elements-widget-"; // 挂件属性前缀

// 当前选中的内联元素类型，默认为 "mark"（标记）
let filterType: string = "mark";

// 控制是否包含嵌入块内容的标志位，默认为 false（不包含）
let isEmbedBlocks: boolean = false;

// TODO: 删除这个 randomId；后面要改成靠 SQL 查询数据
// 当页面中有多个相同的小部件时，通过随机 id 来区分不同的实例
const randomId: string = "id_" + Math.random().toString(36).substr(2, 9);
document.body.id = randomId;

// ==================== 获取 DOM 元素并设置语言 ====================
// 获取挂件块本身
const widgetBlock: Element | null = window.frameElement?.closest("[data-node-id]") || null;
const widgetBlockId: string | null = widgetBlock?.getAttribute("data-node-id") || null;

// 设置语言
let i18nType = widgetBlock?.closest("html")?.getAttribute("lang") || "en_US";
if (!i18n[i18nType]) i18nType = "en_US";
document.documentElement.lang = i18nType;

// 获取挂件内的各个元素
const filterTypeElement = document.getElementById("filterType") as HTMLSelectElement | null;
const embedBlocksElement = document.getElementById("embedBlocks") as HTMLSelectElement | null;
const contentListElement = document.getElementById("contentList") as HTMLElement | null;

// 未获取到必要的挂件元素时显示错误消息并退出
if (!widgetBlock || !widgetBlockId || !filterTypeElement || !embedBlocksElement || !contentListElement) {
  document.body.innerHTML = `<div id="errorMessage">${i18n[i18nType].errorMessage}</div>`;
  return;
}

// 加载挂件配置
let filterTypeInit = false;
let embedBlocksInit = false;
const filterTypeAttr = widgetBlock.getAttribute(`${WIDGET_ATTR_PREFIX}filter-type`);
if (filterTypeAttr) {
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

// 设置下拉框选项文案
filterTypeElement.querySelectorAll(":scope > option").forEach((option: Element) => {
  const text = i18n[i18nType]["text-" + (option as HTMLOptionElement).value];
  option.textContent = text;
});

embedBlocksElement.querySelectorAll(":scope > option").forEach((option: Element) => {
  const text = i18n[i18nType]["embedBlocks-" + (option as HTMLOptionElement).value];
  option.textContent = text;
});


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

// 初始化
genList();

// ==================== 核心功能函数 ====================
/**
 * 生成汇总列表
 */
function genList(): void {
  genList2();
  return;
  // 清空之前的内容列表
  contentListElement!.innerHTML = "";

  // 通过 SQL 查询行级元素

  // 合并相邻的行级元素

  // 生成列表项
}

// @ts-ignore
function genList2(): void {
  // 清空之前的内容列表
  contentListElement!.innerHTML = "";
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
      ) as HTMLIFrameElement;
      
      // 验证这个嵌入块是否包含当前小部件实例（通过随机 id 区分）
      return (
        embedElement !== null &&
        embedElement.contentWindow !== undefined &&
        embedElement.contentWindow !== null &&
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
    contentListElement!.appendChild(listItem);
  }
}

/**
 * 设置块属性（用于保存挂件块配置）
 */
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
}

main();