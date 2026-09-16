import {
    ActivityLogItem,
    ActivityLogUserName,
    HumanizedChange,
    defaultDescriber,
} from 'lib/components/ActivityLog/humanizeActivity'
import { i18n } from 'lib/i18n/i18n'

const getDisplayName = (logItem: ActivityLogItem): string => {
    const name = logItem?.detail?.name
    if (name) {
        return name
    }

    const context = logItem?.detail?.context as any
    if (context?.source_type && context?.content_type) {
        return i18n.t('batchImport.sourceWithContent', {
            defaultValue: 'source {{ source }} ({{ content }})',
            source: context.source_type,
            content: context.content_type,
        })
    }

    const detail = logItem?.detail as any
    const config = detail?.import_config
    if (config?.source?.type) {
        return i18n.t('batchImport.source', {
            defaultValue: 'source {{ source }}',
            source: config.source.type,
        })
    }

    return i18n.t('batchImport.unknownSource', { defaultValue: 'unknown source' })
}

export function batchImportActivityDescriber(logItem: ActivityLogItem, asNotification?: boolean): HumanizedChange {
    if (logItem.activity == 'created') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('activityLog.created', { defaultValue: 'created' })}{' '}
                    <strong>{getDisplayName(logItem)}</strong>
                </>
            ),
        }
    }

    if (logItem.activity == 'deleted') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('activityLog.deleted', { defaultValue: 'deleted' })}{' '}
                    <strong>{getDisplayName(logItem)}</strong>
                </>
            ),
        }
    }

    if (logItem.activity == 'updated') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('activityLog.updated', { defaultValue: 'updated' })}{' '}
                    <strong>{getDisplayName(logItem)}</strong>
                </>
            ),
        }
    }

    return defaultDescriber(logItem, asNotification, getDisplayName(logItem))
}
