// X/Twitter uses the same card as Open Graph. Route segment config can't be
// re-exported, so `revalidate` is declared here again.
export { default, alt, size, contentType } from "./opengraph-image";
export const revalidate = 600;
