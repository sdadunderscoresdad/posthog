import { match } from 'ts-pattern'

import { ActivityChange } from 'lib/components/ActivityLog/humanizeActivity'
import { i18n } from 'lib/i18n/i18n'

import { ExperimentHoldoutType } from '~/types'

import { ActivityClause, clause, describeUnknownFieldChange } from './clauses'

type AllowedHoldoutFields = Pick<ExperimentHoldoutType, 'name' | 'description' | 'filters'>

export const getHoldoutChangeDescription = (holdoutChange: ActivityChange): ActivityClause[] =>
    match(holdoutChange.field as keyof AllowedHoldoutFields)
        .with('name', () => [
            clause(i18n.t('experimentActivity.holdout.name', { defaultValue: 'updated experiment holdout name:' })),
        ])
        .with('description', () => [
            clause(
                i18n.t('experimentActivity.holdout.description', {
                    defaultValue: 'updated experiment holdout description:',
                })
            ),
        ])
        .with('filters', () => [
            clause(
                i18n.t('experimentActivity.holdout.filters', {
                    defaultValue: 'updated experiment holdout filters:',
                })
            ),
        ])
        .otherwise(() => {
            if (!holdoutChange.field) {
                return [
                    clause(
                        i18n.t('experimentActivity.holdout.updated', {
                            defaultValue: 'updated experiment holdout',
                        }),
                        'for'
                    ),
                ]
            }
            return describeUnknownFieldChange(holdoutChange.field, holdoutChange.action)
        })
