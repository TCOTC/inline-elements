import { isExportMode, isExportPDF, type RuntimeMode } from "../context/types";

/**
 * 复制外部的主题样式到挂件块内部
 */
export async function copyThemeStyle(htmlElement: HTMLElement, mode: RuntimeMode): Promise<void> {
  // 复制属性，因为主题的样式选择器依赖这些属性
  syncElementAttributes(htmlElement, document.documentElement);
  syncElementAttributes(htmlElement.ownerDocument.body, document.body);
  // 同步 body.class 会覆盖挂件自身的 class，在此恢复
  if (isExportMode(mode)) {
    document.body.classList.add("exportMode");
  }

  const externalDefaultStyle = htmlElement.querySelector("#themeDefaultStyle") as HTMLLinkElement | null;
  const internalDefaultStyle = document.head.querySelector("#themeDefaultStyle") as HTMLLinkElement | null;
  const externalStyle = htmlElement.querySelector("#themeStyle") as HTMLLinkElement | null;
  const internalStyle = document.head.querySelector("#themeStyle") as HTMLLinkElement | null;

  await Promise.all([
    // <link id="themeDefaultStyle" rel="stylesheet" type="text/css" href="/appearance/themes/daylight/theme.css?v=3.3.4">
    replaceStylesheetLink("themeDefaultStyle", externalDefaultStyle, internalDefaultStyle, mode),
    // <link id="themeStyle" rel="stylesheet" type="text/css" href="/appearance/themes/Whisper/theme.css?v=1.6.0">
    replaceStylesheetLink("themeStyle", externalStyle, internalStyle, mode),
  ]);

  // siyuanStyle 中包含了 --b3-font-size-editor 变量，需要复制到挂件块内
  const internalSiyuanStyle = document.head.querySelector("#siyuanStyle") as HTMLLinkElement | null;
  const externalSiyuanStyle = htmlElement.querySelector("#siyuanStyle") as HTMLLinkElement | null;
  if (internalSiyuanStyle) {
    internalSiyuanStyle.textContent = externalSiyuanStyle?.textContent ?? "";
  }
}

/** 将 source 上的属性同步到 target，并移除 target 上多余的属性 */
function syncElementAttributes(source: Element, target: Element): void {
  // 获取所有属性
  const staleNames = new Set(target.getAttributeNames());

  for (const attr of source.attributes) {
    if (target.getAttribute(attr.name) !== attr.value) {
      target.setAttribute(attr.name, attr.value);
    }
    staleNames.delete(attr.name);
  }

  // 移除多余属性
  for (const name of staleNames) {
    target.removeAttribute(name);
  }
}

/** 用外部样式表替换挂件内同 id 的 link 元素 */
async function replaceStylesheetLink(
  id: string,
  externalElement: HTMLLinkElement | null,
  internalElement: HTMLLinkElement | null,
  mode: RuntimeMode,
): Promise<void> {
  const href = externalElement?.getAttribute("href");
  if (href) {
    // 创建新的样式元素
    const newElement = document.createElement("link");
    newElement.rel = "stylesheet";
    newElement.type = "text/css";

    // 插入新样式元素
    if (internalElement) {
      internalElement.parentNode?.insertBefore(newElement, internalElement);
    } else {
      document.head.appendChild(newElement);
    }

    await loadStylesheet(newElement, resolveStylesheetHref(href, mode));

    // 移除旧样式元素
    internalElement?.remove();
    // 设置新样式元素的 ID
    newElement.id = id;
    return;
  }

  if (internalElement) {
    // 如果没有对应的主题样式，挂件块内保持一致
    internalElement.href = "";
  }
}

/** 根据运行模式解析挂件内可访问的样式表路径 */
function resolveStylesheetHref(href: string, mode: RuntimeMode): string {
  if (!href.startsWith("/")) {
    href = "/" + href;
  }
  return isExportPDF(mode) ? href : "../.." + href; // 导出 PDF 时，获取到的 href 有完整路径
}

/** 等待 link 样式表加载（失败也不阻塞后续流程） */
function loadStylesheet(link: HTMLLinkElement, href: string): Promise<void> {
  // 等待新样式表加载完成再移除旧样式表
  return new Promise<void>((resolve) => {
    link.onload = () => resolve();
    link.onerror = () => resolve(); // 即使加载失败也要继续，避免阻塞
    link.href = href;
  });
}
