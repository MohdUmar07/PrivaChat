import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, AtSign, FileText } from 'lucide-react';

const ContactInfoModal = ({ isOpen, onClose, contact }) => {
    if (!isOpen || !contact) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#0f172a] border border-white/10 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden relative"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex flex-col items-center p-8 bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-b border-white/10">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold text-4xl mb-4 shadow-lg">
                            {contact.username ? contact.username[0].toUpperCase() : '?'}
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-1">
                            {contact.displayName || contact.username}
                        </h2>
                        <p className="text-blue-400 text-sm flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${contact.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                            {contact.isOnline ? 'Online' : 'Offline'}
                        </p>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                            <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400">
                                <AtSign size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Username</p>
                                <p className="text-white font-medium">@{contact.username}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-3 bg-white/5 rounded-xl">
                            <div className="bg-purple-500/10 p-2 rounded-lg text-purple-400">
                                <FileText size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider">About</p>
                                <p className="text-gray-300 text-sm leading-relaxed">
                                    {contact.about || "No status set."}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ContactInfoModal;
