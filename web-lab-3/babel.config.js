export default {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          browsers: ["last 2 versions", "not dead"],
          node: "18"
        },
        modules: false,
        useBuiltIns: false
      }
    ]
  ]
};
