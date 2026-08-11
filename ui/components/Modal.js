export function createModalController(root) {
  let closeHandler = null;

  function open(content, onClose = null) {
    closeHandler = onClose;
    root.innerHTML = `
      <div class="modal-backdrop" data-modal-close>
        <section class="modal" role="dialog" aria-modal="true">
          <button class="modal-close" type="button" data-modal-close aria-label="Close">×</button>
          <div class="modal-content"></div>
        </section>
      </div>
    `;
    root.querySelector('.modal-content').append(content);
    root.hidden = false;
    root.querySelector('[data-modal-close]').addEventListener('click', event => {
      if (event.target.matches('[data-modal-close]')) close();
    });
  }

  function close() {
    root.hidden = true;
    root.replaceChildren();
    if (closeHandler) closeHandler();
    closeHandler = null;
  }

  return Object.freeze({ open, close });
}
