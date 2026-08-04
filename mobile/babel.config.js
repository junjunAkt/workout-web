module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-reanimated v4 は worklets プラグインを必要とする（必ずプラグイン配列の最後）
    plugins: ['react-native-worklets/plugin'],
  };
};
