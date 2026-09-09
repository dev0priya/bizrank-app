// Polyfill missing Node.js/Web globals in Cloudflare Worker environment
if (typeof (globalThis as any).MessagePort === 'undefined') {
  (globalThis as any).MessagePort = class MessagePort {};
}
if (typeof (globalThis as any).MessageChannel === 'undefined') {
  (globalThis as any).MessageChannel = class MessageChannel {};
}
if (typeof (globalThis as any).FinalizationRegistry === 'undefined') {
  (globalThis as any).FinalizationRegistry = class FinalizationRegistry {
    register() {}
    unregister() {}
  };
}
if (typeof (globalThis as any).WeakRef === 'undefined') {
  (globalThis as any).WeakRef = class WeakRef {
    target: any;
    constructor(target: any) { this.target = target; }
    deref() { return this.target; }
  };
}
if (typeof (globalThis as any).BroadcastChannel === 'undefined') {
  (globalThis as any).BroadcastChannel = class BroadcastChannel {
    postMessage() {}
    close() {}
  };
}

export {};
