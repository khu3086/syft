/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transformers.js (+ onnxruntime-node) is a native Node module — keep it out of
  // the bundler and load it server-side at runtime.
  serverExternalPackages: ["@huggingface/transformers"],
};

export default nextConfig;
