// G8N Services - Master Export

export * from './gemini';
export * from './gas';
export * from './file';

// Provide a unified services object for convenience
import { geminiClient } from './gemini';
import { gasBridge } from './gas';
import { g8nFileService } from './file';

export const services = {
    gemini: geminiClient,
    gas: gasBridge,
    file: g8nFileService,
};
