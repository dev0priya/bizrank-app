import * as cheerio from 'cheerio';
import { ProcessedBusiness } from './processor';

export interface AuditedBusiness extends ProcessedBusiness {
    audit_mobile_responsive: boolean;
    audit_https: boolean;
    audit_speed_score: number;
    audit_seo_score: number;
    audit_ux_score: number;
    audit_contact_visible: boolean;
    audit_booking_engine: boolean;
    website_exists: boolean;
    ai_score: number;
}

export class WebsiteAuditor {
    
    static async auditBusinesses(businesses: ProcessedBusiness[]): Promise<AuditedBusiness[]> {
        console.log(`Starting Website Audit for ${businesses.length} businesses...`);
        
        // Audit with concurrency limit of 5 and max 3s timeout per website
        const concurrencyLimit = 5;
        const results: AuditedBusiness[] = [];

        for (let i = 0; i < businesses.length; i += concurrencyLimit) {
            const batch = businesses.slice(i, i + concurrencyLimit);
            const batchResults = await Promise.all(
                batch.map(biz => this.auditSingleWebsite(biz).catch(() => ({
                    ...biz,
                    audit_mobile_responsive: false,
                    audit_https: !!biz.website?.toLowerCase().startsWith('https://'),
                    audit_speed_score: 50,
                    audit_seo_score: 50,
                    audit_ux_score: 50,
                    audit_contact_visible: false,
                    audit_booking_engine: false,
                    website_exists: !!biz.website,
                    ai_score: biz.website ? 40 : 0
                })))
            );
            results.push(...batchResults);
        }

        console.log("Website Audit completed.");
        return results;
    }

    static async auditSingleWebsite(business: ProcessedBusiness): Promise<AuditedBusiness> {
        const defaultAudit = {
            audit_mobile_responsive: false,
            audit_https: false,
            audit_speed_score: 0,
            audit_seo_score: 0,
            audit_ux_score: 0,
            audit_contact_visible: false,
            audit_booking_engine: false,
            website_exists: false,
            ai_score: 0
        };

        if (!business.website || !business.website.trim()) {
            return { ...business, ...defaultAudit };
        }

        const isHttps = business.website.toLowerCase().startsWith('https://');

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const startTime = Date.now();
            const response = await fetch(business.website, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                }
            });
            clearTimeout(timeoutId);

            const duration = Date.now() - startTime;
            // Speed Score: <1s = 100, 1-3s = 50-99, >3s = <50
            const speedScore = duration < 1000 ? 100 : Math.max(0, 100 - Math.floor((duration - 1000) / 40));

            const html = await response.text();
            const $ = cheerio.load(html);

            const isMobileResponsive = $('meta[name="viewport"]').length > 0;
            
            // Basic UX checks
            const hasNavigation = $('nav').length > 0 || $('[role="navigation"]').length > 0;
            const hasCss = $('link[rel="stylesheet"]').length > 0 || $('style').length > 0;
            const uxScore = (hasNavigation ? 50 : 0) + (hasCss ? 50 : 0);

            // Basic SEO checks
            const hasTitle = $('title').length > 0 && $('title').text().trim().length > 0;
            const hasMetaDesc = $('meta[name="description"]').length > 0;
            const hasH1 = $('h1').length > 0;
            let seoScore = 0;
            if (hasTitle) seoScore += 40;
            if (hasMetaDesc) seoScore += 40;
            if (hasH1) seoScore += 20;

            const ctaKeywords = ['book', 'buy', 'shop', 'order', 'sign up', 'contact us', 'get started', 'learn more'];
            let hasBooking = false;
            $('a, button').each((_, el) => {
                if (hasBooking) return;
                const text = $(el).text().toLowerCase();
                if (ctaKeywords.some(keyword => text.includes(keyword))) {
                    hasBooking = true;
                }
            });

            let hasContact = $('a[href^="mailto:"], a[href^="tel:"]').length > 0;
            if (!hasContact) {
                $('a').each((_, el) => {
                    const href = $(el).attr('href') || '';
                    if (href.toLowerCase().includes('contact')) {
                        hasContact = true;
                    }
                });
            }

            // AI Score based on overall audit
            const aiScore = Math.round((speedScore + uxScore + seoScore + (isMobileResponsive ? 100 : 0) + (hasContact ? 100 : 0) + (hasBooking ? 100 : 0)) / 6);

            return {
                ...business,
                audit_mobile_responsive: isMobileResponsive,
                audit_https: isHttps,
                audit_speed_score: speedScore,
                audit_seo_score: seoScore,
                audit_ux_score: uxScore,
                audit_contact_visible: hasContact,
                audit_booking_engine: hasBooking,
                website_exists: true,
                ai_score: aiScore
            };

        } catch (_err) {
            // Website was listed, but failed to fetch or timed out
            return {
                ...business,
                ...defaultAudit,
                audit_https: isHttps,
                website_exists: true,
                ai_score: 35
            };
        }
    }
}
