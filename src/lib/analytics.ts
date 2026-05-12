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

  await supabase.from('analytics_sessions').upsert({
    id,
    referrer: document.referrer || '',
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    user_agent: navigator.userAgent,
    language,
  }, { onConflict: 'id', ignoreDuplicates: true });
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
    section,
  });
}

export async function trackSectionView(section: string, timeMs: number): Promise<void> {
  await trackEvent('section_view', { section, time_on_section_ms: timeMs });
}

export async function trackScrollDepth(depth: number): Promise<void> {
  await trackEvent('scroll', { scroll_depth: depth });
}

// A/B Testing
export type ABVariant = { id: string; name: string; description: string };

const abCache: Record<string, ABVariant | null> = {};

export async function getABVariant(testName: string): Promise<ABVariant | null> {
  if (testName in abCache) return abCache[testName];

  const { data: test } = await supabase
    .from('ab_tests')
    .select('id')
    .eq('name', testName)
    .eq('is_active', true)
    .maybeSingle();

  if (!test) { abCache[testName] = null; return null; }

  const { data: variants } = await supabase
    .from('ab_variants')
    .select('id, name, description, weight, impressions')
    .eq('test_id', test.id);

  if (!variants || variants.length === 0) { abCache[testName] = null; return null; }

  // Deterministic assignment based on session id + test name
  const sessionId = getOrCreateSessionId();
  const hash = [...(sessionId + testName)].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const totalWeight = variants.reduce((s, v) => s + v.weight, 0);
  let bucket = hash % totalWeight;
  let chosen = variants[0];
  for (const v of variants) {
    bucket -= v.weight;
    if (bucket < 0) { chosen = v; break; }
  }

  abCache[testName] = { id: chosen.id, name: chosen.name, description: chosen.description };

  // Track impression (fire-and-forget)
  supabase.from('ab_variants')
    .update({ impressions: chosen.impressions + 1 })
    .eq('id', chosen.id)
    .then(() => {});

  trackEvent('ab_impression', { ab_test_name: testName, ab_variant_name: chosen.name });

  return abCache[testName];
}

export async function trackABConversion(testName: string): Promise<void> {
  const variant = abCache[testName];
  if (!variant) return;

  const { data } = await supabase
    .from('ab_variants')
    .select('conversions')
    .eq('id', variant.id)
    .maybeSingle();

  if (data) {
    supabase.from('ab_variants')
      .update({ conversions: data.conversions + 1 })
      .eq('id', variant.id)
      .then(() => {});
  }

  trackEvent('ab_conversion', { ab_test_name: testName, ab_variant_name: variant.name });
}
