import { useActions, useValues } from 'kea'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { IconPencil, IconPlusSmall, IconTrash } from '@posthog/icons'
import { LemonButton, LemonInput, LemonLabel, LemonModal, LemonSelect, LemonTextArea } from '@posthog/lemon-ui'

import { TaxonomicFilterGroupType } from 'lib/components/TaxonomicFilter/types'
import { i18n } from 'lib/i18n/i18n'
import { LemonTable } from 'lib/lemon-ui/LemonTable'
import { uuid } from 'lib/utils/dom'
import { ActionFilter as ActionFilterComponent } from 'scenes/insights/filters/ActionFilter/ActionFilter'
import { MathAvailability } from 'scenes/insights/filters/ActionFilter/ActionFilterRow/types'

import { actionsAndEventsToSeries } from '~/queries/nodes/InsightQuery/utils/filtersToQueryNode'
import {
    ActionsNode,
    CoreEvent,
    CoreEventCategory,
    DataWarehouseNode,
    EventsNode,
    NodeKind,
} from '~/queries/schema/schema-general'
import {
    ActionFilter,
    BaseMathType,
    AnyDataWarehouseFilter,
    FilterType,
    GroupMathType,
    PropertyMathType,
} from '~/types'

import { coreEventsLogic } from './coreEventsLogic'

// Only allow: total count, unique users/groups, and property sum
const ALLOWED_MATH_TYPES = [
    BaseMathType.TotalCount,
    BaseMathType.UniqueUsers,
    GroupMathType.UniqueGroup,
    PropertyMathType.Sum,
] as const

const CATEGORY_OPTIONS = [
    {
        value: CoreEventCategory.Acquisition,
        get label() {
            return i18n.t('settings.environment.coreEvents.categories.acquisition.label', {
                defaultValue: 'Acquisition',
            })
        },
        get description() {
            return i18n.t('settings.environment.coreEvents.categories.acquisition.description', {
                defaultValue: 'Sign up, app install',
            })
        },
    },
    {
        value: CoreEventCategory.Activation,
        get label() {
            return i18n.t('settings.environment.coreEvents.categories.activation.label', {
                defaultValue: 'Activation',
            })
        },
        get description() {
            return i18n.t('settings.environment.coreEvents.categories.activation.description', {
                defaultValue: 'Onboarding, first core action',
            })
        },
    },
    {
        value: CoreEventCategory.Monetization,
        get label() {
            return i18n.t('settings.environment.coreEvents.categories.monetization.label', {
                defaultValue: 'Monetization',
            })
        },
        get description() {
            return i18n.t('settings.environment.coreEvents.categories.monetization.description', {
                defaultValue: 'Purchase, subscription started',
            })
        },
    },
    {
        value: CoreEventCategory.Expansion,
        get label() {
            return i18n.t('settings.environment.coreEvents.categories.expansion.label', {
                defaultValue: 'Expansion',
            })
        },
        get description() {
            return i18n.t('settings.environment.coreEvents.categories.expansion.description', {
                defaultValue: 'Plan upgraded',
            })
        },
    },
    {
        value: CoreEventCategory.Referral,
        get label() {
            return i18n.t('settings.environment.coreEvents.categories.referral.label', {
                defaultValue: 'Referral',
            })
        },
        get description() {
            return i18n.t('settings.environment.coreEvents.categories.referral.description', {
                defaultValue: 'Invite sent',
            })
        },
    },
    {
        value: CoreEventCategory.Retention,
        get label() {
            return i18n.t('settings.environment.coreEvents.categories.retention.label', {
                defaultValue: 'Retention',
            })
        },
        get description() {
            return i18n.t('settings.environment.coreEvents.categories.retention.description', {
                defaultValue: 'Repeat purchase',
            })
        },
    },
    {
        value: CoreEventCategory.Churn,
        get label() {
            return i18n.t('settings.environment.coreEvents.categories.churn.label', { defaultValue: 'Churn' })
        },
        get description() {
            return i18n.t('settings.environment.coreEvents.categories.churn.description', {
                defaultValue: 'Subscription canceled',
            })
        },
    },
    {
        value: CoreEventCategory.Reactivation,
        get label() {
            return i18n.t('settings.environment.coreEvents.categories.reactivation.label', {
                defaultValue: 'Reactivation',
            })
        },
        get description() {
            return i18n.t('settings.environment.coreEvents.categories.reactivation.description', {
                defaultValue: 'Returned after churn',
            })
        },
    },
]

function getFilterTypeLabel(filter: EventsNode | ActionsNode | DataWarehouseNode): string {
    switch (filter.kind) {
        case NodeKind.EventsNode:
            return i18n.t('settings.environment.coreEvents.filterTypes.event', { defaultValue: 'Event' })
        case NodeKind.ActionsNode:
            return i18n.t('settings.environment.coreEvents.filterTypes.action', { defaultValue: 'Action' })
        case NodeKind.DataWarehouseNode:
            return i18n.t('settings.environment.coreEvents.filterTypes.dataWarehouse', {
                defaultValue: 'Data warehouse',
            })
        default:
            return i18n.t('settings.environment.coreEvents.filterTypes.unknown', { defaultValue: 'Unknown' })
    }
}

function getFilterSummary(filter: EventsNode | ActionsNode | DataWarehouseNode): string {
    switch (filter.kind) {
        case NodeKind.EventsNode:
            return filter.event || i18n.t('settings.environment.coreEvents.allEvents', { defaultValue: 'All events' })
        case NodeKind.ActionsNode:
            return (
                filter.name ||
                i18n.t('settings.environment.coreEvents.actionNumber', {
                    defaultValue: 'Action #{{ id }}',
                    id: filter.id,
                })
            )
        case NodeKind.DataWarehouseNode:
            return (
                filter.table_name ||
                i18n.t('settings.environment.coreEvents.unknownTable', { defaultValue: 'Unknown table' })
            )
        default:
            return i18n.t('settings.environment.coreEvents.filterTypes.unknown', { defaultValue: 'Unknown' })
    }
}

// Convert ActionFilter format to our filter node format
function actionFilterToNode(filters: FilterType): EventsNode | ActionsNode | DataWarehouseNode | null {
    const series = actionsAndEventsToSeries(
        {
            actions: filters.actions as ActionFilter[] | undefined,
            events: filters.events as ActionFilter[] | undefined,
            data_warehouse: filters.data_warehouse as AnyDataWarehouseFilter[] | undefined,
        },
        true,
        MathAvailability.All
    )

    if (series.length > 0) {
        return series[0] as EventsNode | ActionsNode | DataWarehouseNode
    }
    return null
}

// Convert our filter node to ActionFilter format for the picker
function nodeToActionFilter(filter: EventsNode | ActionsNode | DataWarehouseNode | null): Partial<FilterType> {
    if (!filter) {
        return { events: [], actions: [], data_warehouse: [] }
    }

    switch (filter.kind) {
        case NodeKind.EventsNode:
            return {
                events: [
                    {
                        id: filter.event || null,
                        name: filter.name,
                        type: 'events',
                        math: filter.math || BaseMathType.TotalCount,
                        math_property: filter.math_property,
                        properties: filter.properties,
                    } as ActionFilter,
                ],
                actions: [],
                data_warehouse: [],
            }
        case NodeKind.ActionsNode:
            return {
                events: [],
                actions: [
                    {
                        id: filter.id,
                        name: filter.name,
                        type: 'actions',
                        math: filter.math || BaseMathType.TotalCount,
                        math_property: filter.math_property,
                        properties: filter.properties,
                    } as ActionFilter,
                ],
                data_warehouse: [],
            }
        case NodeKind.DataWarehouseNode:
            return {
                events: [],
                actions: [],
                data_warehouse: [
                    {
                        id: filter.table_name,
                        name: filter.name || filter.table_name,
                        type: 'data_warehouse',
                        math: filter.math || BaseMathType.TotalCount,
                        math_property: filter.math_property,
                        id_field: filter.id_field,
                        timestamp_field: filter.timestamp_field,
                        distinct_id_field: filter.distinct_id_field,
                    } as ActionFilter,
                ],
            }
        default:
            return { events: [], actions: [], data_warehouse: [] }
    }
}

const defaultFilter: EventsNode = {
    kind: NodeKind.EventsNode,
    get event() {
        return i18n.t('settings.environment.coreEvents.selectPlaceholder', {
            defaultValue: 'Please select an event, action, or data warehouse table',
        })
    },
}

interface FormState {
    id: string | null // null for new, string for editing
    name: string
    description: string
    category: CoreEventCategory | null
    filter: EventsNode | ActionsNode | DataWarehouseNode
}

const createEmptyFormState = (): FormState => ({
    id: null,
    name: '',
    description: '',
    category: null,
    filter: defaultFilter,
})

const eventToFormState = (event: CoreEvent): FormState => ({
    id: event.id,
    name: event.name,
    description: event.description || '',
    category: event.category,
    filter: event.filter,
})

export function CoreEventsSettings(): JSX.Element {
    const { t } = useTranslation()
    const { coreEvents } = useValues(coreEventsLogic)
    const { addCoreEvent, updateCoreEvent, removeCoreEvent } = useActions(coreEventsLogic)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [formState, setFormState] = useState<FormState>(createEmptyFormState)

    const isEditing = formState.id !== null

    const handleOpenNewModal = (): void => {
        setFormState(createEmptyFormState())
        setIsModalOpen(true)
    }

    const handleOpenEditModal = (event: CoreEvent): void => {
        setFormState(eventToFormState(event))
        setIsModalOpen(true)
    }

    const handleCloseModal = (): void => {
        setIsModalOpen(false)
        setFormState(createEmptyFormState())
    }

    const handleFilterChange = (filters: Partial<FilterType>): void => {
        const node = actionFilterToNode(filters as FilterType)
        if (node) {
            setFormState((prev) => ({
                ...prev,
                filter: node,
                // Auto-fill name from event/action name if not already set
                name: prev.name || node.name || (node.kind === NodeKind.EventsNode ? node.event : '') || '',
            }))
        }
    }

    const handleSave = (): void => {
        if (!formState.name.trim() || !formState.category) {
            return
        }

        const event: CoreEvent = {
            id: formState.id || uuid(),
            name: formState.name.trim(),
            description: formState.description.trim() || undefined,
            category: formState.category,
            filter: formState.filter,
        }

        if (isEditing) {
            updateCoreEvent(event)
        } else {
            addCoreEvent(event)
        }
        handleCloseModal()
    }

    const getDisabledReason = (): string | undefined => {
        if (!formState.name.trim()) {
            return t('settings.environment.coreEvents.nameRequired', {
                defaultValue: 'Please enter a name for this core event',
            })
        }
        const hasValidFilter =
            (formState.filter.kind === NodeKind.EventsNode &&
                formState.filter.event != defaultFilter.event &&
                formState.filter.kind === NodeKind.EventsNode &&
                formState.filter.event) ||
            (formState.filter.kind === NodeKind.ActionsNode && formState.filter.id !== undefined) ||
            (formState.filter.kind === NodeKind.DataWarehouseNode && formState.filter.table_name)

        if (!hasValidFilter) {
            return t('settings.environment.coreEvents.selectPlaceholder', {
                defaultValue: 'Please select an event, action, or data warehouse table',
            })
        }
        if (!formState.category) {
            return t('settings.environment.coreEvents.categoryRequired', {
                defaultValue: 'Please select a category',
            })
        }
        return undefined
    }

    const disabledReason = getDisabledReason()

    // Build filter for ActionFilterComponent
    const currentFilter = nodeToActionFilter(formState.filter)

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-bold">
                    {coreEvents.length === 0
                        ? t('settings.environment.coreEvents.emptyHeading', {
                              defaultValue: 'No core events configured',
                          })
                        : t('settings.environment.coreEvents.heading', {
                              count: coreEvents.length,
                              defaultValue_one: '{{ count }} core event',
                              defaultValue_other: '{{ count }} core events',
                          })}
                </h3>
                <LemonButton type="primary" icon={<IconPlusSmall />} onClick={handleOpenNewModal}>
                    {t('settings.environment.coreEvents.add', { defaultValue: 'Add core event' })}
                </LemonButton>
            </div>

            <LemonTable
                rowKey={(item) => item.id}
                dataSource={coreEvents}
                columns={[
                    {
                        key: 'name',
                        title: t('settings.environment.coreEvents.columns.name', { defaultValue: 'Name' }),
                        render: (_, event: CoreEvent) => <span className="font-medium">{event.name}</span>,
                    },
                    {
                        key: 'type',
                        title: t('settings.environment.coreEvents.columns.type', { defaultValue: 'Type' }),
                        render: (_, event: CoreEvent) => getFilterTypeLabel(event.filter),
                    },
                    {
                        key: 'filter',
                        title: t('settings.environment.coreEvents.columns.filter', { defaultValue: 'Filter' }),
                        render: (_, event: CoreEvent) => (
                            <span className="text-muted">{getFilterSummary(event.filter)}</span>
                        ),
                    },
                    {
                        key: 'category',
                        title: t('settings.environment.coreEvents.columns.category', { defaultValue: 'Category' }),
                        render: (_, event: CoreEvent) =>
                            event.category
                                ? CATEGORY_OPTIONS.find((o) => o.value === event.category)?.label || event.category
                                : '-',
                    },
                    {
                        key: 'actions',
                        title: t('settings.environment.coreEvents.columns.actions', { defaultValue: 'Actions' }),
                        width: 100,
                        render: (_, event: CoreEvent) => (
                            <div className="flex gap-1">
                                <LemonButton
                                    icon={<IconPencil />}
                                    size="small"
                                    onClick={() => handleOpenEditModal(event)}
                                    tooltip={t('settings.environment.coreEvents.edit', { defaultValue: 'Edit' })}
                                />
                                <LemonButton
                                    icon={<IconTrash />}
                                    size="small"
                                    status="danger"
                                    onClick={() => removeCoreEvent(event.id)}
                                    tooltip={t('settings.environment.coreEvents.remove', { defaultValue: 'Remove' })}
                                />
                            </div>
                        ),
                    },
                ]}
                emptyState={t('settings.environment.coreEvents.emptyState', {
                    defaultValue: 'No core events configured yet. Add your first core event above.',
                })}
            />

            <LemonModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={
                    isEditing
                        ? t('settings.environment.coreEvents.editTitle', { defaultValue: 'Edit core event' })
                        : t('settings.environment.coreEvents.addTitle', { defaultValue: 'Add core event' })
                }
                width="40rem"
                footer={
                    <>
                        <LemonButton onClick={handleCloseModal}>
                            {t('settings.cancel', { defaultValue: 'Cancel' })}
                        </LemonButton>
                        <LemonButton type="primary" onClick={handleSave} disabledReason={disabledReason}>
                            {isEditing
                                ? t('settings.environment.coreEvents.update', { defaultValue: 'Update' })
                                : t('settings.environment.coreEvents.create', { defaultValue: 'Add' })}
                        </LemonButton>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="space-y-1">
                        <LemonLabel>
                            {t('settings.environment.coreEvents.columns.name', { defaultValue: 'Name' })}
                        </LemonLabel>
                        <LemonInput
                            value={formState.name}
                            onChange={(value) => setFormState((prev) => ({ ...prev, name: value }))}
                            placeholder={t('settings.environment.coreEvents.namePlaceholder', {
                                defaultValue: 'e.g., Purchase, Sign up',
                            })}
                        />
                    </div>

                    <div className="space-y-1">
                        <LemonLabel>
                            {t('settings.environment.coreEvents.descriptionLabel', {
                                defaultValue: 'Description (optional)',
                            })}
                        </LemonLabel>
                        <LemonTextArea
                            value={formState.description}
                            onChange={(value) => setFormState((prev) => ({ ...prev, description: value }))}
                            placeholder={t('settings.environment.coreEvents.descriptionPlaceholder', {
                                defaultValue: 'Describe what this core event tracks',
                            })}
                        />
                    </div>

                    <div className="space-y-1">
                        <LemonLabel>
                            {t('settings.environment.coreEvents.filterLabel', {
                                defaultValue: 'Event, action, or data warehouse table',
                            })}
                        </LemonLabel>
                        <ActionFilterComponent
                            bordered
                            filters={currentFilter}
                            setFilters={handleFilterChange}
                            typeKey="core-events-settings"
                            mathAvailability={MathAvailability.All}
                            allowedMathTypes={ALLOWED_MATH_TYPES}
                            hideRename
                            hideDuplicate
                            showSeriesIndicator={false}
                            entitiesLimit={1}
                            actionsTaxonomicGroupTypes={[
                                TaxonomicFilterGroupType.Events,
                                TaxonomicFilterGroupType.Actions,
                                TaxonomicFilterGroupType.DataWarehouse,
                            ]}
                            excludedProperties={{
                                [TaxonomicFilterGroupType.Events]: [null],
                            }}
                        />
                    </div>

                    <div className="space-y-1">
                        <LemonLabel>
                            {t('settings.environment.coreEvents.columns.category', { defaultValue: 'Category' })}
                        </LemonLabel>
                        <LemonSelect
                            value={formState.category}
                            onChange={(value) => setFormState((prev) => ({ ...prev, category: value }))}
                            options={CATEGORY_OPTIONS}
                            placeholder={t('settings.environment.coreEvents.categoryPlaceholder', {
                                defaultValue: 'Select a category',
                            })}
                        />
                    </div>
                </div>
            </LemonModal>
        </div>
    )
}
