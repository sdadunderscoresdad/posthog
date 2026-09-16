import { useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { LemonTag, Tooltip } from '@posthog/lemon-ui'

import { useFormatters } from 'lib/i18n/useFormatters'
import { IconRobot } from 'lib/lemon-ui/icons'
import { CATEGORY_LABELS } from 'lib/utils/botDetection'

import { LiveEvent } from '~/types'

const TOP_BOT_LIMIT = 5

interface BotTotals {
    total: number
    byName: Map<string, { name: string; category: string; count: number }>
}

const aggregateBots = (events: LiveEvent[]): BotTotals => {
    const byName = new Map<string, { name: string; category: string; count: number }>()
    let total = 0

    for (const event of events) {
        if (!event.properties?.$virt_is_bot) {
            continue
        }
        const botName = event.properties.$virt_bot_name as string | undefined
        const botCategory = event.properties.$virt_traffic_category as string | undefined

        if (!botName) {
            continue
        }
        total += 1
        const categoryLabel = (CATEGORY_LABELS as Record<string, string>)[botCategory ?? ''] ?? botCategory ?? ''
        const existing = byName.get(botName)
        if (existing) {
            existing.count += 1
        } else {
            byName.set(botName, {
                name: botName,
                category: categoryLabel,
                count: 1,
            })
        }
    }

    return { total, byName }
}

export interface LiveBotPanelProps {
    events: LiveEvent[]
    className?: string
}

export function LiveBotPanel({ events, className }: LiveBotPanelProps): JSX.Element | null {
    const { t } = useTranslation()
    const { percent } = useFormatters()
    const { total, byName } = useMemo(() => aggregateBots(events), [events])

    if (events.length === 0) {
        return null
    }

    const topBots = [...byName.values()].sort((a, b) => b.count - a.count).slice(0, TOP_BOT_LIMIT)
    const regularCount = events.length - total
    const botShare = events.length > 0 ? (total / events.length) * 100 : 0

    return (
        <div
            className={`flex flex-wrap items-center gap-2 rounded-md border border-border bg-bg-light px-3 py-2 text-xs ${
                className ?? ''
            }`}
        >
            <Tooltip
                title={t('activity.live.bots.detectionTooltip', {
                    defaultValue:
                        'Bot detection is based on known user agent patterns for crawlers, AI agents, monitoring tools and automation frameworks.',
                })}
            >
                <span className="flex items-center gap-1 font-medium text-default">
                    <IconRobot className="text-sm text-muted" />
                    {t('activity.live.bots.traffic', { defaultValue: 'Bot traffic' })}
                </span>
            </Tooltip>

            <span className="tabular-nums text-muted">
                <Trans
                    i18nKey="activity.live.bots.summary"
                    values={{
                        botEvents: total.toLocaleString(),
                        totalEvents: events.length.toLocaleString(),
                        share: percent(botShare / 100, {
                            maximumFractionDigits: botShare < 10 ? 1 : 0,
                        }),
                    }}
                    components={{ BotCount: <span className="font-medium text-default" /> }}
                    defaults="<BotCount>{{ botEvents }}</BotCount> bot events of {{ totalEvents }} · {{ share }}"
                />
            </span>

            {regularCount > 0 && (
                <span className="text-muted hidden sm:inline">
                    {t('activity.live.bots.regular', {
                        defaultValue: '({{ value }} regular)',
                        value: regularCount.toLocaleString(),
                    })}
                </span>
            )}

            {topBots.length > 0 && (
                <>
                    <span className="text-muted">·</span>
                    <div className="flex flex-wrap items-center gap-1">
                        {topBots.map((bot) => (
                            <Tooltip
                                key={bot.name}
                                title={t('activity.live.bots.tooltip', {
                                    defaultValue: '{{ count }} events · {{ category }}',
                                    count: bot.count,
                                    category: bot.category,
                                })}
                            >
                                <LemonTag type="muted" size="small" className="text-[11px]">
                                    {bot.name} · {bot.count.toLocaleString()}
                                </LemonTag>
                            </Tooltip>
                        ))}
                        {byName.size > TOP_BOT_LIMIT && (
                            <span className="text-muted">
                                {t('activity.live.bots.more', {
                                    defaultValue: '+{{ value }} more',
                                    value: byName.size - TOP_BOT_LIMIT,
                                })}
                            </span>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
