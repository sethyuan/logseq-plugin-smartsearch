export default function Breadcrumb({ segments }) {
  return (
    <span class="kef-ss-b-segs">
      {segments.map(({ label, name, uuid }, i) => (
        <>
          <span key={uuid} className="kef-ss-b-label">
            {label}
          </span>
          {i + 1 < segments.length && (
            <span class="kef-ss-b-spacer mx-2 opacity-50">➤</span>
          )}
        </>
      ))}
    </span>
  )
}
