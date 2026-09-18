import { useActions } from 'kea'

import { AccessControlAction } from 'lib/components/AccessControlAction'
import { i18n } from 'lib/i18n/i18n'
import { LemonButton } from 'lib/lemon-ui/LemonButton'
import { newDashboardLogic } from 'scenes/dashboard/newDashboardLogic'
import { NewDashboardModal } from 'scenes/dashboard/NewDashboardModal'

import { AccessControlLevel, AccessControlResourceType } from '~/types'

/**
 * Create button for the dashboards empty state. New dashboards are picked in a modal
 * that the scene normally renders, and the gate replaces the scene - so the empty
 * state has to render the modal itself or the button would open nothing.
 */
export function DashboardsPrimaryAction(): JSX.Element {
    const { showNewDashboardModal } = useActions(newDashboardLogic)

    return (
        <>
            <AccessControlAction
                resourceType={AccessControlResourceType.Dashboard}
                minAccessLevel={AccessControlLevel.Editor}
            >
                <LemonButton type="primary" onClick={showNewDashboardModal} data-attr="new-dashboard">
                    {i18n.t('dashboard.emptyState.createFirstAction', { defaultValue: 'Create your first dashboard' })}
                </LemonButton>
            </AccessControlAction>
            <NewDashboardModal />
        </>
    )
}
