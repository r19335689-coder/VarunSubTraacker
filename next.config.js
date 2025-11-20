/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    // Ensure Supabase modules are properly externalized
    config.externals = config.externals || []
    if (isServer) {
      config.externals.push('@supabase/supabase-js')
    }
    return config
  },
}

module.exports = nextConfig

