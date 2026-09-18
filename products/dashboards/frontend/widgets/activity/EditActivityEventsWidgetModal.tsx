import { BindLogic, useActions, useValues } from 'kea'

import { i18n } from 'lib/i18n/i18n'
import { LemonButton } from 'lib/lemon-ui/LemonButton'
import { LemonDivider } from 'lib/lemon-ui/LemonDivider'
import { LemonField } from 'lib/lemon-ui/LemonField/LemonField'
import { LemonInput } from 'lib/lemon-ui/LemonInput/LemonInput'
import { LemonModal } from 'lib/lemon-ui/LemonModal'

import { getDashboardWidgetGroupLabel } from '../../widget_types/catalog'
import { EditWidgetModalFiltersSubsection } from '../EditWidgetModalFiltersSection'
import { EditWidgetModalTileDetailsSection } from '../EditWidgetModalTileDetailsSection'
import type { DashboardWidgetEditModalProps } from '../registry'
import { editActivityEventsWidgetModalLogic } from './editActivityEventsWidgetModalLogic'

function EditActivityEventsWidgetModalContents(): JSX.Element {
    const {
        limit,
        tileName,
        tileDescription,
        filterTestAccounts,
        activeFieldErrors,
        saving,
        saveDisabledReason,
        onClose,
        defaultTitle,
    } = useValues(editActivityEventsWidgetModalLogic)
    const { setLimit, setTileName, setTileDescription, setFilterTestAccounts, clearFieldError, submit } = useActions(
        editActivityEventsWidgetModalLogic
    )

    return (
        <LemonModal
            isOpen
            onClose={onClose}
            title={i18n.t('dashboardWidgets.editModal.title', { defaultValue: 'Widget settings' })}
            description={i18n.t('dashboardWidgets.activity.edit.description', {
                defaultValue: 'Configure tile details and which events appear on this dashboard.',
            })}
            width={680}
            footer={
                <>
                    <div className="flex-1" />
                    <LemonButton type="secondary" onClick={onClose} disabled={saving}>
                        {i18n.t('common.cancel', { defaultValue: 'Cancel' })}
                    </LemonButton>
                    <LemonButton
                        type="primary"
                        loading={saving}
                        disabledReason={saveDisabledReason}
                        onClick={() => submit()}
                    >
                        {i18n.t('settings.save', { defaultValue: 'Save' })}
                    </LemonButton>
                </>
            }
        >
            <div className="flex flex-col gap-4">
                <EditWidgetModalTileDetailsSection
                    tileName={tileName}
                    tileDescription={tileDescription}
                    defaultTitle={defaultTitle}
                    saving={saving}
                    setTileName={setTileName}
                    setTileDescription={setTileDescription}
                />
                <LemonDivider className="my-0" />
                <section className="flex flex-col gap-3">
                    <h5 className="text-sm font-semibold m-0">{getDashboardWidgetGroupLabel('activity')}</h5>
                    <div className="flex flex-col gap-4">
                        <EditWidgetModalFiltersSubsection
                            title={i18n.t('dashboardWidgets.activity.edit.eventFilters', {
                                defaultValue: 'Event filters',
                            })}
                            filterTestAccounts={filterTestAccounts}
                            saving={saving}
                            setFilterTestAccounts={setFilterTestAccounts}
                        >
                            <p className="text-sm text-muted m-0 sm:col-span-2">
                                {i18n.t('dashboardWidgets.activity.edit.filtersHint', {
                                    defaultValue:
                                        'The date range is on the tile filter bar (collapsible on the tile). Use this modal for test-account filtering and list size.',
                                })}
                            </p>
                            <LemonField.Pure
                                label={i18n.t('dashboardWidgets.activity.edit.numberOfEvents', {
                                    defaultValue: 'Number of events',
                                })}
                                help={i18n.t('dashboardWidgets.activity.edit.numberOfEventsHelp', {
                                    defaultValue: 'Show up to 50 events on the tile.',
                                })}
                                error={activeFieldErrors.limit}
                            >
                                <LemonInput
                                    type="number"
                                    min={1}
                                    max={50}
                                    fullWidth
                                    value={limit}
                                    onChange={(value) => {
                                        setLimit(Number(value))
                                        clearFieldError('limit')
                                    }}
                                />
                            </LemonField.Pure>
                        </EditWidgetModalFiltersSubsection>
                    </div>
                </section>
            </div>
        </LemonModal>
    )
}

export function EditActivityEventsWidgetModal({
    isOpen,
    onClose,
    config,
    onSave,
    name,
    defaultTitle,
    description,
}: DashboardWidgetEditModalProps): JSX.Element | null {
    if (!isOpen) {
        return null
    }

    return (
        <BindLogic
            logic={editActivityEventsWidgetModalLogic}
            props={{ onClose, config, onSave, name, defaultTitle, description }}
        >
            <EditActivityEventsWidgetModalContents />
        </BindLogic>
    )
}
