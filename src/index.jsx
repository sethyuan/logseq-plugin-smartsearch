import "@logseq/libs"
import { setup, t } from "logseq-l10n"
import { render } from "preact"
import AutoCompleteInput from "./comps/AutoCompleteInput"
import zhCN from "./translations/zh-CN.json"

const INPUT_ID = "kef-ac-input"

let inputContainer
let lastBlock
let lastPos

async function main() {
  await setup({ builtinTranslations: { "zh-CN": zhCN } })

  provideStyles()

  logseq.useSettingsSchema([
    {
      key: "shortcut",
      type: "string",
      default: "ctrl+space",
      description: t("Shortcut key to trigger the autocomplete input."),
    },
  ])

  logseq.provideUI({
    key: INPUT_ID,
    path: "#app-container",
    template: `<div id="${INPUT_ID}"></div>`,
  })

  if (logseq.settings?.shortcut) {
    logseq.App.registerCommandPalette(
      {
        key: "trigger-input",
        label: t("Trigger autocomplete input"),
        keybinding: { binding: logseq.settings?.shortcut },
      },
      triggerInput,
    )
  } else {
    logseq.App.registerCommandPalette(
      { key: "trigger-input", label: t("Trigger autocomplete input") },
      triggerInput,
    )
  }

  // Let div root element get generated first.
  setTimeout(async () => {
    inputContainer = parent.document.getElementById(INPUT_ID)
    render(<AutoCompleteInput onClose={closeInput} />, inputContainer)
  }, 0)

  // logseq.beforeunload(() => {})

  console.log("#autocomplete loaded")
}

function provideStyles() {
  logseq.provideStyle(`
    #${INPUT_ID} {
      position: absolute;
      top: 0;
      left: 0;
      z-index: var(--ls-z-index-level-2);
      border-radius: 2px;
      display: none;
    }
    .kef-ac-container {
      background: #ddd;
      width: 300px;
      height: 30px;
      padding: 0 14px;
    }
  `)
}

async function triggerInput() {
  const curPos = await logseq.Editor.getEditingCursorPosition()
  if (curPos != null) {
    inputContainer.style.top = `${curPos.top + curPos.rect.y + 30}px`
    if (
      curPos.left + curPos.rect.x + inputContainer.clientWidth <=
      parent.window.innerWidth
    ) {
      inputContainer.style.left = `${curPos.left + curPos.rect.x}px`
    } else {
      inputContainer.style.left = `${
        -inputContainer.clientWidth + parent.window.innerWidth
      }px`
    }
    lastBlock = await logseq.Editor.getCurrentBlock()
    lastPos = curPos.pos
    inputContainer.style.display = "block"
    inputContainer.querySelector("input").focus()
  }
}

async function closeInput(text = "") {
  inputContainer.style.display = "none"
  if (lastBlock == null) return
  if (text) {
    await logseq.Editor.updateBlock(
      lastBlock.uuid,
      `${lastBlock.content}${
        lastPos > lastBlock.content.length ? " " : ""
      }${text}`,
    )
  }
  await logseq.Editor.editBlock(lastBlock.uuid, { pos: lastPos + text.length })
}

logseq.ready(main).catch(console.error)
