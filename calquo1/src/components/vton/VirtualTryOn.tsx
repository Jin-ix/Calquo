import React, { useState } from 'react';
import { Upload, Sparkles, ArrowRight, RefreshCcw, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { BeforeAfterSlider } from './BeforeAfterSlider';

interface VirtualTryOnProps {
    initialSubjectImage?: string | null;
    initialPatternImage?: string | null;
    onClose?: () => void;
}

export const VirtualTryOn: React.FC<VirtualTryOnProps> = ({ 
    initialSubjectImage = null, 
    initialPatternImage = null,
    onClose
}) => {
    const [subjectImage, setSubjectImage] = useState<string | null>(initialSubjectImage);
    const [patternImage, setPatternImage] = useState<string | null>(initialPatternImage);
    const [isGenerating, setIsGenerating] = useState(false);
    const [resultImage, setResultImage] = useState<string | null>(null);

    const handleSubjectUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Basic local preview for now
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => setSubjectImage(e.target?.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handlePatternUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => setPatternImage(e.target?.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleGenerate = () => {
        if (!subjectImage || !patternImage) return;

        setIsGenerating(true);

        // Mock the 10+ second generation delay
        setTimeout(() => {
            // Mock result (will be replaced by actual API response)
            setResultImage(subjectImage); // Just showing the subject back for now as a mock
            setIsGenerating(false);
        }, 12000);
    };

    const resetAll = () => {
        setSubjectImage(initialSubjectImage);
        setPatternImage(initialPatternImage);
        setResultImage(null);
        setIsGenerating(false);
    };

    return (
        <div className="min-h-screen bg-[#fafafa] pt-24 pb-12 selection:bg-black selection:text-white">
            <div className="container mx-auto px-4 max-w-6xl">

                {/* Header section */}
                <div className="mb-12 text-center flex flex-col items-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 mb-6">
                        <Sparkles className="w-3.5 h-3.5 text-zinc-900" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-900">AI Studio</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight mb-4 text-zinc-900">
                        Advanced Try-On
                    </h1>
                    <p className="text-sm md:text-base text-zinc-500 max-w-2xl font-medium tracking-tight mt-4">
                        Upload your subject and a pattern to instantly preview how the design drapes. High-fidelity rendering powered by our editorial AI pipeline.
                    </p>
                    {onClose && (
                        <Button variant="outline" onClick={onClose} className="mt-6 rounded-full px-6">
                            Close Try-On
                        </Button>
                    )}
                </div>

                {/* Main Work Area */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

                    {/* Left Column: Inputs */}
                    <div className="lg:col-span-5 space-y-8">

                        {/* Subject Dropzone */}
                        <div className={`relative group border-2 border-dashed ${subjectImage ? 'border-zinc-900 bg-white' : 'border-zinc-200 hover:border-zinc-400 bg-transparent'} transition-colors duration-300 rounded-none h-64 flex flex-col items-center justify-center p-6 text-center overflow-hidden`}>
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                onChange={handleSubjectUpload}
                            />

                            {subjectImage ? (
                                <>
                                    <img src={subjectImage} alt="Subject" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-multiply" />
                                    <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] z-0" />
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-none mb-3 shadow-xl">
                                            <Check className="w-5 h-5" />
                                        </div>
                                        <p className="text-xs font-black uppercase tracking-widest text-zinc-900 bg-white/90 px-3 py-1">Subject Loaded</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-12 h-12 bg-white flex items-center justify-center rounded-sm mb-4 border border-zinc-100 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                        <Upload className="w-5 h-5 text-zinc-400" />
                                    </div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900 mb-1">The Subject</h3>
                                    <p className="text-xs text-zinc-500">Drag & drop or click to browse</p>
                                </>
                            )}
                        </div>

                        {/* Pattern Dropzone */}
                        <div className={`relative group border-2 border-dashed ${patternImage ? 'border-zinc-900 bg-white' : 'border-zinc-200 hover:border-zinc-400 bg-transparent'} transition-colors duration-300 rounded-none h-64 flex flex-col items-center justify-center p-6 text-center overflow-hidden`}>
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                onChange={handlePatternUpload}
                                disabled={!subjectImage}
                            />

                            {patternImage ? (
                                <>
                                    <img src={patternImage} alt="Pattern" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-multiply" />
                                    <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] z-0" />
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-none mb-3 shadow-xl">
                                            <Check className="w-5 h-5" />
                                        </div>
                                        <p className="text-xs font-black uppercase tracking-widest text-zinc-900 bg-white/90 px-3 py-1">Pattern Loaded</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className={`w-12 h-12 flex items-center justify-center rounded-sm mb-4 border transition-transform duration-500 shadow-sm ${subjectImage ? 'bg-white border-zinc-100 group-hover:scale-110' : 'bg-zinc-50 border-transparent opacity-50'}`}>
                                        <Upload className={`w-5 h-5 ${subjectImage ? 'text-zinc-400' : 'text-zinc-300'}`} />
                                    </div>
                                    <h3 className={`text-sm font-bold uppercase tracking-widest mb-1 ${subjectImage ? 'text-zinc-900' : 'text-zinc-400'}`}>The Pattern</h3>
                                    <p className="text-xs text-zinc-500">
                                        {subjectImage ? "Upload seamless fabric or print" : "Upload subject first"}
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Generate Action */}
                        <Button
                            onClick={handleGenerate}
                            disabled={!subjectImage || !patternImage || isGenerating}
                            className={`w-full h-14 rounded-none text-xs uppercase font-black tracking-widest group transition-all duration-500 ${(subjectImage && patternImage && !isGenerating)
                                ? 'bg-black text-white hover:bg-zinc-800 hover:translate-y-[-2px] shadow-[0_10px_40px_rgba(0,0,0,0.15)]'
                                : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                                }`}
                        >
                            {isGenerating ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-pulse" />
                                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-pulse delay-75" />
                                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-pulse delay-150" />
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-3">
                                    Generate Try-On
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </Button>
                    </div>

                    {/* Right Column: Output / Loading */}
                    <div className="lg:col-span-7">
                        <div className="w-full h-[600px] bg-white border border-zinc-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden flex items-center justify-center">

                            {/* Empty State */}
                            {!isGenerating && !resultImage && (
                                <div className="text-center px-6">
                                    <div className="w-20 h-20 mx-auto border-[0.5px] border-zinc-200 bg-[#fafafa] flex items-center justify-center mb-6">
                                        <Sparkles className="w-6 h-6 text-zinc-300" />
                                    </div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">The Canvas</h3>
                                    <p className="text-xs text-zinc-400 max-w-xs mx-auto">Upload both a subject and a pattern to initialize the AI engine.</p>
                                </div>
                            )}

                            {/* Generating State (Skeleton) */}
                            {isGenerating && (
                                <div className="absolute inset-0 bg-[#fafafa] flex flex-col items-center justify-center z-20">
                                    {/* Shimmering Torso Silhouette Skeleton */}
                                    <div className="relative w-64 h-96 mb-12">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-zinc-200 via-zinc-100 to-zinc-200 animate-[shimmer_2s_infinite] opacity-50 rounded-[40px_40px_20px_20px]" />
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[70%] border border-zinc-300/30 border-dashed rounded-[30px_30px_10px_10px]" />

                                        <div className="absolute -left-12 top-1/4 w-16 h-32 bg-gradient-to-b from-zinc-200 to-zinc-100 animate-[shimmer_2s_infinite_0.5s] filter blur-sm opacity-40 rounded-full origin-top -rotate-12" />
                                        <div className="absolute -right-12 top-1/4 w-16 h-32 bg-gradient-to-b from-zinc-200 to-zinc-100 animate-[shimmer_2s_infinite_0.7s] filter blur-sm opacity-40 rounded-full origin-top rotate-12" />
                                    </div>

                                    {/* Cycling Text Tips */}
                                    <div className="h-6 overflow-hidden text-center">
                                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 animate-pulse">Analyzing Fabric Drape...</p>
                                    </div>
                                </div>
                            )}

                            {/* Result State */}
                            {resultImage && !isGenerating && (
                                <div className="absolute inset-0 animate-in fade-in duration-1000 group">
                                    <BeforeAfterSlider
                                        beforeImage={subjectImage!}
                                        afterImage={resultImage}
                                        className="w-full h-full"
                                    />

                                    {/* Toolbar Overlay */}
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-4 py-2 flex items-center gap-4 shadow-xl border border-black/5 z-20 transition-transform transform translate-y-0 group-hover:-translate-y-2 duration-500">
                                        <Button variant="ghost" size="sm" onClick={resetAll} className="h-8 text-[10px] uppercase font-bold tracking-widest group/btn hover:bg-zinc-100">
                                            <RefreshCcw className="w-3 h-3 mr-2 group-hover/btn:-rotate-90 transition-transform duration-500" />
                                            Reset
                                        </Button>
                                        <div className="w-px h-4 bg-zinc-200" />
                                        <Button size="sm" className="h-8 rounded-none bg-black text-white text-[10px] uppercase font-bold tracking-widest hover:bg-zinc-800 shadow-md">
                                            Save to Profile
                                        </Button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
