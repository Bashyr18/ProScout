import React from 'react';
import { useModal } from '../hooks/useModal.ts';
import { RobotIcon, SparklesIcon, TableCellsIcon } from './icons.tsx';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string; }> = ({ icon, title, description }) => (
    <div className="bg-bg-secondary/40 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-border-accent/50 text-center flex flex-col items-center transition-transform transform hover:-translate-y-2 hover:shadow-2xl duration-300 h-full">
        <div className="flex-shrink-0 bg-bg-primary p-4 rounded-full border-2 border-accent mb-4">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2">{title}</h3>
        <p className="text-text-secondary leading-relaxed">{description}</p>
    </div>
);


const MockCard: React.FC<{ delay: number }> = ({ delay }) => (
    <div
        className="bg-bg-secondary/60 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-border-accent w-full max-w-sm animate-slide-in-up"
        style={{ animationDelay: `${delay}ms`, opacity: 0, animationFillMode: 'forwards' }}
    >
        <div className="flex justify-between items-center mb-2">
            <div className="h-4 bg-border-accent rounded w-3/4"></div>
            <div className="h-4 bg-border-accent rounded w-1/6"></div>
        </div>
        <div className="h-3 bg-border-accent/50 rounded w-1/2 mb-3"></div>
        <div className="flex items-center space-x-2">
            <span className="h-3 w-8 bg-accent/80 rounded-sm"></span>
            <div className="w-full bg-border-accent rounded-full h-1.5">
                <div className="bg-accent h-1.5 rounded-full w-[85%]"></div>
            </div>
        </div>
    </div>
);


const WelcomePanel: React.FC = () => {
    const { openModal } = useModal();

    return (
        <div className="bg-bg-primary min-h-full w-full flex flex-col items-center justify-center p-4 relative overflow-hidden welcome-bg-glow">
            <div className="z-10 flex flex-col items-center text-center animate-fade-in max-w-7xl mx-auto px-4 pt-16 pb-8">
                
                <h1 className="text-4xl md:text-6xl font-extrabold text-text-primary tracking-tight">
                    Stop Searching, <span className="text-accent">Start Winning.</span>
                </h1>

                <p className="mt-4 max-w-2xl text-lg text-text-secondary leading-relaxed">
                    ProScout's AI co-pilot scours thousands of global sources to find your next winning bid. We read the documents, so you can focus on the proposal.
                </p>

                <button 
                    onClick={() => openModal('auth')}
                    className="mt-8 bg-accent hover:bg-opacity-90 text-accent-text font-bold text-lg py-3 px-8 rounded-full transition-transform duration-300 transform hover:scale-105 shadow-lg"
                >
                    Get Started for Free
                </button>
                
                <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-5xl w-full">
                    <FeatureCard 
                        icon={<RobotIcon className="w-8 h-8 text-accent"/>}
                        title="AI-Powered Scouting"
                        description="Our persistent agents work 24/7, using advanced AI to find procurement opportunities perfectly matched to your company profile."
                    />
                    <FeatureCard 
                        icon={<SparklesIcon className="w-8 h-8 text-accent"/>}
                        title="Instant Document Analysis"
                        description="Go from 100-page RFPs to actionable summaries in seconds. Chat with documents to extract key details and make faster bid/no-bid decisions."
                    />
                    <FeatureCard 
                        icon={<TableCellsIcon className="w-8 h-8 text-accent"/>}
                        title="Unified Dashboard"
                        description="Track every opportunity from discovery to submission. Manage your pipeline, monitor deadlines, and get market insights all in one place."
                    />
                </div>
            </div>
            
            <div className="relative w-full flex-grow flex items-end justify-center z-5 min-h-[200px] md:min-h-[250px] mt-8">
                 <div className="w-full max-w-3xl space-y-3 relative">
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-full max-w-sm">
                        <MockCard delay={200} />
                    </div>
                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-full max-w-md opacity-70 transform scale-95">
                        <MockCard delay={400} />
                    </div>
                     <div className="w-full max-w-lg mx-auto opacity-50 transform scale-90">
                        <MockCard delay={600} />
                    </div>
                </div>
            </div>

        </div>
    );
};

export default WelcomePanel;