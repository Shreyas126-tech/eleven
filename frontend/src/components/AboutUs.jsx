import React from 'react';
import { motion } from 'framer-motion';
import { Volume2, Music, Globe, Users, Info, Sparkles, CheckCircle2, ArrowRight, MousePointer2 } from 'lucide-react';

const AboutUs = () => {
    const steps = [
        {
            title: "Choose Your Instrument",
            desc: "Select from our 4 specialized AI models using the sidebar on the left.",
            icon: MousePointer2,
            color: "bg-vpurple"
        },
        {
            title: "Craft Your Input",
            desc: "Enter text for TTS, describe a prompt for Lyrics, or pick a voice to clone.",
            icon: Sparkles,
            color: "bg-vpink"
        },
        {
            title: "Generate & Refine",
            desc: "Hit the generate button and wait a few seconds for our AI to orchestrate your audio.",
            icon: Music,
            color: "bg-vblue"
        },
        {
            title: "Play & Download",
            desc: "Listen to your creation in the premium player and download it for your projects.",
            icon: CheckCircle2,
            color: "bg-emerald-500"
        }
    ];

    const features = [
        {
            title: "Text to Speech",
            icon: Volume2,
            desc: "Industry-leading voice synthesis. Filter by language to find the perfect narrator for your content.",
            color: "text-vpurple-light",
            steps: ["Enter text in the box", "Select language filter", "Pick a voice profile", "Click Generate Voice"]
        },
        {
            title: "Lyrics & Translate",
            icon: Music,
            desc: "Generate professional lyrics from a simple prompt. Translate them instantly and hear them sung by AI.",
            color: "text-vpink-light",
            steps: ["Describe your song topic", "Select genre and main language", "Choose target translation (optional)", "Generate and see side-by-side lyrics"]
        },
        {
            title: "Intelligent Translator",
            icon: Globe,
            desc: "Break language barriers. Translate any text and hear it spoken back in the target language.",
            color: "text-vblue-light",
            steps: ["Type source text", "Select target language", "See translation in real-time", "Click Translate & Speak"]
        },
        {
            title: "Voice Cloning",
            icon: Users,
            desc: "Mimic any voice preset. Use specialized age-group and style models for unique vocal textures.",
            color: "text-amber-400",
            steps: ["Enter script to speak/sing", "Select a voice preset", "Choose Speak or Sing mode", "Generate your clone"]
        },
        {
            title: "AI Story Teller",
            icon: Sparkles,
            desc: "Create immersive narratives for any audience. Perfect for bedtime stories, audiobooks, or roleplay.",
            color: "text-emerald-400",
            steps: ["Select a genre (Adventure, Sci-Fi, etc.)", "Enter a topic or theme", "Set target age group and duration", "Click Generate Story"]
        },
        {
            title: "AI Podcast Generator",
            icon: Volume2,
            desc: "Instant conversational content. Generate multi-speaker podcasts on any topic in seconds.",
            color: "text-orange-400",
            steps: ["Enter a podcast topic", "Select duration (minutes)", "Choose host voices (optional)", "Click Generate Podcast"]
        },
        {
            title: "Music & Beats",
            icon: Music,
            desc: "AI-generated soundtracks and ringtones. High-quality instrumental music tailored to your needs.",
            color: "text-rose-400",
            steps: ["Select a musical instrument", "Set duration (seconds)", "Choose Ringtone or BG Music", "Click Generate Music"]
        },
        {
            title: "Studio & Mashup",
            icon: Sparkles,
            desc: "Professional audio editing and blending. Apply studio effects or mash multiple tracks seamlessly.",
            color: "text-indigo-400",
            steps: ["Upload audio file(s)", "Choose effect (Reverb, Bass, etc.)", "Select Mashup style", "Click Process or Mashup"]
        },
        {
            title: "Analysis Intelligence",
            icon: Info,
            desc: "Dual emotional and linguistic processing. Analyze text sentiment and convert audio speech to text seamlessly.",
            color: "text-cyan-400",
            steps: ["Enter words or sentences for Mood Analysis", "Upload voice files for Audio File Analysis", "View emotional breakdown for text results", "Review generated text from audio speech"]
        }
    ];

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Hero Section */}
            <div className="text-center mb-20">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center space-x-2 bg-vpurple/10 px-4 py-2 rounded-full mb-8 border border-vpurple/20"
                >
                    <Info size={16} className="text-vpurple-light" />
                    <span className="text-vpurple-light font-bold text-xs uppercase tracking-widest">Platform Guide</span>
                </motion.div>
                <h2 className="text-6xl font-black text-white mb-6 tracking-tight">Mastering Vaniverse AI</h2>
                <p className="text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed font-light">
                    Experience the most intuitive AI audio platform. Here is how you can transform your ideas into professional soundscapes.
                </p>
            </div>

            {/* Step by Step Guide */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-24">
                {steps.map((step, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="relative p-6 bg-slate-900/50 border border-slate-800 rounded-3xl"
                    >
                        <div className={`w-12 h-12 ${step.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-white/5`}>
                            <step.icon size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                        {idx < 3 && <ArrowRight className="hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 text-slate-800" size={24} />}
                    </motion.div>
                ))}
            </div>

            {/* Detailed Feature Breakdown */}
            <div className="space-y-12">
                <h3 className="text-3xl font-black text-white text-center mb-12">Detailed Feature Workflows</h3>
                <div className="grid grid-cols-1 gap-8">
                    {features.map((f, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="group p-8 md:p-12 rounded-[3.5rem] bg-slate-900 border border-slate-800 hover:border-vpurple/30 transition-all duration-500 flex flex-col md:flex-row gap-12"
                        >
                            <div className="flex-1">
                                <div className="flex items-center space-x-4 mb-6">
                                    <div className="p-4 rounded-3xl bg-slate-950 border border-slate-800">
                                        <f.icon size={32} className={f.color} />
                                    </div>
                                    <h3 className="text-3xl font-bold text-white tracking-tight">{f.title}</h3>
                                </div>
                                <p className="text-slate-400 text-lg mb-8 leading-relaxed font-light">{f.desc}</p>
                                <div className="flex flex-wrap gap-3">
                                    <span className="px-4 py-2 bg-vpurple/10 text-vpurple-light rounded-xl text-xs font-bold uppercase tracking-widest border border-vpurple/10">Neural Engine v2.0</span>
                                    <span className="px-4 py-2 bg-vpink/10 text-vpink-light rounded-xl text-xs font-bold uppercase tracking-widest border border-vpink/10">Low Latency</span>
                                </div>
                            </div>

                            <div className="md:w-80 bg-slate-950/50 rounded-[2.5rem] p-8 border border-slate-800/50">
                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">How to use:</h4>
                                <ul className="space-y-4">
                                    {f.steps.map((s, i) => (
                                        <li key={i} className="flex items-start space-x-3 text-sm text-slate-400">
                                            <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">{i + 1}</div>
                                            <span>{s}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Call to Action */}
            <div className="mt-24 p-16 rounded-[4rem] bg-gradient-to-br from-vpurple/20 via-slate-900 to-vpink/20 border border-white/5 text-center overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <Sparkles className="mx-auto text-vpurple-light mb-8 animate-pulse" size={48} />
                <h3 className="text-4xl font-black text-white mb-6 italic">"The limit is your imagination"</h3>
                <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10">
                    We are constantly evolving our models to bring you the best in acoustic intelligence. Stay tuned for new updates.
                </p>
                <div className="font-bold text-vpurple-light text-sm uppercase tracking-[0.3em]">Vaniverse AI • EST 2026</div>
            </div>
        </div>
    );
};

export default AboutUs;
