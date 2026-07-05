### Usage

1. Install this widget.
2. In the document editor, open the slash menu, click "Widget", and select this widget to insert a widget block.
3. In the widget block, choose the inline element type to aggregate and whether to include elements inside embed blocks to generate the aggregated list.
4. You can also click the refresh button in the widget block to refresh the aggregated list.

### Aggregating Inline Elements

The widget dropdown supports aggregating the following 14 inline element types (only one type can be selected at a time):

Mark, Bold, Tag, Italic, Underline, Strikethrough, Memo, Hyperlink, Block Ref, Inline Code, Inline Math, Superscript, Subscript, Keyboard.

### Display Behavior

This widget automatically adapts its display to the current runtime scenario. Settings such as the aggregated type and whether to include embed blocks remain consistent across scenarios:

#### WYSIWYG Editor

- The widget is embedded in the document as an iframe, with a control panel at the top (inline element type, whether to include embed blocks, refresh button)
- It automatically aggregates matching inline elements in the current document and displays them as an unordered list inside the iframe
- List items are clickable and jump to the corresponding block
- Changing dropdown options or clicking the refresh button re-parses and updates the list; options are saved to the widget block attributes and persist on export
- Syncs with the editor theme and adapts to light/dark mode
- Shows "No results found" when there are no matches; may briefly show "Parsing document, please wait..." while parsing large documents

#### Editor Export Preview

- Replaces the widget iframe block with a typography unordered list; the iframe no longer appears in the final preview page
- List items are plain text with no jump links
- Removes the widget block when there are no results

#### Export Image

- Hides the control panel and iframe border
- Replaces the widget iframe block with a protyle unordered list block; the iframe no longer appears in the final output
- List items are plain text with no jump links
- Removes the widget block when there are no results

#### Export PDF

- Same as export image: replaces the widget block with an unordered list block
- List items may show a `*` anchor link at the end to jump to the corresponding block in the document (the target block must exist on the export preview page; elements inside embed blocks cannot be linked because their block IDs are temporarily generated)
- Removes the widget block when there are no results

### Acknowledgments

Thanks to the author of the [widget-inline-extractor](https://github.com/hqweay/widget-inline-extractor) widget, [hqweay](https://github.com/hqweay), for inspiring this project.

### Migrating from the widget-inline-extractor Widget

1. Open Global Search, switch to the SQL search mode, and search for:
  `SELECT * FROM blocks WHERE markdown LIKE '<iframe src="/widgets/widget-inline-extractor%';`
2. The search results will list all widget-inline-extractor widget blocks in your workspace.
3. Manually insert this widget for each one, then delete the widget-inline-extractor widget blocks.
