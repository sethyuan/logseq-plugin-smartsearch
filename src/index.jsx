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
      top: 90%;
      left: 0;
      z-index: var(--ls-z-index-level-2);
      display: none;
    }
    .kef-ac-container {
      background: var(--ls-primary-background-color);
      box-shadow: var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000),var(--tw-shadow);
      min-width: 300px;
      max-width: 800px;
    }
    .kef-ac-input {
      width: 100%;
      line-height: 1.2rem;
      border: none;
      border-bottom: 1px solid var(--ls-block-bullet-color);
      margin-bottom: 5px;
    }
    .kef-ac-input:focus {
      box-shadow: none;
      border-color: inherit;
    }
    .kef-ac-list {
      list-style-type: none;
      margin-left: 0;
      font-size: 0.875rem;
      background: var(--ls-tertiary-background-color);
      border: 1px solid var(--ls-border-color);
      max-height: 500px;
      overflow-y: auto;
    }
    .kef-ac-list:empty {
      display: none;
    }
    .kef-ac-listitem {
      padding: 8px 16px;
      margin: 0;
      cursor: pointer;
    }
    .kef-ac-listitem:hover {
      background: var(--ls-menu-hover-color);
    }
    .kef-ac-chosen {
      background: var(--ls-selection-background-color);
    }
  `)
}

async function triggerInput() {
  const editor = parent.document.activeElement.closest(".block-editor")
  if (editor) {
    editor.appendChild(inputContainer)
    inputContainer.style.display = "block"
    inputContainer.querySelector("input").focus()
  }
}

async function closeInput(text = "") {
  inputContainer.style.display = "none"
  parent.document.getElementById("app-container").appendChild(inputContainer)
  if (lastBlock == null) return
  if (text) {
    const content = lastBlock.content
    await logseq.Editor.updateBlock(
      lastBlock.uuid,
      lastPos < content.length
        ? `${content.substring(0, lastPos)}${text}${content.substring(lastPos)}`
        : lastPos === content.length
        ? `${content}${text}`
        : `${content} ${text}`,
    )
  }
  await logseq.Editor.editBlock(lastBlock.uuid, { pos: lastPos + text.length })
}

logseq.ready(main).catch(console.error)
