import { GoogleGenAI, Modality } from "@google/genai";
import type { EditedImageResponse } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to parse potential API errors and return a user-friendly message
const getErrorMessage = (error: any, context: 'generating' | 'editing' | 'removing background'): string => {
    console.error(`Error ${context} image:`, error);
    const message = error.message || `An unknown error occurred while ${context} the image.`;

    // Check for common, user-actionable errors from the API
    if (message.toLowerCase().includes('prompt was blocked')) {
        return "Your prompt was blocked due to safety policies. Please revise your prompt and try again.";
    }
    if (message.toLowerCase().includes('api key not valid')) {
        return "The provided API key is invalid. Please check your configuration.";
    }
    if (message.toLowerCase().includes('unsupported image format')) {
        return "The uploaded image format is not supported. Please use a common format like PNG, JPEG, or WEBP.";
    }
    if (message.toLowerCase().includes('image is too large')) {
        return "The uploaded image is too large. Please use an image smaller than 4MB.";
    }
    // For Nano Banana, sometimes it just can't fulfill the request
    if ((context === 'editing' || context === 'removing background' || context === 'generating') && (message.toLowerCase().includes('internal error') || message.toLowerCase().includes('model could not fulfill request'))) {
        return "The model couldn't complete the request. This can sometimes happen with complex requests. Try simplifying your prompt or using a different image.";
    }
    
    // Generic fallback
    const actionVerb = context.charAt(0).toUpperCase() + context.slice(1).replace(/ing.*/, '');
    return `Failed to ${actionVerb.toLowerCase()} image. ${message}`;
};


export const generateImage = async (prompt: string, aspectRatio: string): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    } else {
      // This case handles a successful API call that still returns no image.
      throw new Error("The model did not generate an image. This could be due to the prompt's content. Please try a different prompt.");
    }
  } catch (error) {
    throw new Error(getErrorMessage(error, 'generating'));
  }
};

export const generateImageFromReference = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string,
  aspectRatio: string
): Promise<string> => {
  try {
    // Instruct the model to generate a new image based on the prompt and reference, and to adhere to the aspect ratio.
    const fullPrompt = `${prompt}. The output image must have an aspect ratio of ${aspectRatio}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: fullPrompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE], // We only need the image for the generator's output
      },
    });

    let imageUrl: string | null = null;
    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64ImageBytes = part.inlineData.data;
          const imageMimeType = part.inlineData.mimeType;
          imageUrl = `data:${imageMimeType};base64,${base64ImageBytes}`;
          break; // Found the image, no need to continue
        }
      }
    }
    
    if (!imageUrl) {
        throw new Error("The AI did not return an image based on the reference. It might not have been able to fulfill the request. Try a different prompt or image.");
    }

    return imageUrl;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'generating'));
  }
};

export const editImage = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string
): Promise<EditedImageResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    let imageUrl: string | null = null;
    let text: string | null = null;

    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          text = (text || '') + part.text;
        } else if (part.inlineData) {
          const base64ImageBytes = part.inlineData.data;
          const imageMimeType = part.inlineData.mimeType;
          imageUrl = `data:${imageMimeType};base64,${base64ImageBytes}`;
        }
      }
    }
    
    if (!imageUrl) {
        // This handles cases where the model responds but doesn't include an image.
        throw new Error("The AI did not return an edited image. It might not have been able to fulfill the request. Try rephrasing your prompt.");
    }

    return { imageUrl, text };
  } catch (error) {
    throw new Error(getErrorMessage(error, 'editing'));
  }
};

export const removeBackground = async (
  base64ImageData: string,
  mimeType: string
): Promise<string> => {
  try {
    // Note: The model used here is `gemini-2.5-flash-image-preview`, a variant of `gemini-2.5-flash`.
    // While thinkingConfig is officially for `gemini-2.5-flash`, setting budget to 0 is a
    // low-risk optimization for this direct task that may improve latency.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: 'Remove the background from this image. The main subject should be preserved. The output must be a PNG with a transparent background.',
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    let imageUrl: string | null = null;
    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64ImageBytes = part.inlineData.data;
          // Forcing PNG as we explicitly requested a transparent background
          const imageMimeType = 'image/png';
          imageUrl = `data:${imageMimeType};base64,${base64ImageBytes}`;
          break; // Found the image part
        }
      }
    }
    
    if (!imageUrl) {
        throw new Error("The AI did not return an image. It might have been unable to process the request.");
    }

    return imageUrl;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'removing background'));
  }
};