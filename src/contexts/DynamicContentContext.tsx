import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export interface ContentRule {
  id: string;
  name: string;
  is_active: boolean;
  priority: number;
  match_utm_source: string | null;
  match_utm_medium: string | null;
  match_utm_campaign: string | null;
  match_referrer_contains: string | null;
  hero_title_pl: string | null;
  hero_title_en: string | null;
  hero_subtitle_pl: string | null;
  hero_subtitle_en: string | null;
  hero_description_pl: string | null;
  hero_description_en: string | null;
  hero_cta_primary_pl: string | null;
  hero_cta_primary_en: string | null;
  hero_cta_secondary_pl: string | null;
  hero_cta_secondary_en: string | null;
  hero_badge_1_pl: string | null;
  hero_badge_2_pl: string | null;
  hero_badge_3_pl: string | null;
  hero_badge_1_en: string | null;
  hero_badge_2_en: string | null;
  hero_badge_3_en: string | null;
  created_at: string;
  updated_at: string;
}

export interface HeroContent {
  title: string | null;
  subtitle: string | null;
  description: string | null;
  ctaPrimary: string | null;
  ctaSecondary: string | null;
  badge1: string | null;
  badge2: string | null;
  badge3: string | null;
}

interface DynamicContentContextType {
  hero: HeroContent;
  matchedRule: ContentRule | null;
  utmParams: Record<string, string>;
  reloadRules: () => void;
}

const DynamicContentContext = createContext<DynamicContentContextType>({
  hero: { title: null, subtitle: null, description: null, ctaPrimary: null, ctaSecondary: null, badge1: null, badge2: null, badge3: null },
  matchedRule: null,
  utmParams: {},
  reloadRules: () => {},
});

function getUtmParams(): Record<string, string> {
  const p = new URLSearchParams(window.location.search);
  return {
    utm_source: p.get('utm_source') || '',
    utm_medium: p.get('utm_medium') || '',
    utm_campaign: p.get('utm_campaign') || '',
    referrer: document.referrer,
  };
}

function ruleMatches(rule: ContentRule, params: Record<string, string>): boolean {
  if (rule.match_utm_source && rule.match_utm_source !== params.utm_source) return false;
  if (rule.match_utm_medium && rule.match_utm_medium !== params.utm_medium) return false;
  if (rule.match_utm_campaign && rule.match_utm_campaign !== params.utm_campaign) return false;
  if (rule.match_referrer_contains && !params.referrer.includes(rule.match_referrer_contains)) return false;
  return true;
}

function extractHero(rule: ContentRule, lang: string): HeroContent {
  const l = lang === 'pl' ? 'pl' : 'en';
  return {
    title:        rule[`hero_title_${l}` as keyof ContentRule] as string | null,
    subtitle:     rule[`hero_subtitle_${l}` as keyof ContentRule] as string | null,
    description:  rule[`hero_description_${l}` as keyof ContentRule] as string | null,
    ctaPrimary:   rule[`hero_cta_primary_${l}` as keyof ContentRule] as string | null,
    ctaSecondary: rule[`hero_cta_secondary_${l}` as keyof ContentRule] as string | null,
    badge1:       rule[`hero_badge_1_${l}` as keyof ContentRule] as string | null,
    badge2:       rule[`hero_badge_2_${l}` as keyof ContentRule] as string | null,
    badge3:       rule[`hero_badge_3_${l}` as keyof ContentRule] as string | null,
  };
}

const EMPTY_HERO: HeroContent = {
  title: null, subtitle: null, description: null,
  ctaPrimary: null, ctaSecondary: null, badge1: null, badge2: null, badge3: null,
};

export const DynamicContentProvider: React.FC<{ language: string; children: ReactNode }> = ({ language, children }) => {
  const [matchedRule, setMatchedRule] = useState<ContentRule | null>(null);
  const [hero, setHero] = useState<HeroContent>(EMPTY_HERO);
  const utmParams = React.useMemo(() => getUtmParams(), []);

  const loadRules = React.useCallback(() => {
    supabase.rpc('get_active_content_rules').then(({ data }) => {
      const match = data ? (data as ContentRule[]).find(r => ruleMatches(r, utmParams)) ?? null : null;
      setMatchedRule(match);
      setHero(match ? extractHero(match, language) : EMPTY_HERO);
    });
  }, [language, utmParams]);

  useEffect(() => { loadRules(); }, [loadRules]);

  // Re-derive hero overrides when language changes
  useEffect(() => {
    setHero(matchedRule ? extractHero(matchedRule, language) : EMPTY_HERO);
  }, [language, matchedRule]);

  return (
    <DynamicContentContext.Provider value={{ hero, matchedRule, utmParams, reloadRules: loadRules }}>
      {children}
    </DynamicContentContext.Provider>
  );
};

export const useDynamicContent = () => useContext(DynamicContentContext);
