import React from 'react';
import { SparklesIcon } from './icons.tsx';

declare var marked: { parse: (text: string) => string };
declare var DOMPurify: { sanitize: (html: string) => string };

interface InsightsPanelProps {
    insights: string;
    isLoading: boolean;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights, isLoading }) => {
    if (!insights && !isLoading) {
        return null;
    }
    
    // Sanitize the HTML output from Marked to prevent XSS
    const sanitizedHtml = DOMPurify.sanitize(marked.parse(insights));

    return (
        <div className="bg-bg-secondary rounded-lg shadow-lg p-6 mb-6 border border-border-accent animate-fade-in">
            <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center">
                <SparklesIcon className="w-6 h-6 mr-2 text-accent" />
                AI Market Insights
            </h3>
            {isLoading ? (
                <div className="flex items-center space-x-3 text-text-secondary">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent"></div>
                    <span className="font-medium">Analyzing opportunities... This may take a moment.</span>
                </div>
            ) : (
                <div 
                    className="space-y-3 prose max-w-none" 
                    dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                >
                </div>
            )}
        </div>
    );
};

export default InsightsPanel;