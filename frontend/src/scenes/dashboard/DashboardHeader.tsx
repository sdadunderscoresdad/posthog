import { useActions, useValues } from 'kea'

import { FullScreen } from 'lib/components/FullScreen'
import { i18n } from 'lib/i18n/i18n'
import { DashboardEventSource } from 'lib/utils/eventUsageLogic'
import { sceneConfigurations } from 'scenes/scenes'
import { Scene } from 'scenes/sceneTypes'

import { iconForType } from '~/layout/panel-layout/ProjectTree/defaultTree'
import { SceneTitleSection } from '~/layout/scenes/components/SceneTitleSection'
import { dashboardsModel } from '~/models/dashboardsModel'
import { DashboardMode } from '~/types'

import { useMcpToolApplyBack } from 'products/posthog_ai/frontend/api/logics'

import { EditModeActions, FullscreenModeActions, ViewModeActions } from './DashboardHeaderActions'
import { DashboardLoadAction, dashboardLogic } from './dashboardLogic'
import { DashboardModals } from './DashboardModals'
import { DashboardSceneMenuBar } from './DashboardSceneMenuBar'
import { DashboardScenePanel } from './DashboardScenePanel'

/** Why a person cannot edit the dashboard they are looking at, in the app's language. */
export function dashboardCannotEditMessage(): string {
    return i18n.t('dashboard.noEditPermissions', {
        defaultValue:
            "You don't have edit permissions for this dashboard. Ask a dashboard collaborator with edit access to add you.",
    })
}

export function insightIsAddedToDashboard(input: Record<string, unknown> | null, dashboardId: number): boolean {
    return Array.isArray(input?.dashboards) && input.dashboards.some((id) => Number(id) === dashboardId)
}

export function DashboardHeader({ loading = false }: { loading?: boolean }): JSX.Element | null {
    const { dashboard, dashboardLoading, dashboardMode, dashboardEditing, canEditDashboard } = useValues(dashboardLogic)
    const { setDashboardMode, loadDashboard } = useActions(dashboardLogic)
    const { updateDashboard } = useActions(dashboardsModel)

    const isLoading = !dashboard && (loading || dashboardLoading)

    // Sandbox PostHog AI adds insights through insight-create/insight-update, rather than the legacy
    // upsert_dashboard tool. Reload only when that tool explicitly targets the dashboard being viewed.
    useMcpToolApplyBack({
        tools: ['insight-create', 'insight-update'],
        targetKey: `dashboard:${dashboard?.id ?? 'unloaded'}`,
        active: !!dashboard && canEditDashboard,
        onApply: (_event, { innerInput }) => {
            if (dashboard && insightIsAddedToDashboard(innerInput, dashboard.id)) {
                loadDashboard({ action: DashboardLoadAction.Update })
            }
        },
    })

    if (!dashboard && !isLoading) {
        return null
    }

    let actions: JSX.Element | undefined
    if (dashboard) {
        if (dashboardEditing) {
            actions = <EditModeActions />
        } else if (dashboardMode === DashboardMode.Fullscreen) {
            actions = <FullscreenModeActions />
        } else {
            actions = <ViewModeActions />
        }
    }

    return (
        <>
            {dashboardMode === DashboardMode.Fullscreen && (
                <FullScreen onExit={() => setDashboardMode(null, DashboardEventSource.Browser)} />
            )}

            {dashboard && <DashboardModals dashboard={dashboard} />}

            <DashboardScenePanel />
            <DashboardSceneMenuBar />

            <SceneTitleSection
                name={dashboard?.name}
                description={dashboard?.description}
                resourceType={{
                    type: sceneConfigurations[Scene.Dashboard].iconType || 'default_icon_type',
                }}
                onNameChange={(value) => {
                    updateDashboard({ id: dashboard?.id, name: value, allowUndo: true })
                }}
                onDescriptionChange={(value) => {
                    updateDashboard({ id: dashboard?.id, description: value, allowUndo: true })
                }}
                markdown
                canEdit={canEditDashboard}
                isLoading={isLoading}
                saveOnBlur
                renameDebounceMs={0}
                maxButtonLabel="PostHog AI"
                maxToolProps={
                    dashboard && canEditDashboard
                        ? {
                              identifier: 'upsert_dashboard',
                              context: {
                                  current_dashboard: {
                                      id: dashboard.id,
                                      name: dashboard.name,
                                      description: dashboard.description,
                                      tags: dashboard.tags,
                                  },
                              },
                              contextDescription: {
                                  text: dashboard.name,
                                  icon: iconForType('dashboard'),
                              },
                              callback: (toolOutput: { dashboard_id?: string | number }) => {
                                  if (Number(toolOutput?.dashboard_id) === dashboard.id) {
                                      loadDashboard({ action: DashboardLoadAction.Update })
                                  }
                              },
                          }
                        : undefined
                }
                actions={actions}
            />
        </>
    )
}
