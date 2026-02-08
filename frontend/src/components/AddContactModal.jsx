import React, { useState } from 'react';
import { Search, UserPlus, X, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const AddContactModal = ({ isOpen, onClose, onRequestSent }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sentMap, setSentMap] = useState({}); // track sent status per user in this session

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/chat/search?query=${query}`, {
                headers: { Authorization: token }
            });
            const data = await res.json();
            setResults(data);
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setLoading(false);
        }
    };

    const sendRequest = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/chat/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token
                },
                body: JSON.stringify({ recipientId: userId })
            });

            if (res.ok) {
                setSentMap(prev => ({ ...prev, [userId]: true }));
                if (onRequestSent) onRequestSent();
            }
        } catch (err) {
            console.error("Failed to send request", err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0f172a] border border-white/10 w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
            >
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 className="text-white font-bold text-lg">Add New Contact</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by username..."
                            className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={loading || !query.trim()}
                            className='absolute right-2 top-2 bg-blue-600 px-3 py-1 rounded-lg text-sm font-medium hover:bg-blue-500 text-white disabled:opacity-50'
                        >
                            {loading ? '...' : 'Search'}
                        </button>
                    </form>

                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {results.length === 0 && query && !loading && (
                            <p className='text-center text-gray-500 text-sm'>No users found.</p>
                        )}

                        {results.map(user => (
                            <div key={user._id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                        {user.username[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="text-white font-medium">{user.username}</h4>
                                        <p className="text-xs text-gray-400">{user.email}</p>
                                    </div>
                                </div>

                                {sentMap[user._id] ? (
                                    <span className="text-green-400 text-xs flex items-center gap-1 bg-green-400/10 px-2 py-1 rounded-lg">
                                        <Check size={14} /> Sent
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => sendRequest(user._id)}
                                        className="p-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                                    >
                                        <UserPlus size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AddContactModal;
