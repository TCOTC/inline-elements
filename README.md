### Usage

1. Install this widget.
2. In the document editor, open the slash menu, click "Widget", and select this widget to insert a widget block.
3. In the widget block, choose the inline element types you want to aggregate, and choose whether to include elements inside embed blocks to generate the aggregated list.
4. You can also click the refresh button in the widget block to refresh the aggregated list.

### Acknowledgments

Thanks to the author of the [widget-inline-extractor](https://github.com/hqweay/widget-inline-extractor) widget, [hqweay](https://github.com/hqweay), for inspiring this project.

### Migrating from the widget-inline-extractor widget

1. Open Global Search, switch to the SQL search mode, and search for:
  
    `SELECT * FROM blocks WHERE markdown LIKE '<iframe src="/widgets/widget-inline-extractor%';`

2. The search results will list all widget-inline-extractor widget blocks in your workspace.
3. Manually insert this widget for each result, and then delete the corresponding widget-inline-extractor widget blocks.
