import {
    ActivityLogItem,
    ActivityLogUserName,
    HumanizedChange,
    defaultDescriber,
} from 'lib/components/ActivityLog/humanizeActivity'
import { i18n } from 'lib/i18n/i18n'
import { Link } from 'lib/lemon-ui/Link'
import { urls } from 'scenes/urls'

export function exportedAssetActivityDescriber(logItem: ActivityLogItem, asNotification?: boolean): HumanizedChange {
    if (logItem.scope !== 'ExportedAsset') {
        console.error('exported asset describer received a non-export activity')
        return { description: null }
    }

    if (logItem.activity === 'exported') {
        const exportFormat = logItem.detail.changes?.[0]?.after
        let formatLabel = i18n.t('exportedAsset.anExport', { defaultValue: 'an export' })
        if (typeof exportFormat === 'string') {
            formatLabel = i18n.t('exportedAsset.format', {
                defaultValue: 'a {{ format }}',
                format: exportFormat.split('/')[1] || exportFormat,
            })
        }

        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('exportedAsset.exported', { defaultValue: 'exported' })}{' '}
                    {asNotification ? <>{i18n.t('exportedAsset.your', { defaultValue: 'your' })} </> : null}
                    <Link to={urls.exports()}>
                        {logItem.detail.name || i18n.t('exportedAsset.anExport', { defaultValue: 'an export' })}
                    </Link>{' '}
                    {i18n.t('exportedAsset.as', { defaultValue: 'as' })} {formatLabel}
                </>
            ),
        }
    }

    return defaultDescriber(logItem, asNotification)
}
