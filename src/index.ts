/**
To-dos:
- [x] 确认能解决 https://github.com/hqweay/widget-inline-extractor/issues 里的问题
- [x] 支持在导出预览模式使用
- [x] 支持在导出图片/PDF时使用：隐藏 iframe 边框、隐藏控制面板
- [x] 测试在发布服务是否正常工作、不报错
- [x] 暗黑模式的样式，需要从 iframe 外获取颜色变量实际值，genList 的时候也要刷新一次
- [x] 导出图片/PDF 时将 iframe 块替换为无序列表块
- [x] 移除所有 console.log → 生产环境打包没有 console
- [x] 支持所有行级元素
- [x] 把主空间里使用到 widget-inline-extractor 挂件的地方，改为使用本挂件
- [ ] 支持汇总带 颜色/背景色 的元素：需要多加一个下拉框，很多颜色 https://github.com/TCOTC/inline-elements/issues/1
- [ ] 测试在移动端能否正常使用
- [ ] 在其他浏览器测试以上功能是否正常工作
*/

import "./index.scss";
import { initI18n } from "./i18n";
import { createContext } from "./context/createContext";
import { loadSettings } from "./settings/load";
import { formatError, showError } from "./ui/message";
import { runNormalMode } from "./genList/normal";
import { genListPreview } from "./genList/preview";
import { genListExportImg } from "./genList/export-img";
import { genListExportPdf } from "./genList/export-pdf";

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
    switch (ctx.mode) {
      case "normal":
        await runNormalMode(ctx, handleError);
        break;
      case "preview":
        await genListPreview(ctx);
        break;
      case "export-img":
        await genListExportImg(ctx);
        break;
      case "export-pdf":
        await genListExportPdf(ctx);
        break;
    }
  } catch (error) {
    handleError(error);
  }
}

main();
