function MechSyncLogo({ compact = false }) {
  return (
    <span className={`brand-logo${compact ? ' brand-logo--compact' : ''}`}>
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M9.7 2.8h4.6l.6 2.2c.4.2.8.4 1.2.7l2.2-.6 2.3 4-1.7 1.6a7 7 0 0 1 0 1.4l1.7 1.6-2.3 4-2.2-.6c-.4.3-.8.5-1.2.7l-.6 2.2H9.7l-.6-2.2c-.4-.2-.8-.4-1.2-.7l-2.2.6-2.3-4 1.7-1.6a7 7 0 0 1 0-1.4L3.4 9.1l2.3-4 2.2.6c.4-.3.8-.5 1.2-.7l.6-2.2Z" />
        <circle cx="12" cy="11.4" r="3.1" />
      </svg>
      <strong>MechSync</strong>
    </span>
  );
}

export default MechSyncLogo;
