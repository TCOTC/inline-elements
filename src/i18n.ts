
// mark        标记
// strong      粗体
// tag         标签
// em          斜体
// u           下划线
// s           删除线
// inline-memo 备注
// a           超链接
// block-ref   块引用
// code        行级代码
// inline-math 行级公式
// sup         上标
// sub         下标
// kbd         键盘

/** 简体中文文案 */
export const zhCN = {
  "text-mark": "标记",
  "text-strong": "粗体",
  "text-tag": "标签",
  "text-em": "斜体",
  "text-u": "下划线",
  "text-s": "删除线",
  "text-inline-memo": "备注",
  "text-a": "超链接",
  "text-block-ref": "块引用",
  "text-code": "行级代码",
  "text-inline-math": "行级公式",
  "text-sup": "上标",
  "text-sub": "下标",
  "text-kbd": "键盘",
  "embedBlocks-true": "包含嵌入块中的元素",
  "embedBlocks-false": "排除嵌入块中的元素",
  "refreshList": "刷新列表",
  "loadingMessage": "正在解析文档，请稍候...",
  "noResultsMessage": "无查询结果",
  "errorMessage": "异常：无法获取到必要的挂件元素，挂件加载失败",
  "docIdNotFoundMessage": "异常：无法获取文档 ID"
} as const;

export type I18nKey = keyof typeof zhCN;

const messages: Record<"zh-CN" | "zh-TW" | "en", Record<I18nKey, string>> = {
  "zh-CN": zhCN,
  "zh-TW": {
    "text-mark": "標記",
    "text-strong": "粗體",
    "text-tag": "標籤",
    "text-em": "斜體",
    "text-u": "下劃線",
    "text-s": "刪除線",
    "text-inline-memo": "備註",
    "text-a": "超連結",
    "text-block-ref": "塊引用",
    "text-code": "行級代碼",
    "text-inline-math": "行級公式",
    "text-sup": "上標",
    "text-sub": "下標",
    "text-kbd": "鍵盤",
    "embedBlocks-true": "包含嵌入塊中的元素",
    "embedBlocks-false": "排除嵌入塊中的元素",
    "refreshList": "刷新列表",
    "loadingMessage": "正在解析文檔，請稍候...",
    "noResultsMessage": "無查詢結果",
    "errorMessage": "異常：無法獲取到必要的掛件元素，掛件加載失敗",
    "docIdNotFoundMessage": "異常：無法獲取文檔 ID"
  },
  en: {
    "text-mark": "Mark",
    "text-strong": "Bold",
    "text-tag": "Tag",
    "text-em": "Italic",
    "text-u": "Underline",
    "text-s": "Strikethrough",
    "text-inline-memo": "Memo",
    "text-a": "Hyperlink",
    "text-block-ref": "Block Ref",
    "text-code": "Inline Code",
    "text-inline-math": "Inline Math",
    "text-sup": "Superscript",
    "text-sub": "Subscript",
    "text-kbd": "Keyboard",
    "embedBlocks-true": "Include Embed Blocks Elements",
    "embedBlocks-false": "Exclude Embed Blocks Elements",
    "refreshList": "Refresh List",
    "loadingMessage": "Parsing document, please wait...",
    "noResultsMessage": "No results found",
    "errorMessage": "Error: Failed to get necessary widget elements, widget loading failed",
    "docIdNotFoundMessage": "Error: Failed to get document ID"
  }
};

/** 当前语言的文案（类型以 zhCN 为参照，便于 IDE 悬浮与跳转） */
export const i18n: typeof zhCN = {} as typeof zhCN;

/** 从宿主页面读取语言并初始化 */
export function initI18n(): void {
  let locale = window.frameElement?.closest("html")?.getAttribute("lang");
  if (!locale || !(locale in messages)) {
    locale = "en";
  }
  const source = messages[locale as keyof typeof messages];
  for (const key of Object.keys(source) as I18nKey[]) {
    (i18n as Record<I18nKey, string>)[key] = source[key];
  }
  document.documentElement.lang = locale;
}
