/** 运行模式：互斥，由 detect 一次判定 */
export type RuntimeMode =
  | "normal"        // 编辑区正常使用：有控件、列表可点击跳转
  | "preview"       // 导出预览：无 data-node-id，纯文本列表
  | "export-img"    // 导出图片：隐藏控件、调 iframe 高度
  | "export-pdf";   // 导出 PDF：同上，高度偏移不同

export interface WidgetSettings {
  filterType: string;
  isEmbedBlocks: boolean;
}

export interface WidgetElements {
  filterType: HTMLSelectElement;
  embedBlocks: HTMLSelectElement;
  refreshList: HTMLButtonElement;
  contentList: HTMLElement;
}

export interface WidgetContext {
  widgetBlock: HTMLElement;
  widgetBlockId: string;
  htmlElement: HTMLElement;
  elements: WidgetElements;
  mode: RuntimeMode;
  settings: WidgetSettings;
}

export interface MergedItem {
  text: string;
  blockId: string;
}

/** 是否是导出图片/PDF模式 */
export function isExportMode(mode: RuntimeMode): boolean {
  return mode === "export-img" || mode === "export-pdf";
}

/** 是否是导出预览模式 */
export function isPreviewMode(mode: RuntimeMode): boolean {
  return mode === "preview";
}

/** 是否是导出 PDF 模式 */
export function isExportPDF(mode: RuntimeMode): boolean {
  return mode === "export-pdf";
}
