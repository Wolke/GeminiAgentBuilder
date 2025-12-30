// Gemini Service - API integration for Gemini AI

import { GoogleGenerativeAI, GenerativeModel, Part, Tool } from '@google/generative-ai';
import { GeminiConfig, FunctionDeclaration, GenerationResult } from '../types';

let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

export function initializeGemini(apiKey: string, modelName: string = 'gemini-2.5-flash'): boolean {
    try {
        genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({ model: modelName });
        return true;
    } catch (error) {
        console.error('Failed to initialize Gemini:', error);
        return false;
    }
}

export function isInitialized(): boolean {
    return model !== null;
}

export async function generateContent(
    prompt: string,
    systemPrompt?: string,
    tools?: {
        functionDeclarations?: FunctionDeclaration[];
        codeExecution?: boolean;
        googleSearch?: boolean;
    },
    modelName?: string
): Promise<GenerationResult> {
    if (!model && !genAI) {
        throw new Error('Gemini not initialized. Call initializeGemini first.');
    }

    try {
        // Build tools array
        const geminiTools: Tool[] = [];

        if (tools?.functionDeclarations && tools.functionDeclarations.length > 0) {
            geminiTools.push({
                functionDeclarations: tools.functionDeclarations.map(fd => ({
                    name: fd.name,
                    description: fd.description,
                    parameters: fd.parameters,
                })),
            });
        }

        if (tools?.codeExecution) {
            geminiTools.push({ codeExecution: {} });
        }

        if (tools?.googleSearch) {
            // Google Search grounding
            geminiTools.push({
                googleSearch: {}
            } as Tool);
        }

        // Determine which model to use
        // If specific modelName provided, get that model
        // Else if systemPrompt provided, get model with system instruction (using default model name)
        // Else use default model

        let generationModel: GenerativeModel;

        if (modelName) {
            generationModel = genAI!.getGenerativeModel({
                model: modelName,
                systemInstruction: systemPrompt
            });
        } else if (systemPrompt) {
            generationModel = genAI!.getGenerativeModel({
                model: model!.model,
                systemInstruction: systemPrompt,
            });
        } else {
            generationModel = model!;
        }

        const result = await generationModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            tools: geminiTools.length > 0 ? geminiTools : undefined,
        });

        const response = result.response;
        const candidate = response.candidates?.[0];

        if (!candidate) {
            throw new Error('No response candidate received');
        }

        const output: GenerationResult = {};

        // Extract text parts
        const textParts = candidate.content.parts.filter(
            (p): p is Part & { text: string } => 'text' in p
        );
        if (textParts.length > 0) {
            output.text = textParts.map(p => p.text).join('\n');
        }

        // Extract function calls
        const functionCallParts = candidate.content.parts.filter(
            (p): p is Part & { functionCall: { name: string; args: Record<string, unknown> } } =>
                'functionCall' in p
        );
        if (functionCallParts.length > 0) {
            output.functionCalls = functionCallParts.map(p => ({
                name: p.functionCall.name,
                args: p.functionCall.args,
            }));
        }

        // Check for grounding metadata
        const groundingMeta = response.candidates?.[0]?.groundingMetadata;
        if (groundingMeta) {
            output.groundingMetadata = {
                searchEntryPoint: groundingMeta.searchEntryPoint,
                groundingChunks: groundingMeta.groundingChunks,
            };
        }

        return output;
    } catch (error) {
        console.error('Generation error:', error);
        throw error;
    }
}

// Chat session for multi-turn conversations
export function createChatSession(
    systemPrompt?: string,
    tools?: {
        functionDeclarations?: FunctionDeclaration[];
        codeExecution?: boolean;
        googleSearch?: boolean;
    }
) {
    if (!genAI || !model) {
        throw new Error('Gemini not initialized');
    }

    const geminiTools: Tool[] = [];

    if (tools?.functionDeclarations && tools.functionDeclarations.length > 0) {
        geminiTools.push({
            functionDeclarations: tools.functionDeclarations.map(fd => ({
                name: fd.name,
                description: fd.description,
                parameters: fd.parameters,
            })),
        });
    }

    if (tools?.codeExecution) {
        geminiTools.push({ codeExecution: {} });
    }

    if (tools?.googleSearch) {
        geminiTools.push({ googleSearch: {} } as Tool);
    }

    const chatModel = systemPrompt
        ? genAI.getGenerativeModel({
            model: model.model,
            systemInstruction: systemPrompt,
        })
        : model;

    return chatModel.startChat({
        tools: geminiTools.length > 0 ? geminiTools : undefined,
        history: [],
    });
}

export async function sendFunctionResponse(
    chat: ReturnType<typeof createChatSession>,
    functionName: string,
    response: Record<string, unknown>
): Promise<GenerationResult> {
    const result = await chat.sendMessage([
        {
            functionResponse: {
                name: functionName,
                response,
            },
        },
    ]);

    const candidate = result.response.candidates?.[0];
    if (!candidate) {
        throw new Error('No response candidate');
    }

    const output: GenerationResult = {};
    const textParts = candidate.content.parts.filter(
        (p): p is Part & { text: string } => 'text' in p
    );
    if (textParts.length > 0) {
        output.text = textParts.map(p => p.text).join('\n');
    }

    return output;
}
