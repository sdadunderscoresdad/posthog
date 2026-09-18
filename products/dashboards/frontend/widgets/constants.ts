import { i18n } from 'lib/i18n/i18n'

/** Shown on the widget tile when run_widgets fails or returns a per-tile error. */
export function getDashboardWidgetFetchErrorMessage(): string {
    return i18n.t('dashboardWidgets.fetchError', { defaultValue: 'Failed to load widget data.' })
}

export function getWidgetListOrderDirectionOptions(): { value: 'DESC' | 'ASC'; label: string }[] {
    return [
        { value: 'DESC', label: i18n.t('dashboardWidgets.listOrder.descending', { defaultValue: 'Descending' }) },
        { value: 'ASC', label: i18n.t('dashboardWidgets.listOrder.ascending', { defaultValue: 'Ascending' }) },
    ]
}

/** Shown on widget tile filter controls when the viewer cannot edit the dashboard. */
export function getDashboardWidgetTileFiltersReadonlyReason(): string {
    return i18n.t('dashboardWidgets.tileFiltersReadonlyReason', {
        defaultValue:
            "You don't have edit permissions for this dashboard. Ask a dashboard collaborator with edit access to add you.",
    })
}

/** Debounce before PATCHing tile config after on-tile filter edits (run_widgets refresh). */
export const WIDGET_TILE_REFRESH_DEBOUNCE_MS = 300

const WIDGET_FETCH_ERROR_PASSTHROUGH_PREFIXES = [
    'Tile not found',
    'You do not have access',
    'Unknown widget type:',
] as const

export function getDashboardWidgetFetchDisplayError(error: string | null | undefined): string | null {
    if (!error) {
        return null
    }

    if (WIDGET_FETCH_ERROR_PASSTHROUGH_PREFIXES.some((prefix) => error.startsWith(prefix))) {
        return error
    }

    return getDashboardWidgetFetchErrorMessage()
}
