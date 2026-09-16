/**
 * One namespace of one language: message keys mapped to translated text.
 *
 * Keys nest on the key separator, so `activity.tabs.events` is stored as
 * `{ activity: { tabs: { events: '…' } } }`, which is the shape i18next looks up and the shape
 * `i18next-cli extract` writes.
 */
export type Catalog = { [key: string]: string | Catalog }

/**
 * A JSON catalog as a bundler hands it back. Vite and esbuild wrap the parsed object in a `default`
 * export, while some CommonJS test transforms hand back the object itself.
 */
export type CatalogModule = Catalog | { default: Catalog }

export type CatalogLoader = () => Promise<CatalogModule>

/**
 * Reduce a JSON import to the catalog itself.
 *
 * A catalog key can legitimately be named `default`, so only an object under that name counts as a
 * bundler wrapper; anything else is the catalog.
 */
export function unwrapCatalog(module: CatalogModule): Catalog {
    const wrapped = (module as { default?: unknown }).default
    if (wrapped !== undefined && typeof wrapped === 'object' && wrapped !== null) {
        return wrapped as Catalog
    }
    return module as Catalog
}
