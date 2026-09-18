import { BindLogic, useActions, useValues } from 'kea'

import { i18n } from 'lib/i18n/i18n'
import { LemonButton } from 'lib/lemon-ui/LemonButton'
import { LemonDivider } from 'lib/lemon-ui/LemonDivider'
import { LemonField } from 'lib/lemon-ui/LemonField/LemonField'
import { LemonInput } from 'lib/lemon-ui/LemonInput/LemonInput'
import { LemonModal } from 'lib/lemon-ui/LemonModal'
import { LemonSelect } from 'lib/lemon-ui/LemonSelect'
import { LemonSwitch } from 'lib/lemon-ui/LemonSwitch'

import { getDashboardWidgetGroupLabel } from '../../widget_types/catalog'
import { WIDGET_DATE_RANGE_SELECT_OPTIONS, type WidgetDateFromValue } from '../../widget_types/widgetConfigShared'
import { EditWidgetModalTileDetailsSection } from '../EditWidgetModalTileDetailsSection'
import type { DashboardWidgetEditModalProps } from '../registry'
import { editLogsWidgetModalLogic } from './editLogsWidgetModalLogic'
import type { LogsTimezone } from './logsWidgetConfigValidation'

function getTimezoneOptions(): { value: LogsTimezone; label: string }[] {
    return [
        { value: 'UTC', label: 'UTC' },
        { value: 'local', label: i18n.t('dashboardWidgets.logs.edit.timezoneLocal', { defaultValue: 'Local time' }) },
    ]
}

function EditLogsWidgetModalContents(): JSX.Element {
    const {
        limit,
        wrapLines,
        timezone,
        dateFrom,
        tileName,
        tileDescription,
        activeFieldErrors,
        saving,
        saveDisabledReason,
        onClose,
        defaultTitle,
    } = useValues(editLogsWidgetModalLogic)
    const {
        setLimit,
        setWrapLines,
        setTimezone,
        setDateFrom,
        setTileName,
        setTileDescription,
        clearFieldError,
        submit,
    } = useActions(editLogsWidgetModalLogic)

    return (
        <LemonModal
            isOpen
            onClose={onClose}
            title={i18n.t('dashboardWidgets.editModal.title', { defaultValue: 'Widget settings' })}
            description={i18n.t('dashboardWidgets.logs.edit.description', {
                defaultValue: 'Configure tile details and which logs appear on this dashboard.',
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
                    <h5 className="text-sm font-semibold m-0">{getDashboardWidgetGroupLabel('logs')}</h5>
                    <p className="text-sm text-muted m-0">
                        {i18n.t('dashboardWidgets.logs.edit.severityHint', {
                            defaultValue:
                                'Severity, service, and sort filters live on the tile filter bar. Use this modal for the date range and how many log lines to show.',
                        })}
                    </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <LemonField.Pure
                            label={i18n.t('dashboard.tileFilters.dateRange', { defaultValue: 'Date range' })}
                        >
                            <LemonSelect
                                value={dateFrom as WidgetDateFromValue}
                                disabled={saving}
                                options={WIDGET_DATE_RANGE_SELECT_OPTIONS}
                                onChange={(value) => {
                                    if (value) {
                                        setDateFrom(value)
                                    }
                                }}
                                fullWidth
                            />
                        </LemonField.Pure>
                        <LemonField.Pure
                            label={i18n.t('dashboardWidgets.logs.edit.numberOfLines', {
                                defaultValue: 'Number of log lines',
                            })}
                            help={i18n.t('dashboardWidgets.logs.edit.numberOfLinesHelp', {
                                defaultValue: 'Show up to 100 log lines on the tile.',
                            })}
                            error={activeFieldErrors.limit}
                        >
                            <LemonInput
                                type="number"
                                min={1}
                                max={100}
                                fullWidth
                                value={limit}
                                onChange={(value) => {
                                    setLimit(Number(value))
                                    clearFieldError('limit')
                                }}
                            />
                        </LemonField.Pure>
                        <LemonField.Pure
                            label={i18n.t('dashboardWidgets.logs.edit.timestamps', { defaultValue: 'Timestamps' })}
                            help={i18n.t('dashboardWidgets.logs.edit.timestampsHelp', {
                                defaultValue: 'Display log times in UTC or your local timezone.',
                            })}
                        >
                            <LemonSelect
                                value={timezone}
                                disabled={saving}
                                options={getTimezoneOptions()}
                                onChange={(value) => {
                                    if (value) {
                                        setTimezone(value)
                                    }
                                }}
                                fullWidth
                            />
                        </LemonField.Pure>
                    </div>
                    <LemonSwitch
                        checked={wrapLines}
                        onChange={setWrapLines}
                        disabled={saving}
                        label={i18n.t('dashboardWidgets.logs.edit.wrapLongLines', {
                            defaultValue: 'Wrap long log lines',
                        })}
                        bordered
                    />
                </section>
            </div>
        </LemonModal>
    )
}

export function EditLogsWidgetModal({
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
            logic={editLogsWidgetModalLogic}
            props={{ onClose, config, onSave, name, defaultTitle, description }}
        >
            <EditLogsWidgetModalContents />
        </BindLogic>
    )
}
