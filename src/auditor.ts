import axios from 'axios';
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
        const auditedBusinesses: AuditedBusiness[] = [];

        for (const business of businesses) {
            const audited = await this.auditSingleWebsite(business);
            auditedBusinesses.push(audited);
        }

        console.log("Website Audit completed.");
        return auditedBusinesses;
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

        if (!business.website) {
            return { ...business, ...defaultAudit };
        }

        try {
            const isHttps = business.website.toLowerCase().startsWith('https://');
            
            const startTime = Date.now();
            const response = await axios.get(business.website, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            const duration = Date.now() - startTime;
            
            // Speed Score: <1s = 100, 1-3s = 50-99, >3s = <50
            const speedScore = duration < 1000 ? 100 : Math.max(0, 100 - Math.floor((duration - 1000) / 40));

            const html = response.data;
            const $ = cheerio.load(html);

            const isMobileResponsive = $('meta[name="viewport"]').length > 0;
            
            // Basic UX checks
            const hasNavigation = $('nav').length > 0 || $('[role="navigation"]').length > 0;
            const hasCss = $('link[rel="stylesheet"]').length > 0 || $('style').length > 0;
            const uxScore = (hasNavigation ? 50 : 0) + (hasCss ? 50 : 0);

            // Basic SEO checks
            const hasTitle = $('title').length > 0 && $('title').text().length > 0;
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

        } catch (error) {
            return {
                ...business,
                ...defaultAudit,
            };
        }
    }
}
