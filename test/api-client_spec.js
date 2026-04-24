'use strict';

const assert = require('assert');
const { mapApiError } = require('../lib/api-client');

describe('api-client', function () {

  describe('mapApiError', function () {

    it('returns friendly message for API_KEY_REQUIRED', function () {
      const result = mapApiError(401, { error: { code: 'API_KEY_REQUIRED' } });
      assert.strictEqual(result, 'Invalid or missing API key');
    });

    it('returns friendly message for RESOURCE_NOT_FOUND with articleId', function () {
      const result = mapApiError(404, {
        error: { code: 'RESOURCE_NOT_FOUND', details: { articleId: 'abc123' } }
      });
      assert.strictEqual(result, 'Article not found: abc123');
    });

    it('returns friendly message for RESOURCE_NOT_FOUND without details', function () {
      const result = mapApiError(404, { error: { code: 'RESOURCE_NOT_FOUND' } });
      assert.strictEqual(result, 'Article not found: unknown');
    });

    it('returns friendly message for CALC_UNDEFINED_SYMBOL', function () {
      const result = mapApiError(400, {
        error: { code: 'CALC_UNDEFINED_SYMBOL', message: 'Symbol x not defined' }
      });
      assert.strictEqual(result, 'Unknown symbol in expression: Symbol x not defined');
    });

    it('returns friendly message for RESOURCE_ACCESS_DENIED', function () {
      const result = mapApiError(403, { error: { code: 'RESOURCE_ACCESS_DENIED' } });
      assert.strictEqual(result, 'Access denied to this article');
    });

    it('returns friendly message for VALIDATION_INVALID_FORMAT', function () {
      const result = mapApiError(400, {
        error: { code: 'VALIDATION_INVALID_FORMAT', message: 'inputs is required' }
      });
      assert.strictEqual(result, 'Invalid request: inputs is required');
    });

    it('returns rate limit message for 429', function () {
      const result = mapApiError(429, {});
      assert.strictEqual(result, 'Rate limit exceeded');
    });

    it('falls back to body error message when code unknown', function () {
      const result = mapApiError(500, { error: { message: 'Internal error' } });
      assert.strictEqual(result, 'Internal error');
    });

    it('falls back to generic message when body has no message', function () {
      const result = mapApiError(503, {});
      assert.strictEqual(result, 'API error 503');
    });

  });

});
