import { unwrapCatalog } from './catalogs'

describe('catalogs', () => {
    it('accepts a catalog whether the bundler wrapped it in a default export or not', () => {
        expect(unwrapCatalog({ save: 'Save' })).toEqual({ save: 'Save' })
        expect(unwrapCatalog({ default: { save: 'Save' } })).toEqual({ save: 'Save' })
    })

    it('keeps a message whose key is itself named default', () => {
        expect(unwrapCatalog({ default: 'Save' })).toEqual({ default: 'Save' })
    })
})
