export type IconName =
  | "layout-dashboard"
  | "building-2"
  | "calendar-days"
  | "calendar-plus"
  | "calendar-x"
  | "log-out"
  | "arrow-left"
  | "arrow-right"
  | "map-pin"
  | "users"
  | "circle-check"
  | "circle-alert"
  | "refresh-cw"
  | "settings"
  | "search"
  | "clock"
  | "shield-check"
  | "link"
  | "mail"
  | "lock-keyhole";

type AppIconProps = {
  name: IconName;
  className?: string;
};

// Ikony uzupełniają tekst; czytnik ekranu odczytuje etykietę elementu nadrzędnego.
export function AppIcon({ name, className = "mr-2 inline-block size-4 align-[-0.15em]" }: AppIconProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      className={`shrink-0 ${className}`}
    >
      <use href={`/icons/ui-icons.svg#${name}`} />
    </svg>
  );
}
