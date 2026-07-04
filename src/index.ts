/**
To-dos:
- [x] 确认能解决 https://github.com/hqweay/widget-inline-extractor/issues 里的问题
- [x] 支持在导出预览模式使用
- [x] 支持在导出图片/PDF时使用：隐藏 iframe 边框、隐藏控制面板
- [x] 测试在发布服务是否正常工作、不报错
- [x] 暗黑模式的样式，需要从 iframe 外获取颜色变量实际值，genList 的时候也要刷新一次
- [ ] 支持所有行级元素：两个接口获取到的行级元素格式不同，需要单独适配
- [ ] 移除所有 console.log
- [ ] 测试在移动端能否正常使用
- [ ] 把主空间里使用到 widget-inline-extractor 挂件的地方，改为使用本挂件
- [ ] 支持汇总带 颜色/背景色 的元素：需要多加一个下拉框，很多颜色 https://github.com/TCOTC/inline-elements/issues/1
- [ ] 在其他浏览器测试以上功能是否正常工作
*/

import "./index.scss";
import { initI18n } from "./i18n";
import { createContext } from "./context/createContext";
import { loadSettings } from "./settings/load";
import { genList } from "./list/genList";
import { initControls } from "./ui/initControls";
import { bindEvents } from "./ui/bindEvents";
import { formatError, showError } from "./ui/message";
import { layoutExportIframe } from "./modes/layout/exportIframe";
import { isExportMode } from "./context/types";

// 用函数包裹，方便直接 return
async function main(): Promise<void> {
  initI18n();

  const ctx = await createContext();
  if (!ctx) {
    return;
  }

  loadSettings(ctx);

  const handleError = (error: unknown): void => {
    console.error("inline-elements widget:", error);
    showError(ctx.elements.contentList, formatError(error));
  };

  try {
    if (isExportMode(ctx.mode)) {
      // TODO: 改成直接操作 DOM，把 IFrame 块替换成无序列表块，否则导出效果会比较差
      // 先初始化才能获取到正确的元素高度
      await genList(ctx);
      layoutExportIframe(ctx);
    } else {
      initControls(ctx);
      bindEvents(ctx, () => {
        void genList(ctx).catch(handleError);
      });

      await genList(ctx);
    }
  } catch (error) {
    handleError(error);
  }
}

main();
