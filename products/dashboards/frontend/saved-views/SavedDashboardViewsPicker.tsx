import { useState } from 'react'

import { IconCheck, IconChevronDown, IconPeople, IconPlus, IconUser } from '@posthog/icons'
import { LemonButton, LemonSkeleton, LemonTag, Popover } from '@posthog/lemon-ui'

import { i18n } from 'lib/i18n/i18n'
import { LemonTabs } from 'lib/lemon-ui/LemonTabs'

import type {
    DashboardListSavedView,
    DashboardSavedViewCursors,
    DashboardSavedViewScope,
} from './dashboardSavedViewsLogic'

export interface SavedDashboardViewsPickerProps {
    activeSavedView: DashboardListSavedView | undefined
    activeSavedViewHasUnsavedChanges: boolean
    isFiltering: boolean
    savedViews: DashboardListSavedView[]
    nextCursors: DashboardSavedViewCursors
    loadingMore: boolean
    updatingSavedView: boolean
    loading: boolean
    loadError: boolean
    loadMoreFailed: boolean
    canEdit: boolean
    defaultOpen?: boolean
    onSaveAsNewView: () => void
    onSaveChanges: (view: DashboardListSavedView) => void
    onSelectView: (view: DashboardListSavedView) => void
    onManageViews: () => void
    onLoadMore: (scope: DashboardSavedViewScope) => void
    onRetryLoad: () => void
}

export function SavedDashboardViewsPicker({
    activeSavedView,
    activeSavedViewHasUnsavedChanges,
    isFiltering,
    savedViews,
    nextCursors,
    loadingMore,
    updatingSavedView,
    loading,
    loadError,
    loadMoreFailed,
    canEdit,
    defaultOpen = false,
    onSaveAsNewView,
    onSaveChanges,
    onSelectView,
    onManageViews,
    onLoadMore,
    onRetryLoad,
}: SavedDashboardViewsPickerProps): JSX.Element {
    const [scope, setScope] = useState<DashboardSavedViewScope>(activeSavedView?.scope ?? 'private')
    const [visible, setVisible] = useState(defaultOpen)
    const privateSavedViews = savedViews
        .filter((view) => view.scope === 'private')
        .sort((left, right) => left.name.localeCompare(right.name))
    const teamSavedViews = savedViews
        .filter((view) => view.scope === 'team')
        .sort((left, right) => left.name.localeCompare(right.name))
    const selectedSavedViews = scope === 'private' ? privateSavedViews : teamSavedViews
    const hasMore = nextCursors[scope] !== null
    const hasSavedViews = savedViews.length > 0
    const tooltip = activeSavedView?.name || i18n.t('dashboardSavedViews.savedViews', { defaultValue: 'Saved views' })
    const emptyScopeMessage =
        scope === 'private'
            ? i18n.t('dashboardSavedViews.noPrivateViews', { defaultValue: 'No private views yet.' })
            : i18n.t('dashboardSavedViews.noTeamViews', { defaultValue: 'No team views yet.' })
    let triggerIcon: JSX.Element | undefined
    if (activeSavedView) {
        triggerIcon = activeSavedView.scope === 'private' ? <IconUser /> : <IconPeople />
    }

    const closePicker = (): void => {
        setVisible(false)
    }

    return (
        <Popover
            visible={visible}
            padded={false}
            onClickOutside={closePicker}
            overlay={
                <div className="flex w-72 flex-col py-1" data-attr="dashboard-saved-views-popover">
                    {canEdit && activeSavedViewHasUnsavedChanges && activeSavedView && (
                        <LemonButton
                            fullWidth
                            size="small"
                            type="tertiary"
                            className="h-auto justify-start rounded-none px-2 py-2 text-left"
                            icon={<IconCheck className="text-primary" />}
                            loading={updatingSavedView}
                            onClick={() => onSaveChanges(activeSavedView)}
                        >
                            <span className="flex flex-col items-start gap-1">
                                <span className="font-semibold text-primary">
                                    {i18n.t('dashboardSavedViews.saveChanges', { defaultValue: 'Save changes' })}
                                </span>
                                <span className="text-xs font-normal text-secondary">
                                    {i18n.t('dashboardSavedViews.filtersDiffer', {
                                        name: activeSavedView.name,
                                        defaultValue: "Current filters differ from '{{ name }}'",
                                    })}
                                </span>
                            </span>
                        </LemonButton>
                    )}
                    {canEdit && isFiltering && (
                        <LemonButton
                            size="small"
                            fullWidth
                            type="tertiary"
                            className="h-auto justify-start rounded-none px-2 py-2 text-left"
                            icon={<IconPlus />}
                            onClick={() => {
                                closePicker()
                                onSaveAsNewView()
                            }}
                        >
                            <span className="flex flex-col items-start gap-1">
                                <span className="font-semibold">
                                    {i18n.t('dashboardSavedViews.saveAsNewView', { defaultValue: 'Save as new view' })}
                                </span>
                                <span className="text-xs font-normal text-secondary">
                                    {i18n.t('dashboardSavedViews.createFromFilters', {
                                        defaultValue: 'Create a new view from these filters',
                                    })}
                                </span>
                            </span>
                        </LemonButton>
                    )}
                    {(activeSavedView || isFiltering) && <div className="mx-3 border-t" />}
                    {loading && (
                        <div
                            className="space-y-2 px-3 py-2"
                            role="status"
                            aria-label={i18n.t('dashboardSavedViews.loadingSavedViews', {
                                defaultValue: 'Loading saved views',
                            })}
                        >
                            <LemonSkeleton repeat={3} className="h-8" />
                        </div>
                    )}
                    {!loading && loadError && (
                        <LemonButton
                            fullWidth
                            size="small"
                            type="tertiary"
                            className="justify-start rounded-none px-3"
                            onClick={onRetryLoad}
                        >
                            {i18n.t('dashboardSavedViews.loadFailed', {
                                defaultValue: 'Could not load saved views. Retry',
                            })}
                        </LemonButton>
                    )}
                    {!loading && !loadError && !hasSavedViews && !isFiltering && (
                        <div className="px-3 py-2 text-sm text-secondary">
                            {i18n.t('dashboardSavedViews.addFilterToCreate', {
                                defaultValue: 'Add a filter to create a saved view.',
                            })}
                        </div>
                    )}
                    {!loading && hasSavedViews && (
                        <>
                            <LemonTabs<DashboardSavedViewScope>
                                size="small"
                                activeKey={scope}
                                onChange={setScope}
                                className="px-3"
                                tabs={[
                                    {
                                        key: 'private',
                                        label: (
                                            <span className="flex items-center gap-1">
                                                {i18n.t('dashboardSavedViews.privateViews', {
                                                    defaultValue: 'Private views',
                                                })}
                                                {activeSavedView?.scope === 'private' && (
                                                    <IconCheck className="text-success" />
                                                )}
                                            </span>
                                        ),
                                    },
                                    {
                                        key: 'team',
                                        label: (
                                            <span className="flex items-center gap-1">
                                                {i18n.t('dashboardSavedViews.sharedWithTeam', {
                                                    defaultValue: 'Shared with team',
                                                })}
                                                {activeSavedView != null && activeSavedView.scope !== 'private' && (
                                                    <IconCheck className="text-success" />
                                                )}
                                            </span>
                                        ),
                                    },
                                ]}
                            />
                            <div className="max-h-64 overflow-y-auto">
                                {selectedSavedViews.length === 0 ? (
                                    <div className="px-3 py-3 text-sm text-secondary">{emptyScopeMessage}</div>
                                ) : (
                                    selectedSavedViews.map((view) => (
                                        <LemonButton
                                            key={view.id}
                                            fullWidth
                                            size="small"
                                            type="tertiary"
                                            className="justify-start rounded-none px-3 hover:!bg-fill-secondary"
                                            sideIcon={
                                                activeSavedView?.id === view.id ? (
                                                    <IconCheck className="text-success" />
                                                ) : null
                                            }
                                            onClick={() => {
                                                onSelectView(view)
                                                closePicker()
                                            }}
                                            tooltip={
                                                activeSavedView?.id === view.id
                                                    ? i18n.t('dashboardSavedViews.clearSelectedView', {
                                                          defaultValue: 'Clear selected view',
                                                      })
                                                    : undefined
                                            }
                                        >
                                            <span className="truncate">{view.name}</span>
                                        </LemonButton>
                                    ))
                                )}
                                {hasMore && (
                                    <div className="border-t p-2">
                                        <LemonButton
                                            fullWidth
                                            center
                                            size="small"
                                            type="secondary"
                                            loading={loadingMore}
                                            onClick={() => onLoadMore(scope)}
                                            data-attr="load-more-dashboard-saved-views"
                                        >
                                            {loadMoreFailed
                                                ? i18n.t('dashboardSavedViews.loadMoreFailed', {
                                                      defaultValue: 'Could not load more views. Retry',
                                                  })
                                                : i18n.t('dashboardSavedViews.loadMore', {
                                                      defaultValue: 'Load more views',
                                                  })}
                                        </LemonButton>
                                    </div>
                                )}
                            </div>
                            {canEdit && (
                                <div className="border-t">
                                    <LemonButton
                                        fullWidth
                                        size="small"
                                        type="tertiary"
                                        className="justify-start rounded-none px-3"
                                        onClick={() => {
                                            closePicker()
                                            onManageViews()
                                        }}
                                    >
                                        {i18n.t('dashboardSavedViews.manageViews', { defaultValue: 'Manage views' })}
                                    </LemonButton>
                                </div>
                            )}
                        </>
                    )}
                </div>
            }
        >
            <LemonButton
                size="small"
                type="secondary"
                data-attr="dashboard-saved-views-picker"
                icon={triggerIcon}
                sideIcon={<IconChevronDown />}
                tooltip={tooltip}
                aria-label={tooltip}
                onClick={() => {
                    if (!visible && activeSavedView) {
                        setScope(activeSavedView.scope ?? 'team')
                    }
                    setVisible(!visible)
                }}
            >
                <span className="flex items-center gap-1">
                    <span>
                        {activeSavedView?.name ||
                            i18n.t('dashboardSavedViews.savedViews', { defaultValue: 'Saved views' })}
                    </span>
                    {!activeSavedView && (
                        <LemonTag type="highlight" size="small">
                            {i18n.t('common.new', { defaultValue: 'New' })}
                        </LemonTag>
                    )}
                    {canEdit && activeSavedViewHasUnsavedChanges && (
                        <span className="text-warning">
                            {i18n.t('dashboardSavedViews.unsaved', { defaultValue: 'Unsaved' })}
                        </span>
                    )}
                </span>
            </LemonButton>
        </Popover>
    )
}
