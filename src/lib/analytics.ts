import { supabase } from './supabase';

const SESSION_KEY = 'ag_session_id';

function getOrCreateSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

let sessionInitialized = false;

export async function initSession(language: string): Promise<void> {
  if (sessionInitialized) return;
  sessionInitialized = true;

  const id = getOrCreateSessionId();
  const params = new URLSearchParams(window.location.search);

  // Plain INSERT — session id is generated client-side so duplicates are rare
  // (only on page reload within same tab). ignoreDuplicates avoids the SELECT
  // permission that upsert/ON CONFLICT requires.
  await supabase.from('analytics_sessions').insert({
    id,
    referrer: document.referrer.slice(0, 512),
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    user_agent: navigator.userAgent.slice(0, 512),
    language,
  });
}

export async function trackEvent(
  event_type: string,
  payload: Record<string, unknown> = {}
): Promise<void> {
  const session_id = getOrCreateSessionId();
  await supabase.from('analytics_events').insert({
    session_id,
    event_type,
    ...payload,
  });
}

export async function trackClick(x: number, y: number, section: string): Promise<void> {
  await trackEvent('click', {
    click_x: Math.round(x),
    click_y: Math.round(y),
    page_width: window.innerWidth,
    page_height: document.documentElement.scrollHeight,
    section: section.slice(0, 64),
  });
}

export async function trackSectionView(section: string, timeMs: number): Promise<void> {
  await trackEvent('section_view', { section: section.slice(0, 64), time_on_section_ms: timeMs });
}

export async function trackScrollDepth(depth: number): Promise<void> {
  await trackEvent('scroll', { scroll_depth: Math.max(0, Math.min(100, depth)) });
}

// A/B Testing
export type ABVariant = { id: string; name: string; description: string };

const abCache: Record<string, ABVariant | null> = {};

export async function getABVariant(testName: string): Promise<ABVariant | null> {
  if (testName in abCache) return abCache[testName];

  // Use secure RPC instead of direct table access
  const { data: variants } = await supabase.rpc('get_active_ab_variants', {
    p_test_name: testName,
  });

  if (!variants || variants.length === 0) { abCache[testName] = null; return null; }

  // Deterministic assignment based on session id + test name
  const sessionId = getOrCreateSessionId();
  const hash = [...(sessionId + testName)].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const totalWeight = variants.reduce((s: number, v: { variant_weight: number }) => s + v.variant_weight, 0);
  let bucket = hash % totalWeight;
  let chosen = variants[0];
  for (const v of variants) {
    bucket -= v.variant_weight;
    if (bucket < 0) { chosen = v; break; }
  }

  abCache[testName] = {
    id: chosen.variant_id,
    name: chosen.variant_name,
    description: chosen.variant_description,
  };

  // Increment impression via secure RPC
  supabase.rpc('increment_ab_variant', {
    p_variant_id: chosen.variant_id,
    p_field: 'impressions',
  }).then(() => {});

  trackEvent('ab_impression', { ab_test_name: testName, ab_variant_name: chosen.variant_name });

  return abCache[testName];
}

export async function trackABConversion(testName: string): Promise<void> {
  const variant = abCache[testName];
  if (!variant) return;

  supabase.rpc('increment_ab_variant', {
    p_variant_id: variant.id,
    p_field: 'conversions',
  }).then(() => {});

  trackEvent('ab_conversion', { ab_test_name: testName, ab_variant_name: variant.name });
}
