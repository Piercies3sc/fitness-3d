import type { NextConfig } from "next";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");
const nextConfig: NextConfig = {
  serverExternalPackages: ["cross-fetch"],
};

export default nextConfig;
