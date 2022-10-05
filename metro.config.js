const { getDefaultConfig } = require('metro-config');
const defaultConfig = getDefaultConfig.getDefaultValues(__dirname);
const exclusionList = require('metro-config/src/defaults/exclusionList');

module.exports = {
  resolver: {
    assetExts: [...defaultConfig.resolver.assetExts, 'pem'],
    blacklistRE: exclusionList([/simulation\/.*/])
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
};