import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'
import { useTranslation } from 'react-i18next'

import { LemonButton } from 'lib/lemon-ui/LemonButton'
import { LemonCheckbox } from 'lib/lemon-ui/LemonCheckbox'
import { LemonField } from 'lib/lemon-ui/LemonField'
import { LemonModal } from 'lib/lemon-ui/LemonModal'
import { deleteDashboardLogic } from 'scenes/dashboard/deleteDashboardLogic'

export function DeleteDashboardModal(): JSX.Element {
    const { t } = useTranslation()
    const { hideDeleteDashboardModal } = useActions(deleteDashboardLogic)
    const { isDeleteDashboardSubmitting, deleteDashboardModalVisible } = useValues(deleteDashboardLogic)

    return (
        <LemonModal
            title={t('dashboard.menuBar.delete', { defaultValue: 'Delete dashboard' })}
            onClose={hideDeleteDashboardModal}
            isOpen={deleteDashboardModalVisible}
            footer={
                <>
                    <LemonButton
                        form="delete-dashboard-form"
                        type="secondary"
                        data-attr="dashboard-delete"
                        disabled={isDeleteDashboardSubmitting}
                        onClick={hideDeleteDashboardModal}
                    >
                        {t('dashboard.editMode.cancel', { defaultValue: 'Cancel' })}
                    </LemonButton>
                    <LemonButton
                        form="delete-dashboard-form"
                        htmlType="submit"
                        type="secondary"
                        status="danger"
                        data-attr="dashboard-delete-submit"
                        loading={isDeleteDashboardSubmitting}
                        disabled={isDeleteDashboardSubmitting}
                    >
                        {t('dashboard.menuBar.delete', { defaultValue: 'Delete dashboard' })}
                    </LemonButton>
                </>
            }
        >
            <Form
                logic={deleteDashboardLogic}
                formKey="deleteDashboard"
                id="delete-dashboard-form"
                enableFormOnSubmit
                className="deprecated-space-y-2"
            >
                <LemonField
                    name="deleteInsights"
                    help={t('dashboard.delete.insightsHelp', {
                        defaultValue: "This will only delete insights if they're not on any other dashboards.",
                    })}
                >
                    {({ value, onChange }) => (
                        <LemonCheckbox
                            data-attr="delete-dashboard-insights-checkbox"
                            checked={value}
                            label={t('dashboard.delete.insightsLabel', {
                                defaultValue: "Delete this dashboard's insights",
                            })}
                            onChange={onChange}
                        />
                    )}
                </LemonField>
            </Form>
        </LemonModal>
    )
}
