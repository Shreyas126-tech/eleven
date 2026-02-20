import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, AudioLines, Rocket, ChevronRight, Zap, Globe } from 'lucide-react';

const WelcomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white relative overflow-hidden">
            {/* Dynamic Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-vpurple/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-vpink/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(2,6,23,1)_80%)]"></div>
            </div>

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="z-10 text-center px-4 max-w-5xl"
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="flex items-center justify-center mb-8"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-vpurple blur-2xl opacity-40 animate-pulse"></div>
                        <div className="relative p-5 bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl">
                            <AudioLines size={60} className="text-vpurple-light" />
                        </div>
                    </div>
                </motion.div>

                <h1 className="text-7xl md:text-9xl font-[950] mb-6 tracking-tighter leading-[0.9]">
                    <span className="bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">VANIVERSE</span>
                    <br />
                    <span className="bg-gradient-to-r from-vpurple-light via-vpink-light to-vblue-light bg-clip-text text-transparent italic">AUDIO AI</span>
                </h1>

                <p className="text-lg md:text-2xl text-slate-400 mb-12 max-w-3xl mx-auto font-light leading-relaxed tracking-tight">
                    Unleash the future of sound. Generate emotive lyrics, translate voices instantly, and orchestrate professional melodies with our next-gen neural engine.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/dashboard')}
                        className="group px-10 py-5 bg-white text-slate-950 font-black rounded-2xl flex items-center space-x-3 shadow-2xl shadow-white/10 hover:shadow-vpurple/20 transition-all duration-300"
                    >
                        <Rocket size={22} className="group-hover:rotate-12 transition-transform" />
                        <span>Enter the Universe</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/dashboard/about')}
                        className="px-10 py-5 bg-slate-900/50 backdrop-blur-xl border border-white/10 text-white font-bold rounded-2xl flex items-center space-x-3 hover:bg-slate-900 transition-all duration-300"
                    >
                        <Zap size={22} className="text-vpurple-light" />
                        <span>View Features</span>
                    </motion.button>
                </div>
            </motion.div>

            {/* Floating badges */}
            <div className="absolute bottom-12 w-full flex justify-center space-x-8 text-slate-500 overflow-hidden px-4">
                {[
                    { icon: Sparkles, text: "High Fidelity" },
                    { icon: Zap, text: "Instant Export" },
                    { icon: Globe, text: "Global Reach" }
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + (i * 0.1) }}
                        className="flex items-center space-x-2 whitespace-nowrap"
                    >
                        <item.icon size={14} className="text-vpurple/60" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">{item.text}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default WelcomePage;
