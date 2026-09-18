import { MemberSelect } from 'lib/components/MemberSelect'
import { i18n } from 'lib/i18n/i18n'
import { LemonSelect } from 'lib/lemon-ui/LemonSelect'

import type { DashboardWidgetTileFiltersProps } from '../registry'
import { useWidgetTileConfigPersist } from '../widgetTileFiltersHooks'
import { WidgetTileFilterReadOnlyValue, WidgetTileFiltersBar } from '../widgetTileFiltersReadOnly'
import {
    getExperimentsWidgetStatusOptions,
    type ExperimentsListWidgetStatus,
    parseExperimentsListWidgetConfig,
    patchExperimentsListWidgetConfig,
} from './experimentsWidgetConfigValidation'

export function ExperimentsListWidgetTileFilters({
    config,
    onUpdateConfig,
    disabledReason,
}: DashboardWidgetTileFiltersProps): JSX.Element {
    const parsed = parseExperimentsListWidgetConfig(config)
    const status = parsed.status ?? 'all'
    const createdBy = parsed.createdBy ?? null

    const { getLatestConfig, persistConfigNow } = useWidgetTileConfigPersist(onUpdateConfig, config)

    const canUpdate = !!onUpdateConfig && !disabledReason

    const applyStatus = async (value: ExperimentsListWidgetStatus): Promise<void> => {
        const nextConfig = patchExperimentsListWidgetConfig(getLatestConfig(), { status: value })
        await persistConfigNow(nextConfig)
    }

    const applyCreatedBy = async (userId: number | null): Promise<void> => {
        const nextConfig = patchExperimentsListWidgetConfig(getLatestConfig(), { createdBy: userId })
        await persistConfigNow(nextConfig)
    }

    if (!onUpdateConfig) {
        const statusLabel =
            getExperimentsWidgetStatusOptions().find((option) => option.value === status)?.label ?? status
        return (
            <WidgetTileFiltersBar dataAttr="experiments-list-widget-tile-filters-readonly">
                <WidgetTileFilterReadOnlyValue>
                    <span className="text-secondary">
                        {i18n.t('dashboardWidgets.experiments.statusFilterLabel', { defaultValue: 'Status:' })}
                    </span>{' '}
                    {statusLabel}
                </WidgetTileFilterReadOnlyValue>
            </WidgetTileFiltersBar>
        )
    }

    return (
        <WidgetTileFiltersBar dataAttr="experiments-list-widget-tile-filters">
            <LemonSelect
                size="small"
                value={status}
                disabled={!canUpdate}
                disabledReason={disabledReason ?? undefined}
                options={getExperimentsWidgetStatusOptions()}
                onChange={(value) => {
                    if (value) {
                        void applyStatus(value)
                    }
                }}
            />
            <MemberSelect
                type="secondary"
                size="small"
                value={createdBy}
                onChange={(user) => {
                    void applyCreatedBy(user?.id ?? null)
                }}
            />
        </WidgetTileFiltersBar>
    )
}
