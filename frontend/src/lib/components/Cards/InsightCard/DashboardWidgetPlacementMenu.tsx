import { useCallback, useState } from 'react'

import { i18n } from 'lib/i18n/i18n'
import { LemonButton } from 'lib/lemon-ui/LemonButton'
import { LemonInput } from 'lib/lemon-ui/LemonInput'
import { LemonMenu, LemonMenuItem, LemonMenuItems } from 'lib/lemon-ui/LemonMenu'

import type { DashboardBasicType } from '~/types'

export interface DashboardWidgetPlacementDestination {
    dashboard: DashboardBasicType
    /** When set, the row is disabled and this explains why (e.g. widget already on that dashboard). */
    disabledReason?: string
}

interface DashboardWidgetPlacementMenuProps {
    destinations: DashboardWidgetPlacementDestination[]
    onSelect: (dashboard: DashboardBasicType) => void
    /** Submenu trigger label (e.g. "Move to" vs "Copy to"). */
    label?: string
    /** When there are no destinations, the trigger stays visible but disabled (avoids hiding the action). */
    emptyDisabledReason?: string
}

export function DashboardWidgetPlacementMenu({
    destinations,
    onSelect,
    label,
    emptyDisabledReason,
}: DashboardWidgetPlacementMenuProps): JSX.Element {
    const [searchTerm, setSearchTermState] = useState('')

    const handleSearchChange = useCallback((value: string) => {
        setSearchTermState(value)
    }, [])

    // TODO: make use Fuse search (might be overkill though)
    const filteredDestinations =
        searchTerm.trim() === ''
            ? destinations
            : destinations.filter((entry) =>
                  (entry.dashboard.name || i18n.t('common.untitled', { defaultValue: 'Untitled' }))
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
              )

    const SearchInputLabel = useCallback(() => {
        return (
            <div className="px-2 pt-2 pb-1">
                <LemonInput
                    type="search"
                    placeholder={i18n.t('insightCard.searchDashboards', { defaultValue: 'Search dashboards' })}
                    value={searchTerm}
                    onChange={handleSearchChange}
                    size="small"
                    fullWidth
                    allowClear
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                />
            </div>
        )
    }, [handleSearchChange, searchTerm])

    const searchItem: LemonMenuItem = {
        custom: true,
        label: SearchInputLabel,
    }

    const items: LemonMenuItems =
        filteredDestinations.length > 0
            ? [
                  { items: [searchItem] },
                  {
                      items: filteredDestinations.map(({ dashboard, disabledReason }) => ({
                          label: disabledReason ? (
                              <span className="flex flex-col items-start gap-0.5 text-left">
                                  <span>
                                      {dashboard.name || (
                                          <i>{i18n.t('common.untitled', { defaultValue: 'Untitled' })}</i>
                                      )}
                                  </span>
                                  <span className="text-xs font-normal text-muted">{disabledReason}</span>
                              </span>
                          ) : (
                              dashboard.name || <i>{i18n.t('common.untitled', { defaultValue: 'Untitled' })}</i>
                          ),
                          key: dashboard.id,
                          // Use `disabled` only: `disabledReason` on LemonButton adds a redundant tooltip when the label already explains why.
                          disabled: !!disabledReason,
                          onClick: () => {
                              if (disabledReason) {
                                  return
                              }
                              onSelect(dashboard)
                              setSearchTermState('')
                          },
                      })),
                  },
              ]
            : [
                  {
                      items: [
                          searchItem,
                          {
                              label: i18n.t('insightCard.noMatchingDashboards', {
                                  defaultValue: 'No dashboards match this search',
                              }),
                              key: 'no-results',
                          },
                      ],
                  },
              ]

    if (!destinations.length) {
        return (
            <LemonButton fullWidth disabledReason={emptyDisabledReason}>
                {label}
            </LemonButton>
        )
    }

    return (
        <LemonMenu
            items={items}
            placement="right-start"
            fallbackPlacements={['left-start']}
            closeParentPopoverOnClickInside
        >
            <LemonButton fullWidth>{label}</LemonButton>
        </LemonMenu>
    )
}
