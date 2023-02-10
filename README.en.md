[中文](README.md) | English

# logseq-plugin-smartsearch

Triggers an input that helps you search various types of data.

## Feature Highlights

- While editing, use the default shortcut key `ctrl+space` to call it out. You can change it in settings.
- `esc` to close the input.
- Search by tag. Format `#tag`, `##tag` to also include it's descendants and `#>tag` to also include it's immediate children.
- Search for blocks not containing the specified tag, used in combinations, see below. Format `#!tag`.
- Completion of tag names is supported, just type part of the tag.
- Search by property existence. Format `@property`.
- Search by property non-existence. Format `@!property`.
- Search by property value, can also work with partial value. Format `@property: value`.
- Search blocks without a specified property-value. Format `@!property: value`.
- Search by property value of number type. Format `@property >value`, supported operators are `>` `<` `=` `<=` `>=`.
- Search by property value of date type. Format `@property~ -1w~d`, supported units are `d` `w` `m` `y`, meaning "days", "weeks", "months" and "years"; The range represented by a `~` is optional.
- Search by task status. Format `[]nltidwc`. `n`=`NOW`, `l`=`LATER`, `t`=`TODO`, `i`=`DOING`, `d`=`DONE`, `w`=`WAITING`, `c`=`CANCELED`.
- Search journal blocks. Format `%j -1w~d`, supported units are `d` `w` `m` `y`, meaning "days", "weeks", "months" and "years"; The range represented by a `~` is optional.
- Full text search. E.g, `learning note`.
- Make combinations of text, tags, properties, tasks and journal blocks, separate them with a `,`. Format `#Book, @published: 2022`.
- Put a `;` at the end to further filter the results. E.g, `#book; holmes`.
- Select using keyboard arrow keys or mouse.
- Select (Enter or click) to insert reference, hold `cmd` or `ctrl` to insert embeds, hold `opt` or `alt` to insert text content.
- Hold `shift` and select to go to the page or block，hold `shift+alt` and select to open the page or block in the right sidebar.

## Usage

https://user-images.githubusercontent.com/3410293/201344817-97631368-3ac5-408f-a196-97d71202705f.mp4

https://user-images.githubusercontent.com/3410293/203462882-05a03dae-e4d7-46b2-ae52-71f3f99fa72f.mp4

https://user-images.githubusercontent.com/3410293/201457231-4e0575e3-b145-41c7-9748-b82b1006ac51.mp4

https://user-images.githubusercontent.com/3410293/206380210-c4260579-e6c1-456f-a527-70153cf4940f.mp4

https://user-images.githubusercontent.com/3410293/218086769-081eadc2-ac02-4cf6-9be7-474b17cbc8e9.mp4
