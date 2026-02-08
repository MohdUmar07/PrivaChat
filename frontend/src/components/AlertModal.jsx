import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertOctagon, Info } from 'lucide-react';

const AlertModal = ({ isOpen, onClose, title, message, type = 'info' }) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="text-green-500" size={32} />;
            case 'error':
                return <AlertOctagon className="text-red-500" size={32} />;
            case 'info':
            default:
                return <Info className="text-blue-500" size={32} />;
        }
    };

    const getButtonColor = () => {
        switch (type) {
            case 'success':
                return 'bg-green-600 hover:bg-green-700';
            case 'error':
                return 'bg-red-600 hover:bg-red-700';
            case 'info':
            default:
                return 'bg-blue-600 hover:bg-blue-700';
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-[#0f172a] border border-white/10 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden relative"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-6 flex flex-col items-center text-center">
                            <div className="mb-4 p-3 bg-white/5 rounded-full">
                                {getIcon()}
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                            <p className="text-gray-400 mb-6 text-sm leading-relaxed">{message}</p>

                            <button
                                onClick={onClose}
                                className={`w-full py-2.5 rounded-lg text-white font-medium transition-colors ${getButtonColor()}`}
                            >
                                Okay
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AlertModal;
