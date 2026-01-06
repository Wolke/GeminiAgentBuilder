// G8N - Gemini API Client

import { GoogleGenerativeAI } from '@google/generative-ai';
import { initialSettings } from '../../models/store/slices/settingsSlice';

// Models
import type { GeminiModel } from '../../models/types';
import { createG8nError } from '../../models/types';

// Types
export interface GeminiRequestConfig {
    apiKey: string;
    model: GeminiModel;
    temperature?: number;
    maxOutputTokens?: number;
    systemInstruction?: string;
}

export interface GeminiGenerationResult {
    text: string;
    tokensUsed?: number;
}

// Client
export const geminiClient = {
    /**
     * Validate API Key
     */
    async validateApiKey(apiKey: string): Promise<boolean> {
        if (!apiKey) return false;
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
            await model.generateContent('Hello');
            return true;
        } catch (error) {
            console.error('Gemini API validation failed:', error);
            return false;
        }
    },

    /**
     * Generate content using Gemini API
     */
    async generateContent(
        prompt: string,
        config: GeminiRequestConfig
    ): Promise<GeminiGenerationResult> {
        if (!config.apiKey) {
            throw createG8nError('GEMINI_INVALID_KEY', 'Gemini API Key is missing');
        }

        try {
            const genAI = new GoogleGenerativeAI(config.apiKey);

            const modelConfig: any = { model: config.model };
            if (config.systemInstruction) {
                modelConfig.systemInstruction = config.systemInstruction;
            }

            const model = genAI.getGenerativeModel(modelConfig);

            const generationConfig = {
                temperature: config.temperature ?? 0.7,
                maxOutputTokens: config.maxOutputTokens,
            };

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig,
            });

            const response = await result.response;
            const text = response.text();

            // Estimate or extract token usage if available in metadata
            const tokensUsed = response.usageMetadata?.totalTokenCount;

            return { text, tokensUsed };
        } catch (error: any) {
            console.error('Gemini generation error:', error);

            // Map to G8N error
            if (error.message?.includes('429')) {
                throw createG8nError('GEMINI_RATE_LIMIT', 'API rate limit exceeded');
            } else if (error.message?.includes('403') || error.message?.includes('INVALID_ARGUMENT')) {
                throw createG8nError('GEMINI_INVALID_KEY', 'Invalid API Key');
            }

            throw createG8nError('GEMINI_API_ERROR', error.message || 'Unknown Gemini API error');
        }
    }
};
