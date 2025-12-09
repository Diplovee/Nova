import React, { useState } from 'react';
import { Settings, Info, Bell, Shield, Database, Sparkles, ChevronRight, Github, Twitter } from 'lucide-react';
import { FloatingChip } from './ui/FloatingChip';

export const SettingsView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'CHANGELOG' | 'ABOUT'>('GENERAL');

    const renderContent = () => {
        switch (activeTab) {
            case 'GENERAL':
                return (
                    <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                        <section className="space-y-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Database size={20} className="text-nova-primary"/> Data Management</h3>
                            <div className="bg-nova-card border border-slate-700 rounded-xl p-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="text-white font-medium">Local Data</h4>
                                        <p className="text-slate-400 text-sm">Clear all locally stored boards and preferences.</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (confirm("Are you sure? This will delete all your boards.")) {
                                                localStorage.removeItem('nova_boards');
                                                localStorage.removeItem('nova_last_board_id');
                                                window.location.reload();
                                            }
                                        }}
                                        className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Reset Data
                                    </button>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Sparkles size={20} className="text-yellow-400"/> Appearance</h3>
                            <div className="bg-nova-card border border-slate-700 rounded-xl p-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="text-white font-medium">Theme</h4>
                                        <p className="text-slate-400 text-sm">Currently locked to Nova Dark.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="w-6 h-6 rounded-full bg-[#1E1E28] border-2 border-nova-primary cursor-pointer"/>
                                        <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-600 opacity-20 cursor-not-allowed"/>
                                    </div>
                                </div>
                                <div className="h-px bg-slate-700/50"/>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="text-white font-medium">Reduced Motion</h4>
                                        <p className="text-slate-400 text-sm">Disable complex animations.</p>
                                    </div>
                                    <div className="w-12 h-6 bg-slate-700 rounded-full relative cursor-pointer">
                                        <div className="absolute left-1 top-1 w-4 h-4 bg-slate-400 rounded-full transition-all"/>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                );
            case 'CHANGELOG':
                return (
                    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-white">Changelog</h3>
                            <span className="px-3 py-1 rounded-full bg-nova-primary/20 text-nova-primary text-xs font-bold border border-nova-primary/30">Latest</span>
                        </div>
                        
                        <div className="relative border-l-2 border-slate-700 ml-3 pl-8 space-y-10 py-2">
                             {/* Version 5.10.0 */}
                             <div className="relative">
                                <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-nova-primary border-4 border-nova-bg flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"/>
                                </div>
                                <div className="flex flex-col gap-1 mb-4">
                                    <h4 className="text-xl font-bold text-white">v5.10.0 BETA</h4>
                                    <span className="text-slate-400 text-sm">Current Version</span>
                                </div>
                                <div className="bg-nova-card border border-slate-700 rounded-xl p-6 shadow-sm hover:shadow-glow transition-shadow">
                                    <ul className="space-y-3">
                                        <li className="flex items-start gap-3 text-slate-300">
                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-nova-primary shrink-0"/>
                                            <span><strong className="text-white">AI Generator for Notes & Sheets:</strong> Instantly create detailed project documents or structured spreadsheets from any board item using AI.</span>
                                        </li>
                                         <li className="flex items-start gap-3 text-slate-300">
                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"/>
                                            <span>Improved context-aware AI suggestions.</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Version 5.9.0 */}
                            <div className="relative opacity-60 hover:opacity-100 transition-opacity">
                                <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-slate-700 border-4 border-nova-bg"/>
                                <div className="flex flex-col gap-1 mb-4">
                                    <h4 className="text-lg font-bold text-slate-200">v5.9.0 BETA</h4>
                                    <span className="text-slate-500 text-sm">Previous Release</span>
                                </div>
                                <div className="bg-nova-card border border-slate-700/50 rounded-xl p-6">
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex items-start gap-3 text-slate-400">
                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"/>
                                            <span>New Timeline View.</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-slate-400">
                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"/>
                                            <span>Resources Module & Enhanced Note Editor.</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-slate-400">
                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"/>
                                            <span>Global Search & Settings Update.</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'ABOUT':
                return (
                    <div className="flex flex-col items-center text-center py-10 animate-in slide-in-from-right-4 fade-in duration-300">
                        <img src="/icon.png" className="w-24 h-24 rounded-2xl shadow-glow mb-6" alt="Nova Logo"/>
                        <h2 className="text-3xl font-bold text-white mb-2">Nova Project Manager</h2>
                        <span className="px-4 py-1.5 bg-slate-800 rounded-full text-nova-primary font-mono text-sm border border-slate-700 mb-8">
                            v5.10.0 BETA
                        </span>
                        
                        <div className="max-w-xl text-slate-400 space-y-4 mb-10">
                            <p>
                                Nova is a premium, visual-first project management tool designed for creative teams and individuals.
                                Combining the flexibility of an infinite canvas with structured task management.
                            </p>
                            <p className="flex items-center justify-center gap-2">
                                 Powered by <span className="text-white font-semibold">Xalo Software</span>
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
                            <a href="#" className="flex items-center justify-center gap-2 p-4 bg-nova-card hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors text-white">
                                <Github size={20}/> GitHub
                            </a>
                            <a href="#" className="flex items-center justify-center gap-2 p-4 bg-nova-card hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors text-white">
                                <Twitter size={20}/> Twitter
                            </a>
                        </div>
                        
                        <footer className="mt-20 text-xs text-slate-600">
                            &copy; 2024 Xalo Software. All rights reserved.
                        </footer>
                    </div>
                );
        }
    };

    return (
        <div className="p-10 h-full overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
                    <p className="text-slate-400">Configure your workspace and view updates.</p>
                </header>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Tabs */}
                    <nav className="w-full md:w-64 flex-shrink-0 space-y-1">
                        <button 
                            onClick={() => setActiveTab('GENERAL')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'GENERAL' ? 'bg-nova-primary text-black' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                            <Settings size={18}/> General
                        </button>
                        <button 
                            onClick={() => setActiveTab('CHANGELOG')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'CHANGELOG' ? 'bg-nova-primary text-black' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                            <Bell size={18}/> Changelog
                            {activeTab !== 'CHANGELOG' && <span className="ml-auto w-2 h-2 bg-nova-primary rounded-full animate-pulse"/>}
                        </button>
                        <button 
                            onClick={() => setActiveTab('ABOUT')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'ABOUT' ? 'bg-nova-primary text-black' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                            <Info size={18}/> About
                        </button>
                    </nav>

                    {/* Content Area */}
                    <main className="flex-1 min-h-[500px]">
                        {renderContent()}
                    </main>
                </div>
            </div>
        </div>
    );
};