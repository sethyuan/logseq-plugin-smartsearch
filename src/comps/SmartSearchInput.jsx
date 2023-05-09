import { t } from "logseq-l10n"
import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks"
import { debounce } from "rambdax"
import { cls, useCompositionChange } from "reactutils"
import { INPUT_ID } from "../libs/cons"
import {
  buildQuery,
  containsValue,
  ge,
  gt,
  includesValue,
  le,
  lt,
  postProcessResult,
} from "../libs/query"
import { parseContent, persistBlockUUID } from "../libs/utils"
import Breadcrumb from "./Breadcrumb"

const BLUR_WAIT = 100

export default function SmartSearchInput({ onClose }) {
  const input = useRef()
  const ul = useRef()
  const [list, setList] = useState([])
  const [tagList, setTagList] = useState([])
  const [chosen, setChosen] = useState(0)
  const [isCompletionRequest, setIsCompletionRequest] = useState(false)
  const closeCalled = useRef(false)
  const lastQ = useRef()
  const lastResult = useRef([])
  const lastTagResult = useRef([])
  const ss = useMemo(() => parent.document.getElementById(INPUT_ID), [])
  const isMac = useMemo(
    () => parent.document.documentElement.classList.contains("is-mac"),
    [],
  )
  const isGlobal = ss.classList.contains("kef-ss-global")

  const handleQuery = useCallback(
    debounce((e) => performQuery(e.target.value), 300),
    [],
  )

  async function performQuery(query) {
    const [q, filter, tagQ, tag, isCompletionRequest] = buildQuery(query)
    // console.log(q, tagQ, tag, isCompletionRequest)

    if (!q) {
      resetState()
      return
    }

    if (q === lastQ.current) {
      if (lastResult.current.length > 0) {
        setList(await postProcessResult(lastResult.current, filter))
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
        .sort(
          (a, b) => (b.page["journal-day"] ?? 0) - (a.page["journal-day"] ?? 0),
        )
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
      setList(
        await postProcessResult(
          isCompletionRequest
            ? result.filter((block) => block["pre-block?"])
            : result,
          filter,
        ),
      )
      setChosen(0)
      setIsCompletionRequest(isCompletionRequest)
    } catch (err) {
      console.error(err, q)
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
        if (isCompletionRequest && list.length > 0) {
          if (!e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.stopPropagation()
            e.preventDefault()
            completeTag(list[chosen].content, isCompletionRequest)
          } else if (e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey) {
            e.stopPropagation()
            e.preventDefault()
            gotoBlock(list[chosen])
            outputAndClose()
          } else if (e.shiftKey && e.altKey && !e.metaKey && !e.ctrlKey) {
            e.stopPropagation()
            e.preventDefault()
            gotoBlock(list[chosen], true)
            outputAndClose()
          }
        } else if (list.length > 0) {
          if (!e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.stopPropagation()
            e.preventDefault()
            if (!isGlobal) {
              outputRef(list[chosen])
            } else {
              gotoBlock(list[chosen])
              outputAndClose()
            }
          } else if (e.altKey && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
            e.stopPropagation()
            e.preventDefault()
            if (isGlobal) return
            outputContent(list[chosen])
          } else if (e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.stopPropagation()
            e.preventDefault()
            if (!isGlobal) {
              gotoBlock(list[chosen])
              outputAndClose()
            } else {
              gotoBlock(list[chosen], true)
              outputAndClose()
            }
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
            if (isGlobal) return
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
      case "Tab": {
        e.stopPropagation()
        e.preventDefault()
        if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) break
        if (isCompletionRequest && list.length > 0) {
          completeTag(list[chosen].content, isCompletionRequest)
        } else if (list.length > 0 && list[chosen]["pre-block?"]) {
          completePage(list[chosen].content)
        } else if (tagList.length > 0) {
          completeTag(tagList[chosen].name)
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
          (!e.ctrlKey && !e.metaKey && !e.altKey) ||
          ((e.metaKey || e.ctrlKey) && e.code === "KeyA") ||
          ((e.metaKey || e.ctrlKey) && e.code === "KeyZ") ||
          ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === "KeyZ") ||
          (e.ctrlKey && e.code === "KeyY")
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
      if (!isGlobal) {
        outputRef(block)
      } else {
        gotoBlock(block)
        outputAndClose()
      }
    } else if (e.altKey && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      if (isGlobal) return
      outputContent(block)
    } else if (e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
      if (!isGlobal) {
        gotoBlock(block)
        outputAndClose()
      } else {
        gotoBlock(block, true)
        outputAndClose()
      }
    } else if (e.shiftKey && e.altKey && !e.ctrlKey && !e.metaKey) {
      gotoBlock(block, true)
      outputAndClose()
    } else if (
      isMac
        ? e.metaKey && !e.shiftKey && !e.ctrlKey && !e.altKey
        : e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey
    ) {
      if (isGlobal) return
      outputEmbed(block)
    }
  }

  function chooseForTag(e, tag, isCompletionRequest) {
    e.stopPropagation()
    e.preventDefault()
    if (e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
      gotoBlock(tag)
      outputAndClose()
    } else if (e.shiftKey && e.altKey && !e.ctrlKey && !e.metaKey) {
      gotoBlock(tag, true)
      outputAndClose()
    } else {
      completeTag(tag.name ?? tag.content, isCompletionRequest, true)
    }
  }

  function outputRef(block) {
    if (block["pre-block?"]) {
      outputAndClose(`[[${block.content}]]`)
    } else {
      persistBlockUUID(block)
      outputAndClose(`((${block.uuid}))`)
    }
  }

  function outputEmbed(block) {
    if (block["pre-block?"]) {
      outputAndClose(`{{embed [[${block.content}]]}}`)
    } else {
      persistBlockUUID(block)
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
      // console.log("tag result", result, tag)
      if (result.some((t) => t.name === tag)) {
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

  function completeTag(tagName, isCompletionRequest, viaClick = false) {
    if (viaClick) {
      // Prevent input from closing due to onblur.
      closeCalled.current = true
      // Reset and give focus back after onblur runs.
      setTimeout(() => {
        input.current.focus()
      }, BLUR_WAIT + 1)
    }

    const value = input.current.value
    const index = Math.max(
      value.lastIndexOf("#"),
      value.lastIndexOf(">"),
      value.lastIndexOf("》"),
    )
    if (index < 0) return
    // Handle >, 》, #, ##, #> cases.
    const query = isCompletionRequest
      ? `${value.substring(0, index)}#${tagName}`
      : `${value.substring(
          0,
          index + (value[index + 1] === ">" ? 2 : 1),
        )}${tagName}`
    input.current.value = query
    performQuery(query)
  }

  function completePage(name) {
    const value = input.current.value
    const query = `#${value.startsWith("##") ? "#" : ""}${name}`
    input.current.value = query
    performQuery(query)
  }

  function resetState() {
    // input.current.value = ""
    setChosen(0)
    if (input.current.value.length === 0) {
      setList([])
      setTagList([])
      lastQ.current = null
      lastResult.current = []
      lastTagResult.current = []
    }
  }

  useEffect(() => {
    ul.current
      .querySelector(".kef-ss-chosen")
      ?.scrollIntoView({ block: "nearest" })
  }, [chosen])

  const inputProps = useCompositionChange(handleQuery)

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
            onClick={(e) =>
              isCompletionRequest
                ? chooseForTag(e, block, isCompletionRequest)
                : chooseOutput(e, block)
            }
          >
            <div class="kef-ss-tagicon">
              {isCompletionRequest ? "T" : block["pre-block?"] ? "P" : "B"}
            </div>
            <div class="kef-ss-listitem-text">
              {!block["pre-block?"] && (
                <Breadcrumb segments={block.breadcrumb} />
              )}
              {block.content.split("\n").map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </li>
        ))}
        {list.length === 0 &&
          tagList.map((tag, i) => (
            <li
              key={tag.name}
              class={cls("kef-ss-listitem", i === chosen && "kef-ss-chosen")}
              onClick={(e) => chooseForTag(e, tag)}
            >
              <div class="kef-ss-tagicon">T</div>
              <div class="kef-ss-listitem-text">{tag.name}</div>
            </li>
          ))}
      </ul>
      <div class="kef-ss-inputhint">
        {list.length > 0 && !isCompletionRequest
          ? isMac
            ? isGlobal
              ? t("select=goto; ⇧=sidebar")
              : t(
                  "select=ref; ⌘=embed; ⌥=content; ⇧=goto; ⇧+⌥=sidebar; ⇥=complete",
                )
            : isGlobal
            ? t("select=goto; shift=sidebar")
            : t(
                "select=ref; ctrl=embed; alt=content; shift=goto; shift+alt=sidebar; tab=complete",
              )
          : tagList.length > 0 || (isCompletionRequest && list.length > 0)
          ? isMac
            ? t("select=complete; ⇥=complete; ⇧=goto; ⇧+⌥=sidebar")
            : t("select=complete; tab=complete; shift=goto; shift+alt=sidebar")
          : t(
              "#[!]tag, ##tag, #>tag, >tag, @[!]prop: value, @prop [=<>]1, @prop~ -1w~d, []nltidwc, %j -1w~d, ;filter",
            )}
      </div>
    </div>
  )
}
