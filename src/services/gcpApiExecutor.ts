// GCP API Executor - Executes GCP API calls using OAuth token

import { GcpAuthService } from './gcpAuthService';
import { useWorkflowStore } from '../stores/workflowStore';
import type { GcpApiTool } from '../types/nodes';

// Function declarations for Gemini function calling
export const GCP_FUNCTION_DECLARATIONS: Record<GcpApiTool, any> = {
    youtube_data: {
        name: 'search_youtube_videos',
        description: '在 YouTube 上搜尋影片。可用於查找特定主題、頻道或內容類型的影片。',
        parameters: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: '搜尋關鍵字',
                },
                maxResults: {
                    type: 'number',
                    description: '最大結果數量 (1-50)',
                },
            },
            required: ['query'],
        },
    },
    google_calendar: {
        name: 'list_calendar_events',
        description: '列出 Google 日曆中的活動。可用於查看即將到來的行程或特定日期的活動。',
        parameters: {
            type: 'object',
            properties: {
                timeMin: {
                    type: 'string',
                    description: '開始時間 (ISO 8601 格式，例如 2024-01-01T00:00:00Z)',
                },
                timeMax: {
                    type: 'string',
                    description: '結束時間 (ISO 8601 格式)',
                },
                maxResults: {
                    type: 'number',
                    description: '最大結果數量',
                },
            },
            required: [],
        },
    },
    gmail: {
        name: 'search_gmail',
        description: '搜尋 Gmail 郵件。可用於查找特定寄件人、主旨或內容的郵件。',
        parameters: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: '搜尋條件 (支援 Gmail 搜尋語法，如 from:xxx subject:xxx)',
                },
                maxResults: {
                    type: 'number',
                    description: '最大結果數量',
                },
            },
            required: ['query'],
        },
    },
    google_drive: {
        name: 'list_drive_files',
        description: '列出 Google Drive 中的檔案和資料夾。可用於瀏覽雲端硬碟內容。',
        parameters: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: '搜尋條件 (支援 Drive query 語法)',
                },
                maxResults: {
                    type: 'number',
                    description: '最大結果數量',
                },
            },
            required: [],
        },
    },
    places_api: {
        name: 'search_places',
        description: '搜尋地點資訊。可用於查找餐廳、商店、景點等地點。',
        parameters: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: '搜尋地點關鍵字',
                },
                location: {
                    type: 'string',
                    description: '位置座標 (格式: lat,lng)',
                },
                radius: {
                    type: 'number',
                    description: '搜尋半徑 (公尺)',
                },
            },
            required: ['query'],
        },
    },
};

// API Base URLs
const API_BASE = {
    youtube: 'https://www.googleapis.com/youtube/v3',
    calendar: 'https://www.googleapis.com/calendar/v3',
    gmail: 'https://www.googleapis.com/gmail/v1',
    drive: 'https://www.googleapis.com/drive/v3',
    places: 'https://maps.googleapis.com/maps/api/place',
};

/**
 * Execute a GCP API function call
 */
export async function executeGcpFunction(
    functionName: string,
    args: Record<string, any>
): Promise<any> {
    const token = GcpAuthService.getAccessToken();
    if (!token) {
        return { error: true, message: '未授權。請先登入 Google 授權。' };
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };

    try {
        switch (functionName) {
            case 'search_youtube_videos': {
                const url = new URL(`${API_BASE.youtube}/search`);
                url.searchParams.set('part', 'snippet');
                url.searchParams.set('type', 'video');
                url.searchParams.set('q', args.query);
                url.searchParams.set('maxResults', String(args.maxResults || 10));

                const res = await fetch(url.toString(), { headers });
                const data = await res.json();

                if (data.error) {
                    return { error: true, message: data.error.message };
                }

                return {
                    success: true,
                    videos: data.items?.map((item: any) => ({
                        title: item.snippet.title,
                        description: item.snippet.description,
                        videoId: item.id.videoId,
                        channelTitle: item.snippet.channelTitle,
                        publishedAt: item.snippet.publishedAt,
                        thumbnail: item.snippet.thumbnails?.default?.url,
                    })) || [],
                };
            }

            case 'list_calendar_events': {
                const url = new URL(`${API_BASE.calendar}/calendars/primary/events`);
                if (args.timeMin) url.searchParams.set('timeMin', args.timeMin);
                if (args.timeMax) url.searchParams.set('timeMax', args.timeMax);
                url.searchParams.set('maxResults', String(args.maxResults || 10));
                url.searchParams.set('singleEvents', 'true');
                url.searchParams.set('orderBy', 'startTime');

                const res = await fetch(url.toString(), { headers });
                const data = await res.json();

                if (data.error) {
                    return { error: true, message: data.error.message };
                }

                return {
                    success: true,
                    events: data.items?.map((item: any) => ({
                        summary: item.summary,
                        start: item.start?.dateTime || item.start?.date,
                        end: item.end?.dateTime || item.end?.date,
                        location: item.location,
                        description: item.description,
                    })) || [],
                };
            }

            case 'search_gmail': {
                const url = new URL(`${API_BASE.gmail}/users/me/messages`);
                url.searchParams.set('q', args.query);
                url.searchParams.set('maxResults', String(args.maxResults || 10));

                const res = await fetch(url.toString(), { headers });
                const data = await res.json();

                if (data.error) {
                    return { error: true, message: data.error.message };
                }

                // Fetch message details
                const messages = await Promise.all(
                    (data.messages || []).slice(0, 5).map(async (msg: any) => {
                        const msgRes = await fetch(
                            `${API_BASE.gmail}/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
                            { headers }
                        );
                        const msgData = await msgRes.json();
                        const getHeader = (name: string) =>
                            msgData.payload?.headers?.find((h: any) => h.name === name)?.value || '';
                        return {
                            id: msg.id,
                            subject: getHeader('Subject'),
                            from: getHeader('From'),
                            date: getHeader('Date'),
                            snippet: msgData.snippet,
                        };
                    })
                );

                return { success: true, messages };
            }

            case 'list_drive_files': {
                const url = new URL(`${API_BASE.drive}/files`);
                url.searchParams.set('pageSize', String(args.maxResults || 20));
                url.searchParams.set('fields', 'files(id,name,mimeType,modifiedTime,size)');
                if (args.query) {
                    url.searchParams.set('q', args.query);
                }

                const res = await fetch(url.toString(), { headers });
                const data = await res.json();

                if (data.error) {
                    return { error: true, message: data.error.message };
                }

                return {
                    success: true,
                    files: data.files?.map((file: any) => ({
                        name: file.name,
                        id: file.id,
                        type: file.mimeType,
                        modifiedTime: file.modifiedTime,
                        size: file.size,
                    })) || [],
                };
            }

            case 'search_places': {
                // Places API uses API Key, not OAuth
                const { settings } = useWorkflowStore.getState();
                const apiKey = settings.gcpApiKey;

                if (!apiKey) {
                    return {
                        error: true,
                        message: '請先在 Settings 中設定 Places API Key。',
                    };
                }

                // Use Places API (New) - Text Search
                const url = new URL('https://places.googleapis.com/v1/places:searchText');

                const res = await fetch(url.toString(), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': apiKey,
                        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.types,places.googleMapsUri',
                    },
                    body: JSON.stringify({
                        textQuery: args.query,
                        maxResultCount: args.maxResults || 10,
                        ...(args.location && {
                            locationBias: {
                                circle: {
                                    center: {
                                        latitude: parseFloat(args.location.split(',')[0]),
                                        longitude: parseFloat(args.location.split(',')[1]),
                                    },
                                    radius: args.radius || 5000,
                                },
                            },
                        }),
                    }),
                });

                const data = await res.json();

                if (data.error) {
                    return { error: true, message: data.error.message };
                }

                return {
                    success: true,
                    places: data.places?.map((place: any) => ({
                        name: place.displayName?.text,
                        address: place.formattedAddress,
                        rating: place.rating,
                        ratingCount: place.userRatingCount,
                        types: place.types,
                        mapsUrl: place.googleMapsUri,
                    })) || [],
                };
            }

            default:
                return { error: true, message: `Unknown function: ${functionName}` };
        }
    } catch (e: any) {
        return { error: true, message: e.message };
    }
}

/**
 * Get function declarations for connected GCP tools
 */
export function getGcpFunctionDeclarations(toolTypes: GcpApiTool[]): any[] {
    return toolTypes
        .filter(t => GCP_FUNCTION_DECLARATIONS[t])
        .map(t => GCP_FUNCTION_DECLARATIONS[t]);
}
