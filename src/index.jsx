import "@logseq/libs"
import { setup } from "logseq-l10n"
import zhCN from "./translations/zh-CN.json"

async function main() {
  await setup({ builtinTranslations: { "zh-CN": zhCN } })

  provideStyles()

  logseq.beforeunload(() => {})

  console.log("#autocomplete loaded")
}

function provideStyles() {
  logseq.provideStyle(`
  `)
}

logseq.ready(main).catch(console.error)
