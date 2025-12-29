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
        ])
    }
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
