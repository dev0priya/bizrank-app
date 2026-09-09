// Polyfill missing Node.js/Web globals in Cloudflare Workers before OpenNext bundle evaluates
if (typeof globalThis.MessagePort === 'undefined') {
  globalThis.MessagePort = class MessagePort {};
}
if (typeof globalThis.MessageChannel === 'undefined') {
  globalThis.MessageChannel = class MessageChannel {};
}
if (typeof globalThis.FinalizationRegistry === 'undefined') {
  globalThis.FinalizationRegistry = class FinalizationRegistry {
    register() {}
    unregister() {}
  };
}
if (typeof globalThis.WeakRef === 'undefined') {
  globalThis.WeakRef = class WeakRef {
    constructor(target) { this.target = target; }
    deref() { return this.target; }
  };
}
if (typeof globalThis.BroadcastChannel === 'undefined') {
  globalThis.BroadcastChannel = class BroadcastChannel {
    postMessage() {}
    close() {}
  };
}

import worker from './.open-next/worker.js';
export * from './.open-next/worker.js';

export default {
  async fetch(request, env, ctx) {
    try {
      return await worker.fetch(request, env, ctx);
    } catch (err) {
      console.error('[WORKER_UNHANDLED_EXCEPTION]', err);
      return new Response(JSON.stringify({
        error: err.message || String(err),
        stack: err.stack,
        name: err.name
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
