import { i18n } from "../i18n";
import { isExportMode, isPreviewMode, type MergedItem, type WidgetContext } from "../context/types";
import { showMessage } from "../ui/message";

/**
 * 生成列表项
 * @param mergedItems 合并后的项目列表
 */
export function renderList(ctx: WidgetContext, mergedItems: MergedItem[]): void {
  const { contentList } = ctx.elements;
  contentList.innerHTML = "";
  
  // 检查是否有查询结果
  if (mergedItems.length === 0) {
    if (isExportMode(ctx.mode)) {
      // 在导出模式没有查询结果时隐藏挂件块
      ctx.widgetBlock.style.display = "none";
    } else {
      showMessage(contentList, i18n.noResultsMessage);
    }
    return;
  }
  
  // 使用 DocumentFragment 提升性能
  const fragment = document.createDocumentFragment();
  
  for (const item of mergedItems) {
    if (isPreviewMode(ctx.mode)) {
      // 导出预览模式不需要链接，因为点击也无法跳转
      // 创建纯文本列表项
      const listItem = document.createElement("li");
      listItem.textContent = item.text;
      fragment.appendChild(listItem);
    } else if (isExportMode(ctx.mode)) {
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
  contentList.appendChild(fragment);
}
