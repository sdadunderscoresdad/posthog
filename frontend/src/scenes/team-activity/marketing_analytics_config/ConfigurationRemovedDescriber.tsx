import { useValues } from 'kea'

import { i18n } from 'lib/i18n/i18n'
import { Link } from 'lib/lemon-ui/Link'
import { urls } from 'scenes/urls'
import {
    ExternalTable,
    marketingAnalyticsLogic,
} from 'scenes/web-analytics/tabs/marketing-analytics/frontend/logic/marketingAnalyticsLogic'

export const ConfigurationRemovedDescriber = ({
    sourceKey,
    columnKey,
}: {
    sourceKey: string
    columnKey: string
}): JSX.Element => {
    const { externalTables } = useValues(marketingAnalyticsLogic)

    const table = externalTables.find((t: ExternalTable) => t.source_map_id === sourceKey)

    return (
        <>
            {i18n.t('teamActivity.cleared', { defaultValue: 'cleared' })}{' '}
            <Link to={urls.settings('project', 'marketing-settings')} target="_blank">
                {i18n.t('teamActivity.marketingSource', { defaultValue: 'marketing source' })}
            </Link>{' '}
            {i18n.t('teamActivity.configurationByRemoving', { defaultValue: 'configuration by removing' })}{' '}
            <code>{columnKey}</code> {i18n.t('teamActivity.columnMappingFor', { defaultValue: 'column mapping for' })}{' '}
            <b>{table?.schema_name}</b>
        </>
    )
}
