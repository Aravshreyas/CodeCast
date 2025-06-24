import React, { useState } from 'react';
import { X } from 'lucide-react';

const PromptModal = ({ prompt, onClose }) => {
    if (!prompt) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
                    <X size={24} />
                </button>
                <h2 className="text-3xl font-bold mb-4">{prompt.title}</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">{prompt.description}</p>
                <button onClick={onClose} className="w-full mt-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                    Start Coding
                </button>
            </div>
        </div>
    );
};

export default PromptModal;