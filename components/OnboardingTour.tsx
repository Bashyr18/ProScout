import React, { useEffect, useRef } from 'react';
import { useWindowSize } from '../hooks/useWindowSize.ts';

declare var Shepherd: any;

interface OnboardingTourProps {
    start: boolean;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ start }) => {
    const tourRef = useRef<any>(null);
    const { width } = useWindowSize();
    const isMobile = width < 1024; // lg breakpoint

    useEffect(() => {
        if (!start || tourRef.current?.isActive()) {
            return;
        }

        const tour = new Shepherd.Tour({
            useModalOverlay: true,
            defaultStepOptions: {
                classes: 'shadow-lg',
                scrollTo: { behavior: 'smooth', block: 'center' },
                cancelIcon: {
                    enabled: true
                }
            }
        });
        
        const onTourEnd = () => {
            localStorage.setItem('proscout-tour-completed', 'true');
        };

        tour.on('complete', onTourEnd);
        tour.on('cancel', onTourEnd);

        if (isMobile) {
            // --- MOBILE TOUR ---
            tour.addStep({
                id: 'welcome-mobile',
                title: 'Welcome to ProScout!',
                text: 'This quick tour will show you how to use the app on your mobile device.',
                buttons: [{ text: 'Next', action: tour.next }]
            });
            tour.addStep({
                id: 'agent-mobile',
                title: 'Dispatch the AI Agent',
                text: `Tap here to open the Agent Control Panel. This is where you'll define your search and start finding opportunities.`,
                attachTo: { element: '[data-tour="mobile-agent-btn"]', on: 'top' },
                buttons: [
                    { text: 'Back', action: tour.back, secondary: true },
                    { text: 'Next', action: tour.next }
                ]
            });
            tour.addStep({
                id: 'add-mobile',
                title: 'Add Manually',
                text: `If you find an opportunity elsewhere, you can tap here to add it to your list manually.`,
                attachTo: { element: '[data-tour="mobile-add-btn"]', on: 'top' },
                buttons: [
                    { text: 'Back', action: tour.back, secondary: true },
                    { text: 'Finish', action: tour.complete }
                ]
            });
        } else {
            // --- DESKTOP TOUR ---
            tour.addStep({
                id: 'welcome',
                title: 'Welcome to ProScout!',
                text: 'This quick tour will show you the key features to get you started on desktop.',
                buttons: [{ text: 'Next', action: tour.next }]
            });

            tour.addStep({
                id: 'agent-panel',
                title: 'The AI Agent Panel',
                text: `This is your command center. Define your search objective, location, and focus sources, then click "Dispatch Agent" to start a search.`,
                attachTo: { element: '[data-tour="agent-control-panel"]', on: 'right' },
                buttons: [
                    { text: 'Back', action: tour.back, secondary: true },
                    { text: 'Next', action: tour.next }
                ]
            });

            tour.addStep({
                id: 'insights',
                title: 'Generate AI Insights',
                text: `After you have some results, click here to get a high-level summary and market analysis of the visible opportunities.`,
                attachTo: { element: '[data-tour="ai-insights"]', on: 'right' },
                buttons: [
                    { text: 'Back', action: tour.back, secondary: true },
                    { text: 'Next', action: tour.next }
                ]
            });

            tour.addStep({
                id: 'filter-bar',
                title: 'Filter Your Results',
                text: `Once you have opportunities, you can quickly filter them by keyword right here. This filters your current view only.`,
                attachTo: { element: '[data-tour="filter-bar"]', on: 'bottom' },
                buttons: [
                    { text: 'Back', action: tour.back, secondary: true },
                    { text: 'Finish', action: tour.complete }
                ]
            });
        }

        tourRef.current = tour;
        tour.start();

    }, [start, isMobile]);

    return null;
};

export default OnboardingTour;