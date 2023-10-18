import { t } from "logseq-l10n"
import { forwardRef } from "preact/compat"
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "preact/hooks"
import { debounce } from "rambdax"
import { cls, useCompositionChange } from "reactutils"
import EventEmitter from "../libs/event"
import {
  buildQuery,
  containsValue,
  fullTextSearch,
  ge,
  gt,
  includesValue,
  le,
  lt,
  postProcessResult,
} from "../libs/query"
import {
  parseContent,
  persistBlockUUID,
  readHistory,
  writeHistory,
} from "../libs/utils"
import Breadcrumb from "./Breadcrumb"

const BLUR_WAIT = 200
const HISTORY_LEN = 30

const events = new EventEmitter()

export default forwardRef(function SmartSearchInput({ onClose, root }, ref) {
  const input = useRef()
  const ul = useRef()
  const [list, setList] = useState([])
  const [tagList, setTagList] = useState([])
  const [chosen, setChosen] = useState(0)
  const [isCompletionRequest, setIsCompletionRequest] = useState(false)
  const [historyList, setHistoryList] = useState([])
  const [showProgress, setShowProgress] = useState(false)
  const closeCalled = useRef(false)
  const lastQ = useRef()
  const lastResult = useRef([])
  const lastTagResult = useRef([])
  const isMac = useMemo(
    () => parent.document.documentElement.classList.contains("is-mac"),
    [],
  )
  const isGlobal = root.classList.contains("kef-ss-global")

  const handleQuery = useCallback(
    debounce((e) => performQuery(e.target.value), 400),
    [],
  )

  useImperativeHandle(ref, () => ({
    fill(prefilled) {
      input.current.value = prefilled
      performQuery(prefilled)
    },
  }))

  async function performQuery(query) {
    const [q, filter, tagQ, tag, isCompletionRequest] = buildQuery(query)
    // console.log(q, tagQ, tag, isCompletionRequest)

    if (!q) {
      resetState()
      return
    }

    if (q === lastQ.current) {
      if (lastResult.current.length > 0) {
        setList(
          await postProcessResult(lastResult.current, filter, true, query),
        )
      }
      if (lastTagResult.current.length > 0) {
        setTagList(await postProcessResult(lastTagResult.current, filter))
      }
      setChosen(0)
      return
    }

    lastQ.current = q
    setShowProgress(true)
    // HACK: wait till progress is shown.
    setTimeout(async () => {
      try {
        const isFullTextSearch = !q.startsWith("[:find ")
        const result = isFullTextSearch
          ? await fullTextSearch(q)
          : (
              await logseq.DB.datascriptQuery(
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
                (a, b) =>
                  (b.page["journal-day"] ?? 0) - (a.page["journal-day"] ?? 0),
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
            // Full text search page is already processed.
            if (!block.name) {
              const page = await logseq.Editor.getPage(block.page.id)
              block.content = page.originalName
            }
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
            !isCompletionRequest,
            query,
            isFullTextSearch,
          ),
        )
        setChosen(0)
        setIsCompletionRequest(isCompletionRequest)
      } catch (err) {
        console.error(err, q)
      } finally {
        setShowProgress(false)
      }
    }, 24)
  }

  async function onKeyDown(e) {
    switch (e.key) {
      case "Escape": {
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.stopPropagation()
          e.preventDefault()
          outputAndClose(undefined, true)
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
            await gotoBlock(list[chosen])
            outputAndClose()
          } else if (e.shiftKey && e.altKey && !e.metaKey && !e.ctrlKey) {
            e.stopPropagation()
            e.preventDefault()
            await gotoBlock(list[chosen], true)
            outputAndClose()
          }
        } else if (list.length > 0) {
          if (!e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.stopPropagation()
            e.preventDefault()
            if (!isGlobal) {
              outputRef(list[chosen])
            } else {
              await gotoBlock(list[chosen])
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
              await gotoBlock(list[chosen])
              outputAndClose()
            } else {
              await gotoBlock(list[chosen], true)
              outputAndClose()
            }
          } else if (e.shiftKey && e.altKey && !e.ctrlKey && !e.metaKey) {
            e.stopPropagation()
            e.preventDefault()
            await gotoBlock(list[chosen], true)
            outputAndClose()
          } else if (
            isMac
              ? e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey
              : e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey
          ) {
            e.stopPropagation()
            e.preventDefault()
            if (isGlobal) return
            outputEmbed(list[chosen])
          } else if (
            isMac
              ? e.metaKey && !e.ctrlKey && e.shiftKey && !e.altKey
              : e.ctrlKey && !e.metaKey && e.shiftKey && !e.altKey
          ) {
            e.stopPropagation()
            e.preventDefault()
            if (isGlobal) return
            outputEmbedChildren(list[chosen])
          }
        } else if (tagList.length > 0) {
          if (!e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.stopPropagation()
            e.preventDefault()
            completeTag(tagList[chosen].name)
          } else if (e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey) {
            e.stopPropagation()
            e.preventDefault()
            await gotoBlock(tagList[chosen])
            outputAndClose()
          } else if (e.shiftKey && e.altKey && !e.metaKey && !e.ctrlKey) {
            e.stopPropagation()
            e.preventDefault()
            await gotoBlock(tagList[chosen], true)
            outputAndClose()
          }
        } else if (input.current == null || input.current.value.length === 0) {
          setInputQuery(e, historyList[chosen])
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
        } else if (input.current == null || input.current.value.length === 0) {
          setInputQuery(e, historyList[chosen])
        }
        break
      }
      case "ArrowDown": {
        e.stopPropagation()
        e.preventDefault()
        const len = list.length || tagList.length || historyList.length
        if (len > 0) {
          setChosen((n) => (n + 1 < len ? n + 1 : 0))
        }
        break
      }
      case "ArrowUp": {
        e.stopPropagation()
        e.preventDefault()
        const len = list.length || tagList.length || historyList.length
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

  async function chooseOutput(e, block) {
    e.stopPropagation()
    e.preventDefault()
    if (!e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (!isGlobal) {
        outputRef(block)
      } else {
        await gotoBlock(block)
        outputAndClose()
      }
    } else if (e.altKey && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      if (isGlobal) return
      outputContent(block)
    } else if (e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
      if (!isGlobal) {
        await gotoBlock(block)
        outputAndClose()
      } else {
        await gotoBlock(block, true)
        outputAndClose()
      }
    } else if (e.shiftKey && e.altKey && !e.ctrlKey && !e.metaKey) {
      await gotoBlock(block, true)
      outputAndClose()
    } else if (
      isMac
        ? e.metaKey && !e.shiftKey && !e.ctrlKey && !e.altKey
        : e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey
    ) {
      if (isGlobal) return
      outputEmbed(block)
    } else if (
      isMac
        ? e.metaKey && !e.ctrlKey && e.shiftKey && !e.altKey
        : e.ctrlKey && !e.metaKey && e.shiftKey && !e.altKey
    ) {
      if (isGlobal) return
      outputEmbedChildren(block)
    }
  }

  async function chooseForTag(e, tag, isCompletionRequest) {
    e.stopPropagation()
    e.preventDefault()
    if (e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
      await gotoBlock(tag)
      outputAndClose()
    } else if (e.shiftKey && e.altKey && !e.ctrlKey && !e.metaKey) {
      await gotoBlock(tag, true)
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

  function outputEmbedChildren(block) {
    if (block["pre-block?"]) {
      outputAndClose(`[[.embed-children]]{{embed [[${block.content}]]}}`)
    } else {
      persistBlockUUID(block)
      outputAndClose(`[[.embed-children]]{{embed ((${block.uuid}))}}`)
    }
  }

  function outputContent(block) {
    outputAndClose(block.content)
  }

  function outputAndClose(output, noHistory = false) {
    if (closeCalled.current) return
    closeCalled.current = true
    onClose(output)
    resetState()
    if (input.current?.value && !noHistory) {
      let history
      const index = historyList.findIndex((v) => v === input.current.value)
      if (index > -1) {
        history = [
          input.current.value,
          ...historyList.slice(0, index),
          ...historyList.slice(index + 1),
        ]
      } else if (historyList.length < HISTORY_LEN) {
        history = [input.current.value, ...historyList]
      } else {
        history = [
          input.current.value,
          ...historyList.slice(0, historyList.length - 1),
        ]
      }
      writeHistory(history)
      setHistoryList(history)
      events.emit("history.change", { fromId: root })
    }
  }

  async function gotoBlock(block, inSidebar = false) {
    if (block["pre-block?"]) {
      if (inSidebar) {
        const page = await logseq.Editor.getPage(block.name ?? block.page.id)
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
    ul.current
      .querySelector(".kef-ss-chosen")
      ?.scrollIntoView({ block: "nearest" })
  }

  function onBlur(e) {
    // HACK: let possible click run first.
    setTimeout(() => outputAndClose(undefined, true), BLUR_WAIT)
  }

  async function findTag(tagQ, tag) {
    try {
      const result = (
        await top.logseq.api.datascript_query(tagQ, includesValue)
      ).flat()
      // console.log("tag result", result, tag)
      if (result.some((t) => t.name === tag)) {
        const empty = []
        setTagList(empty)
        lastTagResult.current = empty
      } else {
        setTagList(await postProcessResult(result))
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
    if (input.current.value.length === 0) {
      setList([])
      setTagList([])
      setChosen(0)
      lastQ.current = null
      lastResult.current = []
      lastTagResult.current = []
    }
  }

  function setInputQuery(e, q, viaClick = false) {
    e.stopPropagation()
    e.preventDefault()

    if (viaClick) {
      // Prevent input from closing due to onblur.
      closeCalled.current = true
      // Reset and give focus back after onblur runs.
      setTimeout(() => {
        input.current.focus()
      }, BLUR_WAIT + 1)
    }

    input.current.value = q
    // HACK: let input be shown first for better UX.
    setTimeout(() => performQuery(q), 16)
  }

  useEffect(() => {
    ul.current
      .querySelector(".kef-ss-chosen")
      ?.scrollIntoView({ block: "nearest" })
  }, [chosen])

  useEffect(() => {
    const offHook = logseq.App.onCurrentGraphChanged(async () => {
      const history = await readHistory()
      setHistoryList(history)
    })
    async function refreshHistory(data) {
      if (data?.fromId === root) return
      const history = await readHistory()
      setHistoryList(history)
    }
    events.on("history.change", refreshHistory)
    refreshHistory()

    return () => {
      events.off("history.change", refreshHistory)
      offHook()
    }
  }, [])

  const inputProps = useCompositionChange(handleQuery)

  const stopPropagation = useCallback((e) => e.stopPropagation(), [])

  return (
    <div class="kef-ss-container">
      <div>
        <input
          ref={input}
          class="kef-ss-input"
          type="text"
          placeholder={t("e.g.: #book, @published: 2000; holmes")}
          {...inputProps}
          onKeyDown={onKeyDown}
          onMouseDown={stopPropagation}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        <div class={cls("kef-ss-progress", showProgress && "kef-ss-show")}>
          &#xeb15;
        </div>
      </div>
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
              {block.breadcrumb && <Breadcrumb segments={block.breadcrumb} />}
              {(block.highlightContent ?? block.content)
                .split("\n")
                .map((line) => (
                  <p key={line} dangerouslySetInnerHTML={{ __html: line }} />
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
        {list.length === 0 &&
          tagList.length === 0 &&
          (input.current == null || input.current.value.length === 0) &&
          historyList.map((query, i) => (
            <li
              key={i}
              class={cls("kef-ss-listitem", i === chosen && "kef-ss-chosen")}
              onClick={(e) => setInputQuery(e, query, true)}
            >
              <div class="kef-ss-listitem-text">{query}</div>
            </li>
          ))}
      </ul>
      <div class="kef-ss-inputhint">
        {list.length > 0 && !isCompletionRequest
          ? isMac
            ? isGlobal
              ? t("[Key combination]  select=goto; ⇧=sidebar")
              : t("[Key combination]  select=ref; ⌘=embed; ⌘+⇧=embed children; ⌥=content; ⇧=goto; ⇧+⌥=sidebar; ⇥=complete")
            : isGlobal
            ? t("[Key combination]  select=goto; shift=sidebar")
            : t("[Key combination]  select=ref; ctrl=embed; ctrl+shift=embed children; alt=content; shift=goto; shift+alt=sidebar; tab=complete")
          : tagList.length > 0 || (isCompletionRequest && list.length > 0)
          ? isMac
            ? t("[Key combination]  select=complete; ⇥=complete; ⇧=goto; ⇧+⌥=sidebar")
            : t("[Key combination]  select=complete; tab=complete; shift=goto; shift+alt=sidebar")
          : desc()
          }
          <p style="text-align: right;"><a href={t("https://github.com/sethyuan/logseq-plugin-smartsearch/blob/master/README.en.md")} target="_blank">README</a></p>
      </div>
    </div>
  )
})

const desc =()=> {
  return  (
            <div data-smartSearch="desc">
              <details open>
                <summary>
                  <h4>{t("Searching Blocks with Keywords or \"#Tag Names\"")}</h4>
                </summary>
                <ul>
                  <li>{t("Use a comma (,) for AND searches.")}</li>
                  <li>{t("#>tag name :Targets child blocks.")}</li>
                  <li>{t("##tag name :Includes descendant blocks.")}</li>
                  <li>{t("#[!]tag name :Excludes specific tags.")}</li>
                  <li>{t("[]t: Represents TODO tasks.")}</li>
                </ul>
              </details>
            </div>
          )
}
