import { parse as parseMarkdown } from "./marked-renderer.js"

export async function parseContent(content) {
  // Use only the first line.
  content = content.match(/.*/)[0]

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
  // TODO
  return `[:find (pull ?b [*])
          :where
          [?t1 :block/name "前端"]
          [?t2 :block/name "技巧"]
          [?b :block/refs ?t1]
          [?b :block/refs ?t2]
          ]`
}

export async function isPage(block) {
  return (
    block.parent.id === block.page.id &&
    (await logseq.Editor.getPreviousSiblingBlock(block.uuid)) == null
  )
}
