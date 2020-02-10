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
                    "./src/index.html",
                    "./src/**/*.component.html",
                    "./src/**/*.component.ts"
                  ],
                  defaultExtractor: content => content.match(/[A-Za-z0-9-_:/]+/g) || [],
                  whitelist: [
                    ':host',
                    '::ng-deep',
                    ':host-context'
                  ]
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
