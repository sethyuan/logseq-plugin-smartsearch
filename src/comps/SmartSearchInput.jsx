import { t } from "logseq-l10n"
import { useCallback, useEffect, useRef, useState } from "preact/hooks"
import { debounce } from "rambdax"
import { cls, useCompositionChange } from "reactutils"
import {
  buildQuery,
  containsValue,
  ge,
  gt,
  includesValue,
  le,
  lt,
  parseContent,
  postProcessResult,
} from "../libs/utils"

const BLUR_WAIT = 100

export default function SmartSearchInput({ onClose }) {
  const input = useRef()
  const ul = useRef()
  const [list, setList] = useState([])
  const [tagList, setTagList] = useState([])
  const [chosen, setChosen] = useState(0)
  const closeCalled = useRef(false)
  const lastQ = useRef()
  const lastResult = useRef([])
  const lastTagResult = useRef([])

  const handleQuery = useCallback(
    debounce((e) => performQuery(e.target.value), 300),
    [],
  )

  async function performQuery(query) {
    const [q, filter, tagQ, tag] = buildQuery(query)
    // console.log(q)

    if (!q) {
      resetState()
      return
    }

    if (q === lastQ.current) {
      if (lastResult.current.length > 0) {
        setList(postProcessResult(lastResult.current, filter))
      }
      if (lastTagResult.current.length > 0) {
        setTagList(postProcessResult(lastTagResult.current, filter))
      }
      setChosen(0)
      return
    }

    lastQ.current = q
    try {
      const result = (
        await top.logseq.api.datascript_query(
          q,
          includesValue,
          containsValue,
          ge,
          le,
          gt,
          lt,
        )
      )
        .flat()
        .filter((b) => b["pre-block?"] || b.content)
      lastResult.current = result
      // console.log("query result:", result)

      if (!tagQ) {
        setTagList([])
      } else if (result.length === 0) {
        findTag(tagQ, tag)
      }

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
      setList(postProcessResult(result, filter))
      setChosen(0)
    } catch (err) {
      // console.error(err, q)
    }
  }

  function onKeyDown(e) {
    switch (e.key) {
      case "Escape": {
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.stopPropagation()
          e.preventDefault()
          outputAndClose()
        }
        break
      }
      case "Enter": {
        if (e.isComposing) return
        if (list.length > 0) {
          if (!e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.stopPropagation()
            e.preventDefault()
            outputRef(list[chosen])
          } else if (e.altKey && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
            e.stopPropagation()
            e.preventDefault()
            outputContent(list[chosen])
          } else if (e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.stopPropagation()
            e.preventDefault()
            gotoBlock(list[chosen])
            outputAndClose()
          } else if (e.shiftKey && e.altKey && !e.ctrlKey && !e.metaKey) {
            e.stopPropagation()
            e.preventDefault()
            gotoBlock(list[chosen], true)
            outputAndClose()
          } else if (
            isMac
              ? e.metaKey && !e.shiftKey && !e.ctrlKey && !e.altKey
              : e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey
          ) {
            e.stopPropagation()
            e.preventDefault()
            outputEmbed(list[chosen])
          }
        } else if (tagList.length > 0) {
          if (!e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.stopPropagation()
            e.preventDefault()
            completeTag(tagList[chosen].name)
          } else if (e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey) {
            e.stopPropagation()
            e.preventDefault()
            gotoBlock(tagList[chosen])
            outputAndClose()
          } else if (e.shiftKey && e.altKey && !e.metaKey && !e.ctrlKey) {
            e.stopPropagation()
            e.preventDefault()
            gotoBlock(tagList[chosen], true)
            outputAndClose()
          }
        }
        break
      }
      case "ArrowDown": {
        e.stopPropagation()
        e.preventDefault()
        const len = list.length || tagList.length
        if (len > 0) {
          setChosen((n) => (n + 1 < len ? n + 1 : 0))
        }
        break
      }
      case "ArrowUp": {
        e.stopPropagation()
        e.preventDefault()
        const len = list.length || tagList.length
        if (len > 0) {
          setChosen((n) => (n - 1 >= 0 ? n - 1 : len - 1))
        }
        break
      }
      default:
        // HACK: do not propagate select all.
        if (
          (!e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) ||
          (e.metaKey && e.code === "KeyA")
        ) {
          e.stopPropagation()
        }
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
    } else if (e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
      gotoBlock(block)
      outputAndClose()
    } else if (e.shiftKey && e.altKey && !e.ctrlKey && !e.metaKey) {
      gotoBlock(block, true)
      outputAndClose()
    } else if (
      isMac
        ? e.metaKey && !e.shiftKey && !e.ctrlKey && !e.altKey
        : e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey
    ) {
      outputEmbed(block)
    }
  }

  function chooseForTag(e, tag) {
    e.stopPropagation()
    e.preventDefault()
    if (e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
      gotoBlock(tag)
      outputAndClose()
    } else if (e.shiftKey && e.altKey && !e.ctrlKey && !e.metaKey) {
      gotoBlock(tag, true)
      outputAndClose()
    } else {
      completeTag(tag.name, true)
    }
  }

  function outputRef(block) {
    if (block["pre-block?"]) {
      outputAndClose(`[[${block.content}]]`)
    } else {
      outputAndClose(`((${block.uuid}))`)
    }
  }

  function outputEmbed(block) {
    if (block["pre-block?"]) {
      outputAndClose(`{{embed [[${block.content}]]}}`)
    } else {
      outputAndClose(`{{embed ((${block.uuid}))}}`)
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
    resetState()
  }

  async function gotoBlock(block, inSidebar = false) {
    if (block["pre-block?"]) {
      if (inSidebar) {
        const page = await logseq.Editor.getPage(block.page.id)
        logseq.Editor.openInRightSidebar(page.uuid)
      } else {
        logseq.Editor.scrollToBlockInPage(block.content)
      }
    } else {
      if (inSidebar) {
        logseq.Editor.openInRightSidebar(block.uuid)
      } else {
        logseq.Editor.scrollToBlockInPage(block.name ?? block.uuid)
      }
    }
  }

  function onFocus(e) {
    closeCalled.current = false
  }

  function onBlur(e) {
    // HACK: let possible click run first.
    setTimeout(outputAndClose, BLUR_WAIT)
  }

  async function findTag(tagQ, tag) {
    try {
      const result = (await logseq.DB.datascriptQuery(tagQ)).flat()
      // console.log("tag result", result)
      if (result.length === 1 && result[0].name === tag) {
        const empty = []
        setTagList(empty)
        lastTagResult.current = empty
      } else {
        setTagList(postProcessResult(result))
        lastTagResult.current = result
      }
      setChosen(0)
    } catch (err) {
      // console.error(err, tagQ)
    }
  }

  function completeTag(tagName, viaClick = false) {
    if (viaClick) {
      // Prevent input from closing due to onblur.
      closeCalled.current = true
      // Reset and give focus back after onblur runs.
      setTimeout(() => {
        input.current.focus()
      }, BLUR_WAIT + 1)
    }

    const value = input.current.value
    const index = value.lastIndexOf("#")
    if (index < 0) return
    // Handle #, ##, #> cases.
    const query = `${value.substring(
      0,
      index + (value[index + 1] === ">" ? 2 : 1),
    )}${tagName}`
    input.current.value = query
    performQuery(query)
  }

  function resetState() {
    setChosen(0)
    setList([])
    setTagList([])
    lastQ.current = null
    lastResult.current = []
    lastTagResult.current = []
  }

  useEffect(() => {
    ul.current
      .querySelector(".kef-ss-chosen")
      ?.scrollIntoView({ block: "nearest" })
  }, [chosen])

  const inputProps = useCompositionChange(handleQuery)
  const isMac = parent.document.documentElement.classList.contains("is-mac")

  const stopPropagation = useCallback((e) => e.stopPropagation(), [])

  return (
    <div class="kef-ss-container">
      <input
        ref={input}
        class="kef-ss-input"
        type="text"
        placeholder={t("e.g.: #book, @published: 2000; holmes")}
        {...inputProps}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      <ul ref={ul} class="kef-ss-list">
        {list.map((block, i) => (
          <li
            key={block.uuid}
            class={cls("kef-ss-listitem", i === chosen && "kef-ss-chosen")}
            onMouseDown={stopPropagation}
            onClick={(e) => chooseOutput(e, block)}
          >
            {block.content.split("\n").map((line) => (
              <div key={line}>{line}</div>
            ))}
          </li>
        ))}
        {list.length === 0 &&
          tagList.map((tag, i) => (
            <li
              key={tag.name}
              class={cls("kef-ss-listitem", i === chosen && "kef-ss-chosen")}
              onClick={(e) => chooseForTag(e, tag)}
            >
              <span class="kef-ss-tagicon">T</span>
              <span>{tag.name}</span>
            </li>
          ))}
      </ul>
      <div class="kef-ss-inputhint">
        {list.length > 0
          ? isMac
            ? t("select=ref; ⌘=embed; ⌥=content; ⇧=goto; ⇧+⌥=sidebar")
            : t(
                "select=ref; ctrl=embed; alt=content; shift=goto; shift+alt=sidebar",
              )
          : tagList.length > 0
          ? isMac
            ? t("select=complete; ⇧=goto; ⇧+⌥=sidebar")
            : t("select=complete; shift=goto; shift+alt=sidebar")
          : t(
              "#tag ##tag #>tag @property @property:value @property[=<>]1 @property[~-+]1w []nltidwc ;filter",
            )}
      </div>
    </div>
  )
}
