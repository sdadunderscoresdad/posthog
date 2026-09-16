import { i18n } from 'lib/i18n/i18n'

/**
 * The words that carry a clause into the item it changed, as in "changed the goal for Experiment".
 * A clause leaves the link off when it already introduces the item itself, such as one ending in a
 * colon.
 */
export type ClauseLink = 'to' | 'from' | 'for' | 'on' | 'in'

export interface ActivityClause {
    text: string | JSX.Element
    link?: ClauseLink
}

export function clause(text: string | JSX.Element, link?: ClauseLink): ActivityClause {
    return { text, link }
}

/** The link, in the language the app is rendering. */
export function clauseLinkText(link: ClauseLink): string {
    switch (link) {
        case 'to':
            return i18n.t('experimentActivity.link.to', { defaultValue: 'to' })
        case 'from':
            return i18n.t('experimentActivity.link.from', { defaultValue: 'from' })
        case 'for':
            return i18n.t('experimentActivity.link.for', { defaultValue: 'for' })
        case 'on':
            return i18n.t('experimentActivity.link.on', { defaultValue: 'on' })
        case 'in':
            return i18n.t('experimentActivity.link.in', { defaultValue: 'in' })
    }
}

/**
 * Splits clauses into the parts a `SentenceList` renders and the link that carries its last part
 * into the item. Only the final clause gets a link, so that a list of clauses reads as
 * "changed A, removed B, and changed C for Experiment".
 */
export function splitClauses(clauses: ActivityClause[]): {
    parts: (string | JSX.Element)[]
    link?: ClauseLink
} {
    return { parts: clauses.map((item) => item.text), link: clauses[clauses.length - 1]?.link }
}

/**
 * Describes a change to a field the backend reported but this describer does not know how to
 * phrase, so that no activity goes unrendered.
 */
export function describeUnknownFieldChange(field: string, action: string | undefined): ActivityClause[] {
    const fieldName = field.replace(/_/g, ' ')
    switch (action) {
        case 'created':
            return [
                clause(
                    i18n.t('experimentActivity.fieldChange.added', {
                        defaultValue: 'added {{ field }}',
                        field: fieldName,
                    }),
                    'to'
                ),
            ]
        case 'deleted':
            return [
                clause(
                    i18n.t('experimentActivity.fieldChange.removed', {
                        defaultValue: 'removed {{ field }}',
                        field: fieldName,
                    }),
                    'from'
                ),
            ]
        case 'changed':
            return [
                clause(
                    i18n.t('experimentActivity.fieldChange.updated', {
                        defaultValue: 'updated {{ field }}',
                        field: fieldName,
                    }),
                    'for'
                ),
            ]
        default:
            return [
                clause(
                    i18n.t('experimentActivity.fieldChange.modified', {
                        defaultValue: 'modified {{ field }}',
                        field: fieldName,
                    }),
                    'for'
                ),
            ]
    }
}
