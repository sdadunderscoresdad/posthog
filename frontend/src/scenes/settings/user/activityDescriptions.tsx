import {
    ActivityLogItem,
    ActivityLogUserName,
    Describer,
    HumanizedChange,
    defaultDescriber,
} from 'lib/components/ActivityLog/humanizeActivity'
import { i18n } from 'lib/i18n/i18n'

export const personalAPIKeyActivityDescriber: Describer = (logItem: ActivityLogItem): HumanizedChange => {
    if (logItem.scope !== 'PersonalAPIKey') {
        console.error('personalAPIKeyActivityDescriber received a non-PersonalAPIKey activity')
        return { description: null }
    }

    const getScopeDescription = (): string => {
        const context = logItem.detail.context
        if (
            context?.team_name &&
            context.team_name !== i18n.t('settingsActivity.unknownProject', { defaultValue: 'Unknown Project' })
        ) {
            return context.team_name
        }
        if (context?.organization_name) {
            return context.organization_name
        }
        return i18n.t('settingsActivity.unknownScope', { defaultValue: 'Unknown scope' })
    }

    const getKeyTitle = (): string => {
        return logItem.detail.name || i18n.t('settingsActivity.unknownKey', { defaultValue: 'Unknown key' })
    }

    if (logItem.activity === 'created') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('settingsActivity.personalApiKey.created', { defaultValue: 'created personal API key' })}{' '}
                    <strong>{getKeyTitle()}</strong> {i18n.t('settingsActivity.for', { defaultValue: 'for' })}{' '}
                    <strong>{getScopeDescription()}</strong>
                </>
            ),
        }
    }

    if (logItem.activity === 'revoked') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('settingsActivity.personalApiKey.revoked', {
                        defaultValue: 'revoked access for personal API key',
                    })}{' '}
                    <strong>{getKeyTitle()}</strong> {i18n.t('settingsActivity.to', { defaultValue: 'to' })}{' '}
                    <strong>{getScopeDescription()}</strong>
                </>
            ),
        }
    }

    if (logItem.activity === 'updated') {
        const rolledChangeDescription = logItem.detail.changes?.find((change) => change.field === 'mask_value')

        if (rolledChangeDescription) {
            return {
                description: (
                    <>
                        <ActivityLogUserName logItem={logItem} />{' '}
                        {i18n.t('settingsActivity.personalApiKey.rolled', { defaultValue: 'rolled personal API key' })}{' '}
                        <strong>{getKeyTitle()}</strong> {i18n.t('settingsActivity.for', { defaultValue: 'for' })}{' '}
                        <strong>{getScopeDescription()}</strong>
                    </>
                ),
            }
        }

        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('settingsActivity.personalApiKey.updated', { defaultValue: 'updated personal API key' })}{' '}
                    <strong>{getKeyTitle()}</strong> {i18n.t('settingsActivity.for', { defaultValue: 'for' })}{' '}
                    <strong>{getScopeDescription()}</strong>
                </>
            ),
        }
    }

    if (logItem.activity === 'deleted') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('settingsActivity.personalApiKey.deleted', { defaultValue: 'deleted personal API key' })}{' '}
                    <strong>{getKeyTitle()}</strong>{' '}
                    {i18n.t('settingsActivity.forAccessTo', { defaultValue: 'for access to' })}{' '}
                    <strong>{getScopeDescription()}</strong>
                </>
            ),
        }
    }

    return defaultDescriber(logItem)
}

function asScopeList(value: unknown): string[] {
    return Array.isArray(value) ? value.map(String) : []
}

function ScopeList({ scopes }: { scopes: string[] }): JSX.Element {
    return (
        <>
            {scopes.map((scope, index) => (
                <span key={scope}>
                    {index > 0 && ', '}
                    <code>{scope}</code>
                </span>
            ))}
        </>
    )
}

export const oauthApplicationActivityDescriber: Describer = (logItem: ActivityLogItem): HumanizedChange => {
    if (logItem.scope !== 'OAuthApplication') {
        console.error('oauthApplicationActivityDescriber received a non-OAuthApplication activity')
        return { description: null }
    }

    const appName =
        logItem.detail.name ||
        i18n.t('settingsActivity.oauthApplicationFallbackName', { defaultValue: 'an OAuth application' })
    const scopesChange = logItem.detail.changes?.find((change) => change.field === 'scopes')
    if (!scopesChange) {
        return defaultDescriber(logItem)
    }

    const actor = <ActivityLogUserName logItem={logItem} />
    const before = asScopeList(scopesChange.before)
    const after = asScopeList(scopesChange.after)

    if (logItem.activity === 'created') {
        return {
            description: (
                <>
                    {actor}{' '}
                    {i18n.t('settingsActivity.oauthApplication.registered', {
                        defaultValue: 'registered OAuth application',
                    })}{' '}
                    <strong>{appName}</strong>{' '}
                    {i18n.t('settingsActivity.oauthApplication.withScopeCeiling', {
                        defaultValue: 'with scope ceiling',
                    })}{' '}
                    <ScopeList scopes={after} />
                </>
            ),
        }
    }

    if (logItem.activity === 'updated') {
        if (after.length === 0 && before.length > 0) {
            return {
                description: (
                    <>
                        {actor}{' '}
                        {i18n.t('settingsActivity.oauthApplication.removedCeiling', {
                            defaultValue: 'removed the scope ceiling on',
                        })}{' '}
                        <strong>{appName}</strong>{' '}
                        {i18n.t('settingsActivity.oauthApplication.was', { defaultValue: '(was' })}{' '}
                        <ScopeList scopes={before} />
                        {i18n.t('settingsActivity.oauthApplication.defaultScopesNote', {
                            defaultValue: '; default unprivileged scopes now apply',
                        })}
                        )
                    </>
                ),
            }
        }

        if (before.length === 0 && after.length > 0) {
            return {
                description: (
                    <>
                        {actor}{' '}
                        {i18n.t('settingsActivity.oauthApplication.setCeiling', {
                            defaultValue: 'set the scope ceiling on',
                        })}{' '}
                        <strong>{appName}</strong>{' '}
                        {i18n.t('settingsActivity.oauthApplication.to', { defaultValue: 'to' })}{' '}
                        <ScopeList scopes={after} />
                    </>
                ),
            }
        }

        const added = after.filter((scope) => !before.includes(scope))
        const removed = before.filter((scope) => !after.includes(scope))

        if (added.length > 0 && removed.length > 0) {
            return {
                description: (
                    <>
                        {actor}{' '}
                        {i18n.t('settingsActivity.oauthApplication.changedCeiling', {
                            defaultValue: 'changed the scope ceiling on',
                        })}{' '}
                        <strong>{appName}</strong>
                        {i18n.t('settingsActivity.oauthApplication.addedRemovedLeadIn', {
                            defaultValue: ': added',
                        })}{' '}
                        <ScopeList scopes={added} />
                        {i18n.t('settingsActivity.oauthApplication.removed', { defaultValue: ', removed' })}{' '}
                        <ScopeList scopes={removed} />
                    </>
                ),
            }
        }
        if (added.length > 0) {
            return {
                description: (
                    <>
                        {actor}{' '}
                        {i18n.t('settingsActivity.oauthApplication.widenedCeiling', {
                            defaultValue: 'widened the scope ceiling on',
                        })}{' '}
                        <strong>{appName}</strong>
                        {i18n.t('settingsActivity.oauthApplication.addedLeadIn', { defaultValue: ': added' })}{' '}
                        <ScopeList scopes={added} />
                    </>
                ),
            }
        }
        if (removed.length > 0) {
            return {
                description: (
                    <>
                        {actor}{' '}
                        {i18n.t('settingsActivity.oauthApplication.narrowedCeiling', {
                            defaultValue: 'narrowed the scope ceiling on',
                        })}{' '}
                        <strong>{appName}</strong>
                        {i18n.t('settingsActivity.oauthApplication.removedLeadIn', { defaultValue: ': removed' })}{' '}
                        <ScopeList scopes={removed} />
                    </>
                ),
            }
        }

        return defaultDescriber(logItem)
    }

    return defaultDescriber(logItem)
}
