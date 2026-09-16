import { useActions, useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { LemonButton, LemonModal } from '@posthog/lemon-ui'

import { i18n } from 'lib/i18n/i18n'
import { CodeEditor } from 'lib/monaco/CodeEditor'

import type { MonacoMarker } from '~/types'

import { dashboardTemplateEditorLogic } from './dashboardTemplateEditorLogic'

export interface DashboardTemplateEditorProps {
    inline?: boolean
}

export function DashboardTemplateEditor({ inline = false }: DashboardTemplateEditorProps): JSX.Element {
    const { t } = useTranslation()
    const {
        closeDashboardTemplateEditor,
        createDashboardTemplate,
        updateDashboardTemplate,
        setEditorValue,
        updateValidationErrors,
    } = useActions(dashboardTemplateEditorLogic)

    const { isOpenNewDashboardTemplateModal, editorValue, validationErrors, templateSchema, id } =
        useValues(dashboardTemplateEditorLogic)

    return (
        <LemonModal
            title={
                id
                    ? i18n.t('dashboard.templates.editTitle', { defaultValue: 'Edit dashboard template' })
                    : i18n.t('dashboard.templates.newTitle', { defaultValue: 'New dashboard template' })
            }
            isOpen={isOpenNewDashboardTemplateModal}
            width={1000}
            onClose={() => {
                closeDashboardTemplateEditor()
            }}
            inline={inline}
            footer={
                id ? (
                    <LemonButton
                        type="primary"
                        data-attr="update-dashboard-template-button"
                        onClick={() => {
                            updateDashboardTemplate({ id })
                        }}
                        disabledReason={
                            validationErrors.length
                                ? `There are ${validationErrors.length} errors to resolve: ${validationErrors.map(
                                      (e) => ' ' + e
                                  )}`
                                : undefined
                        }
                    >
                        {t('dashboard.templateEditor.update', { defaultValue: 'Update template' })}
                    </LemonButton>
                ) : (
                    <LemonButton
                        type="primary"
                        data-attr="create-dashboard-template-button"
                        onClick={() => {
                            createDashboardTemplate()
                        }}
                        disabledReason={
                            validationErrors.length
                                ? t('dashboard.templateEditor.validationErrors', {
                                      defaultValue: 'There are {{ count }} errors to resolve:{{ errors }}',
                                      count: validationErrors.length,
                                      errors: validationErrors.map((e) => ' ' + e),
                                  })
                                : undefined
                        }
                    >
                        {t('dashboard.templateEditor.create', { defaultValue: 'Create new template' })}
                    </LemonButton>
                )
            }
        >
            <CodeEditor
                className="border"
                language="json"
                value={editorValue}
                onChange={(v: string | undefined) => setEditorValue(v ?? '')}
                onValidate={(markers: MonacoMarker[] | undefined) => updateValidationErrors(markers)}
                path={id ? `dashboard-templates/${id}.json` : 'dashboard-templates/new.json'}
                schema={templateSchema}
                height={600}
            />
        </LemonModal>
    )
}
