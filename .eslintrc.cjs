module.exports = {
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/stylistic',
        'plugin:prettier/recommended',
    ],
    ignorePatterns: [".eslintrc.cjs", "prettier.config.js" , "dist/"],
};