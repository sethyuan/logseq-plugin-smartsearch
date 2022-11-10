export default function AutoCompleteInput({ onClose }) {
  function onKeyUp(e) {
    if (
      e.key === "Escape" &&
      !e.shiftKey &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey
    ) {
      onClose?.()
    }
  }

  return (
    <div class="kef-ac-container" onKeyUp={onKeyUp}>
      <input type="text" />
    </div>
  )
}
