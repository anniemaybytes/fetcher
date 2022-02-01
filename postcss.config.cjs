// noinspection JSValidateTypes
module.exports = {
  plugins: [
    require('cssnano')({
      preset: [
        'default',
        {
          mergeRules: true,
          discardComments: {
            removeAll: true,
          },
        },
      ],
    }),
  ],
};
