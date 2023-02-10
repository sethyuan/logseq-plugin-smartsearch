中文 | [English](README.en.md)

# logseq-plugin-smartsearch

弹出一个可以帮你查找各类数据的输入框。

## 功能展示

- 编辑时，用默认快捷键 `ctrl+space` 呼出，可在设置中更改。
- `esc` 退出输入框。
- 可按照标签搜索内容。格式为 `#tag`，`##tag` 如要包含它的子孙块以及 `#>tag` 如要包含它的子块。
- 可搜索不包含指定标签的内容，用于组合搜索，见下方。格式为 `#!tag`。
- 键入部分 tag 名称可弹出对 tag 名的补完。
- 可搜索拥有某属性的内容。格式为 `@property`。
- 可搜索不拥有某属性的内容。格式为 `@!property`。
- 可按照属性值搜索内容，也可按部分内容搜索。格式为 `@property: value`。
- 可搜索不包含指定值的属性。格式为 `@!property: value`。
- 可按照数字属性值搜索内容。格式为 `@property >value`，操作符有 `>` `<` `=` `<=` `>=`。
- 可按照日期属性值搜索内容。格式为 `@property~ -1w~d`，支持的单位有 `d` `w` `m` `y`，分别是天、周、月和年；`~` 所代表的时间段为可选。
- 可搜索各种状态的任务。格式为 `[]nltidwc`。`n`=`NOW`, `l`=`LATER`, `t`=`TODO`, `i`=`DOING`, `d`=`DONE`, `w`=`WAITING`, `c`=`CANCELED`.
- 可搜索日记块。格式为 `%j -1w~d`，支持的单位有 `d` `w` `m` `y`，分别是天、周、月和年；`~` 所代表的时间段为可选。
- 可全文检索。例如：`learning note`。
- 可任意组合文字、标签、属性、任务以及日记搜索内容，以 `,` 分割。格式为 `#Book, @published: 2022`。
- 可在最后加 `;` 进一步过滤查询结果。例如：`#book; holmes`。
- 能识别中文标点，不用刻意切换到英文。
- 支持键盘上下键选择或鼠标点击。
- 正常选择（回车或鼠标点击）插入引用，按住 `cmd` 或 `ctrl` 插入嵌入，按住 `opt` 或 `alt` 插入文字内容。
- 按住 `shift` 选择跳转到块或页面，按住 `shift+alt` 选择在右侧边栏打开块或页面。

## 使用展示

https://user-images.githubusercontent.com/3410293/201344817-97631368-3ac5-408f-a196-97d71202705f.mp4

https://user-images.githubusercontent.com/3410293/203462882-05a03dae-e4d7-46b2-ae52-71f3f99fa72f.mp4

https://user-images.githubusercontent.com/3410293/201457231-4e0575e3-b145-41c7-9748-b82b1006ac51.mp4

https://user-images.githubusercontent.com/3410293/206380210-c4260579-e6c1-456f-a527-70153cf4940f.mp4

https://user-images.githubusercontent.com/3410293/218086769-081eadc2-ac02-4cf6-9be7-474b17cbc8e9.mp4
