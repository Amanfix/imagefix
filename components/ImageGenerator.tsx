import React, { useState } from 'react';
import { generateImage, generateImageFromReference } from '../services/geminiService';
import Spinner from './Spinner';
import LoadingIndicator from './LoadingIndicator';

const aspectRatios = ["1:1", "16:9", "9:16", "4:3", "3:4"];
const generationMessages = [
  "Summoning pixels from the digital ether...",
  "Teaching the AI about modern art...",
  "This might take a moment, great art needs patience.",
  "Translating your imagination into an image...",
  "Warming up the creativity circuits...",
];

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

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [referenceImageFile, setReferenceImageFile] = useState<File | null>(null);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        setError('Reference image size must be less than 4MB.');
        return;
      }
      setReferenceImageFile(file);
      setReferenceImageUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleClearReference = () => {
    setReferenceImageFile(null);
    if (referenceImageUrl) {
        URL.revokeObjectURL(referenceImageUrl);
    }
    setReferenceImageUrl(null);
  };

  const handleGenerate = async () => {
    if (!prompt) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      let imageUrl: string;
      if (referenceImageFile) {
        const { base64, mimeType } = await fileToBase64(referenceImageFile);
        imageUrl = await generateImageFromReference(base64, mimeType, prompt, aspectRatio);
      } else {
        imageUrl = await generateImage(prompt, aspectRatio);
      }
      setGeneratedImage(imageUrl);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    // Sanitize and shorten the prompt for the filename
    const safePrompt = prompt.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const truncatedPrompt = safePrompt.substring(0, 30);
    link.download = `imagfix-${truncatedPrompt || 'generated'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg transition-colors duration-300">
      <div className="space-y-6">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
            Your Prompt
          </label>
          <textarea
            id="prompt"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple transition"
            placeholder="e.g., A futuristic cityscape at sunset, with flying cars and neon lights."
          />
        </div>

        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">
                Reference Image (Optional)
            </label>
            {referenceImageUrl ? (
                <div className="relative w-full h-40 group bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
                    <img src={referenceImageUrl} alt="Reference" className="w-full h-full object-contain rounded-md" />
                    <button
                        onClick={handleClearReference}
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white"
                        aria-label="Remove reference image"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ) : (
                <div className="relative w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                    <input 
                        type="file" 
                        onChange={handleFileChange} 
                        accept="image/png, image/jpeg, image/webp"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="reference-upload"
                        aria-label="Upload reference image"
                    />
                    <label htmlFor="reference-upload" className="text-center text-gray-500 dark:text-gray-500 cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span className="mt-1 block text-sm">Upload an image</span>
                    </label>
                </div>
            )}
        </div>


        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
            Aspect Ratio
          </label>
          <div className="flex flex-wrap gap-2">
            {aspectRatios.map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  aspectRatio === ratio
                    ? 'bg-brand-purple text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 bg-brand-purple hover:bg-brand-purple-light disabled:bg-gray-600 text-white font-bold rounded-lg transition-colors duration-300 shadow-lg disabled:cursor-not-allowed"
          >
            {isLoading ? <><Spinner className="mr-2" /> Generating...</> : 'Generate Image'}
          </button>
        </div>
      </div>
      
      <div className="mt-8">
        {error && <div className="text-center text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg">{error}</div>}
        
        <div className="mt-6 aspect-w-1 aspect-h-1 w-full max-w-lg mx-auto bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden min-h-[30rem] transition-colors duration-300">
          {isLoading && (
            <LoadingIndicator messages={generationMessages} />
          )}
          
          {generatedImage && !isLoading && (
            <div className="animate-fade-in text-center p-4">
                <img src={generatedImage} alt="Generated" className="w-full h-full object-contain" />
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

          {!generatedImage && !isLoading && (
             <div className="text-center text-gray-500 dark:text-gray-500 p-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-2">Your generated image will appear here.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;