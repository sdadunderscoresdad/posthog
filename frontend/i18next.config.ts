import { defineConfig } from 'i18next-cli'

import { SUPPORTED_LOCALES } from './src/lib/i18n/supportedLocales'

/**
 * Configuration for `i18next-cli`.
 *
 * `locales` is read from the runtime registry rather than repeated here, so a language is added in
 * one place. The source language's catalog is written for translators; the app itself reads the
 * English text at each call site, so nothing here is loaded at runtime.
 */
export default defineConfig({
    locales: Object.keys(SUPPORTED_LOCALES),
    extract: {
        input: ['src/**/*.{ts,tsx}', '../products/*/frontend/**/*.{ts,tsx}'],
        // Tests assert against English text directly, so their strings are not messages.
        ignore: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
        output: 'src/lib/i18n/locales/{{language}}/{{namespace}}.json',
        defaultNS: 'common',
        primaryLanguage: 'en',
        functions: ['t', 'i18n.t'],
        transComponents: ['Trans'],
        // Comments are prose, and prose contains `don't (` shapes that a `t(...)` matcher reads as a
        // key. Extraction found a prop name that way, so keys come from code only.
        extractFromComments: false,
        indentation: 4,
        sort: true,
    },
})
