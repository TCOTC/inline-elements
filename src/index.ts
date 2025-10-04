// 为 iframe 设置随机id，防止多窗口窜数据
const randomId = "id_" + Math.random().toString(36).substr(2, 9);
document.body.id = randomId;

var getFromEmbedFlag = false;
var selectedValue = "mark";

var toggleButton = document.getElementById("toggleButton");
var dropdown = document.getElementById("myDropdown");

toggleButton.addEventListener("click", function () {
  getFromEmbedFlag = !getFromEmbedFlag; // 切换变量的值
  document.getElementById("toggleButton").textContent = getFromEmbedFlag
    ? "包含嵌入块"
    : "不包含嵌入块";
  init();
});

dropdown.addEventListener("change", function () {
  selectedValue = dropdown.value;
  init();
});
init();
function init() {
  let contentListElement = document.getElementById("contentList");
  contentListElement.innerHTML = "";
  let elements;

  let pageDoms = window.parent.document.querySelectorAll(
    "[class='fn__flex-1 protyle']"
  );

  if (pageDoms.length > 1) {
    pageDoms = Array.from(pageDoms).filter(function (ele) {
      return (
        ele.querySelector(
          "[data-src='/widgets/widget-inline-extractor/']"
        ) &&
        ele
          .querySelector("[data-src='/widgets/widget-inline-extractor/']")
          .contentWindow.document.querySelector(`[id='${randomId}']`)
      );
    });
  }

  if (pageDoms.length !== 1) {
    console.log("can not found");
    return;
  }

  //获取嵌入块的内容
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
    let content = elements[i].textContent;

    let link = window.parent.document.createElement("a");
    link.textContent = content;

    let firstDataParent = elements[i].closest("[data-node-id]");
    if (!firstDataParent) {
      continue;
    }
    link.href = `siyuan://blocks/${firstDataParent.getAttribute(
      "data-node-id"
    )}`;

    let listItem = window.parent.document.createElement("li");
    listItem.appendChild(link);

    contentListElement.appendChild(listItem);
  }
}