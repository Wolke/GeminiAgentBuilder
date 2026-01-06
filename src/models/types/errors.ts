// G8N Types - Error definitions

// ============================================
// Error Codes
// ============================================

export type G8nErrorCode =
    // API Errors
    | 'GEMINI_API_ERROR'
    | 'GEMINI_RATE_LIMIT'
    | 'GEMINI_INVALID_KEY'

    // GAS Errors
    | 'GAS_UNREACHABLE'
    | 'GAS_AUTH_FAILED'
    | 'GAS_TIMEOUT'
    | 'GAS_NOT_CONFIGURED'

    // Workflow Errors
    | 'WORKFLOW_INVALID'
    | 'WORKFLOW_PARSE_ERROR'
    | 'WORKFLOW_VERSION_MISMATCH'

    // Node Errors
    | 'NODE_NOT_FOUND'
    | 'NODE_EXECUTION_FAILED'
    | 'NODE_MISSING_CONFIG'

    // General Errors
    | 'UNKNOWN_ERROR';

// ============================================
// Error Interface
// ============================================

export interface G8nError {
    code: G8nErrorCode;
    message: string;
    nodeId?: string;
    details?: unknown;
    retryable: boolean;
    timestamp: number;
}

// ============================================
// Error Factory
// ============================================

export function createG8nError(
    code: G8nErrorCode,
    message: string,
    options?: {
        nodeId?: string;
        details?: unknown;
        retryable?: boolean;
    }
): G8nError {
    return {
        code,
        message,
        nodeId: options?.nodeId,
        details: options?.details,
        retryable: options?.retryable ?? isRetryableError(code),
        timestamp: Date.now(),
    };
}

// ============================================
// Helpers
// ============================================

function isRetryableError(code: G8nErrorCode): boolean {
    const retryableCodes: G8nErrorCode[] = [
        'GEMINI_RATE_LIMIT',
        'GAS_UNREACHABLE',
        'GAS_TIMEOUT',
    ];
    return retryableCodes.includes(code);
}

export function isG8nError(error: unknown): error is G8nError {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        'message' in error &&
        'retryable' in error
    );
}

// ============================================
// User-friendly error messages
// ============================================

export const ERROR_MESSAGES: Record<G8nErrorCode, string> = {
    GEMINI_API_ERROR: 'Gemini API 發生錯誤',
    GEMINI_RATE_LIMIT: 'API 配額已超限，請稍後再試',
    GEMINI_INVALID_KEY: 'Gemini API Key 無效',

    GAS_UNREACHABLE: 'GAS 服務無法連線',
    GAS_AUTH_FAILED: 'GAS 認證失敗，請檢查 Token',
    GAS_TIMEOUT: 'GAS 服務逾時',
    GAS_NOT_CONFIGURED: 'GAS 尚未設定，請先同步工作流程',

    WORKFLOW_INVALID: '工作流程格式無效',
    WORKFLOW_PARSE_ERROR: '工作流程解析失敗',
    WORKFLOW_VERSION_MISMATCH: '工作流程版本不相容',

    NODE_NOT_FOUND: '找不到指定節點',
    NODE_EXECUTION_FAILED: '節點執行失敗',
    NODE_MISSING_CONFIG: '節點設定不完整',

    UNKNOWN_ERROR: '發生未知錯誤',
};
