/**
 * Connection Pool Manager for External API Calls
 *
 * Manages connection pooling to prevent overwhelming external APIs
 * and improve performance through connection reuse.
 */

const https = require('https');
const http = require('http');

class ConnectionPool {
  constructor(options = {}) {
    this.maxConnections = options.maxConnections || 10;
    this.maxConnectionsPerHost = options.maxConnectionsPerHost || 5;
    this.connectionTimeout = options.connectionTimeout || 30000; // 30 seconds
    this.keepAlive = options.keepAlive !== false; // Default true

    // Connection tracking
    this.activeConnections = new Map(); // host -> Set of active connections
    this.connectionQueue = new Map(); // host -> Array of queued requests
    this.connectionStats = new Map(); // host -> stats object

    // Agent pools for keep-alive connections
    this.httpAgent = new http.Agent({
      keepAlive: this.keepAlive,
      maxSockets: this.maxConnectionsPerHost,
      timeout: this.connectionTimeout
    });

    this.httpsAgent = new https.Agent({
      keepAlive: this.keepAlive,
      maxSockets: this.maxConnectionsPerHost,
      timeout: this.connectionTimeout
    });
  }

  /**
   * Make an HTTP request with connection pooling
   */
  async request(url, options = {}) {
    const urlObj = new URL(url);
    const host = urlObj.host;

    // Check connection limits
    if (!this.canMakeRequest(host)) {
      // Queue the request
      return this.queueRequest(host, url, options);
    }

    return this.executeRequest(url, options);
  }

  /**
   * Check if we can make a request to this host
   */
  canMakeRequest(host) {
    const active = this.activeConnections.get(host) || new Set();
    return active.size < this.maxConnectionsPerHost;
  }

  /**
   * Queue a request when connection limit is reached
   */
  queueRequest(host, url, options) {
    return new Promise((resolve, reject) => {
      const queue = this.connectionQueue.get(host) || [];
      queue.push({ url, options, resolve, reject, timestamp: Date.now() });
      this.connectionQueue.set(host, queue);

      // Set timeout for queued requests
      setTimeout(() => {
        reject(new Error(`Request queued too long for ${host}`));
        this.removeFromQueue(host, { url, options, resolve, reject });
      }, this.connectionTimeout);
    });
  }

  /**
   * Execute the actual HTTP request
   */
  async executeRequest(url, options = {}) {
    const urlObj = new URL(url);
    const host = urlObj.host;
    const isHttps = urlObj.protocol === 'https:';

    // Track active connection
    const active = this.activeConnections.get(host) || new Set();
    const connectionId = Date.now() + Math.random();
    active.add(connectionId);
    this.activeConnections.set(host, active);

    // Update stats
    this.updateStats(host, 'requests', 1);

    try {
      const result = await this.makeHttpRequest(url, options, isHttps);

      // Update success stats
      this.updateStats(host, 'successes', 1);

      // Process queued requests
      this.processQueue(host);

      return result;

    } catch (error) {
      // Update error stats
      this.updateStats(host, 'errors', 1);
      throw error;

    } finally {
      // Remove from active connections
      active.delete(connectionId);
      if (active.size === 0) {
        this.activeConnections.delete(host);
      } else {
        this.activeConnections.set(host, active);
      }

      // Process queued requests
      this.processQueue(host);
    }
  }

  /**
   * Make the actual HTTP request
   */
  makeHttpRequest(url, options, isHttps) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const agent = isHttps ? this.httpsAgent : this.httpAgent;

      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        agent: agent,
        timeout: this.connectionTimeout,
        headers: {
          'User-Agent': 'Trading-Data-Collection-Service/1.0',
          ...options.headers
        }
      };

      const req = (isHttps ? https : http).request(requestOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const result = {
              statusCode: res.statusCode,
              headers: res.headers,
              data: data
            };

            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(result);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            }
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      // Send request body if provided
      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }

  /**
   * Process queued requests for a host
   */
  processQueue(host) {
    const queue = this.connectionQueue.get(host);
    if (!queue || queue.length === 0) return;

    const active = this.activeConnections.get(host) || new Set();
    const availableSlots = this.maxConnectionsPerHost - active.size;

    for (let i = 0; i < availableSlots && queue.length > 0; i++) {
      const queuedRequest = queue.shift();
      this.executeRequest(queuedRequest.url, queuedRequest.options)
        .then(queuedRequest.resolve)
        .catch(queuedRequest.reject);
    }

    if (queue.length === 0) {
      this.connectionQueue.delete(host);
    } else {
      this.connectionQueue.set(host, queue);
    }
  }

  /**
   * Remove a request from the queue
   */
  removeFromQueue(host, request) {
    const queue = this.connectionQueue.get(host);
    if (!queue) return;

    const index = queue.findIndex(r =>
      r.url === request.url &&
      r.options === request.options &&
      r.resolve === request.resolve
    );

    if (index !== -1) {
      queue.splice(index, 1);
      if (queue.length === 0) {
        this.connectionQueue.delete(host);
      } else {
        this.connectionQueue.set(host, queue);
      }
    }
  }

  /**
   * Update connection statistics
   */
  updateStats(host, metric, value) {
    const stats = this.connectionStats.get(host) || {
      requests: 0,
      successes: 0,
      errors: 0,
      avgResponseTime: 0,
      lastRequest: null
    };

    stats[metric] += value;
    stats.lastRequest = new Date();

    this.connectionStats.set(host, stats);
  }

  /**
   * Get connection pool statistics
   */
  getStats() {
    const stats = {
      totalActiveConnections: 0,
      totalQueuedRequests: 0,
      hosts: {}
    };

    // Active connections
    for (const [host, connections] of this.activeConnections.entries()) {
      stats.totalActiveConnections += connections.size;
      stats.hosts[host] = stats.hosts[host] || {};
      stats.hosts[host].activeConnections = connections.size;
    }

    // Queued requests
    for (const [host, queue] of this.connectionQueue.entries()) {
      stats.totalQueuedRequests += queue.length;
      stats.hosts[host] = stats.hosts[host] || {};
      stats.hosts[host].queuedRequests = queue.length;
    }

    // Host stats
    for (const [host, hostStats] of this.connectionStats.entries()) {
      stats.hosts[host] = stats.hosts[host] || {};
      stats.hosts[host].stats = hostStats;
    }

    return stats;
  }

  /**
   * Clean up old queued requests
   */
  cleanup() {
    const now = Date.now();
    const maxAge = this.connectionTimeout;

    for (const [host, queue] of this.connectionQueue.entries()) {
      const filteredQueue = queue.filter(request => {
        if ((now - request.timestamp) > maxAge) {
          request.reject(new Error(`Request timeout in queue for ${host}`));
          return false;
        }
        return true;
      });

      if (filteredQueue.length === 0) {
        this.connectionQueue.delete(host);
      } else {
        this.connectionQueue.set(host, filteredQueue);
      }
    }
  }

  /**
   * Close all connections and cleanup
   */
  close() {
    this.httpAgent.destroy();
    this.httpsAgent.destroy();

    // Reject all queued requests
    for (const [host, queue] of this.connectionQueue.entries()) {
      for (const request of queue) {
        request.reject(new Error('Connection pool closed'));
      }
    }

    this.activeConnections.clear();
    this.connectionQueue.clear();
    this.connectionStats.clear();
  }
}

module.exports = ConnectionPool;
