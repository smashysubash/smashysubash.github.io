/** Thin wrapper over Umami so calls are safe when analytics is off or blocked. */
type Umami = { track: (event: string, data?: Record<string, string | number>) => void };

export function track(event: string, data?: Record<string, string | number>) {
  try {
    (window as unknown as { umami?: Umami }).umami?.track(event, data);
  } catch {
    /* analytics must never break the page */
  }
}

/**
 * Per-application links like `?ref=acme`: record where the visit came from once Umami is ready.
 * Nothing on the page changes for the visitor.
 */
export function trackRef() {
  const ref = new URLSearchParams(location.search).get('ref');
  if (!ref) return;
  const value = ref.slice(0, 60);
  let tries = 0;
  const tick = () => {
    if ((window as unknown as { umami?: Umami }).umami) track('ref', { ref: value });
    else if (tries++ < 20) setTimeout(tick, 250);
  };
  tick();
}
