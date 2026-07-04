import { trimText } from "../utils/text";
import type { WidgetSettings } from "../context/types";

/**
 * 根据 isEmbedBlocks 和 filterType 创建不同的 TreeWalker
 */
export function createWalker(doc: Document, settings: WidgetSettings): TreeWalker {
  const { isEmbedBlocks, filterType } = settings;

  const defaultWalker = () => {
    // 标准处理：只处理 span 元素
    return doc.createTreeWalker(
      doc.body,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: function(node: Node) {
          // 使用 SHOW_ELEMENT 时，node 一定是 Element 类型，直接访问属性
          if ((node as Element).tagName === 'SPAN') {
            const dataType = (node as Element).getAttribute('data-type');
            if (dataType && dataType.split(' ').includes(filterType)) {
              return NodeFilter.FILTER_ACCEPT;
            }
          }
          return NodeFilter.FILTER_SKIP;
        }
      }
    );
  };
  
  if (isEmbedBlocks) {
    // 嵌入块模式的兼容处理
    switch (filterType) {
      case 'tag':
        // 标签元素结构：<em>#text#</em>
        return doc.createTreeWalker(
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
      case 'a':
        // v3.3.5 及之后版本的超链接元素结构：<a href="link" data-type="a">text</a>
        return doc.createTreeWalker(
          doc.body,
          NodeFilter.SHOW_ELEMENT,
          {
            acceptNode: function(node: Node) {
              if ((node as Element).tagName === 'A') {
                const dataType = (node as Element).getAttribute('data-type');
                if (dataType && dataType.split(' ').includes(filterType)) {
                  return NodeFilter.FILTER_ACCEPT;
                }
              }
              return NodeFilter.FILTER_SKIP;
            }
          }
        );
      case 'block-ref':
        // TODO: 这里还在等实现 https://github.com/siyuan-note/siyuan/issues/16017
        // v3.3.5 及之后版本的块引用元素结构：<a href="link" data-type="block-ref">text</a>
        return doc.createTreeWalker(
          doc.body,
          NodeFilter.SHOW_ELEMENT,
          {
            acceptNode: function(node: Node) {
              if ((node as Element).tagName === 'A') {
                const dataType = (node as Element).getAttribute('data-type');
                if (dataType && dataType.split(' ').includes(filterType)) {
                  return NodeFilter.FILTER_ACCEPT;
                }
              }
              return NodeFilter.FILTER_SKIP;
            }
          }
        );
      default:
        return defaultWalker();
    }
  } else {
    return defaultWalker();
  }
}
