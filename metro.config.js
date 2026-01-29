const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 * 
 * Note: axios is patched via scripts/patch-axios.js (postinstall)
 * to use the browser build instead of Node.js build.
 */
const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    // Enable package.json exports field support
    // This allows Metro to use the 'react-native' condition from package exports
    unstable_enablePackageExports: true,
    
    // Prioritize react-native condition in package.json exports
    unstable_conditionNames: ['react-native', 'browser', 'require', 'import', 'default'],
  },
};

module.exports = mergeConfig(defaultConfig, config);
