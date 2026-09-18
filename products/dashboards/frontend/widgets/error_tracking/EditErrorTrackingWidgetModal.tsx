import { BindLogic, useActions, useValues } from 'kea'

import { i18n } from 'lib/i18n/i18n'
import { LemonButton } from 'lib/lemon-ui/LemonButton'
import { LemonDivider } from 'lib/lemon-ui/LemonDivider'
import { LemonField } from 'lib/lemon-ui/LemonField/LemonField'
import { LemonInput } from 'lib/lemon-ui/LemonInput/LemonInput'
import { LemonModal } from 'lib/lemon-ui/LemonModal'
import { LemonSelect } from 'lib/lemon-ui/LemonSelect'

import { getDashboardWidgetGroupLabel } from '../../widget_types/catalog'
import { getWidgetListOrderDirectionOptions } from '../constants'
import { EditWidgetModalFiltersSubsection } from '../EditWidgetModalFiltersSection'
import { EditWidgetModalTileDetailsSection } from '../EditWidgetModalTileDetailsSection'
import type { DashboardWidgetEditModalProps } from '../registry'
import { editErrorTrackingWidgetModalLogic } from './editErrorTrackingWidgetModalLogic'
import { getErrorTrackingWidgetOrderByOptions } from './utils'

function EditErrorTrackingWidgetModalContents(): JSX.Element {
    const {
        showIssueSettings,
        limit,
        orderBy,
        orderDirection,
        tileName,
        tileDescription,
        filterTestAccounts,
        activeFieldErrors,
        saving,
        saveDisabledReason,
        onClose,
        defaultTitle,
    } = useValues(editErrorTrackingWidgetModalLogic)
    const {
        setLimit,
        setOrderBy,
        setOrderDirection,
        setTileName,
        setTileDescription,
        setFilterTestAccounts,
        clearFieldError,
        submit,
    } = useActions(editErrorTrackingWidgetModalLogic)

    const showTileDetails = true

    return (
        <LemonModal
            isOpen
            onClose={onClose}
            title={i18n.t('dashboardWidgets.editModal.title', { defaultValue: 'Widget settings' })}
            description={
                showIssueSettings
                    ? i18n.t('dashboardWidgets.errorTracking.edit.description', {
                          defaultValue:
                              'Configure tile details and which error tracking issues appear on this dashboard.',
                      })
                    : i18n.t('dashboardWidgets.errorTracking.edit.descriptionNoIssues', {
                          defaultValue: 'Configure tile details for this dashboard widget.',
                      })
            }
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
                {showTileDetails ? (
                    <EditWidgetModalTileDetailsSection
                        tileName={tileName}
                        tileDescription={tileDescription}
                        defaultTitle={defaultTitle}
                        saving={saving}
                        setTileName={setTileName}
                        setTileDescription={setTileDescription}
                    />
                ) : null}
                {showIssueSettings ? (
                    <>
                        {showTileDetails ? <LemonDivider className="my-0" /> : null}
                        <section className="flex flex-col gap-3">
                            <h5 className="text-sm font-semibold m-0">
                                {getDashboardWidgetGroupLabel('error_tracking')}
                            </h5>
                            <div className="flex flex-col gap-4">
                                <EditWidgetModalFiltersSubsection
                                    title={i18n.t('dashboardWidgets.errorTracking.edit.issueFilters', {
                                        defaultValue: 'Issue filters',
                                    })}
                                    filterTestAccounts={filterTestAccounts}
                                    saving={saving}
                                    setFilterTestAccounts={setFilterTestAccounts}
                                >
                                    <p className="text-sm text-muted m-0 sm:col-span-2">
                                        {i18n.t('dashboardWidgets.errorTracking.edit.filtersHint', {
                                            defaultValue:
                                                'Date range, status, and assignee are on the tile filter bar (collapsible on the tile). Use this modal for test-account filtering, list size, and sort.',
                                        })}
                                    </p>
                                    <LemonField.Pure
                                        label={i18n.t('dashboardWidgets.errorTracking.edit.numberOfIssues', {
                                            defaultValue: 'Number of issues',
                                        })}
                                        help={i18n.t('dashboardWidgets.errorTracking.edit.numberOfIssuesHelp', {
                                            defaultValue: 'Show up to 25 issues on the tile.',
                                        })}
                                        error={activeFieldErrors.limit}
                                    >
                                        <LemonInput
                                            type="number"
                                            min={1}
                                            max={25}
                                            fullWidth
                                            value={limit}
                                            onChange={(value) => {
                                                setLimit(Number(value))
                                                clearFieldError('limit')
                                            }}
                                        />
                                    </LemonField.Pure>
                                </EditWidgetModalFiltersSubsection>
                                <div className="flex flex-col gap-3">
                                    <h6 className="text-xs font-semibold text-muted m-0">
                                        {i18n.t('dashboardWidgets.editModal.sorting', { defaultValue: 'Sorting' })}
                                    </h6>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <LemonField.Pure
                                            label={i18n.t('dashboardWidgets.editModal.sortDirection', {
                                                defaultValue: 'Sort direction',
                                            })}
                                            help={i18n.t('dashboardWidgets.editModal.sortDirectionHelp', {
                                                defaultValue: 'Ascending or descending sort.',
                                            })}
                                        >
                                            <LemonSelect
                                                fullWidth
                                                value={orderDirection}
                                                onChange={(value) => setOrderDirection(value)}
                                                options={getWidgetListOrderDirectionOptions()}
                                            />
                                        </LemonField.Pure>
                                        <LemonField.Pure
                                            label={i18n.t('dashboardWidgets.editModal.sortBy', {
                                                defaultValue: 'Sort by',
                                            })}
                                            help={i18n.t('dashboardWidgets.errorTracking.edit.sortByHelp', {
                                                defaultValue: 'Order issues by this metric within the date range.',
                                            })}
                                            error={activeFieldErrors.orderBy}
                                        >
                                            <LemonSelect
                                                fullWidth
                                                value={orderBy}
                                                onChange={(value) => {
                                                    setOrderBy(value)
                                                    clearFieldError('orderBy')
                                                }}
                                                options={getErrorTrackingWidgetOrderByOptions()}
                                            />
                                        </LemonField.Pure>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </>
                ) : null}
            </div>
        </LemonModal>
    )
}

export function EditErrorTrackingWidgetModal({
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
            logic={editErrorTrackingWidgetModalLogic}
            props={{ onClose, config, onSave, name, defaultTitle, description }}
        >
            <EditErrorTrackingWidgetModalContents />
        </BindLogic>
    )
}
