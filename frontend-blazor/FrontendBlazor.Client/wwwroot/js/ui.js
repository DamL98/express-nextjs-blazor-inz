export function showDialog(dialog) {
  const previousFocus = document.activeElement;
  // Blazor can remove the triggering row and dialog in the same render batch.
  // Restore focus after that batch, not during component disposal.
  const observer = new MutationObserver(() => {
    if (dialog.isConnected) return;
    observer.disconnect();
    dialog.close();
    if (previousFocus?.isConnected && !previousFocus.disabled)
      previousFocus.focus();
    else document.getElementById("reservation-search")?.focus();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  dialog.showModal();
  dialog.querySelector("button")?.focus();
}
export function focusField(id) {
  document.getElementById(id)?.focus();
}
export function timeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
