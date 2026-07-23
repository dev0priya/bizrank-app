import axios from 'axios';
import * as cheerio from 'cheerio';
import { ProcessedBusiness } from './processor';

export interface AuditedBusiness extends ProcessedBusiness {
    audit_mobile_responsive: boolean;
    audit_https: boolean;
    audit_navigation: boolean;
    audit_ui_design: boolean;
    audit_typography: boolean;
    audit_cta: boolean;
    audit_contact_visibility: boolean;
    audit_images: boolean;
    audit_branding: boolean;
    audit_loading_speed: boolean;
    audit_accessibility: boolean;
    website_score: number;
    website_classification: string;
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
            audit_navigation: false,
            audit_ui_design: false,
            audit_typography: false,
            audit_cta: false,
            audit_contact_visibility: false,
            audit_images: false,
            audit_branding: false,
            audit_loading_speed: false,
            audit_accessibility: false,
            website_score: 0,
            website_classification: "No Website"
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
            const hasGoodSpeed = duration < 3000;

            const html = response.data;
            const $ = cheerio.load(html);

            const isMobileResponsive = $('meta[name="viewport"]').length > 0;
            const hasNavigation = $('nav').length > 0 || $('[role="navigation"]').length > 0;
            const hasCss = $('link[rel="stylesheet"]').length > 0 || $('style').length > 0;
            const hasSections = $('header, main, footer, section').length >= 2;
            const hasGoodUIDesign = hasCss && hasSections;
            const hasCustomTypography = $('link[href*="fonts.googleapis.com"], link[href*="use.typekit.net"]').length > 0 || 
                                        $('style').text().includes('@font-face');

            const ctaKeywords = ['book', 'buy', 'shop', 'order', 'sign up', 'contact us', 'get started', 'learn more'];
            let hasCTA = false;
            $('a, button').each((_, el) => {
                if (hasCTA) return;
                const text = $(el).text().toLowerCase();
                if (ctaKeywords.some(keyword => text.includes(keyword))) {
                    hasCTA = true;
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

            const hasImages = $('img').length > 0;
            const hasFavicon = $('link[rel="icon"], link[rel="shortcut icon"]').length > 0;
            const hasLogo = $('img[src*="logo"], img[class*="logo"], img[id*="logo"], img[alt*="logo"]').length > 0;
            const hasBranding = hasFavicon || hasLogo;

            const totalImages = $('img').length;
            const imagesWithAlt = $('img[alt]').length;
            const isAccessible = totalImages === 0 ? true : (imagesWithAlt / totalImages) >= 0.8;

            const flags: Record<string, boolean> = {
                audit_mobile_responsive: isMobileResponsive,
                audit_https: isHttps,
                audit_navigation: hasNavigation,
                audit_ui_design: hasGoodUIDesign,
                audit_typography: hasCustomTypography,
                audit_cta: hasCTA,
                audit_contact_visibility: hasContact,
                audit_images: hasImages,
                audit_branding: hasBranding,
                audit_loading_speed: hasGoodSpeed,
                audit_accessibility: isAccessible,
            };

            const criteriaCount = Object.keys(flags).length;
            let passedCount = 0;
            for (const key in flags) {
                if (flags[key]) passedCount++;
            }
            
            const score = Math.round((passedCount / criteriaCount) * 100);

            let classification = "Needs Improvement";
            if (score >= 80) classification = "Excellent";
            else if (score >= 50) classification = "Good";

            return {
                ...business,
                ...flags,
                website_score: score,
                website_classification: classification
            } as AuditedBusiness;

        } catch (error) {
            return {
                ...business,
                ...defaultAudit,
                website_classification: "No Website"
            };
        }
    }
}
