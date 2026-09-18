import { useActions, useValues } from 'kea'

import { LemonTag } from '@posthog/lemon-ui'

import { i18n } from 'lib/i18n/i18n'
import { LemonRadio } from 'lib/lemon-ui/LemonRadio'
import { dashboardLogic } from 'scenes/dashboard/dashboardLogic'

import type { DashboardTileSpacing } from '~/types'

import {
    DashboardGridCompaction,
    type DashboardGridCompaction as DashboardGridCompactionType,
    getDashboardGridCompactionLabels,
    getDashboardTileSpacingLabels,
} from '../../dashboardCustomization'
import { DashboardTileMovementPreview } from './DashboardTileMovementPreview'

function getTileSpacingOptions(): { value: DashboardTileSpacing; label: string }[] {
    const labels = getDashboardTileSpacingLabels()
    return [
        { value: 'tight', label: labels.tight },
        { value: 'condensed', label: labels.condensed },
        { value: 'standard', label: labels.standard },
        { value: 'relaxed', label: labels.relaxed },
        { value: 'wide', label: labels.wide },
    ]
}

function getGridCompactionOptions(): {
    value: DashboardGridCompactionType
    label: JSX.Element
}[] {
    const labels = getDashboardGridCompactionLabels()
    const option = (
        value: DashboardGridCompactionType,
        tag?: JSX.Element
    ): { value: DashboardGridCompactionType; label: JSX.Element } => ({
        value,
        label: (
            <span className="flex items-center gap-2">
                <span className="text-xs font-medium">{labels[value]}</span>
                {tag}
                <DashboardTileMovementPreview mode={value} />
            </span>
        ),
    })
    return [
        option(
            DashboardGridCompaction.Vertical,
            <LemonTag type="success">
                {i18n.t('dashboard.customizeMenu.recommended', { defaultValue: 'Recommended' })}
            </LemonTag>
        ),
        option(DashboardGridCompaction.Horizontal),
        option(DashboardGridCompaction.Stable),
    ]
}

export function DashboardCustomizeMenu(): JSX.Element | null {
    const { dashboard, canEditDashboard } = useValues(dashboardLogic)
    const { changeDashboardGridCompaction, setDashboardTileSpacing, saveDashboardTileSpacing } =
        useActions(dashboardLogic)
    if (!dashboard || !canEditDashboard) {
        return null
    }

    const tileSpacing = dashboard.customization?.tile_spacing ?? 'standard'
    const layoutCompaction = dashboard.customization?.layout_compaction ?? DashboardGridCompaction.Vertical
    const setTileSpacing = (value: DashboardTileSpacing): void => {
        if (value === tileSpacing) {
            return
        }
        setDashboardTileSpacing(value)
        saveDashboardTileSpacing(value)
    }

    const setGridCompaction = (value: DashboardGridCompactionType): void => {
        if (value === layoutCompaction) {
            return
        }
        changeDashboardGridCompaction(value)
    }

    return (
        <div className="space-y-2 p-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-xs text-muted whitespace-nowrap">
                    {i18n.t('dashboard.customizeMenu.tileDensity', { defaultValue: 'Tile density' })}
                </span>
                <LemonRadio<DashboardTileSpacing>
                    value={tileSpacing}
                    onChange={setTileSpacing}
                    options={getTileSpacingOptions()}
                    orientation="horizontal"
                    className="flex-1 flex-wrap gap-x-3 gap-y-1"
                    aria-label={i18n.t('dashboard.customizeMenu.tileDensity', { defaultValue: 'Tile density' })}
                />
            </div>
            <div className="flex gap-x-3 border-t pt-2">
                <span className="pt-3 text-xs text-muted whitespace-nowrap">
                    {i18n.t('dashboard.customizeMenu.moveBehavior', { defaultValue: 'When you move a tile' })}
                </span>
                <LemonRadio<DashboardGridCompactionType>
                    value={layoutCompaction}
                    onChange={setGridCompaction}
                    options={getGridCompactionOptions()}
                    radioPosition="top"
                    className="flex-1"
                    aria-label={i18n.t('dashboard.customizeMenu.moveBehaviorAriaLabel', {
                        defaultValue: 'How moving a tile rearranges other tiles',
                    })}
                />
            </div>
        </div>
    )
}
