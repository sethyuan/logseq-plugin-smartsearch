# logseq-plugin-smartsearch **スマート検索**

Logseqで、さまざまな条件を指定して、データを複合的に検索する機能を提供します。

## 使い方

- 検索ボックスを、サイドバーに設置する

    - 右サイドバーの目次ページを開きます。どこかのブロックに、Smart Searchのブロックレンダリングコード（`{{renderer :smartsearch}}`）を記入します。その際、前後に一行ずつ開けるようにしてください。つまり、先に3行つくってください。

-  ショートカットキーと操作
    - 編集中に、デフォルトのショートカットキー `ctrl+space` で呼び出せます。`esc` キーで入力ボックスを閉じます。ショートカットキーは設定から変更ができます。キーボードの上下矢印キーまたはマウスクリックで操作します。

    1. ブロックとページの移動
        - `shift` キーを押しながらブロックまたはページに移動し、`shift+alt` キーを押しながらサイドバーでブロックまたはページを開きます。

    1. タグの候補のフィルタリング
        - `>tag` 構文を使用して、タグの候補を一覧にします。さらに`,`で候補リストに追加可能です。

- 複合検索
        - テキスト、タグ、プロパティ、タスク、日記を組み合わせてコンテンツを検索できます。カンマ`,`で区切ります。
        - 書き方は `#Book, @published: 2022`

    - 検索の種類

        1. 文字列に一致する検索
            - 例: `learning note`.

        1. タグで検索
            > タグ名の一部を入力すると、タグ名の補完が表示されます。
            - 構文の種類
                1. 通常の書き方は `#tag`
                1. `##tag` それを含む子孫のブロック全体
                1. `#>tag` それを含む直下の子ブロック
                1. `#!tag` 特定のタグを含めない

        1. ブロックのプロパティ

            1. `@property` 特定のプロパティを持つ
            1. `@!property` 特定のプロパティを持たない
            1. `@property: value` その値と一致するプロパティ
            1. `@!property: value` その値と一致しないプロパティ
            1. `@property >value` 数値をもつプロパティ
                > 数値範囲の指示には `>` `<` `=` `<=` `>=` が使用できます。
            1. `@property~ -1w~d` 日付をもつプロパティ
                > プロパティに日付が指定されている場合のみ `20231001`のように。

        1. タスクの検索
            - 書き方は `[]n`
            - nはNOW、lはLATER、 tはTODO、 iはDOING(**※dはなくi**)、 dはDONE、 wはWAITING、cはCANCELEDを示します

        1. ダイアリーブロックの検索
            - 書き方は `%j -1w~d`
                - サポートされる単位は `d` `w` `m` `y` で、それぞれが日、週、月、年を表します。
                - `~` はオプションの期間を表します。
                - `yyyyMMdd` のような絶対日付も使用できます。例: 2023年10月1日は`20231001`

            1. `%j w, []nl` 今週の完了予定のタスク
                > []nlはタスクの検索 nがNOW、 l がLATER
            1. `%j -1w, []nld` 先週のタスク
                > []nldはタスクの検索 nがNOW、lがLATER、dがDONE
            1. `%j +1w, []l` 来週の予定タスク
                > []lはタスクの検索 lがLATER
            1. `%j -1y` 1年前
                > -1y: -1yが一年前の日付
            1. `%j -2y~d` 2年前から現在まで
                > -2y-d -2yが2年前の日付、dが現在の日付(0d)
            1. `%j 20230210` 特定の日
                > 2023年2月10日
            1. `%j 20221231~20230210` 特定の期間
                > 2022年12月31日から2023年2月10日まで

---

## 使用例(デモ)

https://user-images.githubusercontent.com/3410293/201344817-97631368-3ac5-408f-a196-97d71202705f.mp4

https://github.com/sethyuan/logseq-plugin-smartsearch/assets/3410293/6410c4a5-79dc-4570-a284-98dba0f40156

https://user-images.githubusercontent.com/3410293/203462882-05a03dae-e4d7-46b2-ae52-71f3f99fa72f.mp4

https://user-images.githubusercontent.com/3410293/222097302-680b4ffd-e47c-4194-a49b-4231a42d08ee.mp4

https://user-images.githubusercontent.com/3410293/201457231-4e0575e3-b145-41c7-9748-b82b1006ac51.mp4

https://user-images.githubusercontent.com/3410293/206380210-c4260579-e6c1-456f-a527-70153cf4940f.mp4

https://user-images.githubusercontent.com/3410293/218086769-081eadc2-ac02-4cf6-9be7-474b17cbc8e9.mp4

## 製作者にコーヒーをご馳走に buy me a coffee

もしこのソフトウェアがあなたに役立つと考え、肯定的なサポートを提供したい場合、以下のQRコードをスキャンしてご寄付いただければ幸いです。ご支援とご注目、ありがとうございます。

![wx](https://user-images.githubusercontent.com/3410293/236807219-cf21180a-e7f8-44a9-abde-86e1e6df999b.jpg) ![ap](https://user-images.githubusercontent.com/3410293/236807256-f79768a7-16e0-4cbf-a9f3-93f230feee30.jpg)