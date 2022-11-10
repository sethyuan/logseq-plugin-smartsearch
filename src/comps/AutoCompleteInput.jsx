import { useCallback, useState } from "preact/hooks"
import { debounce } from "rambdax"
import { cls } from "reactutils"
import { buildQuery } from "../libs/utils"

export default function AutoCompleteInput({ onClose }) {
  const [list, setList] = useState([])
  const [chosen, setChosen] = useState(-1)

  function onKeyUp(e) {
    if (
      e.key === "Escape" &&
      !e.shiftKey &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey
    ) {
      onClose?.()
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setChosen((n) => (n + 1 < list.length ? n + 1 : 0))
      return
    }

    if (e.key === "ArrowUp") {
      e.preventDefault()
      setChosen((n) => (n - 1 >= 0 ? n - 1 : list.length - 1))
      return
    }
  }

  const handleQuery = useCallback(
    debounce(async (e) => {
      const q = e.target.value
      try {
        const result = (await logseq.DB.datascriptQuery(buildQuery(q))).flat()
        console.log("query result:", result)
        setList(result)
      } catch (err) {
        console.error(err)
      }
    }, 300),
    [],
  )

  return (
    <div class="kef-ac-container" onKeyUp={onKeyUp}>
      <input class="kef-ac-input" type="text" onInput={handleQuery} />
      <ul class="kef-ac-list">
        {list.map((item, i) => (
          <li
            key={item.uuid}
            class={cls("kef-ac-listitem", i === chosen && "kef-ac-chosen")}
          >
            {item.content}
          </li>
        ))}
      </ul>
    </div>
  )
}
