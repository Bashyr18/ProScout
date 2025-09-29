import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore.ts';
import { CloseIcon } from './icons.tsx';
import { useFocusTrap } from '../hooks/useFocusTrap.ts';

interface ManualAddModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ManualAddModal: React.FC<ManualAddModalProps> = ({ isOpen, onClose }) => {
    const { saveOpportunity } = useAppStore(state => ({
        saveOpportunity: state.saveOpportunity,
    }));
    
    const [formData, setFormData] = useState({
        Title: '',
        Organization: '',
        Location: '',
        'Published Date': '',
        Deadline: '',
        URL: '',
        Source: '',
        Stage: '',
        Budget: '',
        Sector: '',
        SubmissionMethod: '',
        FundingSource: '',
    });

    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef, isOpen);

    useEffect(() => {
        if (!isOpen) return;
        
        // Reset form when opening
        setFormData({
            Title: '', Organization: '', Location: '', 'Published Date': '',
            Deadline: '', URL: '', Source: '', Stage: '', Budget: '',
            Sector: '', SubmissionMethod: '', FundingSource: '',
        });

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveOpportunity({
            ...formData,
            URL: formData.URL || null,
            noticePageUrl: formData.URL || '', 
            'Published Date': formData['Published Date'] || null,
            Deadline: formData.Deadline || null,
            Stage: formData.Stage || undefined,
            Budget: formData.Budget || undefined,
            Sector: formData.Sector || undefined,
            SubmissionMethod: formData.SubmissionMethod || undefined,
            FundingSource: formData.FundingSource || undefined,
        });
        onClose();
    };
    
    if (!isOpen) return null;

    return (
         <div 
            className="fixed inset-0 bg-bg-primary bg-opacity-80 z-40 flex items-center justify-center p-0 md:p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                ref={modalRef}
                className="bg-bg-secondary rounded-none md:rounded-lg shadow-xl w-full h-full md:h-auto md:max-w-2xl border-2 border-border-accent flex flex-col animate-slide-in-up"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="manual-add-title"
            >
                <div className="flex items-center justify-between p-4 border-b border-border-accent flex-shrink-0">
                    <h2 id="manual-add-title" className="text-xl font-bold text-text-primary">Add Opportunity Manually</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-text-secondary hover:bg-border-accent" aria-label="Close dialog">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label htmlFor="Title" className="block text-sm font-medium text-text-secondary mb-1">Opportunity Title</label>
                            <input type="text" name="Title" id="Title" value={formData.Title} onChange={handleChange} required className="w-full bg-bg-primary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition" />
                        </div>
                        <div>
                            <label htmlFor="Organization" className="block text-sm font-medium text-text-secondary mb-1">Organization</label>
                            <input type="text" name="Organization" id="Organization" value={formData.Organization} onChange={handleChange} required className="w-full bg-bg-primary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition" />
                        </div>
                         <div>
                            <label htmlFor="Location" className="block text-sm font-medium text-text-secondary mb-1">Location</label>
                            <input type="text" name="Location" id="Location" value={formData.Location} onChange={handleChange} required className="w-full bg-bg-primary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition" />
                        </div>
                         <div>
                            <label htmlFor="Published Date" className="block text-sm font-medium text-text-secondary mb-1">Published Date</label>
                            <input type="date" name="Published Date" id="Published Date" value={formData['Published Date']} onChange={handleChange} className="w-full bg-bg-primary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition" />
                        </div>
                         <div>
                            <label htmlFor="Deadline" className="block text-sm font-medium text-text-secondary mb-1">Deadline</label>
                            <input type="date" name="Deadline" id="Deadline" value={formData.Deadline} onChange={handleChange} className="w-full bg-bg-primary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition" />
                        </div>
                        <div>
                            <label htmlFor="Stage" className="block text-sm font-medium text-text-secondary mb-1">Project Stage</label>
                            <input type="text" name="Stage" id="Stage" value={formData.Stage} onChange={handleChange} placeholder="e.g., EOI, RFP" className="w-full bg-bg-primary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition" />
                        </div>
                         <div>
                            <label htmlFor="Budget" className="block text-sm font-medium text-text-secondary mb-1">Budget / Estimate</label>
                            <input type="text" name="Budget" id="Budget" value={formData.Budget} onChange={handleChange} placeholder="e.g., $500,000" className="w-full bg-bg-primary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition" />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="URL" className="block text-sm font-medium text-text-secondary mb-1">Opportunity URL</label>
                            <input type="url" name="URL" id="URL" value={formData.URL} onChange={handleChange} required className="w-full bg-bg-primary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition" />
                        </div>
                         <div className="md:col-span-2">
                            <label htmlFor="Source" className="block text-sm font-medium text-text-secondary mb-1">Source Platform</label>
                            <input type="text" name="Source" id="Source" value={formData.Source} onChange={handleChange} required placeholder="e.g., worldbank.org" className="w-full bg-bg-primary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition" />
                        </div>
                        <div>
                            <label htmlFor="Sector" className="block text-sm font-medium text-text-secondary mb-1">Sector</label>
                            <input type="text" name="Sector" id="Sector" value={formData.Sector} onChange={handleChange} placeholder="e.g., Energy, Transport" className="w-full bg-bg-primary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition" />
                        </div>
                        <div>
                            <label htmlFor="FundingSource" className="block text-sm font-medium text-text-secondary mb-1">Funding Source</label>
                            <input type="text" name="FundingSource" id="FundingSource" value={formData.FundingSource} onChange={handleChange} placeholder="e.g., World Bank, AfDB" className="w-full bg-bg-primary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition" />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="SubmissionMethod" className="block text-sm font-medium text-text-secondary mb-1">Submission Method</label>
                            <input type="text" name="SubmissionMethod" id="SubmissionMethod" value={formData.SubmissionMethod} onChange={handleChange} placeholder="e.g., Online Portal, Email" className="w-full bg-bg-primary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition" />
                        </div>
                    </div>
                    <div className="p-4 bg-bg-primary rounded-b-lg border-t border-border-accent flex justify-end flex-shrink-0 sticky bottom-0">
                        <button type="button" onClick={onClose} className="mr-2 bg-border-accent hover:bg-accent-hover text-text-primary font-bold py-2 px-4 rounded-md transition duration-300">Cancel</button>
                        <button type="submit" className="bg-accent hover:bg-opacity-90 text-accent-text font-bold py-2 px-4 rounded-md transition duration-300">Save Opportunity</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ManualAddModal;