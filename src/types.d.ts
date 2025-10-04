// 导入 siyuan 类型定义
import type { ISiyuan } from 'siyuan';

// 扩展 Window 接口，添加 siyuan 属性
declare global {
  interface Window {
    parent: Window & {
      siyuan: ISiyuan;
    };
  }
}

export {};
