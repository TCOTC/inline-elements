import type { WidgetSettings } from "../context/types";

/**
 * 根据 filterType 创建 TreeWalker，遍历编辑器 DOM 中的行级元素
 */
export function createWalker(doc: Document, settings: WidgetSettings): TreeWalker {
  const { filterType } = settings;

  return doc.createTreeWalker(
    doc.body,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: function(node: Node) {
        // 使用 SHOW_ELEMENT 时，node 一定是 Element 类型，直接访问属性
        if ((node as Element).tagName === "SPAN") {
          const dataType = (node as Element).getAttribute("data-type");
          if (dataType && dataType.split(" ").includes(filterType)) {
            return NodeFilter.FILTER_ACCEPT;
          }
        }
        return NodeFilter.FILTER_SKIP;
      }
    }
  );
}
