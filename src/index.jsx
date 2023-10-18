import "@logseq/libs"
import { setup, t } from "logseq-l10n"
import { createRef, render } from "preact"
import SmartSearchInput from "./comps/SmartSearchInput"
import { INPUT_ID } from "./libs/cons"
import { setDateOptions } from "./libs/query"
import zhCN from "./translations/zh-CN.json"
import ja from "./translations/ja.json"

let inputContainer
let inputContainerParent
let textarea
let lastBlock

const inputRef = createRef()

async function main() {
  await setup({ builtinTranslations: { "zh-CN": zhCN,ja } })

  const { preferredDateFormat, preferredStartOfWeek } =
    await logseq.App.getUserConfigs()
  const weekStart = (+(preferredStartOfWeek ?? 6) + 1) % 7
  setDateOptions(preferredDateFormat, weekStart)

  provideStyles()

  logseq.useSettingsSchema([
    {
      key: "shortcut",
      type: "string",
      default: "ctrl+space",
      description: t("Shortcut key to trigger the smartsearch input."),
    },
    {
      key: "enablePinyin",
      type: "boolean",
      default: false,
      description: t("Whether to enable matching with pinyin."),
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
        label: t("Trigger smartsearch input"),
        keybinding: { binding: logseq.settings.shortcut },
      },
      triggerInput,
    )
  } else {
    logseq.App.registerCommandPalette(
      { key: "trigger-input", label: t("Trigger smartsearch input") },
      triggerInput,
    )
  }

  // Let div root element get generated first.
  setTimeout(async () => {
    inputContainer = parent.document.getElementById(INPUT_ID)
    inputContainerParent = inputContainer.parentNode
    render(
      <SmartSearchInput
        ref={inputRef}
        onClose={closeInput}
        root={inputContainer}
      />,
      inputContainer,
    )
  }, 0)

  logseq.App.onMacroRendererSlotted(macroRenderer)

  // logseq.beforeunload(() => {})

  console.log("#smartsearch loaded")
}

function provideStyles() {
  logseq.provideStyle(`
    #${INPUT_ID} {
      position: absolute;
      top: 195%;
      left: 0;
      z-index: var(--ls-z-index-level-2);
      display: none;
    }
    #${INPUT_ID}.kef-ss-global {
      top: 150px;
      left: 50%;
      transform: translateX(-50%);
    }
    .kef-ss-container {
      background: var(--ls-primary-background-color);
      min-width: 370px;
      max-width: 800px;
      position: relative;
    }
    .kef-ss-input {
      position: relative;
      width: 100%;
      line-height: 1.2rem;
      border: none;
      border-bottom: 1px solid var(--ls-block-bullet-color);
      margin-bottom: 5px;
      background: var(--ls-tertiary-background-color) !important;
    }
    @keyframes spin {
      0% {
        transform: rotate(0);
      }
      100% {
        transform: rotate(360deg);
      }
    }
    .kef-ss-progress {
      display: none;
      position: absolute;
      top: 8px;
      right: 8px;
      font-family: 'tabler-icons';
      font-size: 0.9em;
      margin-left: 6px;
      color: var(--ls-icon-color);
      will-change: transform;
      animation: 1s linear infinite spin;
    }
    .kef-ss-show {
      display: block;
    }
    .kef-ss-input:focus {
      box-shadow: none;
      border-color: inherit;
      border-bottom: 1px solid var(--ls-block-bullet-color);
    }
    .kef-ss-input::placeholder {
      font-size: 0.8em;
      color: var(--ls-secondary-text-color);
    }
    .kef-ss-inputhint {
      position: absolute;
      top: 0;
      left: 0;
      transform: translateY(-100%);
      padding-left: 2px;
      font-size: 0.95em;
      line-height: 2;
      color: var(--ls-secondary-text-color);
      opacity: 0.95;
      background: var(--ls-primary-background-color);
      outline: 1px solid var(--ls-guideline-color);
      box-shadow: 0 4px 16px 0 var(--ls-tertiary-background-color);
    }
    .kef-ss-list {
      list-style-type: none;
      margin-left: 0;
      font-size: 0.91em;
      max-height: 400px;
      overflow-y: auto;
      opacity: 0.95;
      background: var(--ls-tertiary-background-color);
      outline: 1px solid var(--ls-guideline-color);
      box-shadow: 0 4px 16px 0 var(--ls-tertiary-background-color);
      &>div[data-smartSearch=desc] {
        
      }
    }
    .kef-ss-list:empty {
      display: none;
    }
    .kef-ss-listitem {
      padding: 8px 16px;
      margin: 0;
      cursor: pointer;
      display: flex;
      align-items: baseline;
      user-select: none;
    }
    .kef-ss-listitem:hover {
      background: var(--ls-quaternary-background-color);
    }
    .kef-ss-chosen {
      background: var(--ls-selection-background-color);
    }
    .kef-ss-tagicon {
      flex: 0 0 auto;
      margin-right: 1em;
      font-weight: bold;
      font-size: 0.875em;
    }
    .kef-ss-listitem-text {
      flex: 1 1 auto;
    }
    .kef-ss-b-segs {
      font-size: 0.9em;
      opacity: 0.8;
    }
    .kef-ss-b-spacer.mx-2 {
      margin-left: 0.2rem;
      margin-right: 0.2rem;
    }

    .kef-ss-inline .kef-ss-inputhint {
      background: var(--ls-secondary-background-color);
      color: var(--ls-link-ref-text-color);
    }
    .kef-ss-inline .kef-ss-container {
      width: calc(100% + 40px);
      margin-left: -28px;
      margin-top: 20px;
      background: initial;
    }
    .kef-ss-inline .kef-ss-list {
      box-shadow: none;
      height: calc(100vh - 230px);
      max-height: initial;
      background: var(--ls-secondary-background-color);;
      border: none;
    }
    .kef-ss-keyword-highlight {
      color: var(--ls-page-mark-color);
      background-color: var(--ls-page-mark-bg-color);
    }
  `)
}

function triggerInput() {
  if (inputContainer.style.display === "block") {
    closeInput()
  } else {
    openInput()
  }
}

async function openInput(prefilled) {
  textarea = parent.document.activeElement
  const editor = textarea.closest(".block-editor")
  if (editor) {
    lastBlock = await logseq.Editor.getCurrentBlock()
    editor.appendChild(inputContainer)
    inputContainer.style.display = "block"
    inputContainer.querySelector("input").select()
    if (prefilled) {
      inputRef.current?.fill(prefilled)
    }
  } else {
    inputContainer.classList.add("kef-ss-global")
    inputContainer.style.display = "block"
    inputContainer.querySelector("input").select()
    if (prefilled) {
      inputRef.current?.fill(prefilled)
    }
  }
}

async function closeInput(text = "") {
  const centered = inputContainer.classList.contains("kef-ss-global")
  inputContainer.style.display = "none"
  inputContainer.classList.remove("kef-ss-global")
  inputContainerParent.appendChild(inputContainer)
  if (!centered) {
    const pos = textarea.selectionStart
    const newPos = pos + text.length
    if (text) {
      const content = textarea.value
      await logseq.Editor.updateBlock(
        lastBlock.uuid,
        pos < content.length
          ? `${content.substring(0, pos)}${text}${content.substring(pos)}`
          : pos === content.length
          ? `${content}${text}`
          : `${content} ${text}`,
      )
    }
    textarea.focus()
    textarea.setSelectionRange(newPos, newPos)
  }
}

async function macroRenderer({ slot, payload: { arguments: args, uuid } }) {
  const type = args[0]?.trim()
  if (type !== ":smartsearch") return

  const slotEl = parent.document.getElementById(slot)
  if (!slotEl) return
  const renderered = slotEl.childElementCount > 0
  if (renderered) return

  const id = `kef-ss-${slot}`

  slotEl.style.width = "100%"

  logseq.provideUI({
    key: `ss-${slot}`,
    slot,
    template: `<div id="${id}" class="kef-ss-global kef-ss-inline" style="width: 100%"></div>`,
    reset: true,
    style: {
      cursor: "default",
      flex: "1",
    },
  })

  // Let div root element get generated first.
  setTimeout(async () => {
    const el = parent.document.getElementById(id)
    if (el == null) return
    render(<SmartSearchInput onClose={() => {}} root={el} />, el)
  }, 0)
}

const model = {
  openInput,
}

logseq.ready(model, main).catch(console.error)
