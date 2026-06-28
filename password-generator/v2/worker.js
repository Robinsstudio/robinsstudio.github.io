importScripts('argon2-1.18.0-bundled.min.js');

self.onmessage = async function(e) {
  try {
    const params = e.data;
    params.salt = new Uint8Array(params.salt);
    const result = await argon2.hash(params);
    self.postMessage({ hash: Array.from(result.hash) });
  } catch (err) {
    self.postMessage({ error: err.message || String(err) });
  }
};
