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
                require("@fullhuman/postcss-purgecss")({
                  content: [
                    "./src/**/*.component.html",
                    "./src/**/*.component.ts"
                  ],
                  defaultExtractor: content =>
                    content.match(/[A-Za-z0-9-_:/]+/g) || []
                }),
                require("autoprefixer")
              ]
            }
          }
        ]
      }
    ]
  }
};
