// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require("expo/metro-config")

const config = getDefaultConfig(__dirname)

// OGG is not in Metro's default asset list; assign a new array (some setups freeze the default).
const exts = config.resolver.assetExts
config.resolver.assetExts = exts.includes("ogg") ? [...exts] : [...exts, "ogg"]

module.exports = config
