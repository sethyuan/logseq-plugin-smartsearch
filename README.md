中文 | [English](README.en.md)

# logseq-plugin-smartsearch

弹出一个可以帮你查找各类数据的输入框。

## 功能展示

- 编辑时，用默认快捷键 `ctrl+space` 呼出，可在设置中更改。
- `esc` 退出输入框。
- 可按照标签搜索内容。格式为 `#tag`，`##tag` 如要包含它的子孙块以及 `#>tag` 如要包含它的子块。
- 键入部分 tag 名称可弹出对 tag 名的补完。
- 可搜索拥有某属性的内容。格式为 `@property`。
- 可按照属性值搜索内容，也可按部分内容搜索。格式为 `@property: value`。
- 可按照数字属性值搜索内容。格式为 `@property >value`，操作符有 `>` `<` `=` `<=` `>=`。
- 可按照日期属性值搜索内容。格式为 `@property ~1y`，支持的单位有 `d` `w` `m` `y`，分别是天、周、月和年；操作符有 `~` `-` `+`，分别是“最近”，“以前”，”以后“。
- 可搜索各种状态的任务。格式为 `[]nltidwc`。`n`=`NOW`, `l`=`LATER`, `t`=`TODO`, `i`=`DOING`, `d`=`DONE`, `w`=`WAITING`, `c`=`CANCELED`.
- 可任意组合标签、属性、任务搜索内容，以 `,` 分割。格式为 `#Book, @published: 2022`。
- 可在最后加 `;` 进一步过滤查询结果。例如：`#book; holmes`。
- 可全文检索。格式为以 `;` 开头，例如：`;holmes`。
- 能识别中文标点，不用刻意切换到英文。
- 支持键盘上下键选择或鼠标点击。
- 正常选择（回车或鼠标点击）插入引用，按住 `opt` 或 `alt` 选择插入文字内容。
- 按住 `shift` 选择跳转到块或页面，按住 `shift+alt` 选择在右侧边栏打开块或页面。

## 使用展示

https://user-images.githubusercontent.com/3410293/201344817-97631368-3ac5-408f-a196-97d71202705f.mp4

https://user-images.githubusercontent.com/3410293/203462882-05a03dae-e4d7-46b2-ae52-71f3f99fa72f.mp4

https://user-images.githubusercontent.com/3410293/201457231-4e0575e3-b145-41c7-9748-b82b1006ac51.mp4

https://user-images.githubusercontent.com/3410293/206380210-c4260579-e6c1-456f-a527-70153cf4940f.mp4

https://user-images.githubusercontent.com/3410293/206380230-4df74c9c-ee54-4e9f-9f7d-af34cc499226.mp4
