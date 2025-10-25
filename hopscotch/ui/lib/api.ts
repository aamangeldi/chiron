/**
 * API client for Hopscotch backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface HistoryEntry {
  id: string;
  url: string;
  title?: string;
  visit_time: string;
  browser: 'chrome' | 'firefox' | 'safari' | 'edge';
  visit_count: number;
  metadata?: Record<string, any>;
}

export interface HistoryQuery {
  start_date?: string;
  end_date?: string;
  browser?: string;
  search_term?: string;
  limit?: number;
  offset?: number;
}

export interface HistoryQueryResult {
  entries: HistoryEntry[];
  total: number;
  has_more: boolean;
}

export interface AgentMessage {
  content: string;
  context?: Record<string, any>;
  user_id?: string;
  session_id?: string;
}

export interface AgentResponse {
  content: string;
  confidence?: number;
  sources?: Array<{
    type: string;
    url: string;
    title: string;
    domain: string;
  }>;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface SyncStatus {
  status: 'running' | 'completed' | 'failed' | 'never';
  last_sync?: string;
  entries_synced: number;
  error_message?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // History API
  async getHistory(query: HistoryQuery = {}): Promise<HistoryQueryResult> {
    const params = new URLSearchParams();
    
    if (query.start_date) params.append('start_date', query.start_date);
    if (query.end_date) params.append('end_date', query.end_date);
    if (query.browser) params.append('browser', query.browser);
    if (query.search_term) params.append('search_term', query.search_term);
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.offset) params.append('offset', query.offset.toString());

    const queryString = params.toString();
    const endpoint = `/api/history/${queryString ? `?${queryString}` : ''}`;
    
    return this.request<HistoryQueryResult>(endpoint);
  }

  async getRecentHistory(hours: number = 24, limit: number = 50): Promise<HistoryEntry[]> {
    const params = new URLSearchParams({
      hours: hours.toString(),
      limit: limit.toString(),
    });
    
    return this.request<HistoryEntry[]>(`/api/history/recent?${params}`);
  }

  async getHistoryAnalytics(): Promise<Record<string, any>> {
    return this.request<Record<string, any>>('/api/history/analytics');
  }

  async getDomainStats(days: number = 30, limit: number = 20): Promise<Record<string, any>> {
    const params = new URLSearchParams({
      days: days.toString(),
      limit: limit.toString(),
    });
    
    return this.request<Record<string, any>>(`/api/history/domains?${params}`);
  }

  // AI API
  async chatWithAgent(message: AgentMessage): Promise<AgentResponse> {
    return this.request<AgentResponse>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  async chatWithContext(message: string, context?: Record<string, any>): Promise<AgentResponse> {
    return this.request<AgentResponse>('/api/ai/chat/with-context', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
  }

  async getSuggestions(context?: Record<string, any>): Promise<Record<string, any>> {
    return this.request<Record<string, any>>('/api/ai/suggestions', {
      method: 'GET',
      body: context ? JSON.stringify({ context }) : undefined,
    });
  }

  async getAIStatus(): Promise<Record<string, any>> {
    return this.request<Record<string, any>>('/api/ai/status');
  }

  // Sync API
  async startSync(browsers?: string[]): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/sync/start', {
      method: 'POST',
      body: JSON.stringify({ browsers }),
    });
  }

  async startFullSync(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/sync/full-sync', {
      method: 'POST',
    });
  }

  async getSyncStatus(): Promise<SyncStatus> {
    return this.request<SyncStatus>('/api/sync/status');
  }

  async getAvailableBrowsers(): Promise<Record<string, any>> {
    return this.request<Record<string, any>>('/api/sync/browsers');
  }

  // Health check
  async healthCheck(): Promise<Record<string, any>> {
    return this.request<Record<string, any>>('/health');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export { ApiClient };