type IconProps = { className?: string };

const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export function CheckIcon({ className }: IconProps) {
  return <svg {...base} strokeWidth={2.6} className={className ?? "icon"}><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>;
}

export function PlusIcon({ className }: IconProps) {
  return <svg {...base} strokeWidth={2.2} className={className ?? "icon"}><path d="M12 5v14M5 12h14"/></svg>;
}

export function ArrowLeftIcon({ className }: IconProps) {
  return <svg {...base} strokeWidth={2} className={className ?? "icon"}><path d="M19 12H5M11 6l-6 6 6 6"/></svg>;
}

export function MailIcon({ className }: IconProps) {
  return <svg {...base} strokeWidth={1.7} className={className ?? "icon"}><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M4 7l8 6 8-6"/></svg>;
}
