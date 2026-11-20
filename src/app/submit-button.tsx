"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Shown instead of children while the parent form's server action runs. */
  pendingLabel?: ReactNode;
  /** Keep the button focusable while pending (for toggles whose focus drives follow-up styling). */
  stayEnabled?: boolean;
};

/** Submit button that reflects the enclosing form's pending state (aria-busy, and disabled unless stayEnabled). */
export function SubmitButton({ children, pendingLabel, stayEnabled = false, ...rest }: Props) {
  const { pending } = useFormStatus();
  return (
    <button {...rest} type="submit" aria-busy={pending} disabled={!stayEnabled && pending ? true : rest.disabled}>
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
