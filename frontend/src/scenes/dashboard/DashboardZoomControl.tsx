import { useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { LemonButton } from '@posthog/lemon-ui'

import { Shortcut } from 'lib/components/Shortcuts/Shortcut'
import { eventUsageLogic } from 'lib/utils/eventUsageLogic'
import { Scene } from 'scenes/sceneTypes'

import { dashboardLogic } from './dashboardLogic'

interface DashboardZoomControlProps {
    layoutZoom: number
    setLayoutZoom: (value: number) => void
}

export function DashboardZoomControl({ layoutZoom, setLayoutZoom }: DashboardZoomControlProps): JSX.Element | null {
    const { t } = useTranslation()
    const { dashboard, currentLayoutSize } = useValues(dashboardLogic)

    if (currentLayoutSize === 'xs') {
        return null
    }

    return (
        <div className="flex items-center gap-2 text-sm text-muted hidden md:flex">
            <Shortcut
                name="DashboardLayoutZoomToggle"
                keybind={[['z']]}
                intent="Toggle dashboard layout zoom while editing"
                interaction="click"
                scope={Scene.Dashboard}
            >
                <LemonButton
                    size="small"
                    type="secondary"
                    active={layoutZoom < 1}
                    onClick={() => {
                        const nextZoom = layoutZoom < 1 ? 1 : 0.25
                        setLayoutZoom(nextZoom)
                        eventUsageLogic.actions.reportDashboardLayoutZoomChanged(dashboard ?? null, nextZoom, 'button')
                    }}
                    tooltip={t('dashboard.zoom.tooltip', {
                        defaultValue: 'Collapse/Expand view. Makes it easier to edit the layout for busier dashboards.',
                    })}
                >
                    {layoutZoom < 1
                        ? t('dashboard.zoom.expand', { defaultValue: 'Expand view' })
                        : t('dashboard.zoom.collapse', { defaultValue: 'Collapse view' })}
                </LemonButton>
            </Shortcut>
        </div>
    )
}
