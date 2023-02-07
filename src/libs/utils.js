import { addDays, addMonths, addWeeks, addYears, parse } from "date-fns"

const UNITS = new Set(["y", "m", "w", "d"])

const addUnit = {
  y: addYears,
  m: addMonths,
  w: addWeeks,
  d: addDays,
}

let dateFormat

export function setDateFormat(value) {
  dateFormat = value
}

export async function parseContent(content) {
  // Remove properties.
  content = content.replace(/\b[^:\n]+:: [^\n]+/g, "")

  // Replace block refs with their content.
  let match
  while ((match = /(?:\(\()(?!\()([^\)]+)\)\)/g.exec(content)) != null) {
    const start = match.index
    const end = start + match[0].length
    const refUUID = match[1]
    try {
      const refBlock = await logseq.Editor.getBlock(refUUID)
      if (refBlock == null) break
      const refFirstLine = refBlock.content.match(/.*/)[0]
      const refContent = await parseContent(refFirstLine)
      content = `${content.substring(0, start)}${refContent}${content.substring(
        end,
      )}`
    } catch (err) {
      // ignore err
      break
    }
  }

  return content.trim()
}

export function buildQuery(q) {
  if (!q) return []
  const filterIndex = Math.max(q.lastIndexOf(";"), q.lastIndexOf("；"))
  const filter = filterIndex > -1 ? q.substring(filterIndex + 1).trim() : null
  const conds = (filterIndex > -1 ? q.substring(0, filterIndex) : q)
    .split(/[,，]/)
    .map((s) => s.trim())
  const condStr = conds
    .map((cond, i) => buildCond(cond, i))
    .join("\n")
    .trim()
  if (!condStr) return []
  const [tagQ, tag] = buildTagQuery(conds[conds.length - 1])
  return [
    `[:find (pull ?b [*]) :in $ ?includes ?contains ?ge ?le ?gt ?lt :where ${condStr}]`,
    filter,
    tagQ,
    tag,
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
    const op = str.match(/:|：|\<=|\>=|\>|\<|=| ~| ～| -| \+/)?.[0]
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
      case " ~":
      case " ～": {
        const [name, dateStr] = str
          .split(op)
          .map((s, i) => (i === 0 ? s.trim().toLowerCase() : s.trim()))
        if (!dateStr || dateStr.length < 2) break
        const [start, end] = lastDates(dateStr)
        if (start == null || end == null) break
        return `[?b :block/properties ?bp${i}]
          (not [?b :block/name])
          [(get ?bp${i} :${name}) ?v${i}]
          [(?ge ?v${i} ${start})] [(?le ?v${i} ${end})]`
      }
      case " -": {
        const [name, dateStr] = str
          .split(op)
          .map((s, i) => (i === 0 ? s.trim().toLowerCase() : s.trim()))
        if (!dateStr || dateStr.length < 2) break
        const refDate = pastDate(dateStr)
        if (refDate == null) break
        return `[?b :block/properties ?bp${i}]
          (not [?b :block/name])
          [(get ?bp${i} :${name}) ?v${i}]
          [(?lt ?v${i} ${refDate})]`
      }
      case " +": {
        const [name, dateStr] = str
          .split(op)
          .map((s, i) => (i === 0 ? s.trim().toLowerCase() : s.trim()))
        if (!dateStr || dateStr.length < 2) break
        const refDate = futureDate(dateStr)
        if (refDate == null) break
        return `[?b :block/properties ?bp${i}]
          (not [?b :block/name])
          [(get ?bp${i} :${name}) ?v${i}]
          [(?gt ?v${i} ${refDate})]`
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

export function postProcessResult(result, filter, limit = 100) {
  // Limit to the first n results.
  return (
    filter
      ? result.filter(({ content, name }) =>
          filterMatch(filter, content ?? name),
        )
      : result
  ).slice(0, limit)
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
  if (!cond?.startsWith("#")) return []
  const namePart = cond.replace(/^#(>|#|!|！)?/, "").toLowerCase()
  if (!namePart) return []
  return [
    `[:find (pull ?b [:block/name :block/uuid]) :where [?b :block/name ?name] [(clojure.string/includes? ?name "${namePart}")]]`,
    namePart,
  ]
}

function lastDates(dateStr) {
  const quantity = +dateStr.substring(0, dateStr.length - 1)
  const unit = dateStr[dateStr.length - 1]
  if (isNaN(quantity) || !UNITS.has(unit)) return []
  const today = new Date()
  const start = addUnit[unit](today, -quantity)
  return [start.getTime(), today.getTime()]
}

function pastDate(dateStr) {
  const quantity = +dateStr.substring(0, dateStr.length - 1)
  const unit = dateStr[dateStr.length - 1]
  if (isNaN(quantity) || !UNITS.has(unit)) return null
  const ret = addUnit[unit](new Date(), -quantity)
  return ret.getTime()
}

function futureDate(dateStr) {
  const quantity = +dateStr.substring(0, dateStr.length - 1)
  const unit = dateStr[dateStr.length - 1]
  if (isNaN(quantity) || !UNITS.has(unit)) return null
  const ret = addUnit[unit](new Date(), quantity)
  return ret.getTime()
}
