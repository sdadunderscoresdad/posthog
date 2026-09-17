import { i18n } from 'lib/i18n/i18n'

import { DASHBOARD_WIDGET_CATALOG, type DashboardWidgetCatalogKey } from '../widget_types/catalog'

export type AddWidgetPayload = {
    widgetType: string
    config: Record<string, unknown>
}

export function getAddButtonLabel(selectedCount: number): string {
    if (selectedCount <= 1) {
        return i18n.t('dashboardWidgets.addModal.addButton', { defaultValue: 'Add widget' })
    }
    return i18n.t('dashboardWidgets.addModal.addButtonCount', {
        count: selectedCount,
        defaultValue: 'Add {{ count }} widgets',
    })
}

export function getAddWidgetDisabledReason(loading: boolean | undefined, selectedCount: number): string | undefined {
    if (loading) {
        return i18n.t('dashboardWidgets.addModal.adding', { defaultValue: 'Adding widgets…' })
    }
    if (selectedCount === 0) {
        return i18n.t('dashboardWidgets.addModal.selectAtLeastOne', { defaultValue: 'Select at least one widget type' })
    }
    return undefined
}

export function buildAddWidgetPayloads(selectedTypes: Iterable<string>): AddWidgetPayload[] {
    const payloads: AddWidgetPayload[] = []

    for (const widgetType of selectedTypes) {
        const catalogEntry = DASHBOARD_WIDGET_CATALOG[widgetType as DashboardWidgetCatalogKey]
        if (!catalogEntry) {
            continue
        }
        payloads.push({ widgetType, config: catalogEntry.defaultConfig })
    }

    return payloads
}

export async function submitAddWidgetPayloads(
    selectedTypes: Set<string>,
    onAdd: (payloads: AddWidgetPayload[]) => Promise<void>,
    onClose: () => void
): Promise<void> {
    if (selectedTypes.size === 0) {
        return
    }

    const payloads = buildAddWidgetPayloads(selectedTypes)
    if (payloads.length === 0) {
        return
    }

    // onAdd (dashboardLogic.addWidgetTiles) toasts and rethrows on failure — keep the modal open.
    await onAdd(payloads)
    onClose()
}
