import type { ReactNode, UIEvent } from "react";

type ModalProps = {
  title: string;
  onClose: () => void;
  onScrollEnd?: () => void;
  footer?: ReactNode;
  children: ReactNode;
};

function Modal({ title, onClose, onScrollEnd, footer, children }: ModalProps) {
  function handleScroll(e: UIEvent<HTMLDivElement>) {
    if (!onScrollEnd) return;

    const el = e.currentTarget;
    const reachedEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 120;

    if (reachedEnd) onScrollEnd();
  }

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h2 className="modalTitle">{title}</h2>
          <button
            type="button"
            className="modalClose"
            onClick={onClose}
            aria-label="fechar"
          >
            ✕
          </button>
        </div>

        <div className="modalBody" onScroll={handleScroll}>
          {children}
        </div>

        {footer ? <div className="modalFooter">{footer}</div> : null}
      </div>
    </div>
  );
}

export default Modal;
