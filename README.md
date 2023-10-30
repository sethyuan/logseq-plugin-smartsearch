README: [中文](https://github.com/sethyuan/logseq-plugin-smartsearch) | [English](https://github.com/sethyuan/logseq-plugin-smartsearch/blob/master/README.en.md) | [日本語](https://github.com/sethyuan/logseq-plugin-smartsearch/blob/master/README.ja.md)

# logseq-plugin-smartsearch

弹出一个可以帮你查找各类数据的输入框。也可以在侧边栏使用。

## 功能展示

- 编辑时，用默认快捷键 `ctrl+space` 呼出，可在设置中更改。
- `esc` 退出输入框。
- 可按照标签搜索内容。格式为 `#tag`，`##tag` 如要包含它的子孙块以及 `#>tag` 如要包含它的子块。
- 可搜索不包含指定标签的内容，用于组合搜索，见下方。格式为 `#!tag`。
- 键入部分 tag 名称可弹出对 tag 名的补完。
- 可通过 `>tag` 语法筛选出标签候选，以便在后续查询中使用。
- 可搜索拥有某属性的内容。格式为 `@property`。
- 可搜索不拥有某属性的内容。格式为 `@!property`。
- 可按照属性值搜索内容，也可按部分内容搜索。格式为 `@property: value`。
- 可搜索不包含指定值的属性。格式为 `@!property: value`。
- 可按照数字属性值搜索内容。格式为 `@property >value`，操作符有 `>` `<` `=` `<=` `>=`。
- 可按照日期属性值搜索内容。格式为 `@property~ -1w~d`，支持的单位有 `d` `w` `m` `y`，分别是天、周、月和年；`~` 所代表的时间段为可选。也可使用 `yyyyMMdd` 这样的绝对日期，例如 `20230131~d`。
- 可搜索各种状态的任务。格式为 `[]nltidwc`。`n`=`NOW`, `l`=`LATER`, `t`=`TODO`, `i`=`DOING`, `d`=`DONE`, `w`=`WAITING`, `c`=`CANCELED`.
- 可搜索日记块。格式为 `%j -1w~d`，支持的单位有 `d` `w` `m` `y`，分别是天、周、月和年；`~` 所代表的时间段为可选。也可使用 `yyyyMMdd` 这样的绝对日期，例如 `20230131~d`。
- 可全文检索。例如：`learning note`。
- 可任意组合文字、标签、属性、任务以及日记搜索内容，以 `,` 分割。格式为 `#Book, @published: 2022`。
- 可在最后加 `;` 进一步过滤查询结果。例如：`#book; holmes`。
- 能识别中文标点，不用刻意切换到英文。
- 支持键盘上下键选择或鼠标点击。
- 正常选择（回车或鼠标点击）插入引用，按住 `cmd` 或 `ctrl` 插入嵌入，按住 `cmd+shift` 或 `ctrl+shift` 插入子级嵌入（需要 Another Embed 插件提供嵌入子级的支持），按住 `opt` 或 `alt` 插入文字内容。
- 按住 `shift` 选择跳转到块或页面，按住 `shift+alt` 选择在右侧边栏打开块或页面。
- 支持拼音搜索。

## 使用展示

https://user-images.githubusercontent.com/3410293/201344817-97631368-3ac5-408f-a196-97d71202705f.mp4

https://github.com/sethyuan/logseq-plugin-smartsearch/assets/3410293/6410c4a5-79dc-4570-a284-98dba0f40156

https://user-images.githubusercontent.com/3410293/203462882-05a03dae-e4d7-46b2-ae52-71f3f99fa72f.mp4

https://user-images.githubusercontent.com/3410293/222097302-680b4ffd-e47c-4194-a49b-4231a42d08ee.mp4

https://user-images.githubusercontent.com/3410293/201457231-4e0575e3-b145-41c7-9748-b82b1006ac51.mp4

https://user-images.githubusercontent.com/3410293/206380210-c4260579-e6c1-456f-a527-70153cf4940f.mp4

https://user-images.githubusercontent.com/3410293/218086769-081eadc2-ac02-4cf6-9be7-474b17cbc8e9.mp4

## 时间段示例

```
# 本周需完成的任务
%j w, []nl

# 上周的任务
%j -1w, []nld

# 下周的待办任务
%j +1w, []l

# 一年前的Logseq日记
%j -1y, logseq

# 两年前至今的Logseq日记
%j -2y~d, logseq

# 某一天的Logseq日记
%j 20230210, logseq

# 某一段时间内的Logseq日记
%j 20221231~20230210, logseq
```

## 如何在侧边栏使用

首先为 Smart Search 建立一个特有的页面，然后在里面写入 Smart Search 的块渲染代码（`{{renderer :smartsearch}}`），可参考以下提供的示例。有了这个页面后只要将此页面在侧边栏打开就可以了。

假设你创建了一个名为“Smart Search”的页面：

```
icon:: 🔍

- {{renderer :smartsearch}}
```

## Buy me a coffee

如果您认为我所开发的软件对您有所帮助，并且愿意给予肯定和支持，不妨扫描下方的二维码进行打赏。感谢您的支持与关注。

![wx](https://user-images.githubusercontent.com/3410293/236807219-cf21180a-e7f8-44a9-abde-86e1e6df999b.jpg) ![ap](https://user-images.githubusercontent.com/3410293/236807256-f79768a7-16e0-4cbf-a9f3-93f230feee30.jpg)
