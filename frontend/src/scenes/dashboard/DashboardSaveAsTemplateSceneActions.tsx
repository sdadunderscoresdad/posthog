import { useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { IconScreen } from '@posthog/icons'

import { i18n } from 'lib/i18n/i18n'
import { ButtonPrimitive } from 'lib/ui/Button/ButtonPrimitives'
import { getAccessControlDisabledReason, userHasAccess } from 'lib/utils/accessControlUtils'
import { dashboardLogic } from 'scenes/dashboard/dashboardLogic'
import { dashboardTemplateModalLogic } from 'scenes/dashboard/dashboards/templates/dashboardTemplateModalLogic'

import { AccessControlLevel, AccessControlResourceType } from '~/types'

/** Single entry: save this dashboard as a project template (modal; staff get an optional JSON editor from there). */
export function DashboardSaveAsTemplateSceneActions(): JSX.Element | null {
    const { t } = useTranslation()
    const { asDashboardTemplate, canSaveProjectDashboardTemplate } = useValues(dashboardLogic)

    const customerTemplateEditorAccess = userHasAccess(AccessControlResourceType.Dashboard, AccessControlLevel.Editor)
    const customerTemplateDisabledReason = getAccessControlDisabledReason(
        AccessControlResourceType.Dashboard,
        AccessControlLevel.Editor,
        undefined,
        true
    )

    if (!canSaveProjectDashboardTemplate) {
        return null
    }

    const missingTemplatePayload = !asDashboardTemplate
    const disabled = !customerTemplateEditorAccess || missingTemplatePayload
    const tooltip = !customerTemplateEditorAccess
        ? (customerTemplateDisabledReason ??
          i18n.t('dashboard.templates.saveNoAccess', {
              defaultValue: 'You need edit access to dashboard templates to save a template.',
          }))
        : missingTemplatePayload
          ? i18n.t('dashboard.templates.notReady', {
                defaultValue: 'Template data is not ready yet. Try again in a moment.',
            })
          : undefined

    return (
        <ButtonPrimitive
            onClick={() => {
                if (!asDashboardTemplate) {
                    return
                }
                dashboardTemplateModalLogic.actions.openCreate(asDashboardTemplate)
            }}
            disabled={disabled}
            tooltip={tooltip}
            menuItem
            data-attr="dashboard-save-as-project-template"
        >
            <IconScreen />
            {t('dashboard.saveAsTemplate.action', { defaultValue: 'Save as dashboard template' })}
        </ButtonPrimitive>
    )
}
