/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // allow access from the phone via the laptop's LAN IP (dev hostname check)
  allowedDevOrigins: ["*"],
};

export default nextConfig;
