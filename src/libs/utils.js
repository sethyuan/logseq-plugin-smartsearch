import { parse as parseMarkdown } from "./marked-renderer.js"

export async function parseContent(content) {
  // Remove properties.
  content = content.replace(/\b[^:\n]+:: [^\n]+/g, "")

  // Handle markdown.
  content = parseMarkdown(content)

  // Handle LaTex
  content = content.replaceAll(/(\${1,2})([^\$]+)\1/g, (str, _, expr) => {
    return parent.window.katex.renderToString(expr, { throwOnError: false })
  })

  // Replace block refs with their content.
  let match
  while ((match = /\(\(([^\)]+)\)\)/g.exec(content)) != null) {
    const start = match.index
    const end = start + match[0].length
    const refUUID = match[1]
    const refBlock = await logseq.Editor.getBlock(refUUID)
    const refContent = await parseContent(refBlock.content)
    content = `${content.substring(0, start)}${refContent}${content.substring(
      end,
    )}`
  }

  return content.trim()
}

export function buildQuery(q) {
  if (!q) return []
  const filterIndex = Math.max(q.lastIndexOf(";"), q.lastIndexOf("；"))
  const conds = (filterIndex > -1 ? q.substring(0, filterIndex) : q)
    .split(/[,，]/)
    .map((s) => s.trim())
  const condStr = conds.map((cond, i) => buildCond(cond, i)).join("\n")
  if (!condStr) return []
  return [
    `[:find (pull ?b [*]) :where ${condStr}]`,
    filterIndex > -1 ? q.substring(filterIndex + 1).trim() : null,
  ]
}

function buildCond(cond, i) {
  if (cond.length <= 1) return ""
  if (cond.startsWith("#")) {
    if (cond[1] === "#") {
      const name = cond.substring(2).toLowerCase()
      return `[?t${i} :block/name "${name}"] [?bp :block/refs ?t${i}] [?bp :block/uuid ?uuid] (or [?b :block/uuid ?uuid] [?b :block/parent ?bp])`
    } else {
      const name = cond.substring(1).toLowerCase()
      return `[?t${i} :block/name "${name}"] [?b :block/refs ?t${i}]`
    }
  } else if (cond.startsWith("@")) {
    const [name, value] = cond
      .substring(1)
      .split(/[:：]/)
      .map((s, i) => (i === 0 ? s.trim().toLowerCase() : s.trim()))
    if (value == null) {
      return `[?b :block/properties ?bp${i}] [(get ?bp${i} :${name})] (not [?b :block/name])`
    } else {
      return `[?b :block/properties ?bp${i}] [(get ?bp${i} :${name}) ?v${i}] (not [?b :block/name]) (or-join [?v${i}]
        [(= ?v${i} "${value}")]
        [(= ?v${i} ${value})]
        [(contains? ?v${i} "${value}")])`
    }
  }
}

export function filterMatch(filter, content) {
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
