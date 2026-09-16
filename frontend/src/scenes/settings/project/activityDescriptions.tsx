import {
    ActivityLogItem,
    ActivityLogUserName,
    Describer,
    HumanizedChange,
    defaultDescriber,
} from 'lib/components/ActivityLog/humanizeActivity'
import { i18n } from 'lib/i18n/i18n'

const projectNameForLog = (logItem: ActivityLogItem): string => {
    const context = logItem.detail?.context
    return context?.project_name || i18n.t('settingsActivity.project', { defaultValue: 'this project' })
}

const keyLabel = (logItem: ActivityLogItem): string => {
    return logItem.detail?.name || i18n.t('settingsActivity.unknownKey', { defaultValue: 'Unknown key' })
}

export const projectSecretAPIKeyActivityDescriber: Describer = (logItem: ActivityLogItem): HumanizedChange => {
    if (logItem.scope !== 'ProjectSecretAPIKey') {
        console.error('projectSecretAPIKeyActivityDescriber received a non-ProjectSecretAPIKey activity')
        return { description: null }
    }

    const actor = <ActivityLogUserName logItem={logItem} />
    const keyName = <strong>{keyLabel(logItem)}</strong>
    const scopeName = <strong>{projectNameForLog(logItem)}</strong>

    if (logItem.activity === 'created') {
        return {
            description: (
                <>
                    {actor}{' '}
                    {i18n.t('settingsActivity.projectApiKey.created', { defaultValue: 'created project API key' })}{' '}
                    {keyName} {i18n.t('settingsActivity.for', { defaultValue: 'for' })} {scopeName}
                </>
            ),
        }
    }

    if (logItem.activity === 'updated') {
        const rolled = logItem.detail?.changes?.some((change) => change.field === 'mask_value')

        if (rolled) {
            return {
                description: (
                    <>
                        {actor}{' '}
                        {i18n.t('settingsActivity.projectApiKey.rolled', { defaultValue: 'rolled project API key' })}{' '}
                        {keyName} {i18n.t('settingsActivity.for', { defaultValue: 'for' })} {scopeName}
                    </>
                ),
            }
        }

        return {
            description: (
                <>
                    {actor}{' '}
                    {i18n.t('settingsActivity.projectApiKey.updated', { defaultValue: 'updated project API key' })}{' '}
                    {keyName} {i18n.t('settingsActivity.for', { defaultValue: 'for' })} {scopeName}
                </>
            ),
        }
    }

    if (logItem.activity === 'deleted') {
        return {
            description: (
                <>
                    {actor}{' '}
                    {i18n.t('settingsActivity.projectApiKey.deleted', { defaultValue: 'deleted project API key' })}{' '}
                    {keyName} {i18n.t('settingsActivity.for', { defaultValue: 'for' })} {scopeName}
                </>
            ),
        }
    }

    return defaultDescriber(logItem)
}
