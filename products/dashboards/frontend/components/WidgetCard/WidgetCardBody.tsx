import clsx from 'clsx'
import React from 'react'

import * as chartPng from '@posthog/brand/hoggies/png/chart'
import { IconLock } from '@posthog/icons'
import { LemonSkeleton } from '@posthog/lemon-ui'

import { pngHoggie } from 'lib/brand/hoggies'
import { i18n } from 'lib/i18n/i18n'
import { LemonButton } from 'lib/lemon-ui/LemonButton'
import { cn } from 'lib/utils/css-classes'

const HedgehogChart = pngHoggie(chartPng)

export type WidgetCardBodyProps = React.HTMLAttributes<HTMLDivElement> & {
    locked?: boolean
    lockedMessage?: string
    error?: string | null
    onRefresh?: () => void
    refreshing?: boolean
    children?: React.ReactNode
}

function WidgetCardBodyContent({
    locked,
    lockedMessage,
    error,
    onRefresh,
    refreshing,
    children,
}: Pick<
    WidgetCardBodyProps,
    'locked' | 'lockedMessage' | 'error' | 'onRefresh' | 'refreshing' | 'children'
>): JSX.Element {
    if (locked) {
        return (
            <WidgetCardBodySlot>
                <WidgetCardContent>
                    <WidgetCardBodyMessage variant="locked">{lockedMessage}</WidgetCardBodyMessage>
                </WidgetCardContent>
            </WidgetCardBodySlot>
        )
    }

    if (error) {
        return (
            <WidgetCardBodySlot>
                <WidgetCardContent>
                    <WidgetCardBodyMessage variant="error" onRefresh={onRefresh} refreshing={refreshing}>
                        {error}
                    </WidgetCardBodyMessage>
                </WidgetCardContent>
            </WidgetCardBodySlot>
        )
    }

    return <WidgetCardBodySlot>{children}</WidgetCardBodySlot>
}

export function WidgetCardBody({
    locked,
    lockedMessage = i18n.t('dashboardWidgets.card.lockedMessage', {
        defaultValue: 'You do not have access to view this widget.',
    }),
    error,
    onRefresh,
    refreshing = false,
    children,
    className,
    ...divProps
}: WidgetCardBodyProps): JSX.Element {
    return (
        <div
            data-slot="widget-card-body"
            className={clsx(
                '@container/widget-card WidgetCard__body flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-4 pt-2',
                className
            )}
            {...divProps}
        >
            <WidgetCardBodyContent
                locked={locked}
                lockedMessage={lockedMessage}
                error={error}
                onRefresh={onRefresh}
                refreshing={refreshing}
            >
                {children}
            </WidgetCardBodyContent>
        </div>
    )
}

/** Passes flex height from the card shell into widget body content. */
function WidgetCardBodySlot({ children }: { children: React.ReactNode }): JSX.Element {
    return <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
}

type WidgetCardBodyMessageProps = {
    variant?: 'muted' | 'error' | 'locked'
    onRefresh?: () => void
    refreshing?: boolean
    children: React.ReactNode
}

export function WidgetCardBodyMessage({
    variant = 'muted',
    onRefresh,
    refreshing = false,
    children,
}: WidgetCardBodyMessageProps): JSX.Element {
    let content: React.ReactNode = children

    if (variant === 'locked') {
        content = (
            <div
                className="flex max-w-xs flex-col items-center gap-2 px-2 text-balance"
                data-attr="widget-card-body-locked"
            >
                <IconLock className="text-4xl text-muted" />
                <span>{children}</span>
            </div>
        )
    } else if (variant === 'error') {
        content = (
            <div
                className="flex max-w-xs flex-col items-center gap-3 px-2 text-balance"
                data-attr="widget-card-body-error"
            >
                <span>{children}</span>
                {onRefresh ? (
                    <LemonButton
                        type="secondary"
                        size="small"
                        data-attr="widget-card-body-refresh"
                        loading={refreshing}
                        disabledReason={
                            refreshing
                                ? i18n.t('dashboardWidgets.card.refreshing', { defaultValue: 'Refreshing…' })
                                : undefined
                        }
                        onClick={onRefresh}
                    >
                        {i18n.t('dashboardWidgets.card.refreshData', { defaultValue: 'Refresh data' })}
                    </LemonButton>
                ) : null}
            </div>
        )
    }

    return (
        <div
            data-slot="widget-card-body-message"
            className={clsx(
                'flex min-h-full w-full items-center justify-center text-center text-sm',
                variant === 'error' ? 'text-danger' : 'text-muted'
            )}
        >
            {content}
        </div>
    )
}

type WidgetCardBodySkeletonProps = {
    rowCount?: number
    className?: string
}

/** Generic skeleton rows for dashboard widget loading UI. Prefer wrapping in `WidgetLoadingState`. */
export function WidgetCardBodySkeleton({ rowCount = 4, className }: WidgetCardBodySkeletonProps): JSX.Element {
    return (
        <div
            className={cn('flex flex-col gap-3', className)}
            aria-busy
            aria-label={i18n.t('dashboardWidgets.card.loadingWidget', { defaultValue: 'Loading widget' })}
        >
            {Array.from({ length: rowCount }, (_, index) => (
                <div key={index} className="flex flex-col gap-2" aria-hidden>
                    <LemonSkeleton className="h-4 w-[70%] max-w-md" />
                    <LemonSkeleton className="h-3 w-full max-w-lg" />
                    <LemonSkeleton className="h-3 w-[45%] max-w-xs" />
                </div>
            ))}
        </div>
    )
}

export type WidgetLoadingStateProps = {
    /** Custom loading UI. When omitted, renders the generic body skeleton. */
    children?: React.ReactNode
    /** Row count for the generic skeleton when `children` is omitted. */
    rowCount?: number
    className?: string
}

/** Centers widget loading UI in the card body. Use from widget components while `loading` is true. */
export function WidgetLoadingState({ children, rowCount, className }: WidgetLoadingStateProps): JSX.Element {
    return (
        <WidgetCardContent>
            <div data-slot="widget-loading-state" className="flex min-h-min w-full items-center justify-center">
                {children ?? (
                    <WidgetCardBodySkeleton rowCount={rowCount} className={clsx('w-full max-w-lg', className)} />
                )}
            </div>
        </WidgetCardContent>
    )
}

type WidgetCardContentProps = {
    children: React.ReactNode
    className?: string
}

/** Scrollable widget body — compose with optional `WidgetContentFooter` as a sibling. */
export function WidgetCardContent({ children, className }: WidgetCardContentProps): JSX.Element {
    return (
        <div
            data-slot="widget-card-content"
            className={clsx('min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden', className)}
        >
            {children}
        </div>
    )
}

type WidgetContentFooterProps = {
    children: React.ReactNode
    className?: string
}

/** Pinned footer slot for list widgets — sibling of `WidgetCardContent`. */
export function WidgetContentFooter({ children, className }: WidgetContentFooterProps): JSX.Element {
    return (
        <div data-slot="widget-card-content-footer" className={cn('flex shrink-0 justify-center pt-0.5', className)}>
            {children}
        </div>
    )
}

export type WidgetListCountNoun = {
    singular: string
    plural: string
}

export function getWidgetListCountEvents(): WidgetListCountNoun {
    return {
        singular: i18n.t('dashboardWidgets.listCount.event', { defaultValue: 'event' }),
        plural: i18n.t('dashboardWidgets.listCount.events', { defaultValue: 'events' }),
    }
}

export function getWidgetListCountIssues(): WidgetListCountNoun {
    return {
        singular: i18n.t('dashboardWidgets.listCount.issue', { defaultValue: 'issue' }),
        plural: i18n.t('dashboardWidgets.listCount.issues', { defaultValue: 'issues' }),
    }
}

export function getWidgetListCountRecordings(): WidgetListCountNoun {
    return {
        singular: i18n.t('dashboardWidgets.listCount.recording', { defaultValue: 'recording' }),
        plural: i18n.t('dashboardWidgets.listCount.recordings', { defaultValue: 'recordings' }),
    }
}

export function getWidgetListCountExperiments(): WidgetListCountNoun {
    return {
        singular: i18n.t('dashboardWidgets.listCount.experiment', { defaultValue: 'experiment' }),
        plural: i18n.t('dashboardWidgets.listCount.experiments', { defaultValue: 'experiments' }),
    }
}

export function getWidgetListCountLogs(): WidgetListCountNoun {
    return {
        singular: i18n.t('dashboardWidgets.listCount.logLine', { defaultValue: 'log line' }),
        plural: i18n.t('dashboardWidgets.listCount.logLines', { defaultValue: 'log lines' }),
    }
}

export function getWidgetListCountTickets(): WidgetListCountNoun {
    return {
        singular: i18n.t('dashboardWidgets.listCount.ticket', { defaultValue: 'ticket' }),
        plural: i18n.t('dashboardWidgets.listCount.tickets', { defaultValue: 'tickets' }),
    }
}

export function formatWidgetListCountFooter(
    shown: number,
    totalCount: number | undefined,
    totalCountIsLowerBound?: boolean,
    noun: WidgetListCountNoun = getWidgetListCountIssues(),
    hasMore?: boolean
): string {
    const label = shown === 1 && totalCount === 1 && !totalCountIsLowerBound ? noun.singular : noun.plural

    if (totalCount === undefined) {
        if (hasMore && shown > 0) {
            return i18n.t('dashboardWidgets.listCount.atLeast', {
                shown,
                noun: shown === 1 ? noun.singular : noun.plural,
                defaultValue: '{{ shown }}+ {{ noun }}',
            })
        }
        return i18n.t('dashboardWidgets.listCount.exact', {
            shown,
            noun: shown === 1 ? noun.singular : noun.plural,
            defaultValue: '{{ shown }} {{ noun }}',
        })
    }

    const totalLabel = totalCountIsLowerBound ? `${totalCount}+` : String(totalCount)
    return i18n.t('dashboardWidgets.listCount.range', {
        shown,
        total: totalLabel,
        noun: label,
        defaultValue: '{{ shown }} of {{ total }} {{ noun }}',
    })
}

type WidgetListCountProps = {
    shown: number
    totalCount?: number
    totalCountIsLowerBound?: boolean
    noun?: WidgetListCountNoun
    hasMore?: boolean
    dataAttr: string
}

export function WidgetListCount({
    shown,
    totalCount,
    totalCountIsLowerBound,
    noun = getWidgetListCountIssues(),
    hasMore,
    dataAttr,
}: WidgetListCountProps): JSX.Element {
    return (
        <p className="text-xs text-muted m-0 text-center" data-attr={dataAttr}>
            {formatWidgetListCountFooter(shown, totalCount, totalCountIsLowerBound, noun, hasMore)}
        </p>
    )
}

export type WidgetCardSharedPlaceholderCopy = {
    title: string
    message: string
}

/** Shared/public dashboard placeholder when live widget data is not loaded. */
export function WidgetCardSharedPlaceholderBody({ copy }: { copy: WidgetCardSharedPlaceholderCopy }): JSX.Element {
    return (
        <WidgetCardBody>
            <WidgetCardContent>
                <WidgetCardBodyMessage>
                    <div
                        className="flex max-w-xs flex-col items-center gap-2 px-2 text-balance"
                        data-attr="shared-dashboard-widget-placeholder"
                    >
                        <HedgehogChart className="size-20 shrink-0" />
                        <p className="m-0 text-base font-semibold text-primary">{copy.title}</p>
                        <p className="m-0 text-sm text-muted">{copy.message}</p>
                    </div>
                </WidgetCardBodyMessage>
            </WidgetCardContent>
        </WidgetCardBody>
    )
}
