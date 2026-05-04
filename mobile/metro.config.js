const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Limit workers to avoid spawn issues on Windows
config.maxWorkers = 2;
config.resetCache = true;

module.exports = config;
