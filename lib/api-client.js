'use strict';

const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * Make an HTTP/HTTPS request to the CalcsLive API.
 * @param {object} options
 * @param {string} options.url - Full URL
 * @param {string} [options.method='GET'] - HTTP method
 * @param {string} options.apiKey - Bearer token
 * @param {object} [options.body] - Request body (will be JSON-serialized)
 * @param {number} [options.timeout=10000] - Timeout in ms
 * @returns {Promise<{statusCode: number, body: object}>}
 */
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.url);
    const lib = url.protocol === 'https:' ? https : http;
    const body = options.body ? JSON.stringify(options.body) : null;

    const reqOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.apiKey}`,
        ...(body && { 'Content-Length': Buffer.byteLength(body) })
      }
    };

    const req = lib.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          reject(new Error(`Invalid JSON response: ${data.substring(0, 100)}`));
        }
      });
    });

    req.setTimeout(options.timeout || 10000, () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    req.on('error', reject);

    if (body) req.write(body);
    req.end();
  });
}

/**
 * Map a CalcsLive API error code + statusCode to a human-readable message.
 * @param {number} statusCode
 * @param {object} body - Parsed response body
 * @returns {string}
 */
function mapApiError(statusCode, body) {
  if (statusCode === 429) return 'Rate limit exceeded';

  const error = body && body.error;
  const code = error && error.code;
  const details = error && error.details;

  const messages = {
    'API_KEY_REQUIRED': 'Invalid or missing API key',
    'RESOURCE_NOT_FOUND': `Article not found: ${(details && details.articleId) || 'unknown'}`,
    'CALC_UNDEFINED_SYMBOL': `Unknown symbol in expression: ${(error && error.message) || ''}`,
    'RESOURCE_ACCESS_DENIED': 'Access denied to this article',
    'VALIDATION_INVALID_FORMAT': `Invalid request: ${(error && error.message) || ''}`
  };

  if (code && messages[code]) return messages[code];
  return (error && error.message) || `API error ${statusCode}`;
}

module.exports = { makeRequest, mapApiError };
