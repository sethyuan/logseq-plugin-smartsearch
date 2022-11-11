import { useCallback, useRef, useState } from "preact/hooks"
import { debounce } from "rambdax"
import { cls } from "reactutils"
import { buildQuery, isPage, parseContent } from "../libs/utils"

export default function AutoCompleteInput({ onClose }) {
  const input = useRef()
  const [list, setList] = useState([])
  const [chosen, setChosen] = useState(-1)

  function onKeyDown(e) {
    e.stopPropagation()
  }

  async function onKeyUp(e) {
    switch (e.key) {
      case "Escape": {
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault()
          await outputAndClose()
        }
        break
      }
      case "ArrowDown": {
        e.preventDefault()
        setChosen((n) => (n + 1 < list.length ? n + 1 : 0))
        break
      }
      case "ArrowUp": {
        e.preventDefault()
        setChosen((n) => (n - 1 >= 0 ? n - 1 : list.length - 1))
        break
      }
      case "Enter": {
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault()
          await outputRef(list[chosen])
        } else if (e.altKey && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
          e.preventDefault()
          await outputContent(list[chosen])
        }
        break
      }
      default:
        break
    }
  }

  async function chooseOutput(e, block) {
    e.stopPropagation()
    e.preventDefault()
    if (!e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
      await outputRef(block)
    } else if (e.altKey && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      await outputContent(block)
    }
  }

  async function outputRef(block) {
    if (await isPage(block)) {
      const page = await logseq.Editor.getPage(block.page.id)
      await outputAndClose(`[[${page.originalName}]]`)
    } else {
      await outputAndClose(`((${block.uuid}))`)
    }
  }

  async function outputContent(block) {
    await outputAndClose(block.content)
  }

  async function outputAndClose(output) {
    onClose(output)
    input.current.value = ""
    setChosen(-1)
    setList([])
  }

  const handleQuery = useCallback(
    debounce(async (e) => {
      const q = e.target.value
      try {
        const result = (await logseq.DB.datascriptQuery(buildQuery(q))).flat()
        for (const block of result) {
          if (block.content) {
            block.content = await parseContent(block.content)
          }
        }
        console.log("query result:", result)
        setList(result)
      } catch (err) {
        console.error(err)
      }
    }, 300),
    [],
  )

  return (
    <div class="kef-ac-container" onKeyDown={onKeyDown} onKeyUp={onKeyUp}>
      <input
        ref={input}
        class="kef-ac-input"
        type="text"
        onInput={handleQuery}
      />
      <ul class="kef-ac-list">
        {list.map((item, i) => (
          <li
            key={item.uuid}
            class={cls("kef-ac-listitem", i === chosen && "kef-ac-chosen")}
            onClick={(e) => chooseOutput(e, item)}
          >
            {item.content}
          </li>
        ))}
      </ul>
    </div>
  )
}
