import { useCallback, useEffect, useRef, useState } from "preact/hooks"
import { debounce } from "rambdax"
import { cls, useCompositionChange } from "reactutils"
import { buildQuery, parseContent } from "../libs/utils"

export default function SmartSearchInput({ onClose }) {
  const input = useRef()
  const ul = useRef()
  const [list, setList] = useState([])
  const [chosen, setChosen] = useState(-1)
  const closeCalled = useRef(false)

  function onKeyDown(e) {
    e.stopPropagation()
    switch (e.key) {
      case "Escape": {
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault()
          outputAndClose()
        }
        break
      }
      case "Enter": {
        if (e.isComposing) return
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault()
          outputRef(list[chosen])
        } else if (e.altKey && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
          e.preventDefault()
          outputContent(list[chosen])
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
      default:
        break
    }
  }

  function chooseOutput(e, block) {
    e.stopPropagation()
    e.preventDefault()
    if (!e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
      outputRef(block)
    } else if (e.altKey && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      outputContent(block)
    }
  }

  function outputRef(block) {
    if (block["pre-block?"]) {
      outputAndClose(`[[${block.content}]]`)
    } else {
      outputAndClose(`((${block.uuid}))`)
    }
  }

  function outputContent(block) {
    outputAndClose(block.content)
  }

  function outputAndClose(output) {
    if (closeCalled.current) return
    closeCalled.current = true
    onClose(output)
    input.current.value = ""
    setChosen(-1)
    setList([])
  }

  const handleQuery = useCallback(
    debounce(async (e) => {
      const q = buildQuery(e.target.value)
      // console.log(q)
      if (!q) return
      try {
        const result = (await logseq.DB.datascriptQuery(q)).flat()
        // console.log("query result:", result)
        for (const block of result) {
          if (block["pre-block?"]) {
            const page = await logseq.Editor.getPage(block.page.id)
            block.content = page.originalName
          } else if (block.content) {
            block.content = await parseContent(block.content)
          } else {
            block.content = block["original-name"]
          }
        }
        setList(result)
      } catch (err) {
        console.error(err)
      }
    }, 300),
    [],
  )

  function onFocus(e) {
    closeCalled.current = false
  }

  function onBlur(e) {
    // HACK: let possible click run first.
    setTimeout(outputAndClose, 100)
  }

  useEffect(() => {
    ul.current
      .querySelector(".kef-ac-chosen")
      ?.scrollIntoView({ block: "nearest" })
  }, [chosen])

  const inputProps = useCompositionChange(handleQuery)

  return (
    <div class="kef-ac-container">
      <input
        ref={input}
        class="kef-ac-input"
        type="text"
        {...inputProps}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      <ul ref={ul} class="kef-ac-list">
        {list.map((block, i) => (
          <li
            key={block.uuid}
            class={cls("kef-ac-listitem", i === chosen && "kef-ac-chosen")}
            onClick={(e) => chooseOutput(e, block)}
          >
            {block.content}
          </li>
        ))}
      </ul>
    </div>
  )
}
