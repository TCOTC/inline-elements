### 使用方法

1. 安装本挂件
2. 在文档编辑器中呼出斜杠菜单，点击“挂件”选项，选择本挂件插入挂件块
3. 在挂件块中选择需要汇总的行级元素类型，并选择是否包含嵌入块中的元素，即可生成汇总列表
4. 还可以点击挂件块中的刷新按钮，刷新汇总列表

### 致谢

感谢 [行内元素抓取](https://github.com/hqweay/widget-inline-extractor) 挂件的作者 [hqweay](https://github.com/hqweay) 为本项目提供了灵感。

### 从 行内元素抓取 挂件迁移

1. 打开全局搜索，切换到 SQL 搜索方式，搜索：
  
    `SELECT * FROM blocks WHERE markdown LIKE '<iframe src="/widgets/widget-inline-extractor%';`

2. 搜索结果会显示工作空间中的所有 行内元素抓取 挂件块
3. 手动一个个插入本挂件，然后删除 行内元素抓取 挂件块