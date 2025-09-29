import { Opportunity } from '../types.ts';
import { calculateRelevance } from '../services/dataService.ts';

type SampleOpportunityData = Omit<Opportunity, 'id' | 'userId'>;

const rawSamples: Array<Omit<SampleOpportunityData, 'Relevance' | 'noticePageUrl' | 'URL' | 'foundAt'> & { URL: string }> = [
    {
        Organization: 'World Bank Group',
        Title: 'Consulting Services for Feasibility Study of the Accra-Tema Metro Rail Transit Project',
        Location: 'Ghana',
        'Published Date': '2024-05-15',
        Deadline: '2024-07-25',
        URL: 'https://projects.worldbank.org/en/projects-operations/procurement/deppsearch?lang=en&searchTerm=transaction%20advisory',
        Source: 'worldbank.org',
        manuallyAdded: false,
        status: 'New',
        chatHistory: [],
        citations: [{ title: 'World Bank Projects', uri: 'https://projects.worldbank.org' }],
        Stage: 'Feasibility',
        Budget: '$1.2M',
        Sector: 'Transport',
        SubmissionMethod: 'Online Portal',
        FundingSource: 'World Bank',
    },
    {
        Organization: 'African Development Bank (AfDB)',
        Title: 'Expression of Interest: Transaction Advisory for the Development of Solar Mini-Grids in Rural Nigeria',
        Location: 'Nigeria',
        'Published Date': '2024-05-20',
        Deadline: '2024-08-01',
        URL: 'https://www.afdb.org/en/projects-and-operations/procurement',
        Source: 'afdb.org',
        manuallyAdded: false,
        status: 'New',
        chatHistory: [],
        citations: [{ title: 'AfDB Procurement', uri: 'https://www.afdb.org' }],
        Stage: 'EOI',
        Budget: '—',
        Sector: 'Energy',
        SubmissionMethod: 'Email',
        FundingSource: 'African Development Bank (AfDB)',
    },
    {
        Organization: 'UNDP',
        Title: 'RFP for Development of an Outline Business Case (OBC) for Climate Resilient Infrastructure',
        Location: 'Kenya',
        'Published Date': '2024-06-01',
        Deadline: '2024-07-18',
        URL: 'https://procurement-notices.undp.org/view_negotiation.cfm?nego_id=19875',
        Source: 'undp.org',
        manuallyAdded: false,
        status: 'New',
        chatHistory: [],
        citations: [{ title: 'UNDP Procurement', uri: 'https://procurement-notices.undp.org' }],
        Stage: 'RFP',
        Budget: '$450,000',
        Sector: 'Climate Resilience',
        SubmissionMethod: 'Online Portal',
        FundingSource: 'UNDP',
    }
];

// Calculate relevance for each sample
export const sampleOpportunities: Omit<SampleOpportunityData, 'userId'>[] = rawSamples.map(op => ({
    ...op,
    // For sample data, we'll make the notice page the main URL and invent a PDF link.
    noticePageUrl: op.URL,
    URL: op.URL.endsWith('pdf') ? op.URL : null,
    Relevance: calculateRelevance(op),
    foundAt: Date.now() - Math.floor(Math.random() * 1000 * 3600 * 24 * 5), // random time in last 5 days
}));