// Since we are in a worker, we can't use DOM or window.
// We must import scripts that are not ES modules using importScripts.

declare var XLSX: any;

try {
    importScripts('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
} catch (e) {
    // If importScripts fails, post an error back to the main thread.
    self.postMessage({ success: false, error: 'Failed to load the XLSX library.' });
}

// Type for the Opportunity status, mirrored from the main app's types for safety in worker.
type OpportunityStatus = 'New' | 'Reviewing' | 'Action' | 'Discarded';
const validStatuses: OpportunityStatus[] = ['New', 'Reviewing', 'Action', 'Discarded'];

self.onmessage = (e) => {
    // Check if the XLSX library was loaded successfully.
    if (typeof XLSX === 'undefined') {
        return; // Error was already posted if this is the case.
    }

    const { fileBuffer } = e.data;
    if (!fileBuffer) {
        self.postMessage({ success: false, error: 'No file buffer received.' });
        return;
    }

    try {
        const workbook = XLSX.read(fileBuffer, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {raw: false}) as any[]; // raw: false to get formatted dates

        const formatDate = (dateString: string | null): string | null => {
            if (!dateString) return null;
            try {
                // XLSX with cellDates:true and raw:false should give a date string.
                // We parse it to ensure it's valid and then format to YYYY-MM-DD.
                const d = new Date(dateString);
                if (isNaN(d.getTime())) return null;
                return d.toISOString().split('T')[0];
            } catch { return null; }
        };

        const processedData = jsonData.map((row: any, index: number) => {
            const urlValue = String(row.URL || '');
            if (!row.Title || !urlValue) {
                console.warn(`Skipping row ${index + 2} due to missing Title or URL.`);
                return null;
            }

            const status = row.status && validStatuses.includes(row.status) ? row.status : 'New';

            return {
                Title: String(row.Title || ''),
                Organization: String(row.Organization || ''),
                Location: String(row.Location || ''),
                'Published Date': formatDate(row['Published Date'] || null),
                Deadline: formatDate(row.Deadline || null),
                URL: urlValue,
                noticePageUrl: urlValue, // For imported data, we assume the URL is the notice page.
                Source: String(row.Source || ''),
                status: status,
                Stage: String(row.Stage || 'N/A'),
                Budget: String(row.Budget || '—'),
                // These will be set on the main thread
                manuallyAdded: true,
                citations: [],
                chatHistory: [],
            };
        }).filter(op => op !== null); // Filter out skipped rows

        self.postMessage({ success: true, data: processedData });

    } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred during parsing.';
        self.postMessage({ success: false, error: `Parsing Error: ${message}` });
    }
};