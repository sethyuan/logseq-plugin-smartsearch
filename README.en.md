README: [中文](https://github.com/sethyuan/logseq-plugin-smartsearch) | [English](https://github.com/sethyuan/logseq-plugin-smartsearch/blob/master/README.en.md) | [日本語](https://github.com/sethyuan/logseq-plugin-smartsearch/blob/master/README.ja.md)

# logseq-plugin-smartsearch

In Logseq, it provides the ability to search data based on various criteria. It is more advanced than regular searches or search suggestions.

1. Input Assistance for Links and References:
   > As an alternative to the input suggestions displayed with `#` and `[[]]` in Logseq's standard features.

2. Conditional Search (AND Search):
   > If the blocks are written in the journal, they will be sorted by date.

## Usage (Optional)

### Placing the Search Box in the Sidebar

- Open the table of contents page on the right sidebar. Paste the Smart Search block rendering code (`{{renderer :smartsearch}}`) into any block. Make sure to leave a line before and after it. In other words, create three lines first.

### Calling the Input Box from a Block

- Shortcut keys and operations
  - First, place the cursor in a block and enter the editing mode. Press the default shortcut key `Ctrl+Space` to open the input/search box, and press `Esc` to close the input box. You can change the shortcut keys in the settings. Navigate using the keyboard's up and down arrow keys or by mouse clicks.

  1. Block and Page Navigation
     - Press the `Shift` key to navigate to a block or page, and press `Shift+Alt` to open blocks or pages in the sidebar.

### Searching for Related Pages

   - You can search for pages with keywords and relevance, including page tags. Blocks (references) are not included in the search results. Also add further filtering by adding `;`.
   - The format is `>Tag Name`.

### Searching for Related Blocks

#### Combination of Searches

- Separate conditions with commas. You can search for content by combining text, tags (page names), properties, tasks, and diary entries.
   > In Logseq, page names and tags are treated at the same level.
- The formats are `#Tag Name, @Property: Value`.

#### Types of Searches

1. Search matching string keywords
   - Example: `Logseq`

1. Search by Tags
   > Enter the `#` symbol followed by the tag name. This will trigger tag name suggestions. Select one to see a list of candidates.
   - Types of formats:
      1. Normal format: `#Tag Name`
      1. `#>Tag Name` - Only references to direct child blocks
      1. `##Tag Name` - References including descendant blocks
      1. `#!Tag Name` - Excluding specific tags

1. Block Properties
   > Enter the `@` symbol followed by the property name.
   - Types of formats:
      1. `@Property` - With a specific property
      1. `@!Property` - Without a specific property
      1. `@Property: Value` - With a specific property value
      1. `@!Property: Value` - Without a specific property value
      1. `@Property > Value` - With numeric properties
      > You can use `>`, `<`, `=`, `<=`, and `>=` for numeric range indications.

   1. `@Property~ -1w~d` - With properties that have dates
      > This is only when a diary link is placed in the property.

1. Task Search
   - Format: `[]n`
   - n represents NOW, l represents LATER, t represents TODO, i represents DOING, d represents DONE, w represents WAITING, and c represents CANCELED.
      > DOING is represented by i, not d.

1. Diary Block Search
   - Format: `%j -1w~d`
      - Supported units are `d`, `w`, `m`, and `y`, representing days, weeks, months, and years, respectively.
      - `~` represents an optional period.
      - You can also use absolute dates like `yyyyMMdd`. For example, October 1, 2023, is `20231001`.
   1. `%j w, []nl` - Tasks scheduled for this week
      > []nl represents task searches with n for NOW and l for LATER.
   1. `%j -1w, []nld` - Tasks from last week
      > []nld represents task searches with n for NOW, l for LATER, and d for DONE.
   1. `%j +1w, []l` - Upcoming tasks next week
      > []l represents task searches with l for LATER.
   1. `%j -1y` - A year ago
      > -1y represents a date one year ago.
   1. `%j -2y~d` - From 2 years ago to the present
      > -2y represents a date two years ago, and d represents the current date (0d).
   1. `%j 20230210` - A specific date
      > February 10, 2023
   1. `%j 20221231~20230210` - A specific time range
      > From December 31, 2022, to February 10, 2023.

## Showcase (Demo)

1. Operations in a Block

   - Press shortcut keys to bring up search suggestions. Find links, tags, and blocks.

https://user-images.githubusercontent.com/3410293/201344817-97631368-3ac5-408f-a196-97d71202705f.mp4

1. Operations in the Sidebar

   - Search by keywords, find the suggestions, and quickly open pages.

   https://github.com/sethyuan/logseq-plugin-smartsearch/assets/3410293/6410c4a5-79dc-4570-a284-98dba0f40156

1. Auto-completion of tag names and display of filtered suggestions based on the selection.

   https://user-images.githubusercontent.com/3410293/203462882-05a03dae-e4d7-46b2-ae52-71f3f99fa72f.mp4

1. Finding pages from tags

   https://user-images.githubusercontent.com/3410293/222097302-680b4ffd-e47c-4194-a49b-4231a42d08ee.mp4

1. Extracting blocks containing tags and inserting their content.

   https://user-images.githubusercontent.com/3410293/201457231-4e0575e3-b145-41c7-9748-b82b1006ac51.mp4

1. Finding pages matching properties and linking to them.

   https://user-images.githubusercontent.com/3410293/206380210-c4260579-e6c1-456f-a527-70153cf4940f.mp4

1. Only when links to diary entries are present in properties. Search for dates like a query.

   https://user-images.githubusercontent.com/3410293/218086769-081eadc2-ac02-4cf6-9be7-474b17cbc8e9.mp4

## Buy me a coffee

If you think the software I have developed is helpful to you and would like to give recognition and support, you may buy me a coffee using following link. Thank you for your support and attention.

Author: [Seth YUan](https://github.com/sethyuan)

<a href="https://www.buymeacoffee.com/sethyuan" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-blue.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

Translator: [YU000jp](https://github.com/YU000jp)
