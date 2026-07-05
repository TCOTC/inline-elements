import { i18n } from "../i18n";
import { getDocHTML } from "../parser/getDoc";
import { extractItems } from "../parser/extractItems";
import { showMessage } from "../ui/message";
import { escapeHtml } from "../util";
import type { MergedItem, WidgetContext } from "../context/types";

/** 导出 PDF 时替换生成的列表块专用类名 */
const EXPORT_LIST_CLASS = "inline-elements-export-list";
const EXPORT_LIST_STYLE_ID = "inline-elements-export-list-style";

export async function getMergedItems(ctx: WidgetContext): Promise<MergedItem[]> {
  const docHTML = await getDocHTML(ctx);
  return extractItems(docHTML, ctx);
}

export function renderIframeList(ctx: WidgetContext, mergedItems: MergedItem[], useLinks: boolean): void {
  const { contentList } = ctx.elements;

  if (mergedItems.length === 0) {
    showMessage(contentList, i18n.noResultsMessage);
    return;
  }

  const parts = new Array<string>(mergedItems.length);
  for (let i = 0; i < mergedItems.length; i++) {
    const item = mergedItems[i];
    const text = escapeHtml(item.text);
    parts[i] = useLinks
      ? `<li><a href="siyuan://blocks/${escapeHtml(item.blockId)}">${text}</a></li>`
      : `<li>${text}</li>`;
  }
  contentList.innerHTML = parts.join("");
}

export function replaceWidgetWithList(
  ctx: WidgetContext,
  mergedItems: MergedItem[],
  useHashLinks: boolean,
): void {
  const { widgetBlock, htmlElement, widgetBlockId } = ctx;

  if (mergedItems.length === 0) {
    widgetBlock.remove();
    return;
  }

  const parentDoc = htmlElement.ownerDocument;
  if (useHashLinks) {
    addExportListStyle(parentDoc);
  }

  widgetBlock.outerHTML = buildListHtml(
    parentDoc,
    mergedItems,
    widgetBlockId,
    useHashLinks,
  );
}

/** 导出 PDF 预览页注入列表星号链接样式 */
function addExportListStyle(parentDoc: Document): void {
  if (parentDoc.getElementById(EXPORT_LIST_STYLE_ID)) {
    // 同页多挂件时只插入一次
    return;
  }
  const style = parentDoc.createElement("style");
  style.id = EXPORT_LIST_STYLE_ID;
  style.textContent = `.${EXPORT_LIST_CLASS} a { text-decoration: none; }`;
  parentDoc.head.appendChild(style);
}

function buildListHtml(
  parentDoc: Document,
  items: MergedItem[],
  listId: string,
  useHashLinks: boolean,
): string {
  const listClass = useHashLinks ? `list ${EXPORT_LIST_CLASS}` : "list";
  const itemBlockId = renewBlockIdSuffix(listId);
  const partCount = items.length + 2;
  const liParts = new Array<string>(partCount);

  liParts[0] = `<div data-subtype="u" data-node-id="${listId}" data-type="NodeList" class="${listClass}">`;

  for (let i = 0; i < items.length; i++) {
    const content = buildListItemContent(parentDoc, items[i], useHashLinks);
    liParts[i + 1] = buildListItemHtml(itemBlockId, content);
  }

  liParts[partCount - 1] = `<div class="protyle-attr" contenteditable="false"></div></div>`;
  return liParts.join("");
}

/** 块 ID 后缀字符集（与思源块 ID 后缀格式一致） */
const BLOCK_ID_SUFFIX_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

/** 保留块 ID 的时间戳前缀，重新生成 7 位随机后缀 */
function renewBlockIdSuffix(blockId: string): string {
  const dashIndex = blockId.indexOf("-");
  if (dashIndex === -1) {
    return blockId;
  }
  const prefix = blockId.slice(0, dashIndex + 1);
  let suffix = "";
  for (let i = 0; i < 7; i++) {
    suffix += BLOCK_ID_SUFFIX_CHARS[Math.floor(Math.random() * BLOCK_ID_SUFFIX_CHARS.length)];
  }
  return prefix + suffix;
}

/**
 * 判断导出预览文档中是否存在可跳转的目标块。
 * 嵌入块会转换为引述块，其中的块 ID 是临时生成的，所以哈希锚点匹配不到。
 */
function hasBlockAnchor(parentDoc: Document, blockId: string): boolean {
  return parentDoc.querySelector(`[data-node-id="${CSS.escape(blockId)}"]`) !== null;
}

function buildListItemContent(
  parentDoc: Document,
  item: MergedItem,
  useHashLinks: boolean,
): string {
  const text = escapeHtml(item.text);
  if (useHashLinks && hasBlockAnchor(parentDoc, item.blockId)) {
    return `${text} <a href="#${escapeHtml(item.blockId)}">*</a>`;
  }
  return text;
}

function buildListItemHtml(itemBlockId: string, content: string): string {
  return `<div data-subtype="u" data-node-id="${itemBlockId}" data-type="NodeListItem" class="li"><div class="protyle-action" draggable="true"><svg><use xlink:href="#iconDot"></use></svg></div><div data-node-id="${itemBlockId}" data-type="NodeParagraph" class="p"><div contenteditable="false" spellcheck="false">${content}</div><div class="protyle-attr" contenteditable="false"></div></div><div class="protyle-attr" contenteditable="false"></div></div>`;
}
