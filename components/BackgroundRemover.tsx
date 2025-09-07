import React, { useState } from 'react';
import { removeBackground } from '../services/geminiService';
import Spinner from './Spinner';
import LoadingIndicator from './LoadingIndicator';

const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const [header, data] = result.split(',');
      if (!header || !data) {
        reject(new Error("Invalid file format"));
        return;
      }
      const mimeType = header.match(/:(.*?);/)?.[1] || 'application/octet-stream';
      resolve({ base64: data, mimeType });
    };
    reader.onerror = (error) => reject(error);
  });
};

const UploadPlaceholder = () => (
    <div className="w-full h-full border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-500 p-4 hover:bg-gray-700/50 hover:border-gray-500 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="mt-2 text-center">Click to upload or drag & drop</p>
        <p className="text-xs mt-1 text-center">PNG, JPG, WEBP (Max 4MB)</p>
    </div>
);

const removerMessages = [
    "Analyzing image composition...",
    "Performing pixel-perfect surgery...",
    "Isolating the subject with precision...",
    "Almost there, creating a transparent canvas...",
];

const BackgroundRemover: React.FC = () => {
    const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
    const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
    const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 4 * 1024 * 1024) { // 4MB limit
                setError('File size must be less than 4MB.');
                return;
            }
            setOriginalImageFile(file);
            setOriginalImageUrl(URL.createObjectURL(file));
            setResultImageUrl(null);
            setError(null);
        }
    };

    const handleRemoveBackground = async () => {
        if (!originalImageFile) {
            setError('Please upload an image first.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResultImageUrl(null);

        try {
            const { base64, mimeType } = await fileToBase64(originalImageFile);
            const resultUrl = await removeBackground(base64, mimeType);
            setResultImageUrl(resultUrl);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownload = () => {
        if (!resultImageUrl) return;
        const link = document.createElement('a');
        link.href = resultImageUrl;
        const originalFileName = originalImageFile?.name.split('.').slice(0, -1).join('.') || 'image';
        link.download = `${originalFileName}-no-bg.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-6xl mx-auto p-6 bg-gray-800 rounded-xl shadow-lg">
            <div className="text-center mb-8">
                <div className="relative w-full max-w-md mx-auto h-48 bg-gray-900 rounded-lg">
                    <input 
                        type="file" 
                        onChange={handleFileChange} 
                        accept="image/png, image/jpeg, image/webp"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        aria-label="Upload image"
                    />
                    {originalImageUrl ? (
                        <img src={originalImageUrl} alt="Original Upload" className="w-full h-full object-contain rounded-lg p-2" />
                    ) : <UploadPlaceholder />}
                </div>

                <button
                    onClick={handleRemoveBackground}
                    disabled={isLoading || !originalImageFile}
                    className="mt-6 w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 bg-brand-purple hover:bg-brand-purple-light disabled:bg-gray-600 text-white font-bold rounded-lg transition-colors duration-300 shadow-lg disabled:cursor-not-allowed"
                >
                    {isLoading ? <><Spinner className="mr-2" /> Removing Background...</> : 'Remove Background'}
                </button>
            </div>
            
            {error && <div className="text-center text-red-400 bg-red-900/50 p-3 rounded-lg my-6">{error}</div>}

            <div className="w-full max-w-2xl mx-auto bg-gray-900 rounded-lg flex flex-col items-center justify-center overflow-hidden min-h-[24rem]">
                {isLoading && (
                    <LoadingIndicator messages={removerMessages} />
                )}

                {resultImageUrl && !isLoading && (
                    <div className="animate-fade-in p-4 text-center">
                      <img src={resultImageUrl} alt="Background removed" className="max-w-full h-auto object-contain" />
                       <button
                            onClick={handleDownload}
                            className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors duration-300 shadow-lg"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download Image
                        </button>
                    </div>
                )}

                {!resultImageUrl && !isLoading && (
                    <div className="text-center text-gray-500 p-8">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <p className="mt-2">The result will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BackgroundRemover;