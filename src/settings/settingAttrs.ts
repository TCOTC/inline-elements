import type { WidgetSettings } from "../context/types";

export type SettingKey = keyof WidgetSettings;

export type SettingAttrDef<K extends SettingKey = SettingKey> = {
  /** 块属性名（不含挂件前缀） */
  attrName: string;
  /** 可选值列表：用于下拉框、load 校验与默认值（options[0]） */
  options: readonly WidgetSettings[K][];
};

export type SettingAttrDefMap = {
  [K in SettingKey]: SettingAttrDef<K>;
};

// 通过 JS 生成 option 元素；按实际使用情况排一下序；两个接口获取到的行级元素格式不同
// mark        标记　　   <span data-type="mark">text</span>
// strong      粗体　　   <span data-type="strong">text</span>
// tag         标签　　   <span data-type="tag">&ZeroWidthSpace;text</span>                                           |  [x]  <em>#text#</em>
// em	         斜体　　   <span data-type="em">text</span>
// u           下划线　   <span data-type="u">text</span>
// s           删除线　   <span data-type="s">text</span>
// inline-memo 备注　　   <span data-type="inline-memo" data-inline-memo-content="memo">text</span>                   |  [x]  导出预览接口没有行级备注元素
// a           超链接　   <span data-type="a" data-href="link">text</span>                                            |  [ ]  <a href="link" data-type="a">text</a>（块超链接跟块引用的一样）
// block-ref   块引用　   <span data-type="block-ref" data-id="20250924233731-pl5p9zc" data-subtype="s">text</span>   |  [ ]  <a href="siyuan://blocks/20250924233731-pl5p9zc">text</a> // TODO: 这里在等 https://github.com/siyuan-note/siyuan/issues/16017 修改
// code	       行级代码   <span data-type="code">&ZeroWidthSpace;text</span>                                          |  <span data-type="code">text</span>
// inline-math 行级公式   <span data-type="inline-math">
// sup         上标　　   <span data-type="sup">text</span>
// sub         下标　　   <span data-type="sub">text</span>
// kbd         键盘　　   <span data-type="kbd">&ZeroWidthSpace;text</span>                                           |  <span data-type="kbd">text</span>

export const SETTING_ATTR_DEFS = {
  // 当前选中的内联元素类型，默认为 "mark"（标记）
  filterType: {
    attrName: "filter-type",
    options: ["mark", "strong", "tag", "em", "u", "s", "inline-memo", "a", "block-ref", "code", "inline-math", "sup", "sub", "kbd"] as const,
  },
  // 控制是否包含嵌入块内容的标志位，默认为 false（不包含）
  isEmbedBlocks: {
    attrName: "embed-blocks",
    options: [false, true] as const,
  },
} satisfies SettingAttrDefMap;

export const SETTING_KEYS = Object.keys(SETTING_ATTR_DEFS) as SettingKey[];

/** 将配置项值序列化为块属性 / 控件 option 字符串 */
export function settingToAttrValue(value: WidgetSettings[SettingKey]): string {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return value;
}

/** 解析属性字符串；无效或空则回退 options[0] */
function resolveSetting<K extends SettingKey>(
  key: K,
  raw: string | null | undefined
): { value: WidgetSettings[K]; valid: boolean } {
  const { options } = SETTING_ATTR_DEFS[key];
  const defaultValue = options[0] as WidgetSettings[K];
  if (raw === null || raw === undefined || raw === "") {
    return { value: defaultValue, valid: false };
  }
  const matched = options.find((option) => settingToAttrValue(option) === raw);
  if (matched !== undefined) {
    return { value: matched as WidgetSettings[K], valid: true };
  }
  return { value: defaultValue, valid: false };
}

/** 从块属性 / 控件字符串解析配置项值 */
export function attrValueToSetting<K extends SettingKey>(key: K, raw: string): WidgetSettings[K] {
  return resolveSetting(key, raw).value;
}

/**
 * 从块属性加载配置：在 options 中则采用属性值，否则回退 options[0]
 * @returns 块属性是否存在且合法
 */
export function loadSettingAttr<K extends SettingKey>(
  key: K,
  raw: string | null,
  settings: WidgetSettings
): boolean {
  const { value, valid } = resolveSetting(key, raw);
  settings[key] = value;
  return valid;
}
