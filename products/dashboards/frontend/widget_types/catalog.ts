import type { ComponentType } from 'react'

import { IconFlask, IconList, IconLive, IconMessage, IconRewindPlay, IconWarning } from '@posthog/icons'

import { i18n } from 'lib/i18n/i18n'
import { urls } from 'scenes/urls'

import { ProductKey, QuickFilterContext } from '~/queries/schema/schema-general'
import { ActivityTab } from '~/types'

import {
    activityEventsWidgetConfigSchema,
    conversationsRecentTicketsWidgetConfigSchema,
    errorTrackingWidgetConfigSchema,
    experimentResultsWidgetConfigSchema,
    experimentsWidgetConfigSchema,
    logsWidgetConfigSchema,
    sessionReplayWidgetConfigSchema,
    surveyResultsWidgetConfigSchema,
} from '../generated/widget-configs.zod'
import type { DashboardWidgetProductAccess } from '../types'
import { isLiveDashboardWidgetType } from '../widgets/live/liveWidgetTypes'
import type {
    WidgetAvailabilityConfig,
    WidgetAvailabilityRequirement,
    WidgetAvailabilityRequirementId,
} from './widgetAvailability'

export const DASHBOARD_WIDGET_HEADER_LAYOUTS = ['simple', 'dashboard_tile'] as const

export type DashboardWidgetHeaderLayout = (typeof DASHBOARD_WIDGET_HEADER_LAYOUTS)[number]

export type DashboardWidgetHeaderMeta = {
    /** Show the widget type label in the compact top heading row (e.g. "Error tracking"). Defaults to true. */
    showWidgetType?: boolean
    /** Show the configured date range in the compact top heading row (e.g. "Last 7 days"). Defaults to true. */
    showDateRange?: boolean
}

export const DEFAULT_DASHBOARD_WIDGET_HEADER_LAYOUT = 'dashboard_tile' satisfies DashboardWidgetHeaderLayout

export const DEFAULT_DASHBOARD_WIDGET_HEADER_META = {
    showWidgetType: true,
    showDateRange: true,
} satisfies DashboardWidgetHeaderMeta

/** Event properties allowed in error tracking list widget `config.widgetFilters`. */
export const ERROR_TRACKING_LIST_TILE_FILTER_PROPERTIES = [
    '$environment',
    '$current_url',
    '$pathname',
    '$team',
    '$posthog_team',
    '$temporal_worker',
    '$temporal_worker_name',
] as const

/** Event properties allowed in session replay list widget `config.widgetFilters`. */
export const SESSION_REPLAY_LIST_TILE_FILTER_PROPERTIES = [
    '$browser',
    '$os',
    '$device_type',
    '$geoip_country_code',
    '$geoip_city_name',
    '$current_url',
    '$pathname',
    '$host',
    '$referring_domain',
    '$lib',
    '$environment',
] as const

export type DashboardWidgetTileFiltersCatalogConfig = {
    quickFilterContext: QuickFilterContext
    allowedPropertyNames: readonly string[]
}

/** Product area labels keyed by catalog `groupId`. New groups: add here. */
export const DASHBOARD_WIDGET_GROUP_LABELS = {
    activity: 'Activity',
    error_tracking: 'Error tracking',
    session_replay: 'Session replay',
    experiments: 'Experiments',
    surveys: 'Surveys',
    logs: 'Logs',
    conversations: 'Support',
} as const satisfies Record<string, string>

export function getDashboardWidgetGroupLabel(groupId: string): string {
    switch (groupId) {
        case 'activity':
            return i18n.t('dashboardWidgets.groups.activity', { defaultValue: 'Activity' })
        case 'error_tracking':
            return i18n.t('dashboardWidgets.groups.errorTracking', { defaultValue: 'Error tracking' })
        case 'session_replay':
            return i18n.t('dashboardWidgets.groups.sessionReplay', { defaultValue: 'Session replay' })
        case 'experiments':
            return i18n.t('dashboardWidgets.groups.experiments', { defaultValue: 'Experiments' })
        case 'surveys':
            return i18n.t('dashboardWidgets.groups.surveys', { defaultValue: 'Surveys' })
        case 'logs':
            return i18n.t('dashboardWidgets.groups.logs', { defaultValue: 'Logs' })
        case 'conversations':
            return i18n.t('dashboardWidgets.groups.support', { defaultValue: 'Support' })
        default:
            return groupId
    }
}

/** Product icons shown next to group headings in the Add widget picker, keyed by `groupId`. */
export const DASHBOARD_WIDGET_GROUP_ICONS = {
    activity: IconLive,
    error_tracking: IconWarning,
    session_replay: IconRewindPlay,
    experiments: IconFlask,
    surveys: IconMessage,
    logs: IconList,
    conversations: IconMessage,
} as const satisfies Record<keyof typeof DASHBOARD_WIDGET_GROUP_LABELS, ComponentType<{ className?: string }>>

export function getDashboardWidgetGroupIcon(groupId: string): ComponentType<{ className?: string }> | undefined {
    return DASHBOARD_WIDGET_GROUP_ICONS[groupId as keyof typeof DASHBOARD_WIDGET_GROUP_ICONS]
}

type DashboardWidgetGroupProductIntroConfig = {
    productKey: ProductKey
    /** Setup requirement that gates the nudge — shown only while this requirement is unmet. */
    requirement: WidgetAvailabilityRequirementId
    /** One-liner pitching why the product is worth a look — shown up front in the picker nudge. */
    valueProp: string
    /** Label for the CTA link (e.g. "Explore error tracking"). */
    ctaLabel: string
    docsHref: string
}

/**
 * Pitch shown next to a group heading when the product's setup requirement (see `availability`) is unmet.
 * Keyed by catalog `groupId`; only products that gate on a project setting belong here — areas with no
 * setup requirement (e.g. `experiments`, `activity`) are intentionally omitted.
 */
export const DASHBOARD_WIDGET_GROUP_PRODUCT_INTRO = {
    error_tracking: {
        productKey: ProductKey.ERROR_TRACKING,
        requirement: 'exception_autocapture',
        valueProp: 'Catch and resolve the errors hurting your users.',
        ctaLabel: 'Explore error tracking',
        docsHref: 'https://posthog.com/docs/error-tracking',
    },
    session_replay: {
        productKey: ProductKey.SESSION_REPLAY,
        requirement: 'session_replay_enabled',
        valueProp: 'Watch real sessions to see exactly where users get stuck.',
        ctaLabel: 'Explore session replay',
        docsHref: 'https://posthog.com/docs/session-replay',
    },
} as const satisfies Partial<Record<keyof typeof DASHBOARD_WIDGET_GROUP_LABELS, DashboardWidgetGroupProductIntroConfig>>

/** Structural, not literal, so the accessor can return translated copy in place of the English. */
export type DashboardWidgetGroupProductIntro = DashboardWidgetGroupProductIntroConfig

export function getDashboardWidgetGroupProductIntro(groupId: string): DashboardWidgetGroupProductIntro | undefined {
    const intro = DASHBOARD_WIDGET_GROUP_PRODUCT_INTRO[groupId as keyof typeof DASHBOARD_WIDGET_GROUP_PRODUCT_INTRO]
    if (!intro) {
        return undefined
    }
    if (groupId === 'error_tracking') {
        return {
            ...intro,
            valueProp: i18n.t('dashboardWidgets.intro.errorTracking.valueProp', {
                defaultValue: 'Catch and resolve the errors hurting your users.',
            }),
            ctaLabel: i18n.t('dashboardWidgets.intro.errorTracking.ctaLabel', {
                defaultValue: 'Explore error tracking',
            }),
        }
    }
    if (groupId === 'session_replay') {
        return {
            ...intro,
            valueProp: i18n.t('dashboardWidgets.intro.sessionReplay.valueProp', {
                defaultValue: 'Watch real sessions to see exactly where users get stuck.',
            }),
            ctaLabel: i18n.t('dashboardWidgets.intro.sessionReplay.ctaLabel', {
                defaultValue: 'Explore session replay',
            }),
        }
    }
    return intro
}

/** What the catalog declares: structure, config, and the setup requirement. Copy lives in the messages. */
export type DashboardWidgetCatalogDefinition = {
    /** Stable key for grouping widgets from the same product area. */
    groupId: keyof typeof DASHBOARD_WIDGET_GROUP_LABELS | (string & {})
    defaultConfig: Record<string, unknown>
    defaultLayout: { w: number; h: number; minW: number; minH?: number }
    productAccess?: DashboardWidgetProductAccess
    headerLayout?: DashboardWidgetHeaderLayout
    headerMeta?: DashboardWidgetHeaderMeta
    /** When set, the widget title links here on private dashboard placements for users with access. */
    titleHref?: string
    /** Optional project setup requirement surfaced in widget runtime when unmet (see `widgetAvailability.ts`). */
    availability?: WidgetAvailabilityRequirement
    /** Quick filter context + property allowlist for on-tile filter bars. */
    tileFilters?: DashboardWidgetTileFiltersCatalogConfig
}

/** A catalog entry plus the copy a person reads, resolved from the message catalog. */
export type DashboardWidgetCatalogEntry = Omit<DashboardWidgetCatalogDefinition, 'availability'> & {
    /** Widget variant label within the group (also used as fallback card title). */
    label: string
    /** Short promo badge shown next to the label in the Add widget picker (e.g. "Most popular"). */
    badge?: string
    description: string
    /** Title shown in the card header (defaults to `label`). */
    headerTitle: string
    /** Copy for shared/public dashboard placeholders when live widget data is not loaded. */
    sharedPlaceholder?: {
        title: string
        message: string
    }
    availability?: WidgetAvailabilityConfig
}

/** New widget types: add here. See products/dashboards/CONTRIBUTING.md. */
export const DASHBOARD_WIDGET_CATALOG = {
    conversations_recent_tickets: {
        groupId: 'conversations',
        headerMeta: { showDateRange: false },
        defaultConfig: conversationsRecentTicketsWidgetConfigSchema.parse({}),
        defaultLayout: { w: 6, h: 6, minW: 3, minH: 4 },
        productAccess: 'ticket',
        titleHref: urls.supportTickets(),
        availability: {
            requirement: 'conversations_enabled',
            docsHref: 'https://posthog.com/docs/support',
            compactSetupPrompt: true,
        },
    },
    error_tracking_list: {
        groupId: 'error_tracking',
        defaultConfig: errorTrackingWidgetConfigSchema.parse({
            dateRange: { date_from: '-7d' },
        }),
        defaultLayout: { w: 6, h: 5, minW: 3, minH: 3 },
        productAccess: 'error_tracking',
        titleHref: urls.errorTracking(),
        tileFilters: {
            quickFilterContext: QuickFilterContext.ErrorTrackingIssueFilters,
            allowedPropertyNames: ERROR_TRACKING_LIST_TILE_FILTER_PROPERTIES,
        },
    },
    session_replay_list: {
        groupId: 'session_replay',
        defaultConfig: sessionReplayWidgetConfigSchema.parse({
            dateRange: { date_from: '-7d' },
        }),
        defaultLayout: { w: 6, h: 5, minW: 3, minH: 3 },
        productAccess: 'session_recording',
        titleHref: urls.replay(),
        availability: {
            requirement: 'session_replay_enabled',
            docsHref: 'https://posthog.com/docs/session-replay',
        },
        tileFilters: {
            quickFilterContext: QuickFilterContext.Dashboards,
            allowedPropertyNames: SESSION_REPLAY_LIST_TILE_FILTER_PROPERTIES,
        },
    },
    experiments_list: {
        groupId: 'experiments',
        // Filtered by status/creator, not a date range — don't show a (defaulted) date in the header.
        headerMeta: { showDateRange: false },
        defaultConfig: experimentsWidgetConfigSchema.parse({}),
        defaultLayout: { w: 6, h: 5, minW: 3, minH: 3 },
        productAccess: 'experiment',
        titleHref: urls.experiments(),
    },
    experiment_results: {
        groupId: 'experiments',
        // Shows a selected experiment's current results — there's no date range to surface.
        headerMeta: { showDateRange: false },
        defaultConfig: experimentResultsWidgetConfigSchema.parse({}),
        defaultLayout: { w: 6, h: 5, minW: 3, minH: 3 },
        productAccess: 'experiment',
    },
    survey_results: {
        groupId: 'surveys',
        defaultConfig: surveyResultsWidgetConfigSchema.parse({}),
        defaultLayout: { w: 6, h: 5, minW: 3, minH: 3 },
        productAccess: 'survey',
        titleHref: urls.surveys(),
    },
    activity_events_list: {
        groupId: 'activity',
        defaultConfig: activityEventsWidgetConfigSchema.parse({
            dateRange: { date_from: '-24h' },
        }),
        defaultLayout: { w: 6, h: 5, minW: 3, minH: 3 },
        titleHref: urls.activity(ActivityTab.ExploreEvents),
    },
    logs_list: {
        groupId: 'logs',
        defaultConfig: logsWidgetConfigSchema.parse({
            dateRange: { date_from: '-1h' },
        }),
        defaultLayout: { w: 6, h: 5, minW: 3, minH: 3 },
        productAccess: 'logs',
        titleHref: urls.logs(),
    },
} as const satisfies Record<string, DashboardWidgetCatalogDefinition>

export type DashboardWidgetCatalogKey = keyof typeof DASHBOARD_WIDGET_CATALOG

export type ResolvedDashboardWidgetCatalogEntry = DashboardWidgetCatalogEntry & {
    headerLayout: DashboardWidgetHeaderLayout
    headerMeta: Required<DashboardWidgetHeaderMeta>
    /** `WidgetSpec.is_live` from the generated manifest — the tile self-updates in real time after load. */
    live: boolean
}

function resolveDashboardWidgetCatalogEntry(
    widgetType: string,
    definition: DashboardWidgetCatalogDefinition
): ResolvedDashboardWidgetCatalogEntry {
    if (!(widgetType in DASHBOARD_WIDGET_CATALOG)) {
        throw new Error(`Unknown dashboard widget type: ${widgetType}`)
    }

    return withHeaderDefaults(widgetType, resolveWidgetCopy(widgetType as DashboardWidgetCatalogKey, definition))
}

/** Fills in the header defaults a rendered entry needs, which the catalog leaves optional. */
function withHeaderDefaults(
    widgetType: string,
    entry: DashboardWidgetCatalogEntry
): ResolvedDashboardWidgetCatalogEntry {
    const live = isLiveDashboardWidgetType(widgetType)
    return {
        ...entry,
        live,
        headerLayout: entry.headerLayout ?? DEFAULT_DASHBOARD_WIDGET_HEADER_LAYOUT,
        headerMeta: {
            ...DEFAULT_DASHBOARD_WIDGET_HEADER_META,
            // Live tiles show a fixed real-time window; there is no configured date range to display.
            ...(live ? { showDateRange: false } : null),
            ...entry.headerMeta,
        },
    }
}

/**
 * Copy for one widget, resolved per call: the catalog is built at import, so a value read then would
 * keep whichever language the app started in.
 */
function widgetCopy(
    entry: DashboardWidgetCatalogDefinition,
    copy: {
        label: string
        description: string
        headerTitle: string
        placeholderTitle: string
        placeholderMessage: string
        badge?: string
        availability?: Pick<WidgetAvailabilityConfig, 'unavailableTitle' | 'unavailableReason' | 'setupActionLabel'>
    }
): DashboardWidgetCatalogEntry {
    const { availability, ...definition } = entry
    return {
        ...definition,
        label: copy.label,
        badge: copy.badge,
        description: copy.description,
        headerTitle: copy.headerTitle,
        sharedPlaceholder: { title: copy.placeholderTitle, message: copy.placeholderMessage },
        ...(availability && copy.availability ? { availability: { ...availability, ...copy.availability } } : null),
    }
}

function resolveWidgetCopy(
    widgetType: DashboardWidgetCatalogKey,
    entry: DashboardWidgetCatalogDefinition
): DashboardWidgetCatalogEntry {
    switch (widgetType) {
        case 'conversations_recent_tickets':
            return widgetCopy(entry, {
                label: i18n.t('dashboardWidgets.recentTickets.label', { defaultValue: 'Recent tickets' }),
                description: i18n.t('dashboardWidgets.recentTickets.description', {
                    defaultValue: 'Most recently updated support tickets.',
                }),
                headerTitle: i18n.t('dashboardWidgets.recentTickets.headerTitle', { defaultValue: 'Recent tickets' }),
                placeholderTitle: i18n.t('dashboardWidgets.recentTickets.placeholderTitle', {
                    defaultValue: 'Recent tickets',
                }),
                placeholderMessage: i18n.t('dashboardWidgets.recentTickets.placeholderMessage', {
                    defaultValue: 'Log in to PostHog to see recent support tickets from this dashboard.',
                }),
                availability: {
                    unavailableTitle: i18n.t('dashboardWidgets.recentTickets.unavailableTitle', {
                        defaultValue: 'Keep customer conversations close to your product data',
                    }),
                    unavailableReason: i18n.t('dashboardWidgets.recentTickets.unavailableReason', {
                        defaultValue:
                            'Triage and respond to customer questions with the context you need to solve them.',
                    }),
                    setupActionLabel: i18n.t('dashboardWidgets.recentTickets.setupActionLabel', {
                        defaultValue: 'Enable',
                    }),
                },
            })
        case 'error_tracking_list':
            return widgetCopy(entry, {
                label: i18n.t('dashboardWidgets.topIssues.label', { defaultValue: 'Top issues' }),
                badge: i18n.t('dashboardWidgets.topIssues.badge', { defaultValue: 'Crowd favorite' }),
                description: i18n.t('dashboardWidgets.topIssues.description', {
                    defaultValue: 'Ranked list of the most impactful error tracking issues.',
                }),
                headerTitle: i18n.t('dashboardWidgets.topIssues.headerTitle', { defaultValue: 'Top issues' }),
                placeholderTitle: i18n.t('dashboardWidgets.topIssues.placeholderTitle', { defaultValue: 'Top issues' }),
                placeholderMessage: i18n.t('dashboardWidgets.topIssues.placeholderMessage', {
                    defaultValue: 'Log in to PostHog to see which errors are affecting your users.',
                }),
            })
        case 'session_replay_list':
            return widgetCopy(entry, {
                label: i18n.t('dashboardWidgets.recentRecordings.label', { defaultValue: 'Recent recordings' }),
                badge: i18n.t('dashboardWidgets.recentRecordings.badge', { defaultValue: 'Crowd favorite' }),
                description: i18n.t('dashboardWidgets.recentRecordings.description', {
                    defaultValue: 'Recent session recordings you can open in the replay player.',
                }),
                headerTitle: i18n.t('dashboardWidgets.recentRecordings.headerTitle', {
                    defaultValue: 'Recent recordings',
                }),
                placeholderTitle: i18n.t('dashboardWidgets.recentRecordings.placeholderTitle', {
                    defaultValue: 'Recent recordings',
                }),
                placeholderMessage: i18n.t('dashboardWidgets.recentRecordings.placeholderMessage', {
                    defaultValue: 'Log in to PostHog to watch session replays from this dashboard.',
                }),
                availability: {
                    unavailableTitle: i18n.t('dashboardWidgets.recentRecordings.unavailableTitle', {
                        defaultValue: 'Session replay is not enabled',
                    }),
                    unavailableReason: i18n.t('dashboardWidgets.recentRecordings.unavailableReason', {
                        defaultValue:
                            'Turn on session recordings for this project to watch recent replays from your dashboard.',
                    }),
                    setupActionLabel: i18n.t('dashboardWidgets.recentRecordings.setupActionLabel', {
                        defaultValue: 'Enable session replay',
                    }),
                },
            })
        case 'experiments_list':
            return widgetCopy(entry, {
                label: i18n.t('dashboardWidgets.experimentsList.label', { defaultValue: 'Experiments list' }),
                description: i18n.t('dashboardWidgets.experimentsList.description', {
                    defaultValue: 'List of experiments filtered by status and creator.',
                }),
                headerTitle: i18n.t('dashboardWidgets.experimentsList.headerTitle', { defaultValue: 'Experiments' }),
                placeholderTitle: i18n.t('dashboardWidgets.experimentsList.placeholderTitle', {
                    defaultValue: 'Experiments',
                }),
                placeholderMessage: i18n.t('dashboardWidgets.experimentsList.placeholderMessage', {
                    defaultValue: 'Log in to PostHog to see experiments from this dashboard.',
                }),
            })
        case 'experiment_results':
            return widgetCopy(entry, {
                label: i18n.t('dashboardWidgets.experimentResults.label', { defaultValue: 'Experiment results' }),
                description: i18n.t('dashboardWidgets.experimentResults.description', {
                    defaultValue: 'Current results for the primary metrics of a selected experiment.',
                }),
                headerTitle: i18n.t('dashboardWidgets.experimentResults.headerTitle', {
                    defaultValue: 'Experiment results',
                }),
                placeholderTitle: i18n.t('dashboardWidgets.experimentResults.placeholderTitle', {
                    defaultValue: 'Experiment results',
                }),
                placeholderMessage: i18n.t('dashboardWidgets.experimentResults.placeholderMessage', {
                    defaultValue: 'Log in to PostHog to see experiment results from this dashboard.',
                }),
            })
        case 'survey_results':
            return widgetCopy(entry, {
                label: i18n.t('dashboardWidgets.surveyResults.label', { defaultValue: 'Survey results' }),
                description: i18n.t('dashboardWidgets.surveyResults.description', {
                    defaultValue: 'Performance stats and recent responses for a selected survey.',
                }),
                headerTitle: i18n.t('dashboardWidgets.surveyResults.headerTitle', { defaultValue: 'Survey results' }),
                placeholderTitle: i18n.t('dashboardWidgets.surveyResults.placeholderTitle', {
                    defaultValue: 'Survey results',
                }),
                placeholderMessage: i18n.t('dashboardWidgets.surveyResults.placeholderMessage', {
                    defaultValue: 'Log in to PostHog to see survey results from this dashboard.',
                }),
            })
        case 'activity_events_list':
            return widgetCopy(entry, {
                label: i18n.t('dashboardWidgets.recentEvents.label', { defaultValue: 'Recent events' }),
                description: i18n.t('dashboardWidgets.recentEvents.description', {
                    defaultValue: 'Latest events captured in this project, as on Activity > Explore.',
                }),
                headerTitle: i18n.t('dashboardWidgets.recentEvents.headerTitle', { defaultValue: 'Recent events' }),
                placeholderTitle: i18n.t('dashboardWidgets.recentEvents.placeholderTitle', {
                    defaultValue: 'Recent events',
                }),
                placeholderMessage: i18n.t('dashboardWidgets.recentEvents.placeholderMessage', {
                    defaultValue: 'Log in to PostHog to explore the latest events from this dashboard.',
                }),
            })
        case 'logs_list':
            return widgetCopy(entry, {
                label: i18n.t('dashboardWidgets.recentLogs.label', { defaultValue: 'Recent logs' }),
                description: i18n.t('dashboardWidgets.recentLogs.description', {
                    defaultValue: 'Latest log lines, filterable by severity level and service.',
                }),
                headerTitle: i18n.t('dashboardWidgets.recentLogs.headerTitle', { defaultValue: 'Recent logs' }),
                placeholderTitle: i18n.t('dashboardWidgets.recentLogs.placeholderTitle', {
                    defaultValue: 'Recent logs',
                }),
                placeholderMessage: i18n.t('dashboardWidgets.recentLogs.placeholderMessage', {
                    defaultValue: 'Log in to PostHog to see the latest logs from this dashboard.',
                }),
            })
        default:
            // Unreachable for a keyed widget: every catalog entry has a case above.
            return {
                ...entry,
                availability: undefined,
                label: widgetType,
                description: '',
                headerTitle: widgetType,
            }
    }
}

export function getDashboardWidgetCatalogEntry(widgetType: string): ResolvedDashboardWidgetCatalogEntry {
    if (!(widgetType in DASHBOARD_WIDGET_CATALOG)) {
        throw new Error(`Unknown dashboard widget type: ${widgetType}`)
    }

    return resolveDashboardWidgetCatalogEntry(
        widgetType,
        DASHBOARD_WIDGET_CATALOG[widgetType as DashboardWidgetCatalogKey]
    )
}

export function tryGetDashboardWidgetCatalogEntry(widgetType: string): ResolvedDashboardWidgetCatalogEntry | undefined {
    if (!(widgetType in DASHBOARD_WIDGET_CATALOG)) {
        return undefined
    }

    return resolveDashboardWidgetCatalogEntry(
        widgetType,
        DASHBOARD_WIDGET_CATALOG[widgetType as DashboardWidgetCatalogKey]
    )
}

/** Resolved per call, because a constant read at import would keep the language the app started in. */
export function defaultSharedDashboardWidgetPlaceholder(): { title: string; message: string } {
    return {
        title: i18n.t('dashboardWidgets.sharedPlaceholder.title', { defaultValue: 'Widget data' }),
        message: i18n.t('dashboardWidgets.sharedPlaceholder.message', {
            defaultValue: "Log in to PostHog to see this widget's data.",
        }),
    }
}

export function getUnknownDashboardWidgetCatalogFallback(widgetType: string): ResolvedDashboardWidgetCatalogEntry {
    return withHeaderDefaults(widgetType, {
        groupId: widgetType,
        defaultConfig: {},
        defaultLayout: { w: 6, h: 5, minW: 3 },
        label: widgetType,
        description: '',
        headerTitle: widgetType,
        sharedPlaceholder: defaultSharedDashboardWidgetPlaceholder(),
    })
}

export type DashboardWidgetCatalogGroup = {
    groupId: string
    groupLabel: string
    widgets: Array<{
        widgetType: DashboardWidgetCatalogKey
        entry: ResolvedDashboardWidgetCatalogEntry
    }>
}

function getDashboardWidgetCatalogGroups(): DashboardWidgetCatalogGroup[] {
    const groupsById = new Map<string, DashboardWidgetCatalogGroup>()

    for (const [widgetType, entry] of Object.entries(DASHBOARD_WIDGET_CATALOG)) {
        let group = groupsById.get(entry.groupId)

        if (!group) {
            group = {
                groupId: entry.groupId,
                groupLabel: getDashboardWidgetGroupLabel(entry.groupId),
                widgets: [],
            }
            groupsById.set(entry.groupId, group)
        }

        group.widgets.push({
            widgetType: widgetType as DashboardWidgetCatalogKey,
            entry: resolveDashboardWidgetCatalogEntry(widgetType, entry),
        })
    }

    const groupDisplayOrder = ['session_replay', 'error_tracking', 'activity', 'logs', 'experiments', 'surveys']

    return [...groupsById.values()].sort((a, b) => {
        const aIndex = groupDisplayOrder.indexOf(a.groupId)
        const bIndex = groupDisplayOrder.indexOf(b.groupId)
        return (aIndex === -1 ? Infinity : aIndex) - (bIndex === -1 ? Infinity : bIndex)
    })
}

/** Built per call, because the copy inside it would otherwise keep the language the app started in. */
export function dashboardWidgetCatalogGroups(): DashboardWidgetCatalogGroup[] {
    return getDashboardWidgetCatalogGroups()
}
