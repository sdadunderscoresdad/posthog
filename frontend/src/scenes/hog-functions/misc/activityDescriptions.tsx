import { Suspense } from 'react'

import {
    ActivityLogItem,
    ActivityLogUserName,
    HumanizedChange,
    defaultDescriber,
} from 'lib/components/ActivityLog/humanizeActivity'
import { i18n } from 'lib/i18n/i18n'
import { LemonDropdown } from 'lib/lemon-ui/LemonDropdown'
import { Link } from 'lib/lemon-ui/Link'
import { Spinner } from 'lib/lemon-ui/Spinner'
import { isObject } from 'lib/utils/guards'
import { lazyWithRetry } from 'lib/utils/retryImport'
import { urls } from 'scenes/urls'

import { HogFunctionTypeType } from '~/types'

import { humanizeHogFunctionType } from '../hog-function-utils'
import type { DiffProps } from './Diff'

const stagedChanges = (): string =>
    i18n.t('hogFunctionActivity.stagedChanges', { defaultValue: 'changed the staged changes' })

const nameOrLinkToHogFunction = (id?: string | null, name?: string | null): string | JSX.Element => {
    const displayName = name?.trim()
        ? name
        : i18n.t('hogFunctionActivity.untitled', { defaultValue: 'Untitled hog function' })
    return id ? <Link to={urls.hogFunction(id)}>{displayName}</Link> : displayName
}

const DRAFT_ACTIVITIES = new Set(['draft_updated', 'published', 'draft_discarded', 'revision_restored'])

/** The clause a draft activity reads as, naming the thing the change is staged on. */
function draftActivityClause(activity: string, noun: string): string {
    switch (activity) {
        case 'draft_updated':
            return i18n.t('hogFunctionActivity.draftUpdated', {
                defaultValue: 'staged changes for review on the {{ noun }}:',
                noun,
            })
        case 'published':
            return i18n.t('hogFunctionActivity.published', {
                defaultValue: 'published the staged changes to the {{ noun }}:',
                noun,
            })
        case 'draft_discarded':
            return i18n.t('hogFunctionActivity.draftDiscarded', {
                defaultValue: 'discarded the staged changes on the {{ noun }}:',
                noun,
            })
        default:
            return i18n.t('hogFunctionActivity.revisionRestored', {
                defaultValue: 'staged an earlier version for review on the {{ noun }}:',
                noun,
            })
    }
}

/** The noun the backend type maps to, in the app's language where the type has one. */
function objectNounFor(rawType: HogFunctionTypeType | undefined): string {
    if (rawType) {
        return humanizeHogFunctionType(rawType)
    }
    return i18n.t('hogFunctionActivity.hogFunction', { defaultValue: 'hog function' })
}

const LazyDiff = lazyWithRetry(() => import('./Diff').then((m) => ({ default: m.Diff })))

/** Lazy so the activity describer registry (imported app-wide) doesn't pull monaco into its chunk. */
export function Diff(props: DiffProps): JSX.Element {
    return (
        <Suspense
            fallback={
                <div className="min-h-[300px]">
                    <Spinner />
                </div>
            }
        >
            <LazyDiff {...props} />
        </Suspense>
    )
}

export interface DiffLinkProps extends DiffProps {
    children: string | JSX.Element
}

export function DiffLink({ before, after, language, children }: DiffLinkProps): JSX.Element {
    return (
        <LemonDropdown
            closeOnClickInside={false}
            overlay={
                <div className="w-[50vw] min-w-[300px]">
                    <Diff before={before} after={after} language={language} />
                </div>
            }
        >
            <span className="Link">{children}</span>
        </LemonDropdown>
    )
}

export function hogFunctionActivityDescriber(logItem: ActivityLogItem, asNotification?: boolean): HumanizedChange {
    if (logItem.scope != 'HogFunction') {
        console.error('HogFunction describer received a non-HogFunction activity')
        return { description: null }
    }

    const rawType = logItem?.detail.type as HogFunctionTypeType | undefined
    const objectNoun = objectNounFor(rawType)

    if (logItem.activity == 'created') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('hogFunctionActivity.created', {
                        defaultValue: 'created the {{ noun }}:',
                        noun: objectNoun,
                    })}{' '}
                    {nameOrLinkToHogFunction(logItem?.item_id, logItem?.detail.name)}
                </>
            ),
        }
    }

    if (logItem.activity == 'deleted') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('hogFunctionActivity.deleted', {
                        defaultValue: 'deleted the {{ noun }}:',
                        noun: objectNoun,
                    })}{' '}
                    {logItem.detail.name}
                </>
            ),
        }
    }

    if (logItem.activity == 'restored') {
        const functionName = nameOrLinkToHogFunction(logItem?.item_id, logItem?.detail.name)

        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('hogFunctionActivity.restored', {
                        defaultValue: 'restored the {{ noun }}:',
                        noun: objectNoun,
                    })}{' '}
                    {functionName}
                </>
            ),
        }
    }

    if (DRAFT_ACTIVITIES.has(logItem.activity)) {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} /> {draftActivityClause(logItem.activity, objectNoun)}{' '}
                    {nameOrLinkToHogFunction(logItem?.item_id, logItem?.detail.name)}
                </>
            ),
        }
    }

    if (logItem.activity == 'updated') {
        const changes: { inline: string | JSX.Element; inlist: string | JSX.Element }[] = []
        for (const change of logItem.detail.changes ?? []) {
            switch (change.field) {
                case 'encrypted_inputs': {
                    changes.push({
                        inline: i18n.t('hogFunctionActivity.updatedEncryptedInputsInline', {
                            defaultValue: 'updated encrypted inputs for',
                        }),
                        inlist: i18n.t('hogFunctionActivity.updatedEncryptedInputs', {
                            defaultValue: 'updated encrypted inputs',
                        }),
                    })
                    break
                }
                // Both are masked server-side, so there is nothing to diff — say the staged config
                // changed and let the reader open it in the builder. A staged edit usually touches
                // both fields, so collapse them into one entry.
                case 'draft':
                case 'draft_encrypted_inputs': {
                    const staged = stagedChanges()
                    if (!changes.some((c) => c.inlist === staged)) {
                        changes.push({
                            inline: i18n.t('hogFunctionActivity.stagedChangesInline', {
                                defaultValue: '{{ staged }} on',
                                staged,
                            }),
                            inlist: staged,
                        })
                    }
                    break
                }
                case 'inputs': {
                    const beforeValues = isObject(change.before)
                        ? (change.before as Record<string, { value?: unknown }>)
                        : {}
                    const afterValues = isObject(change.after)
                        ? (change.after as Record<string, { value?: unknown }>)
                        : {}

                    const changedFields = Object.entries(afterValues)
                        .map(([key, value]) => {
                            const before = JSON.stringify(beforeValues[key]?.value)
                            const after = JSON.stringify(value?.value)

                            if (before !== after) {
                                return (
                                    <DiffLink key={key} before={before} after={after}>
                                        {key}
                                    </DiffLink>
                                )
                            }
                            return null
                        })
                        .filter((x): x is JSX.Element => !!x)

                    const changedSpans: JSX.Element[] = []
                    for (let index = 0; index < changedFields.length; index++) {
                        if (index !== 0 && index === changedFields.length - 1) {
                            changedSpans.push(
                                <>{` ${i18n.t('activityLog.listConjunction', { defaultValue: 'and' })} `}</>
                            )
                        } else if (index > 0) {
                            changedSpans.push(<>{i18n.t('activityLog.listSeparator', { defaultValue: ', ' })}</>)
                        }
                        changedSpans.push(changedFields[index])
                    }

                    const inputOrInputs =
                        changedFields.length === 1
                            ? i18n.t('hogFunctionActivity.input', { defaultValue: 'input' })
                            : i18n.t('hogFunctionActivity.inputs', { defaultValue: 'inputs' })
                    changes.push({
                        inline: (
                            <>
                                {i18n.t('hogFunctionActivity.updatedThe', { defaultValue: 'updated the' })}{' '}
                                {inputOrInputs} {changedSpans}{' '}
                                {i18n.t('hogFunctionActivity.for', { defaultValue: 'for' })}
                            </>
                        ),
                        inlist: (
                            <>
                                {i18n.t('hogFunctionActivity.updated', { defaultValue: 'updated' })} {inputOrInputs}:{' '}
                                {changedSpans}
                            </>
                        ),
                    })
                    break
                }
                case 'inputs_schema':
                case 'filters':
                case 'hog':
                case 'name':
                case 'description':
                case 'masking': {
                    const code = (
                        <DiffLink
                            language={change.field === 'hog' ? 'hog' : 'json'}
                            before={
                                typeof change.before === 'string'
                                    ? change.before
                                    : JSON.stringify(change.before, null, 2)
                            }
                            after={
                                typeof change.after === 'string' ? change.after : JSON.stringify(change.after, null, 2)
                            }
                        >
                            {change.field === 'hog'
                                ? i18n.t('hogFunctionActivity.sourceCode', { defaultValue: 'source code' })
                                : change.field === 'inputs_schema'
                                  ? i18n.t('hogFunctionActivity.inputsSchema', { defaultValue: 'inputs schema' })
                                  : change.field}
                        </DiffLink>
                    )
                    changes.push({
                        inline: (
                            <>
                                {i18n.t('hogFunctionActivity.updated', { defaultValue: 'updated' })} {code}{' '}
                                {i18n.t('hogFunctionActivity.for', { defaultValue: 'for' })}
                            </>
                        ),
                        inlist: (
                            <>
                                {i18n.t('hogFunctionActivity.updated', { defaultValue: 'updated' })} {code}
                            </>
                        ),
                    })
                    break
                }
                case 'deleted': {
                    if (change.after) {
                        changes.push({
                            inline: i18n.t('hogFunctionActivity.deletedInline', { defaultValue: 'deleted' }),
                            inlist: i18n.t('hogFunctionActivity.deletedInlineList', {
                                defaultValue: 'deleted the {{ noun }}',
                                noun: objectNoun,
                            }),
                        })
                    } else {
                        changes.push({
                            inline: i18n.t('hogFunctionActivity.undeletedInline', { defaultValue: 'undeleted' }),
                            inlist: i18n.t('hogFunctionActivity.undeletedInlineList', {
                                defaultValue: 'undeleted the {{ noun }}',
                                noun: objectNoun,
                            }),
                        })
                    }
                    break
                }
                case 'enabled': {
                    if (change.after) {
                        changes.push({
                            inline: i18n.t('hogFunctionActivity.enabledInline', { defaultValue: 'enabled' }),
                            inlist: i18n.t('hogFunctionActivity.enabledInlineList', {
                                defaultValue: 'enabled the {{ noun }}',
                                noun: objectNoun,
                            }),
                        })
                    } else {
                        changes.push({
                            inline: i18n.t('hogFunctionActivity.disabledInline', { defaultValue: 'disabled' }),
                            inlist: i18n.t('hogFunctionActivity.disabledInlineList', {
                                defaultValue: 'disabled the {{ noun }}',
                                noun: objectNoun,
                            }),
                        })
                    }
                    break
                }
                case 'priority': {
                    const changedPriority = i18n.t('hogFunctionActivity.changedPriority', {
                        defaultValue: 'changed priority from {{ before }} to {{ after }} for',
                        before: change.before,
                        after: change.after,
                    })
                    changes.push({
                        inline: changedPriority,
                        inlist: changedPriority,
                    })
                    break
                }
                default:
                    changes.push({
                        inline: i18n.t('hogFunctionActivity.updatedUnknownField', {
                            defaultValue: 'updated unknown field: {{ field }}',
                            field: change.field,
                        }),
                        inlist: i18n.t('hogFunctionActivity.updatedUnknownField', {
                            defaultValue: 'updated unknown field: {{ field }}',
                            field: change.field,
                        }),
                    })
            }
        }
        const functionName = nameOrLinkToHogFunction(logItem?.item_id, logItem?.detail.name)
        const updatedNoun = i18n.t('hogFunctionActivity.updatedNoun', {
            defaultValue: 'updated the {{ noun }}:',
            noun: objectNoun,
        })

        return {
            description:
                changes.length == 1 ? (
                    <>
                        <ActivityLogUserName logItem={logItem} /> {changes[0].inline}{' '}
                        {i18n.t('hogFunctionActivity.theNoun', { defaultValue: 'the {{ noun }}:', noun: objectNoun })}{' '}
                        {functionName}
                    </>
                ) : (
                    <div>
                        <ActivityLogUserName logItem={logItem} /> {updatedNoun} {functionName}
                        <ul className="ml-5 list-disc">
                            {changes.map((c, i) => (
                                <li key={i}>{c.inlist}</li>
                            ))}
                        </ul>
                    </div>
                ),
        }
    }
    return defaultDescriber(logItem, asNotification, nameOrLinkToHogFunction(logItem?.item_id, logItem?.detail.name))
}
