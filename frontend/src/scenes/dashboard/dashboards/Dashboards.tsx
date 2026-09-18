import { useActions, useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { LemonButton } from '@posthog/lemon-ui'

import { AccessControlAction } from 'lib/components/AccessControlAction'
import { Shortcut } from 'lib/components/Shortcuts/Shortcut'
import { keyBinds } from 'lib/components/Shortcuts/shortcuts'
import { i18n } from 'lib/i18n/i18n'
import { LemonTab, LemonTabs } from 'lib/lemon-ui/LemonTabs'
import { DashboardsTab, dashboardsLogic } from 'scenes/dashboard/dashboards/dashboardsLogic'
import { DashboardTemplateModal } from 'scenes/dashboard/dashboards/templates/DashboardTemplateModal'
import { DashboardTemplatesTable } from 'scenes/dashboard/dashboards/templates/DashboardTemplatesTable'
import { DashboardTemplateEditor } from 'scenes/dashboard/DashboardTemplateEditor'
import { DeleteDashboardModal } from 'scenes/dashboard/DeleteDashboardModal'
import { DuplicateDashboardModal } from 'scenes/dashboard/DuplicateDashboardModal'
import { newDashboardLogic } from 'scenes/dashboard/newDashboardLogic'
import { NewDashboardModal } from 'scenes/dashboard/NewDashboardModal'
import { sceneConfigurations } from 'scenes/scenes'
import { Scene, SceneExport } from 'scenes/sceneTypes'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneTitleSection } from '~/layout/scenes/components/SceneTitleSection'
import { dashboardsModel } from '~/models/dashboardsModel'
import { ProductKey } from '~/queries/schema/schema-general'
import { AccessControlLevel, AccessControlResourceType } from '~/types'

import { getDashboardsEmptyState } from 'products/dashboards/frontend/emptyState/dashboardsEmptyState'
import { DashboardSavedViews } from 'products/dashboards/frontend/saved-views/DashboardSavedViews'

import { DashboardsTableContainer } from './DashboardsTable'

export const scene: SceneExport = {
    component: Dashboards,
    logic: dashboardsLogic,
    productKey: ProductKey.PRODUCT_ANALYTICS,
    // Read on render so the empty state's copy follows the active language rather than the
    // language that was loaded when this module was first imported.
    get emptyState() {
        return getDashboardsEmptyState()
    },
}

export function Dashboards(): JSX.Element {
    const { t } = useTranslation()
    const { dashboardsLoading } = useValues(dashboardsModel)
    const { setCurrentTab } = useActions(dashboardsLogic)
    const { dashboards, currentTab, isFiltering } = useValues(dashboardsLogic)
    const { showNewDashboardModal } = useActions(newDashboardLogic)
    const enabledTabs: LemonTab<DashboardsTab>[] = [
        {
            key: DashboardsTab.All,
            label: i18n.t('dashboard.list.all', { defaultValue: 'All dashboards' }),
        },
        { key: DashboardsTab.Yours, label: i18n.t('dashboard.list.mine', { defaultValue: 'My dashboards' }) },
        {
            key: DashboardsTab.Templates,
            label: 'Templates',
        },
    ]

    return (
        <SceneContent>
            <NewDashboardModal />
            <DuplicateDashboardModal />
            <DeleteDashboardModal />
            <DashboardTemplateEditor />
            <DashboardTemplateModal />

            <SceneTitleSection
                name={sceneConfigurations[Scene.Dashboards].name}
                description={sceneConfigurations[Scene.Dashboards].description}
                resourceType={{
                    type: sceneConfigurations[Scene.Dashboards].iconType || 'default_icon_type',
                }}
                actions={
                    <>
                        <AccessControlAction
                            resourceType={AccessControlResourceType.Dashboard}
                            minAccessLevel={AccessControlLevel.Editor}
                        >
                            <Shortcut
                                name="NewDashboard"
                                keybind={[keyBinds.new]}
                                intent={i18n.t('dashboard.list.new', { defaultValue: 'New dashboard' })}
                                interaction="click"
                                scope={Scene.Dashboards}
                            >
                                <LemonButton
                                    size="small"
                                    data-attr="new-dashboard"
                                    onClick={showNewDashboardModal}
                                    type="primary"
                                >
                                    {t('dashboard.new.action', { defaultValue: 'New dashboard' })}
                                </LemonButton>
                            </Shortcut>
                        </AccessControlAction>
                    </>
                }
            />
            <LemonTabs
                onChange={(newKey) => {
                    setCurrentTab(newKey)
                }}
                activeKey={currentTab}
                tabs={enabledTabs}
                sceneInset
                rightSlot={<DashboardSavedViews />}
                rightSlotClassName="!static !justify-start !bg-transparent"
            />

            <div>
                {currentTab === DashboardsTab.Templates ? (
                    <DashboardTemplatesTable />
                ) : dashboardsLoading || dashboards.length > 0 || isFiltering ? (
                    <DashboardsTableContainer />
                ) : null}
            </div>
        </SceneContent>
    )
}
