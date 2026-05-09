import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import { ShieldCheck, MapPin, Star, ChevronRight } from 'lucide-react';
import { Badge } from '../ui/badge';

export interface QCAgent {
    id: string;
    name: string;
    location: string;
    rating: number;
    reviews: number;
    feePercentage: number;
    completedInspections: number;
    avatarUrl?: string;
}

const QC_AGENTS: QCAgent[] = [
    {
        id: 'agent_mumbai_01',
        name: 'VeriTextile Mumbai Hub',
        location: 'Mumbai, MH',
        rating: 4.9,
        reviews: 1420,
        feePercentage: 5,
        completedInspections: 8430,
        avatarUrl: 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=100'
    },
    {
        id: 'agent_delhi_02',
        name: 'Capital Threads QC',
        location: 'New Delhi, DL',
        rating: 4.8,
        reviews: 890,
        feePercentage: 4.5,
        completedInspections: 4200,
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100'
    },
    {
        id: 'agent_tirupur_01',
        name: 'Southern Stitch Inspectors',
        location: 'Tirupur, TN',
        rating: 5.0,
        reviews: 310,
        feePercentage: 4,
        completedInspections: 1250,
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100'
    },
];

interface MiddlemanSelectorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedAgentId: string | null;
    onSelectAgent: (agent: QCAgent) => void;
}

export const MiddlemanSelectorModal: React.FC<MiddlemanSelectorModalProps> = ({
    open,
    onOpenChange,
    selectedAgentId,
    onSelectAgent,
}) => {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md border-l-0 p-0 flex flex-col bg-slate-50">
                <SheetHeader className="p-6 pb-4 bg-white border-b border-slate-100">
                    <SheetTitle className="flex items-center gap-2 font-heading tracking-wide uppercase text-lg">
                        <ShieldCheck className="h-5 w-5 text-black" />
                        Select QC Inspector
                    </SheetTitle>
                    <SheetDescription className="font-light text-slate-500 text-xs">
                        Choose a verified middleman to inspect your bulk order. Funds will be held in escrow until they approve the quality.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {QC_AGENTS.map((agent) => {
                        const isSelected = selectedAgentId === agent.id;

                        return (
                            <div
                                key={agent.id}
                                onClick={() => {
                                    onSelectAgent(agent);
                                    onOpenChange(false);
                                }}
                                className={`group relative bg-white p-5 cursor-pointer transition-all duration-300 hover:shadow-lg ${isSelected ? 'ring-2 ring-black shadow-md' : 'border border-slate-100 shadow-sm hover:border-black'
                                    }`}
                            >
                                {isSelected && (
                                    <div className="absolute top-0 right-0 bg-black text-white text-[9px] uppercase tracking-widest px-2 py-1 font-bold">
                                        Selected
                                    </div>
                                )}

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 shrink-0">
                                        <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-slate-900 truncate pr-10">{agent.name}</h4>

                                        <div className="flex items-center text-xs text-slate-500 mt-1 mb-3">
                                            <MapPin className="h-3 w-3 mr-1" />
                                            {agent.location}
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center text-xs font-medium">
                                                    <Star className="h-3 w-3 mr-1 fill-black text-black" />
                                                    {agent.rating} <span className="text-slate-400 font-light ml-1">({agent.reviews}+)</span>
                                                </div>
                                                <Badge variant="outline" className="text-[10px] uppercase tracking-widest rounded-none border-slate-200">
                                                    {agent.completedInspections.toLocaleString()} Audits
                                                </Badge>
                                            </div>

                                            <div className="text-right">
                                                <div className="text-sm font-bold text-slate-900">{agent.feePercentage}%</div>
                                                <div className="text-[9px] uppercase tracking-widest text-slate-400">Escrow Fee</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </SheetContent>
        </Sheet>
    );
};
