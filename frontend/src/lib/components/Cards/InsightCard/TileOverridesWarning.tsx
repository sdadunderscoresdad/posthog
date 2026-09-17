import { IconFilter, IconWarning } from '@posthog/icons'

import { i18n } from 'lib/i18n/i18n'
import { Tooltip } from 'lib/lemon-ui/Tooltip'

export function TileOverridesWarning(): JSX.Element | null {
    return (
        <Tooltip
            title={
                <div className="flex items-center gap-1">
                    <span>
                        {i18n.t('insightCard.tileFiltersMerge', {
                            defaultValue:
                                "Tile filters merge with the dashboard's, taking precedence where they overlap",
                        })}
                    </span>
                </div>
            }
        >
            <div className="flex items-center gap-1 text-warning">
                <IconWarning /> {i18n.t('insightCard.tileFiltersApplied', { defaultValue: 'Tile filters applied' })}
            </div>
        </Tooltip>
    )
}

export function IgnoresDashboardFiltersNotice(): JSX.Element | null {
    return (
        <Tooltip
            title={i18n.t('insightCard.tileOverridesWarning', {
                defaultValue: "None of the dashboard's filters apply to this insight. Its own tile overrides still do.",
            })}
        >
            <div className="flex items-center gap-1 text-muted-alt">
                <IconFilter />{' '}
                {i18n.t('insightCard.ignoresDashboardFilters', {
                    defaultValue: 'Ignores dashboard filters',
                })}
            </div>
        </Tooltip>
    )
}
