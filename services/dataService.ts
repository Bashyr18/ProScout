

import { Opportunity } from '../types';

// The calculateRelevance function scores opportunities based on keywords related to services, sectors,
// geography, and urgency, tuned for a sample consultancy profile.
export function calculateRelevance(row: Partial<Pick<Opportunity, 'Title' | 'Organization' | 'Location' | 'Deadline' | 'Stage' | 'Sector' | 'FundingSource'>>): number {
    let score = 0;

    // 1. Scope Match (Base Score: 40 points)
    // The new Gemini prompt is very strict, so any opportunity that passes it is considered a strong scope match.
    score += 40;

    // 2. Geography (Max 10 points)
    const location = (row.Location || '').toLowerCase();
    if (location.includes('nigeria')) {
        score += 10;
    } else if (location.includes('ghana') || location.includes('kenya') || location.includes('uganda') || location.includes('mauritius')) {
        score += 7;
    } else if (location.includes('africa')) {
        score += 5;
    } else {
        score += 2; // Global
    }

    // 3. Stage (Max 15 points)
    const stage = (row.Stage || '').toLowerCase();
    if (stage.includes('eoi') || stage.includes('expression of interest') || stage.includes('rfq') || stage.includes('request for qualification')) {
        score += 15;
    } else if (stage.includes('rfp') || stage.includes('request for proposal')) {
        score += 10;
    }

    // 4. Sector (Max 10 points) - Based on Murty Consulting profile
    const title = (row.Title || '').toLowerCase();
    const sector = (row.Sector || '').toLowerCase();
    if (title.includes('solar') || title.includes('mini-grid') || sector.includes('energy') || title.includes('power')) {
        score += 10;
    } else if (title.includes('transport') || title.includes('infrastructure') || sector.includes('transport')) {
        score += 7;
    } else if (title.includes('digital') || title.includes('ict') || sector.includes('digital')) {
        score += 5;
    }

    // 5. Funding Source (Max 5 points)
    const fundingSource = (row.FundingSource || '').toLowerCase();
    if (fundingSource.includes('world bank') || fundingSource.includes('afdb') || fundingSource.includes('adb') || fundingSource.includes('isdb') || fundingSource.includes('ebrd') || fundingSource.includes('undp')) {
        score += 5; // MDB funding
    } else if (fundingSource) {
        score += 2; // Other specified funding
    }
    
    // 6. Deadline Urgency (Max 5 points) - Prefer more buffer
    if (row.Deadline) {
        try {
            const deadlineDate = new Date(row.Deadline);
            if (!isNaN(deadlineDate.getTime())) {
                const now = new Date();
                const diffTime = deadlineDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays >= 14) {
                    score += 5; // >= 2 weeks left
                } else if (diffDays >= 7) {
                    score += 3; // >= 1 week left
                }
            }
        } catch (e) {
            console.error("Date parsing failed for relevance:", row.Deadline, e);
        }
    }

    // Normalize to a 100-point scale. Max possible score is 40+10+15+10+5+5 = 85.
    // So we'll scale by 100/85.
    return Math.min(100, Math.round(score * (100 / 85)));
}