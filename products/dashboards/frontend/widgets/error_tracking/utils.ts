import { i18n } from 'lib/i18n/i18n'

export type ErrorTrackingWidgetOrderBy = 'occurrences' | 'last_seen' | 'first_seen' | 'users' | 'sessions'

export function getErrorTrackingWidgetOrderByOptions(): {
    value: ErrorTrackingWidgetOrderBy
    label: string
}[] {
    return [
        {
            value: 'occurrences',
            label: i18n.t('insightFilters.occurrences', { defaultValue: 'Occurrences' }),
        },
        { value: 'last_seen', label: i18n.t('insightFilters.lastSeen', { defaultValue: 'Last seen' }) },
        { value: 'first_seen', label: i18n.t('insightFilters.firstSeen', { defaultValue: 'First seen' }) },
        { value: 'users', label: i18n.t('insightFilters.users', { defaultValue: 'Users' }) },
        { value: 'sessions', label: i18n.t('insightFilters.sessions', { defaultValue: 'Sessions' }) },
    ]
}

/** True when the project can query error tracking issues (matches tile setup prompt gating). */
export function canConfigureErrorTrackingWidgetIssues(
    team: { autocapture_exceptions_opt_in?: boolean | null } | null | undefined,
    hasSentExceptionEvent: boolean | undefined
): boolean {
    if (!team) {
        return false
    }

    return hasSentExceptionEvent === true || !!team.autocapture_exceptions_opt_in
}
