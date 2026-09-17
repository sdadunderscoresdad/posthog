import {
    ActivityLogItem,
    ActivityLogUserName,
    HumanizedChange,
    defaultDescriber,
} from 'lib/components/ActivityLog/humanizeActivity'
import { i18n } from 'lib/i18n/i18n'

import { ActivityScope, DataWarehouseSyncInterval, ExternalDataSourceSyncSchema } from '~/types'

import { SyncTypeLabelMap } from 'products/data_warehouse/frontend/utils'

const getSyncFrequencyLabel = (syncFrequency: string): string => {
    const syncFrequencyMap: Record<DataWarehouseSyncInterval, string> = {
        '1min': i18n.t('dataWarehouseActivity.syncFrequency.everyMinute', { defaultValue: 'every 1 min' }),
        '5min': i18n.t('dataWarehouseActivity.syncFrequency.everyFiveMinutes', { defaultValue: 'every 5 mins' }),
        '15min': i18n.t('dataWarehouseActivity.syncFrequency.everyFifteenMinutes', { defaultValue: 'every 15 mins' }),
        '30min': i18n.t('dataWarehouseActivity.syncFrequency.everyThirtyMinutes', { defaultValue: 'every 30 mins' }),
        '1hour': i18n.t('dataWarehouseActivity.syncFrequency.everyHour', { defaultValue: 'every 1 hour' }),
        '6hour': i18n.t('dataWarehouseActivity.syncFrequency.everySixHours', { defaultValue: 'every 6 hours' }),
        '12hour': i18n.t('dataWarehouseActivity.syncFrequency.everyTwelveHours', { defaultValue: 'every 12 hours' }),
        '24hour': i18n.t('dataWarehouseActivity.syncFrequency.daily', { defaultValue: 'daily' }),
        '7day': i18n.t('dataWarehouseActivity.syncFrequency.weekly', { defaultValue: 'weekly' }),
        '30day': i18n.t('dataWarehouseActivity.syncFrequency.monthly', { defaultValue: 'monthly' }),
    }
    return syncFrequencyMap[syncFrequency as DataWarehouseSyncInterval] || syncFrequency
}

const getDisplayName = (logItem: ActivityLogItem): string => {
    const name = logItem?.detail?.name
    if (name) {
        return name
    }

    // Handle ExternalDataSource display name
    if (logItem.scope === ActivityScope.EXTERNAL_DATA_SOURCE) {
        const sourceType = (logItem?.detail as any)?.source_type
        const prefix = (logItem?.detail as any)?.prefix

        if (sourceType && prefix) {
            return `${sourceType} (${prefix})`
        } else if (sourceType) {
            return sourceType
        }
    }

    // Handle ExternalDataSchema display name
    if (logItem.scope === ActivityScope.EXTERNAL_DATA_SCHEMA) {
        const schemaName =
            logItem?.detail?.name || i18n.t('dataWarehouseActivity.unnamedSchema', { defaultValue: 'Unnamed Schema' })
        const context = (logItem?.detail as any)?.context
        const syncType = context?.sync_type
        const syncFrequency = context?.sync_frequency

        const humanizedSyncType = syncType
            ? SyncTypeLabelMap[syncType as NonNullable<ExternalDataSourceSyncSchema['sync_type']>] || syncType
            : null
        const humanizedSyncFrequency = syncFrequency ? getSyncFrequencyLabel(syncFrequency) : null

        if (humanizedSyncType && humanizedSyncFrequency) {
            return `${schemaName} (${humanizedSyncType}, ${humanizedSyncFrequency})`
        } else if (humanizedSyncType) {
            return `${schemaName} (${humanizedSyncType})`
        }
        return schemaName
    }

    return i18n.t('dataWarehouseActivity.sourceFallbackName', { defaultValue: 'Source' })
}

export function externalDataSourceActivityDescriber(
    logItem: ActivityLogItem,
    asNotification?: boolean
): HumanizedChange {
    const displayName = getDisplayName(logItem)

    if (logItem.activity == 'created') {
        if (logItem.scope === ActivityScope.EXTERNAL_DATA_SCHEMA) {
            return {
                description: (
                    <>
                        <ActivityLogUserName logItem={logItem} />{' '}
                        {i18n.t('dataWarehouseActivity.createdSchema', { defaultValue: 'created schema' })}{' '}
                        <strong>{displayName}</strong>
                    </>
                ),
            }
        }
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('dataWarehouseActivity.createdSource', { defaultValue: 'created source' })}{' '}
                    <strong>{displayName}</strong>
                </>
            ),
        }
    }

    if (
        logItem.activity == 'deleted' ||
        (logItem.activity == 'updated' &&
            logItem.detail?.changes?.some((change: any) => change.field === 'deleted' && change.after === true))
    ) {
        if (logItem.scope === ActivityScope.EXTERNAL_DATA_SCHEMA) {
            return {
                description: (
                    <>
                        <ActivityLogUserName logItem={logItem} />{' '}
                        {i18n.t('dataWarehouseActivity.deletedSchema', { defaultValue: 'deleted schema' })}{' '}
                        <strong>{displayName}</strong>
                    </>
                ),
            }
        }
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('dataWarehouseActivity.deletedSource', { defaultValue: 'deleted source' })}{' '}
                    <strong>{displayName}</strong>
                </>
            ),
        }
    }

    if (logItem.activity == 'updated') {
        if (logItem.scope === ActivityScope.EXTERNAL_DATA_SCHEMA) {
            const changes = logItem.detail?.changes ?? []
            const enabledChange = changes.find((change) => change.field === 'enabled')
            if (enabledChange && changes.length === 1) {
                return {
                    description: (
                        <>
                            <ActivityLogUserName logItem={logItem} />{' '}
                            {enabledChange.after
                                ? i18n.t('dataWarehouseActivity.enabledSchema', { defaultValue: 'enabled schema' })
                                : i18n.t('dataWarehouseActivity.disabledSchema', {
                                      defaultValue: 'disabled schema',
                                  })}{' '}
                            <strong>{displayName}</strong>
                        </>
                    ),
                }
            }
            return {
                description: (
                    <>
                        <ActivityLogUserName logItem={logItem} />{' '}
                        {i18n.t('dataWarehouseActivity.updatedSchema', { defaultValue: 'updated schema' })}{' '}
                        <strong>{displayName}</strong>
                    </>
                ),
            }
        }
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('dataWarehouseActivity.updatedSource', { defaultValue: 'updated source' })}{' '}
                    <strong>{displayName}</strong>
                </>
            ),
        }
    }

    return defaultDescriber(logItem, asNotification, displayName)
}
