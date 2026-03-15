/**
 * Instagram Bulk Comments Deletion Script
 *
 * Extended Version:
 * Only deletes comments that DO NOT contain a specific string marker.
 *
 * Marker example:
 * "!i!"  → comment will be kept
 *
 * Everything else → deleted
 */

(async function instagramBulkDelete() {
  window.__STOP_IG_BULK_DELETE__ = false;

  /**
   * Runtime configuration.
   */
  const MAX = 10;
  const KEEP_STRING = "!i!";

  const CYCLE_DELAY = 20000;
  const SELECT_DELAY = 1200;
  const ICON_DELAY = 700;
  const DELETE_DELAY = 1500;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * Simulates real pointer click (Bloks UI ignores .click())
   */
  function realClick(element) {
    element.scrollIntoView({ block: "center" });

    ["mousedown", "mouseup", "click"].forEach((eventType) => {
      element.dispatchEvent(
        new MouseEvent(eventType, {
          view: window,
          bubbles: true,
          cancelable: true,
          buttons: 1,
        }),
      );
    });
  }

  /**
   * Find the "Select" button
   */
  function findSelectButton() {
    return [
      ...document.querySelectorAll(
        'div[data-bloks-name="bk.components.Flexbox"]'
      ),
    ].find((el) => el.innerText?.trim() === "Select");
  }

  /**
   * Activate selection mode
   */
  async function activateSelectMode() {
    const selectBtn = findSelectButton();

    if (!selectBtn) {
      throw new Error("Select control not found");
    }

    realClick(selectBtn);
    await sleep(SELECT_DELAY);
  }

  /**
   * Get unselected comment icons
   */
  function getSelectableIcons() {
    return document.querySelectorAll(
      'div[data-bloks-name="ig.components.Icon"][style*="circle__outline"]'
    );
  }

  /**
   * Extract comment text associated with an icon
   */
  function getCommentTextFromIcon(icon) {
    const row = icon.closest('[data-bloks-name="bk.components.Flexbox"]');
    if (!row) return "";

    const spans = row.querySelectorAll(
      'span[data-bloks-name="bk.components.TextSpan"]'
    );

    return [...spans].map((s) => s.innerText).join(" ");
  }

  /**
   * Select comments that DO NOT contain KEEP_STRING
   */
  async function selectComments(max) {
    const icons = getSelectableIcons();
    if (!icons.length) return 0;

    let selected = 0;

    for (const icon of icons) {
      if (selected >= max) break;

      const commentText = getCommentTextFromIcon(icon);

      if (commentText.includes(KEEP_STRING)) {
        console.log("Skipping (marker found):", commentText);
        continue;
      }

      icon.scrollIntoView({ behavior: "smooth", block: "center" });
      await sleep(400);

      const button = icon.closest('[role="button"]');
      if (!button) continue;

      realClick(button);

      selected++;

      console.log("Selected for deletion:", commentText);

      await sleep(ICON_DELAY);
    }

    return selected;
  }

  /**
   * Locate Bloks delete button
   */
  function findBloksDeleteButton() {
    const deleteText = [
      ...document.querySelectorAll(
        'span[data-bloks-name="bk.components.TextSpan"]'
      ),
    ].find((span) => span.innerText?.trim() === "Delete");

    if (!deleteText) return null;

    return deleteText.closest('div[style*="pointer-events: auto"]');
  }

  /**
   * Trigger delete action
   */
  async function clickBloksDelete() {
    await sleep(SELECT_DELAY);

    const deleteBtn = findBloksDeleteButton();

    if (!deleteBtn) {
      throw new Error("Bloks Delete control not found");
    }

    realClick(deleteBtn);
  }

  /**
   * Find confirmation modal delete button
   */
  function findModalDeleteButton() {
    return [...document.querySelectorAll("button")].find(
      (btn) => btn.innerText?.trim() === "Delete"
    );
  }

  /**
   * Confirm final deletion
   */
  async function confirmFinalDelete() {
    await sleep(DELETE_DELAY);

    const modalDeleteBtn = findModalDeleteButton();

    if (!modalDeleteBtn) {
      throw new Error("Final confirmation button not found");
    }

    modalDeleteBtn.focus();

    await sleep(100);

    modalDeleteBtn.click();
  }

  /**
   * Main execution loop
   */
  let cycle = 1;

  while (!window.__STOP_IG_BULK_DELETE__) {
    try {
      await activateSelectMode();

      const deletedCount = await selectComments(MAX);

      if (!deletedCount) {
        console.log("No deletable comments found");
        break;
      }

      await clickBloksDelete();
      await confirmFinalDelete();

      console.log(`Cycle ${cycle}: deleted ${deletedCount} comments`);

      cycle++;

      await sleep(CYCLE_DELAY);
    } catch (error) {
      console.warn("Execution stopped:", error.message);
      break;
    }
  }
})();
