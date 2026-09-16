/**
 * Translation namespaces.
 *
 * Each namespace is a separate catalog file per language, imported on its own, so a scene pays
 * only for the strings it renders. A product adds its namespace here and a `locales/<code>/<ns>.json`
 * file for every supported language.
 */
export const NAMESPACES = ['common'] as const

export type TranslationNamespace = (typeof NAMESPACES)[number]

export const DEFAULT_NAMESPACE: TranslationNamespace = 'common'
