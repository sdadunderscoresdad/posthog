import { UserNameWithEmail } from 'lib/components/ActivityLog/UserNameWithEmail'
import { dayjs } from 'lib/dayjs'
import { getActiveLocale, i18n } from 'lib/i18n/i18n'
import { LemonMarkdown } from 'lib/lemon-ui/LemonMarkdown'
import { fullName } from 'lib/utils/strings'

import { ActivityScope, InsightShortId, PersonType, UserBasicType } from '~/types'

export interface ActivityChange {
    type: ActivityScope
    action: 'changed' | 'created' | 'deleted' | 'exported' | 'split' | 'merged' | 'copied'
    field?: string
    before?: string | number | any[] | Record<string, any> | boolean | null
    after?: string | number | any[] | Record<string, any> | boolean | null
}

export interface PersonMerge {
    type: 'Person'
    source: PersonType[]
    target: PersonType
}

export interface Trigger {
    job_type: string
    job_id: string
    payload: Record<string, any>
}

export interface ActivityLogDetail {
    merge: PersonMerge | null
    trigger: Trigger | null
    changes: ActivityChange[] | null
    name: string | null
    short_id?: InsightShortId | null
    /** e.g. for property definition carries event, person, or group */
    type?: string
    context?: Record<string, any> | null
}

export type ActivityLogItem = {
    id?: string
    user?: Pick<UserBasicType, 'email' | 'first_name' | 'last_name'>
    activity: string
    created_at: string
    scope: ActivityScope | string
    item_id?: string
    detail: ActivityLogDetail
    /** Team (project) the activity belongs to; null for organization-scoped activities. */
    team_id?: number | null
    /** Present if the log is used as a notification. Whether the notification is unread. */
    unread?: boolean
    /** Whether the activity was initiated by a PostHog staff member impersonating a user. */
    is_staff?: boolean
    /** Whether the activity was initiated by the PostHog backend. Example: an exported image when sharing an insight. */
    is_system?: boolean
    /** Whether a PostHog team member was impersonating the user when this activity was logged. */
    was_impersonated?: boolean
    /** SDK or integration that triggered this action (from x-posthog-client header). */
    client?: string | null
    /** Client IP address captured at request time. Null for non-HTTP activity (system, background jobs). */
    ip_address?: string | null
}

// the description of a single activity log is a sentence describing one or more changes that makes up the entry
export type Description = string | JSX.Element | null
// the extended description gives extra context, like the insight details card to describe a change to an insight
export type ExtendedDescription = JSX.Element | undefined
// content too large to sit inline with the sentence, shown as its own tab once the row is expanded
export type ExpandedView = { label: string; content: JSX.Element }
export type ChangeMapping = {
    description: Description[] | null
    extendedDescription?: ExtendedDescription
    expandedView?: ExpandedView
    suffix?: string | JSX.Element | null // to override the default suffix
}
export type HumanizedChange = {
    description: Description | null
    extendedDescription?: ExtendedDescription
    expandedView?: ExpandedView
}

export type HumanizedActivityLogItem = {
    id?: string
    email?: string | null
    /** The email to offer on hover, or null when the row already prints it as the actor's name. */
    emailToReveal?: string | null
    name?: string
    isSystem?: boolean
    wasImpersonated?: boolean
    /** SDK or integration that triggered this action (from x-posthog-client header). */
    client?: string | null
    description: Description
    extendedDescription?: ExtendedDescription // e.g. an insight's filters summary
    expandedView?: ExpandedView // e.g. a flag's release conditions after the change
    created_at: dayjs.Dayjs
    unread?: boolean
    // used when showing e.g. diff of changes
    unprocessed?: ActivityLogItem
}

export type Describer = (logItem: ActivityLogItem, asNotification?: boolean) => HumanizedChange

export function detectBoolean(candidate: unknown): boolean {
    let b: boolean = !!candidate
    if (typeof candidate === 'string') {
        b = candidate.toLowerCase() === 'true'
    }
    return b
}

export function humanize(
    results: ActivityLogItem[],
    describerFor?: (logItem?: ActivityLogItem) => Describer | undefined,
    asNotification?: boolean
): HumanizedActivityLogItem[] {
    const logLines: HumanizedActivityLogItem[] = []

    for (const logItem of results) {
        if (!logItem.detail || !logItem.scope) {
            // Sometimes we can end up with bad payloads from the backend so we check for some required fields here
            continue
        }
        const describer = describerFor?.(logItem)

        if (!describer) {
            continue
        }
        const { description, extendedDescription, expandedView } = describer(logItem, asNotification)

        if (description !== null) {
            const impersonatedUserName = logItem.user ? fullName(logItem.user) : undefined
            logLines.push({
                id: logItem.id,
                email: actorEmailForLogItem(logItem),
                emailToReveal: actorEmailToRevealForLogItem(logItem),
                name: logItem.was_impersonated
                    ? `PostHog Support${impersonatedUserName ? ` (as ${impersonatedUserName})` : ''}`
                    : impersonatedUserName,
                isSystem: logItem.is_system,
                wasImpersonated: logItem.was_impersonated,
                client: logItem.client,
                description,
                extendedDescription,
                expandedView,
                created_at: dayjs(logItem.created_at),
                unread: logItem.unread,
                unprocessed: logItem,
            })
        }
    }
    return logLines
}

export function userNameForLogItem(logItem: ActivityLogItem): string {
    if (logItem.is_system) {
        return 'PostHog'
    }
    if (logItem.was_impersonated) {
        return i18n.t('activityLog.impersonatedActor', {
            defaultValue: 'PostHog Support (as {{ name }})',
            name: nameOrEmailForUser(logItem.user, i18n.t('activityLog.aUser', { defaultValue: 'a user' })),
        })
    }
    return nameOrEmailForUser(logItem.user, i18n.t('activityLog.aUserCapitalized', { defaultValue: 'A user' }))
}

// The user's name can be blank (e.g. SCIM-provisioned members whose IdP omits a name), so fall
// back to their email — which is always in the payload — before the generic placeholder.
function nameOrEmailForUser(
    user: Pick<UserBasicType, 'email' | 'first_name' | 'last_name'> | undefined,
    fallback: string
): string {
    if (!user) {
        return fallback
    }
    return fullName(user) || user.email || fallback
}

// An impersonated row names PostHog Support as the actor, so the address on it belongs to the
// member who was impersonated and attributing it to Support would misread the audit trail. Every
// surface that shows the email must use this, or a row can disclose it in one place and hide it
// in another.
export function actorEmailForLogItem(logItem: ActivityLogItem): string | null {
    if (logItem.is_system || logItem.was_impersonated) {
        return null
    }
    return logItem.user?.email ?? null
}

// Kept apart from actorEmailForLogItem because that one also feeds the Gravatar lookup, and a
// member whose name is their email still has a Gravatar to show.
export function actorEmailToRevealForLogItem(logItem: ActivityLogItem): string | null {
    const email = actorEmailForLogItem(logItem)
    return email && email !== userNameForLogItem(logItem) ? email : null
}

/** The person who did the thing, with their email on hover. */
export function ActivityLogUserName({ logItem }: { logItem: ActivityLogItem }): JSX.Element {
    return <UserNameWithEmail name={userNameForLogItem(logItem)} email={actorEmailForLogItem(logItem)} />
}

const NO_PLURAL_SCOPES: ActivityScope[] = [ActivityScope.DATA_MANAGEMENT]

// Keep in sync with SCOPE_DISPLAY_NAMES in ee/hogai/context/activity_log/context.py
function buildScopeDisplayNames(): Partial<Record<ActivityScope, { singular: string; plural: string }>> {
    return {
        [ActivityScope.ALERT_CONFIGURATION]: {
            singular: i18n.t('activityLog.scope.alert.singular', { defaultValue: 'Alert' }),
            plural: i18n.t('activityLog.scope.alert.plural', { defaultValue: 'Alerts' }),
        },
        [ActivityScope.BATCH_EXPORT]: {
            singular: i18n.t('activityLog.scope.destination.singular', { defaultValue: 'Destination' }),
            plural: i18n.t('activityLog.scope.destination.plural', { defaultValue: 'Destinations' }),
        },
        [ActivityScope.CANVAS]: {
            singular: i18n.t('activityLog.scope.canvas.singular', { defaultValue: 'Canvas' }),
            plural: i18n.t('activityLog.scope.canvas.plural', { defaultValue: 'Canvases' }),
        },
        [ActivityScope.EXTERNAL_DATA_SOURCE]: {
            singular: i18n.t('activityLog.scope.source.singular', { defaultValue: 'Source' }),
            plural: i18n.t('activityLog.scope.source.plural', { defaultValue: 'Sources' }),
        },
        [ActivityScope.HOG_FUNCTION]: {
            singular: i18n.t('activityLog.scope.dataPipeline.singular', { defaultValue: 'Data pipeline' }),
            plural: i18n.t('activityLog.scope.dataPipeline.plural', { defaultValue: 'Data pipelines' }),
        },
        [ActivityScope.PERSONAL_API_KEY]: {
            singular: i18n.t('activityLog.scope.personalApiKey.singular', { defaultValue: 'Personal API key' }),
            plural: i18n.t('activityLog.scope.personalApiKey.plural', { defaultValue: 'Personal API keys' }),
        },
        [ActivityScope.LLM_TRACE]: {
            singular: i18n.t('activityLog.scope.llmTrace.singular', { defaultValue: 'LLM trace' }),
            plural: i18n.t('activityLog.scope.llmTrace.plural', { defaultValue: 'LLM traces' }),
        },
        [ActivityScope.LOG]: {
            singular: i18n.t('activityLog.scope.log.singular', { defaultValue: 'Log' }),
            plural: i18n.t('activityLog.scope.log.plural', { defaultValue: 'Logs' }),
        },
        [ActivityScope.PROJECT_SECRET_API_KEY]: {
            singular: i18n.t('activityLog.scope.projectSecretApiKey.singular', {
                defaultValue: 'Project secret API key',
            }),
            plural: i18n.t('activityLog.scope.projectSecretApiKey.plural', {
                defaultValue: 'Project secret API keys',
            }),
        },
        [ActivityScope.TICKET]: {
            singular: i18n.t('activityLog.scope.supportTicket.singular', { defaultValue: 'Support ticket' }),
            plural: i18n.t('activityLog.scope.supportTicket.plural', { defaultValue: 'Support tickets' }),
        },
    }
}

let cachedScopeDisplayNames: {
    locale: string
    names: Partial<Record<ActivityScope, { singular: string; plural: string }>>
} | null = null

/** The resource nouns activity rows name, in the language the app is rendering. */
function getScopeDisplayNames(): Partial<Record<ActivityScope, { singular: string; plural: string }>> {
    const locale = getActiveLocale()
    if (cachedScopeDisplayNames?.locale !== locale) {
        cachedScopeDisplayNames = { locale, names: buildScopeDisplayNames() }
    }
    return cachedScopeDisplayNames.names
}

export function humanizeScope(scope: ActivityScope | string, singular = false): string {
    const customName = getScopeDisplayNames()[scope as ActivityScope]
    if (customName) {
        return singular ? customName.singular : customName.plural
    }

    // Default behavior: split camelCase and add plural 's'
    let output = scope.split(/(?=[A-Z])/).join(' ')

    if (!singular && !NO_PLURAL_SCOPES.includes(scope as ActivityScope)) {
        output += 's'
    }

    return output
}

export function humanizeActivity(activity: string): string {
    activity = activity.replace(/_/g, ' ')

    return activity.charAt(0).toUpperCase() + activity.slice(1)
}

export function defaultDescriber(
    logItem: ActivityLogItem,
    asNotification = false,
    resource?: string | JSX.Element
): HumanizedChange {
    resource = resource || logItem.detail.name || `a ${humanizeScope(logItem.scope, true)}`

    if (logItem.activity == 'deleted') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('activityLog.deleted', { defaultValue: 'deleted' })} <b>{resource}</b>
                </>
            ),
        }
    }

    if (logItem.activity == 'created') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('activityLog.created', { defaultValue: 'created' })} <b>{resource}</b>
                </>
            ),
        }
    }

    if (logItem.activity == 'restored') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('activityLog.restored', { defaultValue: 'restored' })} <b>{resource}</b>
                </>
            ),
        }
    }

    if (logItem.activity == 'updated') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('activityLog.updated', { defaultValue: 'updated' })} <b>{resource}</b>
                </>
            ),
        }
    }

    if (logItem.activity == 'copied_to_project') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} /> {i18n.t('activityLog.copied', { defaultValue: 'copied' })}{' '}
                    <b>{resource}</b> {i18n.t('activityLog.toAnotherProject', { defaultValue: 'to another project' })}
                </>
            ),
        }
    }

    if (logItem.activity == 'commented') {
        let description: JSX.Element | string

        if (logItem.scope === 'Comment') {
            description = (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('activityLog.repliedToA', { defaultValue: 'replied to a' })}{' '}
                    {humanizeScope(logItem.scope, true)}
                </>
            )
        } else {
            description = (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('activityLog.commented', { defaultValue: 'commented' })}
                    {asNotification ? (
                        <>
                            {' '}
                            {i18n.t('activityLog.onA', { defaultValue: 'on a' })} {humanizeScope(logItem.scope, true)}
                        </>
                    ) : null}
                </>
            )
        }
        const commentContent = logItem.detail.changes?.[0].after as string | undefined

        return {
            description,
            extendedDescription: commentContent ? (
                <div className="border rounded bg-surface-primary p-4">
                    <LemonMarkdown lowKeyHeadings>{commentContent}</LemonMarkdown>
                </div>
            ) : undefined,
        }
    }

    return { description: null }
}
