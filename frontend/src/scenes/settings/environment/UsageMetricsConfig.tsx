import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'
import { Trans, useTranslation } from 'react-i18next'

import { IconEllipsis, IconPlusSmall } from '@posthog/icons'
import {
    LemonButton,
    LemonDialog,
    LemonInput,
    LemonLabel,
    LemonMenu,
    LemonModal,
    LemonSelect,
    LemonTable,
    LemonTableColumns,
} from '@posthog/lemon-ui'

import { PropertyFilters } from 'lib/components/PropertyFilters/PropertyFilters'
import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TaxonomicFilterGroupType } from 'lib/components/TaxonomicFilter/types'
import { TaxonomicStringPopover } from 'lib/components/TaxonomicPopover/TaxonomicPopover'
import { TestAccountFilterSwitch } from 'lib/components/TestAccountFiltersSwitch'
import { TeamMembershipLevel } from 'lib/constants'
import { useOnMountEffect } from 'lib/hooks/useOnMountEffect'
import { groupsAccessLogic } from 'lib/introductions/groupsAccessLogic'
import { LemonField } from 'lib/lemon-ui/LemonField'
import { eventUsageLogic } from 'lib/utils/eventUsageLogic'
import { ActionFilter } from 'scenes/insights/filters/ActionFilter/ActionFilter'
import { MathAvailability } from 'scenes/insights/filters/ActionFilter/ActionFilterRow/types'

import { AnyPropertyFilter, EntityTypes, FilterType } from '~/types'

import type { GroupUsageMetricApi } from 'products/customer_analytics/frontend/generated/api.schemas'

import {
    UsageMetricFiltersDataWarehouse,
    UsageMetricFormData,
    actionFilterValueToSavedFilters,
    getMetricSource,
    savedFiltersToActionFilterValue,
    usageMetricsConfigLogic,
} from './usageMetricsConfigLogic'

function UsageMetricsTable(): JSX.Element {
    const { t } = useTranslation()
    const { usageMetrics, usageMetricsLoading } = useValues(usageMetricsConfigLogic)
    const { removeUsageMetric, openModal, setUsageMetricValues } = useActions(usageMetricsConfigLogic)
    const { reportUsageMetricsUpdateButtonClicked } = useActions(eventUsageLogic)
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    const columns: LemonTableColumns<GroupUsageMetricApi> = [
        {
            title: t('settings.environment.usageMetrics.columns.name', { defaultValue: 'Name' }),
            key: 'name',
            dataIndex: 'name',
        },
        {
            title: t('settings.environment.usageMetrics.columns.format', { defaultValue: 'Format' }),
            key: 'format',
            dataIndex: 'format',
        },
        {
            title: t('settings.environment.usageMetrics.columns.interval', { defaultValue: 'Interval' }),
            key: 'interval',
            dataIndex: 'interval',
        },
        {
            title: t('settings.environment.usageMetrics.columns.display', { defaultValue: 'Display' }),
            key: 'display',
            render: function Render(_, metric) {
                return metric.display === 'sparkline'
                    ? t('settings.environment.usageMetrics.display.sparkline', { defaultValue: 'Sparkline' })
                    : t('settings.environment.usageMetrics.display.number', { defaultValue: 'Number' })
            },
        },
        {
            title: t('settings.environment.usageMetrics.columns.source', { defaultValue: 'Source' }),
            key: 'source',
            render: function Render(_, metric) {
                const source = getMetricSource(metric.filters as UsageMetricFormData['filters'])
                if (source === 'data_warehouse') {
                    const dwFilters = metric.filters as UsageMetricFiltersDataWarehouse
                    return t('settings.environment.usageMetrics.source.warehouseTable', {
                        defaultValue: 'Warehouse · {{ table }}',
                        table:
                            dwFilters?.table_name ??
                            t('settings.environment.usageMetrics.source.unknownTable', {
                                defaultValue: '(unknown table)',
                            }),
                    })
                }
                return t('settings.environment.usageMetrics.source.events', { defaultValue: 'Events' })
            },
        },
        {
            title: t('settings.environment.usageMetrics.columns.calculation', { defaultValue: 'Calculation' }),
            key: 'math',
            render: function Render(_, metric) {
                if (metric.math === 'sum') {
                    return t('settings.environment.usageMetrics.calculation.sumOf', {
                        defaultValue: 'Sum of {{ property }}',
                        property:
                            metric.math_property ??
                            t('settings.environment.usageMetrics.calculation.unknownProperty', {
                                defaultValue: '(unknown)',
                            }),
                    })
                }
                return t('settings.environment.usageMetrics.calculation.count', { defaultValue: 'Count' })
            },
        },
        {
            title: '',
            key: 'actions',
            width: 24,
            render: function Render(_, metric) {
                return (
                    <LemonMenu
                        items={[
                            {
                                label: t('settings.environment.usageMetrics.edit', { defaultValue: 'Edit' }),
                                onClick: () => {
                                    openModal()
                                    setUsageMetricValues({ ...metric, filters: (metric.filters ?? {}) as FilterType })
                                    reportUsageMetricsUpdateButtonClicked()
                                },
                                disabledReason: restrictedReason,
                            },
                            {
                                label: t('settings.environment.usageMetrics.delete', { defaultValue: 'Delete' }),
                                status: 'danger',
                                onClick: () => {
                                    LemonDialog.open({
                                        title: t('settings.environment.usageMetrics.deleteDialog.title', {
                                            defaultValue: 'Delete usage metric',
                                        }),
                                        description: t('settings.environment.usageMetrics.deleteDialog.description', {
                                            defaultValue:
                                                'Are you sure you want to delete "{{ name }}"? This action cannot be undone.',
                                            name: metric.name,
                                        }),
                                        primaryButton: {
                                            children: t('settings.environment.usageMetrics.delete', {
                                                defaultValue: 'Delete',
                                            }),
                                            status: 'danger',
                                            onClick: () => {
                                                removeUsageMetric(metric.id)
                                            },
                                            disabledReason: restrictedReason,
                                        },
                                        secondaryButton: {
                                            children: t('settings.cancel', { defaultValue: 'Cancel' }),
                                        },
                                    })
                                },
                                disabledReason: restrictedReason,
                            },
                        ]}
                    >
                        <LemonButton size="small" icon={<IconEllipsis />} />
                    </LemonMenu>
                )
            },
        },
    ]

    return <LemonTable columns={columns} dataSource={usageMetrics} loading={usageMetricsLoading} />
}

function UsageMetricsForm(): JSX.Element {
    const { t } = useTranslation()
    const { usageMetric } = useValues(usageMetricsConfigLogic)
    const { setUsageMetricValue } = useActions(usageMetricsConfigLogic)
    const taxonomicGroupTypes = [
        TaxonomicFilterGroupType.EventProperties,
        TaxonomicFilterGroupType.EventMetadata,
        TaxonomicFilterGroupType.HogQLExpression,
    ]
    const source = getMetricSource(usageMetric.filters)

    return (
        <Form id="usageMetric" logic={usageMetricsConfigLogic} formKey="usageMetric" enableFormOnSubmit>
            <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                    <LemonField
                        name="name"
                        label={t('settings.environment.usageMetrics.fields.name', { defaultValue: 'Name' })}
                    >
                        <LemonInput
                            placeholder={t('settings.environment.usageMetrics.fields.namePlaceholder', {
                                defaultValue: 'Events',
                            })}
                        />
                    </LemonField>

                    <LemonField
                        name="interval"
                        label={t('settings.environment.usageMetrics.fields.interval', { defaultValue: 'Interval' })}
                    >
                        <LemonSelect
                            options={[
                                {
                                    value: 7,
                                    label: t('settings.environment.usageMetrics.intervals.days7', {
                                        defaultValue: '7d',
                                    }),
                                },
                                {
                                    value: 30,
                                    label: t('settings.environment.usageMetrics.intervals.days30', {
                                        defaultValue: '30d',
                                    }),
                                },
                                {
                                    value: 90,
                                    label: t('settings.environment.usageMetrics.intervals.days90', {
                                        defaultValue: '90d',
                                    }),
                                },
                            ]}
                        />
                    </LemonField>

                    <LemonField
                        name="format"
                        label={t('settings.environment.usageMetrics.fields.format', { defaultValue: 'Format' })}
                    >
                        <LemonSelect
                            options={[
                                {
                                    value: 'currency',
                                    label: t('settings.environment.usageMetrics.format.currency', {
                                        defaultValue: 'Currency',
                                    }),
                                },
                                {
                                    value: 'numeric',
                                    label: t('settings.environment.usageMetrics.format.numeric', {
                                        defaultValue: 'Numeric',
                                    }),
                                },
                            ]}
                        />
                    </LemonField>

                    <LemonField
                        name="display"
                        label={t('settings.environment.usageMetrics.fields.display', { defaultValue: 'Display' })}
                    >
                        <LemonSelect
                            options={[
                                {
                                    value: 'number',
                                    label: t('settings.environment.usageMetrics.display.number', {
                                        defaultValue: 'Number',
                                    }),
                                },
                                {
                                    value: 'sparkline',
                                    label: t('settings.environment.usageMetrics.display.sparkline', {
                                        defaultValue: 'Sparkline',
                                    }),
                                },
                            ]}
                        />
                    </LemonField>

                    <LemonField
                        name="math"
                        label={t('settings.environment.usageMetrics.fields.calculation', {
                            defaultValue: 'Calculation',
                        })}
                    >
                        {({ value, onChange }) => (
                            <LemonSelect
                                value={value}
                                options={[
                                    {
                                        value: 'count',
                                        label:
                                            source === 'data_warehouse'
                                                ? t('settings.environment.usageMetrics.math.countRows', {
                                                      defaultValue: 'Count of rows',
                                                  })
                                                : t('settings.environment.usageMetrics.math.countEvents', {
                                                      defaultValue: 'Count of events',
                                                  }),
                                    },
                                    {
                                        value: 'sum',
                                        label:
                                            source === 'data_warehouse'
                                                ? t('settings.environment.usageMetrics.math.sumColumn', {
                                                      defaultValue: 'Sum of column',
                                                  })
                                                : t('settings.environment.usageMetrics.math.sumProperty', {
                                                      defaultValue: 'Sum of property',
                                                  }),
                                    },
                                ]}
                                onChange={(newValue) => {
                                    onChange(newValue)
                                    if (newValue === 'count') {
                                        setUsageMetricValue('math_property', null)
                                    }
                                }}
                            />
                        )}
                    </LemonField>

                    {usageMetric.math === 'sum' && (
                        <LemonField
                            name="math_property"
                            label={
                                source === 'data_warehouse'
                                    ? t('settings.environment.usageMetrics.math.columnToSum', {
                                          defaultValue: 'Column to sum',
                                      })
                                    : t('settings.environment.usageMetrics.math.propertyToSum', {
                                          defaultValue: 'Property to sum',
                                      })
                            }
                        >
                            {({ value, onChange }) =>
                                source === 'data_warehouse' ? (
                                    <LemonInput
                                        value={value ?? ''}
                                        onChange={(newValue) => onChange(newValue || null)}
                                        placeholder={t('settings.environment.usageMetrics.math.amountPlaceholder', {
                                            defaultValue: 'amount',
                                        })}
                                        data-attr="usage-metric-math-property"
                                    />
                                ) : (
                                    <TaxonomicStringPopover
                                        groupType={TaxonomicFilterGroupType.NumericalEventProperties}
                                        value={value}
                                        onChange={onChange}
                                        placeholder={t('settings.environment.usageMetrics.math.selectProperty', {
                                            defaultValue: 'Select property',
                                        })}
                                        data-attr="usage-metric-math-property"
                                        selectingKeyOnly
                                    />
                                )
                            }
                        </LemonField>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-2">
                    <LemonField
                        name="filters"
                        label={t('settings.environment.usageMetrics.filters.label', {
                            defaultValue: 'Match events or data warehouse table',
                        })}
                        help={
                            source === 'data_warehouse'
                                ? t('settings.environment.usageMetrics.filters.dataWarehouseHelp', {
                                      defaultValue:
                                          'Data warehouse metrics are limited to a single table and currently only render on group profiles.',
                                  })
                                : t('settings.environment.usageMetrics.filters.eventsHelp', {
                                      defaultValue:
                                          'Pick events to match, or switch to a data warehouse table. Only one source can be active per metric.',
                                  })
                        }
                    >
                        {({ value, onChange }) => {
                            const actionFilterValue = savedFiltersToActionFilterValue(value)
                            return (
                                <>
                                    <ActionFilter
                                        bordered
                                        filters={actionFilterValue}
                                        setFilters={(payload) => {
                                            onChange(actionFilterValueToSavedFilters(payload, source))
                                        }}
                                        typeKey="usage-metric-filters"
                                        mathAvailability={MathAvailability.None}
                                        hideRename
                                        hideDuplicate
                                        showNestedArrow={false}
                                        entitiesLimit={source === 'data_warehouse' ? 1 : undefined}
                                        actionsTaxonomicGroupTypes={[
                                            TaxonomicFilterGroupType.Events,
                                            TaxonomicFilterGroupType.DataWarehouse,
                                        ]}
                                        propertiesTaxonomicGroupTypes={taxonomicGroupTypes}
                                        propertyFiltersPopover
                                        dataWarehousePopoverFields={[
                                            {
                                                key: 'timestamp_field',
                                                label: t('settings.environment.usageMetrics.filters.timestampColumn', {
                                                    defaultValue: 'Timestamp column',
                                                }),
                                                allowHogQL: true,
                                            },
                                            {
                                                key: 'key_field',
                                                label: t('settings.environment.usageMetrics.filters.groupKeyColumn', {
                                                    defaultValue: 'Group key column',
                                                }),
                                            },
                                        ]}
                                        addFilterDefaultOptions={{
                                            id: '$pageview',
                                            name: '$pageview',
                                            type: EntityTypes.EVENTS,
                                        }}
                                        buttonCopy={
                                            (actionFilterValue?.events ?? []).length > 0
                                                ? t('settings.environment.usageMetrics.filters.addEvent', {
                                                      defaultValue: 'Add event',
                                                  })
                                                : t('settings.environment.usageMetrics.filters.matchPrompt', {
                                                      defaultValue: 'Match event or data warehouse table',
                                                  })
                                        }
                                    />
                                    {source === 'events' && (
                                        <>
                                            <div className="flex gap-2 justify-between w-full">
                                                <LemonLabel>
                                                    {t(
                                                        'settings.environment.usageMetrics.filters.propertyFiltersLabel',
                                                        {
                                                            defaultValue: 'Filters',
                                                        }
                                                    )}
                                                </LemonLabel>
                                            </div>
                                            <PropertyFilters
                                                propertyFilters={
                                                    (actionFilterValue?.properties ?? []) as AnyPropertyFilter[]
                                                }
                                                taxonomicGroupTypes={taxonomicGroupTypes}
                                                onChange={(properties: AnyPropertyFilter[]) => {
                                                    onChange(
                                                        actionFilterValueToSavedFilters(
                                                            { ...actionFilterValue, properties },
                                                            source
                                                        )
                                                    )
                                                }}
                                                pageKey="UsageMetricsConfig"
                                            />
                                            <TestAccountFilterSwitch
                                                checked={actionFilterValue?.filter_test_accounts ?? false}
                                                onChange={(filter_test_accounts) => {
                                                    onChange(
                                                        actionFilterValueToSavedFilters(
                                                            { ...actionFilterValue, filter_test_accounts },
                                                            source
                                                        )
                                                    )
                                                }}
                                                fullWidth
                                            />
                                        </>
                                    )}
                                </>
                            )
                        }}
                    </LemonField>
                </div>
            </div>
        </Form>
    )
}

export function UsageMetricsConfig(): JSX.Element {
    const { t } = useTranslation()
    const { openModal } = useActions(usageMetricsConfigLogic)
    const { groupsEnabled } = useValues(groupsAccessLogic)
    const { reportUsageMetricsSettingsViewed } = useActions(eventUsageLogic)
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    useOnMountEffect(() => {
        reportUsageMetricsSettingsViewed()
    })

    return (
        <>
            <p>
                <Trans
                    i18nKey="settings.environment.usageMetrics.intro"
                    defaults="Define what usage means for your product based on one or more events."
                />
                <br />
                <Trans
                    i18nKey="settings.environment.usageMetrics.introPlacement"
                    values={{
                        surface: groupsEnabled
                            ? t('settings.environment.usageMetrics.surfaces.personAndGroup', {
                                  defaultValue: 'and group profiles',
                              })
                            : t('settings.environment.usageMetrics.surfaces.person', { defaultValue: 'profile' }),
                    }}
                    defaults="Usage metrics are displayed in the person {{ surface }}."
                />
            </p>
            <div className="flex flex-col gap-2 items-start">
                <LemonButton
                    type="primary"
                    size="small"
                    onClick={openModal}
                    icon={<IconPlusSmall />}
                    disabledReason={restrictedReason}
                >
                    {t('settings.environment.usageMetrics.add', { defaultValue: 'Add metric' })}
                </LemonButton>
                <UsageMetricsTable />
                <UsageMetricsModal />
            </div>
        </>
    )
}

export function UsageMetricsModal(): JSX.Element {
    const { t } = useTranslation()
    const { isModalOpen } = useValues(usageMetricsConfigLogic)
    const { closeModal } = useActions(usageMetricsConfigLogic)

    return (
        <LemonModal
            title={t('settings.environment.usageMetrics.modalTitle', { defaultValue: 'Add usage metric' })}
            isOpen={isModalOpen}
            onClose={closeModal}
            children={<UsageMetricsForm />}
            footer={
                <>
                    <LemonButton
                        htmlType="submit"
                        form="usageMetric"
                        type="primary"
                        children={t('settings.save', { defaultValue: 'Save' })}
                        data-attr="create-usage-metric"
                    />
                    <LemonButton
                        children={t('settings.cancel', { defaultValue: 'Cancel' })}
                        onClick={closeModal}
                        data-attr="cancel-create-usage-metric"
                    />
                </>
            }
        />
    )
}
