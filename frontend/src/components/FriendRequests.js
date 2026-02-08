import React, { useEffect, useState } from 'react';
import { Check, X, User } from 'lucide-react';
import { motion } from 'framer-motion';

const FriendRequests = ({ onAccept }) => {
    const [requests, setRequests] = useState([]);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/chat/requests`, {
                headers: { Authorization: token }
            });
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (err) {
            console.error("Failed to fetch requests", err);
        }
    };

    useEffect(() => {
        fetchRequests();
        // Poll every 10 seconds for new requests (or use socket in future)
        const interval = setInterval(fetchRequests, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleResponse = async (requestId, status) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/chat/request/respond`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token
                },
                body: JSON.stringify({ requestId, status })
            });

            // Update local state
            setRequests(prev => prev.filter(r => r._id !== requestId));

            if (status === 'accepted' && onAccept) {
                onAccept(); // Refresh contact list
            }
        } catch (err) {
            console.error("Failed to respond to request", err);
        }
    };

    if (requests.length === 0) return null;

    return (
        <div className="mb-4 px-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pending Requests</h3>
            <div className="space-y-2">
                {requests.map(req => (
                    <motion.div
                        key={req._id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-600/10 border border-blue-500/20 p-3 rounded-xl flex items-center justify-between"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                {req.sender.username[0].toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">{req.sender.username}</p>
                                <p className="text-[10px] text-blue-300">Wants to chat</p>
                            </div>
                        </div>

                        <div className="flex gap-1">
                            <button
                                onClick={() => handleResponse(req._id, 'accepted')}
                                className="p-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500 hover:text-white transition-colors"
                                title="Accept"
                            >
                                <Check size={14} />
                            </button>
                            <button
                                onClick={() => handleResponse(req._id, 'rejected')}
                                className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                                title="Decline"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default FriendRequests;
