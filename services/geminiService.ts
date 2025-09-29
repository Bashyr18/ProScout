import { GoogleGenAI, HarmCategory, HarmBlockThreshold, GenerateContentResponse, Type } from "@google/genai";
import { Opportunity, AgentMission, SearchStreamEvent, RawStreamedOpportunity } from "../types";

// --- System Instructions & Schema ---

const URL_FINDER_SYSTEM_INSTRUCTION = `You are an expert web researcher specializing in public procurement. Your goal is to find official websites for PPP Transaction Advisory services.

**Objective:**
Based on the user's query, find and list up to 10 highly relevant URLs that are **official sources** for public procurement notices.

**Allow-listed Data Sources (Prioritize these):**
- Official Government Procurement Portals and PPP Units (e.g., FMCIDE, ICRC Nigeria, BPP Nigeria, Kenya PPP Directorate, South Africa GTAC, Uganda PPP Unit, PPP Center Philippines, EU TED, UK Contracts Finder, USA MCC, IDB Invest).
- Multilateral Development Bank (MDB) portals (e.g., World Bank RFx/eConsult, AfDB, ADB CSRN, IsDB, EBRD eSelection).

**Strict Rules:**
- **DO NOT** list news articles, blog posts, or generic company homepages.
- **DO NOT** list aggregators unless they provide a direct deep-link to an official notice or an original PDF document.
- Your entire output must be **only the raw URLs**, each on a new line. Do not add any commentary, numbering, or markdown.

**Example User Query:** "Transaction advisory for solar mini-grids in Nigeria"
**Example Output:**
https://projects.worldbank.org/en/projects-operations/procurement
https://www.afdb.org/en/projects-and-operations/procurement
https://www.icrc.gov.ng/tenders/
https://ppp.worldbank.org/public-private-partnership/library/procurement
`;

const URL_PROCESSOR_SYSTEM_INSTRUCTION = `You are a highly discerning data extraction AI for a PPP Transaction Advisory firm named Murty Consulting. Your primary function is to analyze webpage text and determine if it represents a **single, specific, actionable procurement opportunity notice** that is a good fit for the firm. You must be extremely strict and act as if you are performing a multi-step validation process.

**Core Mission & Validation Flow:**
1.  **Analyze Content:** Read the provided webpage text.
2.  **Validate Relevancy:** Determine if the opportunity is for **PPP Transaction Advisory**.
    - **Relevant Scope:** Transaction advisory, feasibility/structuring, financial modeling, value for money analysis, market sounding, RFQ/RFP preparation, procurement support, contract drafting/negotiation, or financial close support.
    - **Irrelevant Scope (MUST REJECT):** Owner’s engineer, construction supervision, EPC contracts, O&M-only, audit-only, policy studies without a transaction component, or single-CV/individual consultant hires (unless it's for a full transaction advisory role).
3.  **Validate Stage:** The opportunity stage must be **EOI (Expression of Interest), RFQ (Request for Qualification), or RFP (Request for Proposal)**. Reject all others.
4.  **Validate Deadline:** The opportunity MUST have a clear deadline that is in the **future**. If the deadline is missing or has passed, you must reject it.
5.  **Final Decision:** If the opportunity passes ALL validation steps, extract its details into a single JSON object using the structure below. Otherwise, you **MUST** return the literal value \`null\`.

**Critical Rejection Criteria (Return \`null\` if ANY of these are true):**
*   The page is a **list of multiple tenders** or a search results page.
*   The page is a generic "procurement" portal homepage, not a detail page for one specific tender.
*   The content is an article, blog post, or news report *about* procurement, not the notice itself.
*   The text lacks key details like a specific title, a description of the services required, or the procuring organization.
*   The scope is on the "Irrelevant Scope" list above.
*   The stage is not EOI, RFQ, or RFP.
*   The deadline is missing or in the past.

**JSON Extraction Rules (Only if a valid opportunity is found):**
1.  Your *entire* response must be EITHER a single valid JSON object OR the literal \`null\`. No other text, explanations, or markdown is allowed.
2.  If a value for a field isn't present in the source text, the value in the JSON MUST be \`null\`. Do not invent data.
3.  The \`noticePageUrl\` field in the JSON MUST be the original URL provided for analysis.
4.  Search the content for a direct download link to a document (PDF, DOC, DOCX). If a valid link is found, use it for the \`URL\` field. If not, \`URL\` MUST be \`null\`.
5.  The JSON object must have the following structure. Fill in the values by extracting them from the page content.

\`\`\`json
{
  "Organization": "string",
  "Title": "string",
  "Location": "string",
  "Published Date": "string (YYYY-MM-DD) or null",
  "Deadline": "string (YYYY-MM-DD) or null",
  "URL": "string (direct document link) or null",
  "noticePageUrl": "string (the page URL you analyzed)",
  "Source": "string (e.g., worldbank.org)",
  "Budget": "string or null",
  "Stage": "string (EOI, RFQ, or RFP) or null",
  "Sector": "string or null",
  "SubmissionMethod": "string or null",
  "FundingSource": "string or null"
}
\`\`\`
`;

const TEXT_PARSER_SYSTEM_INSTRUCTION = `You are an expert data extraction AI. Your task is to analyze the provided text, which could be a markdown table, a list, or unstructured paragraphs, and extract all distinct procurement opportunities into a structured JSON array.

**Rules:**
1.  Your entire output MUST be a single, valid JSON array of objects. Do not add any commentary, explanations, or markdown fences. If no opportunities are found, return an empty array \`[]\`.
2.  Analyze the text to find details for each opportunity. Each object in the array should conform to the provided JSON schema.
3.  For each field, if you cannot find a corresponding value in the text, you MUST use \`null\`. Do not invent data.
4.  Derive the 'Source' field from the domain name of any provided links (e.g., 'worldbank.org').
5.  The 'URL' field should be a direct link to a document (PDF, DOC), if available. Otherwise, it should be null.
6.  The 'noticePageUrl' should be the primary webpage for the tender notice. If only one link is available, use it for 'noticePageUrl'.
7.  Parse dates into 'YYYY-MM-DD' format if possible. If you can't parse a date, leave it as the original string or set to null.`;

const opportunitySchema = {
    type: Type.OBJECT,
    properties: {
        Organization: { type: Type.STRING, description: "The name of the procuring authority or organization." },
        Title: { type: Type.STRING, description: "The official title of the project or assignment." },
        Location: { type: Type.STRING, description: "The country or primary location of the project." },
        "Published Date": { type: Type.STRING, nullable: true, description: "The date the notice was published, in YYYY-MM-DD format." },
        Deadline: { type: Type.STRING, nullable: true, description: "The submission deadline, in YYYY-MM-DD format." },
        URL: { type: Type.STRING, description: "Direct download link for a document (.pdf, .doc). Must be null if not found.", nullable: true },
        noticePageUrl: { type: Type.STRING, description: "The URL of the specific tender notice webpage." },
        Source: { type: Type.STRING, description: "The website domain (e.g., 'worldbank.org')." },
        Budget: { type: Type.STRING, nullable: true, description: "The estimated budget, if available." },
        Stage: { type: Type.STRING, nullable: true, description: "The procurement stage (e.g., EOI, RFQ, RFP)." },
        Sector: { type: Type.STRING, nullable: true, description: "The primary sector (e.g., Energy, Transport, Water, Digital Infrastructure)." },
        SubmissionMethod: { type: Type.STRING, nullable: true, description: "How to submit the proposal (e.g., Online Portal, Email)." },
        FundingSource: { type: Type.STRING, nullable: true, description: "The source of funding for the project (e.g., World Bank, AfDB, Government)." },
        citations: {
            type: Type.ARRAY,
            description: "This is handled programmatically, do not generate.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    uri: { type: Type.STRING }
                },
                required: ["title", "uri"]
            }
        }
    },
    required: ["Organization", "Title", "Location", "noticePageUrl", "Source", "Deadline", "Stage"]
};


// Define safety settings to be less restrictive. This helps prevent the model from
// returning empty responses due to its default safety filters being overly cautious,
// which can cause JSON parsing errors.
const permissiveSafetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
];

export async function* runStructuredSearchMission(
    client: GoogleGenAI,
    mission: AgentMission,
    companyProfile?: string,
    signal?: AbortSignal
): AsyncGenerator<SearchStreamEvent> {
    const model = 'gemini-2.5-flash';
    const { userPrompt } = mission;

    const timeoutPromise = <T>(ms: number, promise: Promise<T>, message: string): Promise<T> => {
        let timeoutId: number;
        const timeout = new Promise<T>((_, reject) => {
            timeoutId = window.setTimeout(() => reject(new Error(message)), ms);
        });
        return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
    };

    // --- PHASE 1: Find Potential URLs ---
    yield { type: 'progress', data: { message: 'Phase 1: Identifying potential sources...' } };

    let researchResponse: GenerateContentResponse;
    try {
        const researchCall = client.models.generateContent({
            model,
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            config: {
                systemInstruction: URL_FINDER_SYSTEM_INSTRUCTION,
                tools: [{ googleSearch: {} }],
                safetySettings: permissiveSafetySettings,
            },
        });
        researchResponse = await timeoutPromise(60000, researchCall, "AI source identification phase timed out after 60 seconds.");
    } catch (e) {
        yield { type: 'progress', data: { message: `Error during source identification: ${(e as Error).message}` } };
        return;
    }

    if (signal?.aborted) return;

    const urlsToProcess = (researchResponse.text ?? '')
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.startsWith('http'))
        .slice(0, 15); // Limit to a max of 15 URLs to be safe

    if (urlsToProcess.length === 0) {
        yield { type: 'progress', data: { message: 'Phase 1: No potential sources found. Mission ending.' } };
        return;
    }

    yield { type: 'progress', data: { message: `Phase 2: Analyzing ${urlsToProcess.length} sources...` } };

    // --- PHASE 2: Analyze Each URL ---
    let totalFound = 0;
    for (let i = 0; i < urlsToProcess.length; i++) {
        const urlToAnalyze = urlsToProcess[i];
        if (signal?.aborted) return;

        // Add a delay between processing each URL to avoid hitting rate limits.
        if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        yield { type: 'progress', data: { message: `Analyzing source ${i + 1}/${urlsToProcess.length}...` } };

        try {
            const singleStepPrompt = `My company's original request was: "${mission.params.query}".
            Now, please use the google search tool to visit this specific URL, read its full content, and then strictly analyze it according to your detailed system instructions.

            URL to visit and analyze: ${urlToAnalyze}`;

            const singleStepCall = client.models.generateContent({
                model,
                contents: [{ role: 'user', parts: [{ text: singleStepPrompt }] }],
                config: {
                    systemInstruction: URL_PROCESSOR_SYSTEM_INSTRUCTION,
                    tools: [{ googleSearch: {} }],
                    safetySettings: permissiveSafetySettings,
                },
            });

            const extractResponse: GenerateContentResponse = await timeoutPromise(150000, singleStepCall, `Analysis of source ${i + 1} timed out after 150 seconds.`);
            
            if (signal?.aborted) return;

            let resultText = (extractResponse.text ?? '').trim();

            // The model might return the literal string "null" with or without markdown backticks or an empty string.
            if (resultText.toLowerCase() === 'null' || resultText === '`null`' || resultText === '""') {
                continue; // This is a valid rejection, continue to the next URL.
            }

            // The model might wrap the JSON in markdown code fences. Let's extract it.
            const jsonMatch = resultText.match(/```(json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[2]) {
                resultText = jsonMatch[2].trim();
            }
            
            let opportunity: RawStreamedOpportunity | null = null;
            try {
                opportunity = JSON.parse(resultText) as RawStreamedOpportunity;
            } catch (parseError) {
                // The model returned text that is not valid JSON, which is a soft failure.
                // Log it for debugging but don't treat it as a critical error.
                console.warn(`Could not parse JSON for URL ${urlToAnalyze}. Response was: "${resultText}"`);
                continue; // Move to the next URL.
            }

            // The model can sometimes return an empty object {} or a malformed object.
            if (opportunity && opportunity.Title && opportunity.noticePageUrl) {
                if (!opportunity.citations || opportunity.citations.length === 0) {
                    opportunity.citations = [{ title: opportunity.Source || 'Source Link', uri: opportunity.noticePageUrl }];
                }
                
                yield { type: 'opportunity', data: opportunity };
                totalFound++;
                yield { type: 'progress', data: { message: `Found: ${opportunity.Title.substring(0, 30)}... (${totalFound} total)` } };
            }
        } catch (e) {
            const errorMessage = (e as Error).message || JSON.stringify(e);
            console.error(`Failed to process URL ${urlToAnalyze}:`, errorMessage);

            let progressMessage = `Skipping source ${i + 1} due to error.`;
            if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
                progressMessage = `Rate limit reached. Pausing before next source...`;
                yield { type: 'progress', data: { message: progressMessage } };
                await new Promise(resolve => setTimeout(resolve, 5000));
            } else {
                 yield { type: 'progress', data: { message: progressMessage } };
            }
        }
    }

    yield { type: 'progress', data: { message: `Analysis complete. Found ${totalFound} new opportunities.` } };
}

export async function* generateInsightsStream(client: GoogleGenAI, opportunities: Opportunity[]): AsyncGenerator<string> {
    const model = 'gemini-2.5-flash';
    const dataSubset = opportunities.slice(0, 25).map(op => ({
        Title: op.Title,
        Organization: op.Organization,
        Location: op.Location,
        Deadline: op.Deadline,
    }));
    
    const prompt = `Based on this list of procurement opportunities, generate a high-level market analysis.
    - What are the dominant themes or sectors?
    - Are there any geographic hotspots?
    - What types of services are most in demand?
    - Who are the key clients/organizations posting these?
    - Provide a brief, actionable summary for an executive.
    Use markdown for formatting (bolding, lists).

    Data:
    ${JSON.stringify(dataSubset, null, 2)}
    `;

    const responseStream = await client.models.generateContentStream({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
            safetySettings: permissiveSafetySettings,
        },
    });

    const iterator = responseStream[Symbol.asyncIterator]();
    while (true) {
        const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Insights generation timed out after 30s of inactivity.")), 30000));
        const chunkResult = await Promise.race([iterator.next(), timeout]);
        if (chunkResult.done) break;
        yield chunkResult.value.text ?? '';
    }
}

export async function* getChatResponseStream(
    client: GoogleGenAI,
    url:string,
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    newMessage: string
): AsyncGenerator<string> {
    const model = 'gemini-2.5-flash';
    
    const chatSystemInstruction = `You are an expert procurement analyst. Your task is to answer questions based *only* on the content of a document found at a specific URL.
- You MUST use the search tool to find and read the content of the document at the URL provided in the user's prompt.
- Your answers must be derived *exclusively* from the information within that document. Do not use your general knowledge or other sources.
- If the document does not contain the answer, you must state that the information is not available in the provided document.
- Present your answers clearly, using markdown for formatting (e.g., for lists or summaries).`;
    
    const augmentedNewMessage = `Based *only* on the content of the document found at this URL: ${url}\n\nPlease answer the following question:\n"${newMessage}"`;

    const contents = [
        ...history,
        { role: 'user' as const, parts: [{ text: augmentedNewMessage }] }
    ];
    
    const responseStream = await client.models.generateContentStream({
        model,
        contents,
        config: {
            systemInstruction: chatSystemInstruction,
            tools: [{ googleSearch: {} }],
            safetySettings: permissiveSafetySettings,
        },
    });

    const iterator = responseStream[Symbol.asyncIterator]();
    while (true) {
        const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Chat response timed out after 30s of inactivity.")), 30000));
        const chunkResult = await Promise.race([iterator.next(), timeout]);
        if (chunkResult.done) break;
        yield chunkResult.value.text ?? '';
    }
}

export async function parseTextToOpportunities(
    client: GoogleGenAI,
    textToParse: string,
    signal?: AbortSignal
): Promise<RawStreamedOpportunity[]> {
    const model = 'gemini-2.5-flash';

    const response = await client.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: textToParse }] }],
        config: {
            systemInstruction: TEXT_PARSER_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: opportunitySchema
            },
            safetySettings: permissiveSafetySettings,
        }
    });

    if (signal?.aborted) {
        throw new Error("Operation aborted");
    }

    try {
        const resultText = (response.text ?? '[]').trim();
        // The API should return valid JSON because of responseSchema, but we parse defensively.
        const opportunities = JSON.parse(resultText) as RawStreamedOpportunity[];
        return opportunities;
    } catch (e) {
        console.error("Failed to parse opportunities from text:", e, `Response was: "${response.text}"`);
        throw new Error("The AI returned data in an unexpected format.");
    }
}