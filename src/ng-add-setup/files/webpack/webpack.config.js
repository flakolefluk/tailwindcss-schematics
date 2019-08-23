module.exports = {
  module: {
    rules: [
      {
        test: /\.<%= stylesExt %>$/,
        use: [
          {
            loader: "postcss-loader",
            options: {
              plugins: [
                require("tailwindcss")("./tailwind.config.js"),
                require("autoprefixer")
              ]
            }
          }
        ]
      }
    ]
  }
};
