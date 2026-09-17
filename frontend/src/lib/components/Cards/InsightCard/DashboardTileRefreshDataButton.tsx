import { TZLabel } from 'lib/components/TZLabel'
import { dayjs, type Dayjs } from 'lib/dayjs'
import { i18n } from 'lib/i18n/i18n'
import { LemonButton } from 'lib/lemon-ui/LemonButton'

export function DashboardTileRefreshDataButton({
    onRefresh,
    disabledReason,
    lastRefresh,
}: {
    onRefresh: () => void
    disabledReason?: string | null
    lastRefresh?: string | number | Dayjs | null
}): JSX.Element {
    const lastRefreshTime = lastRefresh != null ? dayjs(lastRefresh) : null

    return (
        <LemonButton
            onClick={onRefresh}
            disabledReason={disabledReason}
            fullWidth
            data-attr="dashboard-tile-refresh-data"
        >
            {lastRefreshTime ? (
                <div className="block my-1">
                    {i18n.t('insightCard.refreshData', { defaultValue: 'Refresh data' })}
                    <p className="text-xs text-muted mt-0.5">
                        {i18n.t('insightCard.lastComputed', { defaultValue: 'Last computed' })}{' '}
                        <TZLabel time={lastRefreshTime} noStyles className="whitespace-nowrap border-dotted border-b" />
                    </p>
                </div>
            ) : (
                <>{i18n.t('insightCard.refreshData', { defaultValue: 'Refresh data' })}</>
            )}
        </LemonButton>
    )
}
