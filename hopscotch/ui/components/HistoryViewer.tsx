/**
 * History Viewer Component
 * Example component showing how to integrate with the new FastAPI backend
 */

'use client';

import React, { useState, useEffect } from 'react';
import { apiClient, HistoryEntry, HistoryQueryResult } from '../lib/api';

interface HistoryViewerProps {
  className?: string;
}

export default function HistoryViewer({ className = '' }: HistoryViewerProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const query = {
        limit: 50,
        search_term: searchTerm || undefined,
      };
      
      const result = await apiClient.getHistory(query);
      setHistory(result.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadHistory();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const extractDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Browsing History</h2>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Search history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Search
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading history...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadHistory}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No history entries found. Try syncing your browser history first.
            </p>
          ) : (
            history.map((entry) => (
              <div
                key={entry.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {entry.title || 'Untitled'}
                    </h3>
                    <p className="text-sm text-blue-600 hover:text-blue-800 truncate">
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {entry.url}
                      </a>
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {entry.browser}
                      </span>
                      <span>{extractDomain(entry.url)}</span>
                      <span>{formatDate(entry.visit_time)}</span>
                      {entry.visit_count > 1 && (
                        <span>Visited {entry.visit_count} times</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!loading && !error && history.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={loadHistory}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}