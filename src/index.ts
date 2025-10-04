// 为 iframe 设置随机 id，防止多窗口窜数据
const randomId: string = "id_" + Math.random().toString(36).substr(2, 9);
document.body.id = randomId;

let getFromEmbedFlag: boolean = false;
let selectedValue: string = "mark";

const toggleButton: HTMLElement | null = document.getElementById("toggleButton");
const dropdown: HTMLSelectElement | null = document.getElementById("myDropdown") as HTMLSelectElement;

// 添加空值检查
if (toggleButton) {
  toggleButton.addEventListener("click", function (): void {
    getFromEmbedFlag = !getFromEmbedFlag; // 切换变量的值
    const buttonElement = document.getElementById("toggleButton");
    if (buttonElement) {
      buttonElement.textContent = getFromEmbedFlag
        ? "包含嵌入块"
        : "不包含嵌入块";
    }
    init();
  });
}

if (dropdown) {
  dropdown.addEventListener("change", function (): void {
    selectedValue = dropdown.value;
    init();
  });
}
// 定义接口
interface ElementWithContentWindow extends Element {
  contentWindow?: Window;
}

// 初始化函数
function init(): void {
  const contentListElement: HTMLElement | null = document.getElementById("contentList");
  if (!contentListElement) {
    console.error("contentList element not found");
    return;
  }
  
  contentListElement.innerHTML = "";
  let elements: NodeListOf<Element>;

  let pageDoms: Element[] = Array.from(window.parent.document.querySelectorAll(
    "[class='fn__flex-1 protyle']"
  ));

  if (pageDoms.length > 1) {
    pageDoms = pageDoms.filter(function (el: Element): boolean {
      const embedElement = el.querySelector(
        "[data-src='/widgets/widget-inline-extractor/']"
      ) as ElementWithContentWindow;
      return (
        embedElement !== null &&
        embedElement.contentWindow !== undefined &&
        embedElement.contentWindow.document.querySelector(`[id='${randomId}']`) !== null
      );
    });
  }

  if (pageDoms.length !== 1) {
    console.log("can not found");
    return;
  }

  // 获取嵌入块的内容
  if (getFromEmbedFlag) {
    elements = pageDoms[0].querySelectorAll(
      `span[data-type~=${selectedValue}]`
    );
  } else {
    elements = pageDoms[0].querySelectorAll(
      `span[data-type~=${selectedValue}]:not(.protyle-wysiwyg__embed *)`
    );
  }

  for (let i = 0; i < elements.length; i++) {
    const content: string | null = elements[i].textContent;
    if (!content) {
      continue;
    }

    const link: HTMLAnchorElement = window.parent.document.createElement("a");
    link.textContent = content;

    const firstDataParent: Element | null = elements[i].closest("[data-node-id]");
    if (!firstDataParent) {
      continue;
    }
    
    const nodeId: string | null = firstDataParent.getAttribute("data-node-id");
    if (nodeId) {
      link.href = `siyuan://blocks/${nodeId}`;
    }

    const listItem: HTMLLIElement = window.parent.document.createElement("li");
    listItem.appendChild(link);

    contentListElement.appendChild(listItem);
  }
}

// 调用初始化函数
init();