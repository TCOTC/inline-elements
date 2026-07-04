import { getBlockDOM, querySQL } from "../api/siyuan";
import { i18n } from "../i18n";
import { showMessage } from "../ui/message";
import type { WidgetContext } from "../context/types";

/**
 * 获取文档 ID
 */
async function getDocId(widgetBlock: Element, widgetBlockId: string): Promise<string | null> {
  let docId: string | null = null;
  if (!widgetBlock.closest(".protyle-wysiwyg__embed")) {
    const protyleContent = widgetBlock.closest(".protyle-content");
    if (protyleContent) {
      docId = protyleContent.querySelector(".protyle-top .protyle-title")?.getAttribute("data-node-id") || null;
    }
  }
  if (!docId) {
    // 在 DOM 中获取不到文档 ID 时，使用 SQL 查询获取
    const docIdResult = await querySQL(`SELECT root_id FROM blocks WHERE id = '${widgetBlockId}' LIMIT 1`);
    docId = docIdResult[0].root_id;
  }
  return docId;
}

/**
 * 获取文档 HTML
 */
export async function getDocHTML(ctx: WidgetContext): Promise<string> {
  const { widgetBlock, widgetBlockId, settings, elements } = ctx;
  const { contentList } = elements;
  const { isEmbedBlocks } = settings;

  const docId = await getDocId(widgetBlock, widgetBlockId);

  let docHTML: string;

  // 设置加载提示超时
  const loadingTimeout = setTimeout(() => {
    showMessage(contentList, i18n.loadingMessage);
  }, 400);

  try {
    if (!docId) {
      throw new Error(i18n.docIdNotFoundMessage);
    }

    const docDOMResult = await getBlockDOM(docId, isEmbedBlocks);
    docHTML = docDOMResult.data.dom;

    // 检查 HTML 大小，如果过大则显示提示
    if (docHTML.length > 100000) { // 约 100KB
      showMessage(contentList, i18n.loadingMessage);
    }
  } finally {
    clearTimeout(loadingTimeout);
  }

  return docHTML;
}
