import { useEffect, useRef } from 'react';
import { useApp } from '../state/AppContext.jsx';
import { playSound } from '../audio/audio.js';

/** Button with click sound. */
export function Button({ variant = 'secondary', size, icon, children, onClick, className = '', silent, ...rest }) {
  return (
    <button
      type="button"
      className={`btn btn-${variant} ${size ? `btn-${size}` : ''} ${className}`}
      onClick={(e) => {
        if (!silent) playSound('click');
        onClick?.(e);
      }}
      {...rest}
    >
      {icon && (
        <span className="btn-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="btn-label">{children}</span>
    </button>
  );
}

/** Screen layout with a header and a back button. */
export function Screen({ title, onBack, children, className = '', actions, withBanner }) {
  const { t } = useApp();
  return (
    <div className={`screen ${withBanner ? 'with-banner' : ''} ${className}`}>
      <header className="screen-header">
        {onBack ? (
          <button
            type="button"
            className="icon-btn back-btn"
            onClick={() => {
              playSound('click');
              onBack();
            }}
            aria-label={t('common.back')}
          >
            <span className="flip-rtl" aria-hidden="true">
              ‹
            </span>
          </button>
        ) : (
          <span className="icon-btn-placeholder" />
        )}
        <h1 className="screen-title">{title}</h1>
        <div className="screen-actions">{actions ?? <span className="icon-btn-placeholder" />}</div>
      </header>
      <main className="screen-body">{children}</main>
    </div>
  );
}

export function Toggle({ checked, onChange, label, icon }) {
  const { t } = useApp();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className="row row-toggle"
      onClick={() => {
        playSound('click');
        onChange(!checked);
      }}
    >
      <span className="row-label">
        {icon && <span className="row-icon" aria-hidden="true">{icon}</span>}
        {label}
      </span>
      <span className={`switch ${checked ? 'on' : ''}`}>
        <span className="switch-text">{checked ? t('common.on') : t('common.off')}</span>
        <span className="switch-knob" />
      </span>
    </button>
  );
}

/** Segmented control: options = [{ value, label }] */
export function Segmented({ value, options, onChange, ariaLabel }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={`segment ${value === o.value ? 'active' : ''} ${o.className ?? ''}`}
          onClick={() => {
            playSound('click');
            onChange(o.value);
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Modal({ open, onClose, children, labelledBy }) {
  const ref = useRef(null);
  useEffect(() => {
    if (open) ref.current?.querySelector('button')?.focus();
  }, [open]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, text, confirmLabel, danger, onConfirm, onCancel }) {
  const { t } = useApp();
  return (
    <Modal open={open} onClose={onCancel} labelledBy="confirm-title">
      <h2 id="confirm-title" className="modal-title">
        {title}
      </h2>
      <p className="modal-text">{text}</p>
      <div className="modal-actions">
        <Button onClick={onCancel}>{t('common.cancel')}</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
          {confirmLabel ?? t('common.confirm')}
        </Button>
      </div>
    </Modal>
  );
}

export function Card({ title, children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {title && <h2 className="card-title">{title}</h2>}
      {children}
    </section>
  );
}

export function StatTile({ label, value, icon, accent }) {
  return (
    <div className={`stat-tile ${accent ? 'accent' : ''}`}>
      {icon && <div className="stat-icon" aria-hidden="true">{icon}</div>}
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export function StatRow({ label, value }) {
  return (
    <div className="stat-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((x) => (
        <div key={x.id} className="toast">
          {x.icon && <span className="toast-icon">{x.icon}</span>}
          <span>{x.message}</span>
        </div>
      ))}
    </div>
  );
}
