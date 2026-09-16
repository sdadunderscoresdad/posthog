import { useValues } from 'kea'

import { i18n } from 'lib/i18n/i18n'
import { Link } from 'lib/lemon-ui/Link'
import { urls } from 'scenes/urls'
import {
    ExternalTable,
    marketingAnalyticsLogic,
} from 'scenes/web-analytics/tabs/marketing-analytics/frontend/logic/marketingAnalyticsLogic'

export const ColumnMappingChangedDescriber = ({
    sourceKey,
    columnKey,
    oldMapping,
    newMapping,
}: {
    sourceKey: string
    columnKey: string
    oldMapping: string
    newMapping: string
}): JSX.Element => {
    const { externalTables } = useValues(marketingAnalyticsLogic)

    const table = externalTables.find((t: ExternalTable) => t.source_map_id === sourceKey)

    return (
        <>
            {i18n.t('teamActivity.changed', { defaultValue: 'changed' })} <code>{columnKey}</code>{' '}
            {i18n.t('teamActivity.columnMappingFrom', { defaultValue: 'column mapping from' })}{' '}
            <code>{oldMapping}</code> {i18n.t('teamActivity.to', { defaultValue: 'to' })} <code>{newMapping}</code>{' '}
            {i18n.t('teamActivity.for', { defaultValue: 'for' })}{' '}
            <b>{table?.schema_name || i18n.t('teamActivity.unknownSource', { defaultValue: 'Unknown source' })}</b>{' '}
            <Link to={urls.settings('project', 'marketing-settings')} target="_blank">
                {i18n.t('teamActivity.marketingSource', { defaultValue: 'marketing source' })}
            </Link>
        </>
    )
}
