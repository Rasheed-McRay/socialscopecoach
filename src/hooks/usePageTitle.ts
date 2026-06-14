import { useEffect } from "react";

const BRAND = "SocialScope";

/**
 * Sets document.title to `${title} | SocialScope` for the page lifetime,
 * restoring the previous title on unmount.
 * Pass `{ bare: true }` to skip the brand suffix.
 */
export function usePageTitle(title: string, opts?: { bare?: boolean }) {
  useEffect(() => {
    const prev = document.title;
    document.title = opts?.bare ? title : `${title} | ${BRAND}`;
    return () => {
      document.title = prev;
    };
  }, [title, opts?.bare]);
}
