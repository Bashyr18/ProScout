import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore.ts';
import { useModal } from '../hooks/useModal.ts';
import { Opportunity } from '../types.ts';
import { CloseIcon, ExternalLinkIcon, LinkIcon, SparklesIcon, TrashIcon, SendIcon, UserCircleIcon, DocumentSearchIcon } from './icons.tsx';
import StatusBadge from './common/StatusBadge.tsx';
import { useFocusTrap } from '../hooks/useFocusTrap.ts';

declare var marked: { parse: (text: string) => string };
declare var DOMPurify: { sanitize: (html: string) => string };


const AiChatPanel: React.FC<{ opportunity: Opportunity }> = ({ opportunity }) => {
    const { sendMessage, isSending, isThinking, hasQuota, isAuthenticated } = useAppStore(state => ({
        sendMessage: state.sendMessage,
        isSending: state.isSending,
        isThinking: state.isThinking,
        hasQuota: state.hasQuota,
        isAuthenticated: state.isAuthenticated,
    }));
    const { openModal } = useModal();
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatHistory = opportunity.chatHistory || [];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [chatHistory]);

    const handleSendMessageInternal = async (message: string) => {
        if (!message.trim() || isSending) return;
        
        if (!isAuthenticated) {
            openModal('auth');
            return;
        }
        if (!hasQuota('chatMessages')) {
            openModal('pricing');
            return;
        }

        // Use the most reliable link for the AI to analyze
        const urlForAnalysis = opportunity.URL || opportunity.noticePageUrl;
        if (!urlForAnalysis) {
            useAppStore.getState().addToast({ type: 'error', message: 'No valid URL available for this opportunity to chat with.' });
            return;
        }

        await sendMessage(opportunity, message);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSendMessageInternal(newMessage);
        setNewMessage('');
    };
    
    const handleStartChat = () => {
        const urlForAnalysis = opportunity.URL || opportunity.noticePageUrl;
        const initialPrompt = `Please provide a detailed summary of the procurement document found at this URL: ${urlForAnalysis}. Extract the following key information if available: Project Background and Objectives, Scope of Work/Services Required, Key Deliverables, Eligibility Criteria for Bidders, Submission Deadline and Procedure. Present the summary in clear, concise language using markdown for structure.`;
        handleSendMessageInternal(initialPrompt);
    };

    return (
        <div className="bg-bg-primary p-4 rounded-lg border border-border-accent flex flex-col h-full">
            <h4 className="font-semibold text-text-primary mb-3 flex items-center flex-shrink-0">
                <SparklesIcon className="w-5 h-5 mr-2 text-accent"/>
                AI Document Chat
            </h4>
            {(!chatHistory || chatHistory.length === 0) ? (
                 <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                    <p className="text-text-secondary mb-4">Chat with the document to get key insights without reading the full text.</p>
                    <button onClick={handleStartChat} disabled={isSending} className="flex items-center justify-center mx-auto space-x-2 bg-accent hover:bg-opacity-90 text-accent-text font-bold py-2 px-4 rounded-md transition duration-300 disabled:opacity-50">
                        {isSending ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div> : <SparklesIcon className="w-5 h-5" />}
                        <span>Start with AI Summary</span>
                    </button>
                </div>
            ) : (
                <>
                    <div className="flex-grow overflow-y-auto pr-2 space-y-4 mb-4">
                        {chatHistory.map((msg, index) => {
                            if (msg.role === 'model' && msg.parts[0].text.trim() === '' && index === chatHistory.length - 1) {
                                return null;
                            }
                            const isUser = msg.role === 'user';
                            const sanitizedHtml = DOMPurify.sanitize(marked.parse(msg.parts[0].text));
                            
                             const bubbleClasses = isUser
                                ? 'bg-accent text-accent-text rounded-2xl rounded-br-lg'
                                : 'bg-bg-secondary text-text-primary rounded-2xl rounded-bl-lg';
                            
                            const proseColorClasses = isUser 
                                ? 'prose-p:text-accent-text prose-li:text-accent-text prose-strong:text-accent-text' 
                                : 'prose-p:text-text-primary prose-li:text-text-primary prose-strong:text-text-primary';

                            return (
                                <div key={index} className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                                    {!isUser && (
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-border-accent flex items-center justify-center self-start">
                                            <SparklesIcon className="w-5 h-5 text-accent" />
                                        </div>
                                    )}
                                    <div className={`p-3 shadow-md max-w-lg ${bubbleClasses}`}>
                                        <div 
                                            className={`prose prose-sm max-w-none prose-p:my-1 prose-ul:my-2 prose-ol:my-2 prose-ul:pl-4 prose-ol:pl-4 ${proseColorClasses}`}
                                            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                                        ></div>
                                    </div>
                                    {isUser && (
                                         <div className="flex-shrink-0 w-8 h-8 rounded-full bg-border-accent flex items-center justify-center self-start">
                                            <UserCircleIcon className="w-6 h-6 text-text-primary" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                         {isThinking && (
                            <div className="flex items-start gap-3 justify-start">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-border-accent flex items-center justify-center self-start">
                                    <SparklesIcon className="w-5 h-5 text-accent" />
                                </div>
                                <div className="p-3 shadow-md bg-bg-secondary rounded-2xl rounded-bl-lg">
                                    <div className="flex items-center space-x-2 text-text-secondary">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent"></div>
                                        <span>Thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleSubmit} className="flex-shrink-0 flex items-center space-x-2 border-t border-border-accent pt-4">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Ask a follow-up question..."
                            disabled={isSending || isThinking}
                            className="w-full bg-bg-secondary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={isSending || isThinking || !newMessage.trim()}
                            className="bg-accent hover:bg-opacity-90 text-accent-text p-2.5 rounded-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Send Message"
                        >
                           <SendIcon className="w-5 h-5" />
                        </button>
                    </form>
                </>
            )}
        </div>
    );
};

interface OpportunityDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    opportunity: Opportunity | null | undefined;
}

const OpportunityDetailModal: React.FC<OpportunityDetailModalProps> = ({ isOpen, onClose, opportunity }) => {
    const { updateOpportunity, deleteOpportunity } = useAppStore(state => ({
        updateOpportunity: state.updateOpportunity,
        deleteOpportunity: state.deleteOpportunity,
    }));
    const { openModal } = useModal();
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef, isOpen);

    useEffect(() => {
        if (!isOpen) return;
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        document.body.classList.add('modal-open');
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.classList.remove('modal-open');
        };
    }, [isOpen, onClose]);

    if (!isOpen || !opportunity) return null;

    const op = opportunity;

    const handleStatusChange = (newStatus: Opportunity['status']) => {
        updateOpportunity({ ...op, status: newStatus });
    };

    const handleDelete = () => {
        openModal('confirmation', {
            title: 'Confirm Deletion',
            message: <p>Are you sure you want to permanently delete the opportunity: <strong className="text-text-primary">{op.Title}</strong>? This action cannot be undone.</p>,
            onConfirm: () => {
                deleteOpportunity(op.id);
                onClose(); // Close detail modal after confirmation
            }
        });
    };

    return (
         <div 
            className="fixed inset-0 bg-bg-primary bg-opacity-80 z-40 flex items-center justify-center p-0 md:p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                ref={modalRef}
                className="bg-bg-secondary rounded-none md:rounded-lg shadow-xl w-full h-full md:max-w-6xl md:max-h-[90vh] flex flex-col border-2 border-border-accent animate-slide-in-up"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="op-detail-title"
            >
                {/* Header */}
                <div className="flex items-start justify-between p-4 border-b border-border-accent flex-shrink-0">
                    <div className="pr-4">
                        <h2 id="op-detail-title" className="text-xl font-bold text-text-primary leading-tight">{op.Title}</h2>
                        <p className="text-sm text-text-secondary">{op.Organization}</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-text-secondary hover:bg-border-accent flex-shrink-0" aria-label="Close dialog">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
                
                {/* Body */}
                <div className="flex-grow p-4 md:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left/Main Column - Chat */}
                    <div className="lg:col-span-2 h-full min-h-[50vh] lg:min-h-0">
                         <AiChatPanel opportunity={op} />
                    </div>

                    {/* Right/Info Column */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-bg-primary p-4 rounded-lg border border-border-accent">
                            <h4 className="font-semibold text-text-primary mb-2">Status</h4>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => handleStatusChange('New')} disabled={op.status === 'New'} className="text-xs bg-info-bg hover:bg-info-border disabled:opacity-50 text-info-fg font-bold py-1 px-3 rounded-full transition duration-300">New</button>
                                <button onClick={() => handleStatusChange('Reviewing')} disabled={op.status === 'Reviewing'} className="text-xs bg-warning-bg hover:bg-warning-border disabled:opacity-50 text-warning-fg font-bold py-1 px-3 rounded-full transition duration-300">Reviewing</button>
                                <button onClick={() => handleStatusChange('Action')} disabled={op.status === 'Action'} className="text-xs bg-success-bg hover:bg-success-border disabled:opacity-50 text-success-fg font-bold py-1 px-3 rounded-full transition duration-300">Action</button>
                                <button onClick={() => handleStatusChange('Discarded')} disabled={op.status === 'Discarded'} className="text-xs bg-danger-bg hover:bg-danger-border disabled:opacity-50 text-danger-fg font-bold py-1 px-3 rounded-full transition duration-300">Discard</button>
                            </div>
                            <div className="mt-3">
                                <StatusBadge status={op.status} className="px-3 py-1 text-sm"/>
                            </div>
                        </div>
                        <div className="bg-bg-primary p-4 rounded-lg border border-border-accent">
                            <h4 className="font-semibold text-text-primary mb-2">Key Dates</h4>
                            <p className="text-sm text-text-secondary">Published: <span className="text-text-primary font-medium">{op['Published Date'] || 'N/A'}</span></p>
                            <p className="text-sm text-text-secondary">Deadline: <span className="text-text-primary font-medium">{op.Deadline || 'N/A'}</span></p>
                        </div>
                         <div className="bg-bg-primary p-4 rounded-lg border border-border-accent">
                            <h4 className="font-semibold text-text-primary mb-2">Details</h4>
                            <p className="text-sm text-text-secondary">Location: <span className="text-text-primary font-medium">{op.Location}</span></p>
                            <p className="text-sm text-text-secondary">Stage: <span className="text-text-primary font-medium">{op.Stage || 'N/A'}</span></p>
                            <p className="text-sm text-text-secondary">Sector: <span className="text-text-primary font-medium">{op.Sector || 'N/A'}</span></p>
                            <p className="text-sm text-text-secondary">Funding: <span className="text-text-primary font-medium">{op.FundingSource || 'N/A'}</span></p>
                            <p className="text-sm text-text-secondary">Submission: <span className="text-text-primary font-medium">{op.SubmissionMethod || 'N/A'}</span></p>
                            <p className="text-sm text-text-secondary">Budget: <span className="text-text-primary font-medium">{op.Budget || '—'}</span></p>
                            <p className="text-sm text-text-secondary">Relevance Score: <span className="text-text-primary font-medium">{op.Relevance}</span></p>
                            <p className="text-sm text-text-secondary">Verified At: <span className="text-text-primary font-medium">{op.foundAt ? new Date(op.foundAt).toLocaleString() : 'N/A'}</span></p>
                        </div>
                         <div className="bg-bg-primary p-4 rounded-lg border border-border-accent">
                             <h4 className="font-semibold text-text-primary mb-3">Source Links</h4>
                             <div className="space-y-3">
                                {op.URL && (
                                    <a href={op.URL} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline break-all inline-flex items-center text-sm">
                                        <DocumentSearchIcon className="w-4 h-4 mr-2 flex-shrink-0"/>
                                        <span>View Source Document (PDF)</span>
                                    </a>
                                )}
                                <a href={op.noticePageUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline break-all inline-flex items-center text-sm">
                                     <ExternalLinkIcon className="w-4 h-4 mr-2 flex-shrink-0"/>
                                     <span>View Original Notice on {op.Source}</span>
                                </a>
                             </div>
                        </div>
                         {op.citations && op.citations.length > 0 && (
                            <div className="bg-bg-primary p-4 rounded-lg border border-border-accent">
                                <h4 className="font-semibold text-text-primary mb-2">AI Agent Grounding Source</h4>
                                <ul className="space-y-2">
                                    {op.citations.map((cite, i) => (
                                        <li key={i} className="flex items-start space-x-2 text-sm">
                                            <LinkIcon className="w-4 h-4 mt-0.5 text-text-secondary flex-shrink-0" />
                                            <a href={cite.uri} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline truncate" title={cite.uri}>
                                                {cite.title || 'Source Link'}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-bg-primary rounded-b-lg border-t border-border-accent flex justify-between items-center flex-shrink-0 sticky bottom-0">
                    <button onClick={handleDelete} className="flex items-center space-x-2 text-danger-fg hover:text-opacity-80 font-bold py-2 px-3 rounded-md transition duration-300 hover:bg-danger-bg bg-opacity-50">
                         <TrashIcon className="w-5 h-5" />
                         <span className="hidden sm:inline">Delete Opportunity</span>
                    </button>
                     <button onClick={onClose} className="bg-accent hover:bg-opacity-90 text-accent-text font-bold py-2 px-6 rounded-md transition duration-300">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OpportunityDetailModal;