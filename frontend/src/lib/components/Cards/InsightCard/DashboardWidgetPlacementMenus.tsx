import {
    DashboardWidgetPlacementMenu,
    type DashboardWidgetPlacementDestination,
} from 'lib/components/Cards/InsightCard/DashboardWidgetPlacementMenu'
import { i18n } from 'lib/i18n/i18n'

import type { DashboardBasicType, DashboardType } from '~/types'

export interface DashboardWidgetPlacementMenusProps {
    /** Same list for Copy and Move (includes disabled rows with reasons, e.g. already on dashboard). */
    placementDestinations: DashboardWidgetPlacementDestination[]
    onMoveToDashboard?: (target: Pick<DashboardType, 'id' | 'name'>) => void
    onCopyToDashboard?: (dashboard: DashboardBasicType) => void
}

/**
 * Move to / Copy to submenus (search + list) for dashboard text, button, and insight widgets.
 */
export function DashboardWidgetPlacementMenus({
    placementDestinations,
    onMoveToDashboard,
    onCopyToDashboard,
}: DashboardWidgetPlacementMenusProps): JSX.Element {
    return (
        <>
            {onMoveToDashboard && (
                <DashboardWidgetPlacementMenu
                    label={i18n.t('insightCard.moveTo', { defaultValue: 'Move to' })}
                    destinations={placementDestinations}
                    onSelect={(d) => onMoveToDashboard({ id: d.id, name: d.name })}
                    emptyDisabledReason={i18n.t('insightCard.noMoveDestinations', {
                        defaultValue: 'No dashboards you can move to',
                    })}
                />
            )}
            {onCopyToDashboard && (
                <DashboardWidgetPlacementMenu
                    label={i18n.t('insightCard.copyTo', { defaultValue: 'Copy to' })}
                    destinations={placementDestinations}
                    onSelect={onCopyToDashboard}
                    emptyDisabledReason={i18n.t('insightCard.noCopyDestinations', {
                        defaultValue: 'No dashboards you can copy to',
                    })}
                />
            )}
        </>
    )
}
