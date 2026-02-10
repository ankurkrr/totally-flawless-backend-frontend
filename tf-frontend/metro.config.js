const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
    resolver: {
        blacklistRE: exclusionList([
            /node_modules\/.*\/node_modules\/react-native\/.*/,
            /.*\.git\/.*/,
            /.*\.idea\/.*/,
            /.*\/android\/.*/,
            /.*\/ios\/.*/,
            /.*\.zip/
        ]),
        resolveRequest: (context, moduleName, platform) => {
            if (moduleName === 'axios') {
                // Force resolution to the browser build to avoid "crypto" dependency issues
                return {
                    filePath: require.resolve('./node_modules/axios/dist/browser/axios.cjs'),
                    type: 'sourceFile',
                };
            }
            return context.resolveRequest(context, moduleName, platform);
        }
    }
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
