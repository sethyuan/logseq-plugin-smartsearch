import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  parse,
  setDefaultOptions,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { parseOneLineContent } from "./utils"

const UNITS = new Set(["y", "m", "w", "d"])

const addUnit = {
  y: addYears,
  m: addMonths,
  w: addWeeks,
  d: addDays,
}

const startOfUnit = {
  y: (date) => new Date(date.getFullYear(), 0, 1),
  m: startOfMonth,
  w: startOfWeek,
  d: startOfDay,
}

const endOfUnit = {
  y: (date) => new Date(date.getFullYear(), 11, 31, 23, 59, 59),
  m: endOfMonth,
  w: endOfWeek,
  d: endOfDay,
}

let dateFormat

export function setDateOptions(format, weekStartsOn) {
  dateFormat = format
  setDefaultOptions({ weekStartsOn })
}

export function buildQuery(q) {
  if (!q) return []
  const filterIndex = Math.max(q.lastIndexOf(";"), q.lastIndexOf("；"))
  const filter = filterIndex > -1 ? q.substring(filterIndex + 1).trim() : null
  const conds = (filterIndex > -1 ? q.substring(0, filterIndex) : q)
    .split(/[,，]/)
    .map((s) => s.trim())
  const lastCond = conds[conds.length - 1]
  const isCompletionRequest = [">", "》"].includes(lastCond?.[0])
  const condStr = isCompletionRequest
    ? buildCond(lastCond, 0)
    : conds
        .map((cond, i) => buildCond(cond, i))
        .join("\n")
        .trim()
  if (!condStr) return []
  const [tagQ, tag] = buildTagQuery(lastCond)
  return [
    `[:find (pull ?b [* {:block/page [:db/id :block/journal-day]}]) :in $ ?includes ?contains ?ge ?le ?gt ?lt :where ${condStr}]`,
    filter,
    tagQ,
    tag,
    isCompletionRequest,
  ]
}

function buildCond(cond, i) {
  if (cond.length < 1) return ""
  if (cond.startsWith("#!") || cond.startsWith("#！")) {
    const name = cond.substring(2).toLowerCase()
    return `[?t${i} :block/name "${name}"] (not [?b :block/refs ?t${i}])`
  } else if (cond.startsWith("#")) {
    if (cond.length < 2) return ""
    if (cond[1] === "#") {
      const name = cond.substring(2).toLowerCase()
      return `[?t${i} :block/name "${name}"] [?b :block/path-refs ?t${i}]`
    } else if (cond[1] === ">") {
      const name = cond.substring(2).toLowerCase()
      return `[?t${i} :block/name "${name}"] [?bp :block/refs ?t${i}] [?bp :block/uuid ?uuid] (or [?b :block/uuid ?uuid] [?b :block/parent ?bp])`
    } else {
      const name = cond.substring(1).toLowerCase()
      return `[?t${i} :block/name "${name}"] [?b :block/refs ?t${i}]`
    }
  } else if (cond.startsWith(">") || cond.startsWith("》")) {
    if (cond.length < 2) return ""
    const name = cond.substring(1).toLowerCase()
    return `[?t${i} :block/name "${name}"] [?b :block/refs ?t${i}]`
  } else if (cond.startsWith("@!") || cond.startsWith("@！")) {
    if (cond.length < 3) return ""
    const str = cond.substring(2)
    const op = str.match(/:|：/)?.[0]
    switch (op) {
      case ":":
      case "：": {
        const [name, value] = str
          .split(op)
          .map((s, i) => (i === 0 ? s.trim().toLowerCase() : s.trim()))
        if (!value) break
        return `[?b :block/content] (not-join [?b ?includes ?contains] [?b :block/properties ?bp${i}] [(get ?bp${i} :${name}) ?v${i}] (or-join [?includes ?contains ?v${i}]
          [(?includes ?v${i} "${value}")]
          [(= ?v${i} ${value})]
          [(?contains ?v${i} "${value}")]))`
      }
      default:
        break
    }
    return `[?b :block/content] (not-join [?b] [?b :block/properties ?bp${i}] [(get ?bp${i} :${str})])`
  } else if (cond.startsWith("@")) {
    if (cond.length < 2) return ""
    const str = cond.substring(1)
    const match = str.match(/:|：|\<=|\>=|\>|\<|=|~|～/)
    const op = match?.[0]
    const opIndex = match?.index
    switch (op) {
      case ":":
      case "：": {
        const [name, value] = str
          .split(op)
          .map((s, i) => (i === 0 ? s.trim().toLowerCase() : s.trim()))
        if (!value) break
        return `[?b :block/properties ?bp${i}] [(get ?bp${i} :${name}) ?v${i}] [?b :block/content] (or-join [?includes ?contains ?v${i}]
          [(?includes ?v${i} "${value}")]
          [(= ?v${i} ${value})]
          [(?contains ?v${i} "${value}")])`
      }
      case "=":
      case "<":
      case ">":
      case ">=":
      case "<=": {
        const [name, value] = str
          .split(op)
          .map((s, i) => (i === 0 ? s.trim().toLowerCase() : s.trim()))
        if (!value) break
        return `[?b :block/properties ?bp${i}] [(get ?bp${i} :${name}) ?v${i}] (not [?b :block/name]) [(${op} ?v${i} ${value})]`
      }
      case "~":
      case "～": {
        const [name, dateStr] = [
          str.substring(0, opIndex).trim().toLowerCase(),
          str
            .substring(opIndex + 1)
            .trim()
            .toLowerCase(),
        ]
        if (!dateStr) break
        const [start, end] = parseDateRange(dateStr)
        if (start == null || end == null) break
        return `[?b :block/properties ?bp${i}]
          (not [?b :block/name])
          [(get ?bp${i} :${name}) ?v${i}]
          [(?ge ?v${i} ${start.getTime()})] [(?le ?v${i} ${end.getTime()})]`
      }
      default:
        break
    }
    return `[?b :block/properties ?bp${i}] [(get ?bp${i} :${str})] [?b :block/content]`
  } else if (cond.startsWith("[]") || cond.startsWith("【】")) {
    if (cond.length < 3) return ""
    const statuses = toStatus(cond.substring(2).toLowerCase())
    return `[?b :block/marker ?m]${
      statuses.length > 0
        ? ` (or ${statuses.map((status) => `[(= ?m "${status}")]`).join(" ")})`
        : ""
    }`
  } else if (cond.startsWith("%j ")) {
    const dateStr = cond.substring(3).trim().toLowerCase()
    if (!dateStr) return ""
    const [start, end] = parseDateRange(dateStr).map(
      (date) => date && format(date, "yyyyMMdd"),
    )
    if (start == null || end == null) return ""
    return `[?j${i} :block/journal-day ?d${i}]
      [(>= ?d${i} ${start})]
      [(<= ?d${i} ${end})]
      (or
        [?b :block/page ?j${i}]
        [?b :block/path-refs ?j${i}])`
  } else {
    // Defaults to text search.
    return `[?b :block/content ?c] [(?includes ?c "${cond}")]`
  }
}

export function includesValue(prop, val) {
  if (prop.toLowerCase == null) return false
  return prop.toLowerCase().includes(val.toLowerCase())
}

export function containsValue(prop, val) {
  if (!Array.isArray(prop)) return false
  const lowerVal = val.toLowerCase()
  return prop.some((v) => v.toLowerCase().includes(lowerVal))
}

export function ge(dateSet, val) {
  const date = convertToDate(dateSet)?.getTime()
  if (date == null) return false
  return date >= val
}

export function le(dateSet, val) {
  const date = convertToDate(dateSet)?.getTime()
  if (date == null) return false
  return date <= val
}

export function gt(dateSet, val) {
  const date = convertToDate(dateSet)?.getTime()
  if (date == null) return false
  return date > val
}

export function lt(dateSet, val) {
  const date = convertToDate(dateSet)?.getTime()
  if (date == null) return false
  return date < val
}

function convertToDate(dateSet) {
  try {
    const dateStr = dateSet[0]
    const date = parse(dateStr, dateFormat, new Date())
    return date
  } catch (err) {
    return null
  }
}

function filterMatch(filter, content) {
  if (!filter) return true
  if (!content) return false
  for (let i = 0, j = 0; i < content.length && j < filter.length; i++) {
    const t = filter[j].toLowerCase()
    const c = content[i].toLowerCase()
    if (c !== t) continue
    j++
    if (j >= filter.length) return true
  }
  return false
}

export async function postProcessResult(
  result,
  filter,
  needBreadcrumb = false,
  query,
  limit = 100,
) {
  const pageResult =
    query?.startsWith("#") && !/,，/.test(query)
      ? (
          await top.logseq.api.datascript_query(
            `[:find (pull ?b [*]) :where [?b :block/name "${query
              .substring(1)
              .toLowerCase()}"]]`,
          )
        )
          .flat()
          .map((page) => ({
            ...page,
            content: page["original-name"],
            "pre-block?": true,
          }))
      : []

  // Limit to the first n results.
  const blocks = pageResult
    .concat(
      filter
        ? result.filter(({ content, name }) =>
            filterMatch(filter, content ?? name),
          )
        : result,
    )
    .slice(0, limit)

  if (needBreadcrumb) {
    for (const block of blocks) {
      await setBlockBreadcrumb(block)
    }
  }

  return blocks
}

async function setBlockBreadcrumb(block) {
  // No breadcrumb for pages.
  if (block["pre-block?"]) return

  const path = []
  let tempBlock = block
  while (tempBlock.parent != null) {
    tempBlock =
      tempBlock.page.id === tempBlock.parent.id
        ? await logseq.Editor.getPage(tempBlock.parent.id)
        : await logseq.Editor.getBlock(tempBlock.parent.id)
    path.unshift({
      label: tempBlock.content
        ? await parseOneLineContent(tempBlock.content)
        : tempBlock.originalName,
      name: tempBlock.name,
      uuid: tempBlock.uuid,
    })
  }
  block.breadcrumb = path
}

function toStatus(s) {
  const ret = new Set()
  for (const c of s) {
    switch (c) {
      case "n":
        ret.add("NOW")
        break
      case "l":
        ret.add("LATER")
        break
      case "t":
        ret.add("TODO")
        break
      case "i":
        ret.add("DOING")
        break
      case "d":
        ret.add("DONE")
        break
      case "w":
        ret.add("WAITING")
        break
      case "c":
        ret.add("CANCELED")
        break
      default:
        break
    }
  }
  return Array.from(ret)
}

function buildTagQuery(cond) {
  if (!cond || !["#", ">", "》"].includes(cond[0])) return []
  const namePart = cond.replace(/^(#(>|#|!|！)?)|\>|》/, "").toLowerCase()
  if (!namePart) return []
  return [
    `[:find (pull ?b [:block/name :block/uuid]) :where [?b :block/name ?name] [(clojure.string/includes? ?name "${namePart}")]]`,
    namePart,
  ]
}

function parseDateRange(rangeStr) {
  const range = rangeStr
    .split(/~|～/)
    .map((part) => {
      part = part.trim()
      if (part.length === 8 && /[0-9]/.test(part[7])) {
        try {
          const date = parse(part, "yyyyMMdd", new Date())
          return [date, date]
        } catch (err) {
          return null
        }
      } else {
        const quantity = +part.substring(0, part.length - 1)
        const unit = part[part.length - 1]
        if (isNaN(quantity) || !UNITS.has(unit)) return null
        const anchor = addUnit[unit](new Date(), quantity)
        const start = startOfUnit[unit](anchor)
        const end = endOfUnit[unit](anchor)
        return [start, end]
      }
    })
    .filter((part) => part != null)
    .flat()
  if (range.length < 2) return []
  return [range[0], range[range.length - 1]]
}
