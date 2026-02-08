import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 24, color = 'text-blue-500' }) => {
    return (
        <div className="flex items-center justify-center">
            <motion.div
                className={`rounded-full border-4 border-t-transparent ${color}`}
                style={{ width: size, height: size, borderRightColor: 'transparent', borderBottomColor: 'transparent' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
        </div>
    );
};

export default LoadingSpinner;
