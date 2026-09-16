import { useActions, useValues } from 'kea'
import { Trans, useTranslation } from 'react-i18next'

import { IconFolder, IconHome, IconLock, IconPin, IconPinFilled, IconShare } from '@posthog/icons'

import { AccessControlAction } from 'lib/components/AccessControlAction'
import { BulkUpdateTagsButton } from 'lib/components/BulkActions/BulkUpdateTagsButton'
import { ObjectTags } from 'lib/components/ObjectTags/ObjectTags'
import { i18n } from 'lib/i18n/i18n'
import { LemonButton } from 'lib/lemon-ui/LemonButton'
import { More } from 'lib/lemon-ui/LemonButton/More'
import { LemonDivider } from 'lib/lemon-ui/LemonDivider'
import { LemonRow } from 'lib/lemon-ui/LemonRow'
import { LemonTable, LemonTableColumn, LemonTableColumns } from 'lib/lemon-ui/LemonTable'
import { atColumn, createdAtColumn, createdByColumn } from 'lib/lemon-ui/LemonTable/columnUtils'
import { LemonTableLink } from 'lib/lemon-ui/LemonTable/LemonTableLink'
import { Link } from 'lib/lemon-ui/Link'
import { Tooltip } from 'lib/lemon-ui/Tooltip'
import { accessLevelSatisfied } from 'lib/utils/accessControlUtils'
import { DashboardEventSource } from 'lib/utils/eventUsageLogic'
import { dashboardLogic } from 'scenes/dashboard/dashboardLogic'
import { dashboardsLogic } from 'scenes/dashboard/dashboards/dashboardsLogic'
import { deleteDashboardLogic } from 'scenes/dashboard/deleteDashboardLogic'
import { duplicateDashboardLogic } from 'scenes/dashboard/duplicateDashboardLogic'
import { teamLogic } from 'scenes/teamLogic'
import { urls } from 'scenes/urls'

import { dashboardsModel, nameCompareFunction } from '~/models/dashboardsModel'
import { AccessControlLevel, AccessControlResourceType, DashboardBasicType, DashboardType } from '~/types'

import { UNFILED_DASHBOARDS_FOLDER } from '../dashboardConstants'
import { dashboardCannotEditMessage } from '../DashboardHeader'
import { DashboardsFiltersBar } from './DashboardsFiltersBar'

function BulkMoveToFolderButton({
    ctx,
    filedIds,
    onMove,
}: {
    ctx: { selectedKeys: ReadonlyArray<number>; setSelectedKeys: (keys: ReadonlyArray<number>) => void }
    filedIds: Set<number>
    onMove: (ids: number[], method: 'single' | 'bulk', onStillSelected?: (ids: number[]) => void) => void
}): JSX.Element {
    const movable = ctx.selectedKeys.filter((key) => filedIds.has(key))
    const skipped = ctx.selectedKeys.length - movable.length
    return (
        <LemonButton
            size="small"
            type="secondary"
            onClick={() => onMove([...ctx.selectedKeys], 'bulk', ctx.setSelectedKeys)}
            disabledReason={
                movable.length === 0
                    ? i18n.t('dashboard.list.noneFiled', {
                          defaultValue: 'None of the selected dashboards are filed anywhere yet',
                      })
                    : undefined
            }
            tooltip={
                skipped > 0 && movable.length > 0
                    ? i18n.t('dashboard.list.someNotFiled', {
                          defaultValue:
                              '{{ skipped }} of the {{ total }} selected are not filed anywhere yet, so they stay put',
                          skipped,
                          total: ctx.selectedKeys.length,
                      })
                    : undefined
            }
            data-attr="dashboards-bulk-move-to-folder"
        >
            {skipped > 0 && movable.length > 0
                ? i18n.t('dashboard.list.moveToFolderCount', {
                      defaultValue: 'Move {{ count }} to folder',
                      count: movable.length,
                  })
                : i18n.t('dashboard.list.moveToFolder', { defaultValue: 'Move to folder' })}
        </LemonButton>
    )
}

export function DashboardsTableContainer(): JSX.Element {
    const { dashboardsLoading } = useValues(dashboardsModel)
    const { dashboards } = useValues(dashboardsLogic)

    return <DashboardsTable dashboards={dashboards} dashboardsLoading={dashboardsLoading} />
}

interface DashboardsTableProps {
    dashboards: DashboardBasicType[]
    dashboardsLoading: boolean
    extraActions?: JSX.Element | JSX.Element[]
    hideActions?: boolean
}

export function DashboardsTable({
    dashboards,
    dashboardsLoading,
    extraActions,
    hideActions,
}: DashboardsTableProps): JSX.Element {
    const { t } = useTranslation()
    const { unpinDashboard, pinDashboard } = useActions(dashboardsModel)
    const { tableSortingChanged, setFilters, moveDashboardsToFolder } = useActions(dashboardsLogic)
    const { tableSorting, filters, filedDashboardIds } = useValues(dashboardsLogic)
    // Server-side fuzzy search ranks results by relevance; re-sorting alphabetically by name
    // would push the exact match below partial matches. Suppress the persisted column sort
    // while the user has an active search term.
    const effectiveTableSorting = filters.search ? null : tableSorting
    const { currentTeam } = useValues(teamLogic)
    const { showDuplicateDashboardModal } = useActions(duplicateDashboardLogic)
    const { showDeleteDashboardModal } = useActions(deleteDashboardLogic)

    const columns: LemonTableColumns<DashboardType> = [
        {
            // Fixed-layout table: icon-only columns need an explicit width, otherwise they'd be squeezed to a sliver.
            width: 40,
            dataIndex: 'pinned',
            render: function Render(pinned, { id }) {
                return (
                    <LemonButton
                        size="small"
                        onClick={
                            pinned
                                ? () => unpinDashboard(id, DashboardEventSource.DashboardsList)
                                : () => pinDashboard(id, DashboardEventSource.DashboardsList)
                        }
                        tooltip={
                            pinned
                                ? i18n.t('dashboard.list.unpin', { defaultValue: 'Unpin dashboard' })
                                : i18n.t('dashboard.list.pin', { defaultValue: 'Pin dashboard' })
                        }
                        icon={pinned ? <IconPinFilled /> : <IconPin />}
                    />
                )
            },
        },
        {
            title: 'Name',
            dataIndex: 'name',
            width: '40%',
            render: function Render(_, { id, name, description, is_shared, user_access_level }) {
                const isPrimary = id === currentTeam?.primary_dashboard
                const canEditDashboard = accessLevelSatisfied(
                    AccessControlResourceType.Dashboard,
                    user_access_level,
                    AccessControlLevel.Editor
                )
                return (
                    // Fixed-layout table sizes this cell from the container, so the name truncates within its column
                    // (full name on hover) instead of growing the cell and scrolling the whole table.
                    <div className="min-w-0">
                        <LemonTableLink
                            to={urls.dashboard(id)}
                            truncateTitle
                            title={
                                <>
                                    <Tooltip title={name || t('common.untitled', { defaultValue: 'Untitled' })}>
                                        <span data-attr="dashboard-name" className="truncate min-w-0">
                                            {name || t('common.untitled', { defaultValue: 'Untitled' })}
                                        </span>
                                    </Tooltip>
                                    {is_shared && (
                                        <Tooltip
                                            title={t('dashboard.table.sharedPublicly', {
                                                defaultValue: 'This dashboard is shared publicly.',
                                            })}
                                        >
                                            <IconShare className="ml-1 text-base text-link" />
                                        </Tooltip>
                                    )}
                                    {!canEditDashboard && (
                                        <Tooltip title={dashboardCannotEditMessage()}>
                                            <IconLock className="ml-1 text-base text-secondary" />
                                        </Tooltip>
                                    )}
                                    {isPrimary && (
                                        <Tooltip
                                            title={t('dashboard.table.primaryHint', {
                                                defaultValue:
                                                    'The primary dashboard is shown on the project home page.',
                                            })}
                                        >
                                            <span>
                                                <IconHome className="ml-1 text-base text-warning" />
                                            </span>
                                        </Tooltip>
                                    )}
                                </>
                            }
                            description={
                                description ? (
                                    <Tooltip title={description}>
                                        <span className="block truncate max-w-[30rem]">{description}</span>
                                    </Tooltip>
                                ) : undefined
                            }
                        />
                    </div>
                )
            },
            sorter: nameCompareFunction,
        },
        {
            title: 'Tags',
            dataIndex: 'tags' as keyof DashboardType,
            render: function Render(tags: DashboardType['tags']) {
                return tags ? (
                    <ObjectTags
                        tags={[...tags].sort()}
                        staticOnly
                        maxVisibleTags={5}
                        data-attr="dashboard-tags"
                        onTagClick={(tag) => setFilters({ tags: [tag] })}
                    />
                ) : null
            },
        } as LemonTableColumn<DashboardType, keyof DashboardType | undefined>,
        {
            title: 'Folder',
            dataIndex: 'folder' as keyof DashboardType,
            render: function Render(folder: DashboardType['folder']) {
                // Unfiled dashboards live in the default `Unfiled/Dashboards` folder — that's not a folder
                // the user chose, so show nothing rather than a filter affordance.
                if (folder === null || folder === undefined || folder === UNFILED_DASHBOARDS_FOLDER) {
                    return <span className="text-secondary">—</span>
                }
                const label = folder || i18n.t('dashboard.list.projectRoot', { defaultValue: 'Project root' })
                return (
                    <Tooltip
                        title={i18n.t('dashboard.list.filterToFolder', {
                            defaultValue: 'Filter to dashboards in {{ folder }}',
                            folder: label,
                        })}
                    >
                        <Link
                            className="flex items-center gap-1 text-secondary max-w-[10rem]"
                            onClick={() => setFilters({ folder })}
                        >
                            <IconFolder className="shrink-0" />
                            <span className="truncate">{label}</span>
                        </Link>
                    </Tooltip>
                )
            },
        } as LemonTableColumn<DashboardType, keyof DashboardType | undefined>,
        createdByColumn<DashboardType>() as LemonTableColumn<DashboardType, keyof DashboardType | undefined>,
        createdAtColumn<DashboardType>() as LemonTableColumn<DashboardType, keyof DashboardType | undefined>,
        atColumn<DashboardType>(
            'last_accessed_at',
            i18n.t('dashboard.list.lastAccessedAt', { defaultValue: 'Last accessed at' })
        ) as LemonTableColumn<DashboardType, keyof DashboardType | undefined>,
        atColumn<DashboardType>(
            'last_viewed_at',
            i18n.t('dashboard.list.youLastViewed', { defaultValue: 'You last viewed' })
        ) as LemonTableColumn<DashboardType, keyof DashboardType | undefined>,
        hideActions
            ? {}
            : {
                  // Fixed-layout table: give the actions menu a fixed width so it isn't squeezed to a sliver.
                  width: 48,
                  render: function RenderActions(_, dashboard: DashboardType) {
                      const { id, name, user_access_level } = dashboard
                      return (
                          <More
                              overlay={
                                  <>
                                      <LemonButton
                                          to={urls.dashboard(id)}
                                          onClick={() => {
                                              dashboardLogic({ id }).mount()
                                              dashboardLogic({ id }).actions.setDashboardMode(
                                                  null,
                                                  DashboardEventSource.DashboardsList
                                              )
                                          }}
                                          fullWidth
                                      >
                                          {t('dashboard.table.view', { defaultValue: 'View' })}
                                      </LemonButton>

                                      <AccessControlAction
                                          resourceType={AccessControlResourceType.Dashboard}
                                          minAccessLevel={AccessControlLevel.Editor}
                                          userAccessLevel={user_access_level}
                                      >
                                          <LemonButton
                                              to={urls.dashboard(id)}
                                              onClick={() => {
                                                  dashboardLogic({ id }).mount()
                                                  dashboardLogic({ id }).actions.setDashboardEditing(
                                                      { filters: true, layout: true },
                                                      DashboardEventSource.DashboardsList
                                                  )
                                              }}
                                              fullWidth
                                          >
                                              {t('dashboard.table.edit', { defaultValue: 'Edit' })}
                                          </LemonButton>
                                      </AccessControlAction>

                                      <LemonButton
                                          onClick={() => {
                                              showDuplicateDashboardModal(id, name)
                                          }}
                                          fullWidth
                                      >
                                          {t('dashboard.menuBar.duplicate', { defaultValue: 'Duplicate' })}
                                      </LemonButton>

                                      <AccessControlAction
                                          resourceType={AccessControlResourceType.Dashboard}
                                          minAccessLevel={AccessControlLevel.Editor}
                                          userAccessLevel={user_access_level}
                                      >
                                          <LemonButton
                                              onClick={() => moveDashboardsToFolder([id], 'single')}
                                              disabledReason={
                                                  filedDashboardIds.has(id)
                                                      ? undefined
                                                      : t('dashboard.table.notFiled', {
                                                            defaultValue: 'This dashboard is not filed anywhere yet',
                                                        })
                                              }
                                              fullWidth
                                              data-attr="dashboard-move-to-folder"
                                          >
                                              {t('dashboard.table.moveToFolder', {
                                                  defaultValue: 'Move to another folder',
                                              })}
                                          </LemonButton>
                                      </AccessControlAction>

                                      <LemonDivider />

                                      <LemonRow
                                          icon={<IconHome className="size-4 text-warning" />}
                                          fullWidth
                                          status="warning"
                                      >
                                          <span className="text-secondary">
                                              <Trans i18nKey="dashboard.table.changeDefault">
                                                  Change the default dashboard from the{' '}
                                                  <Link to={urls.projectHomepage()}>project home page</Link>.
                                              </Trans>
                                          </span>
                                      </LemonRow>

                                      <LemonDivider />

                                      <AccessControlAction
                                          resourceType={AccessControlResourceType.Dashboard}
                                          minAccessLevel={AccessControlLevel.Editor}
                                          userAccessLevel={user_access_level}
                                      >
                                          <LemonButton
                                              onClick={() => showDeleteDashboardModal(id)}
                                              fullWidth
                                              status="danger"
                                          >
                                              {t('dashboard.menuBar.delete', { defaultValue: 'Delete dashboard' })}
                                          </LemonButton>
                                      </AccessControlAction>
                                  </>
                              }
                          />
                      )
                  },
              },
    ]

    return (
        <>
            <DashboardsFiltersBar extraActions={extraActions} />
            <LemonTable
                data-attr="dashboards-table"
                pagination={{ pageSize: 50 }}
                dataSource={dashboards as DashboardType[]}
                rowKey="id"
                rowClassName={(record) => (record._highlight ? 'highlighted' : null)}
                tableLayout="fixed"
                columns={columns}
                loading={dashboardsLoading}
                defaultSorting={effectiveTableSorting}
                onSort={tableSortingChanged}
                emptyState={i18n.t('dashboard.list.empty', { defaultValue: 'No dashboards matching your filters!' })}
                nouns={['dashboard', 'dashboards']}
                bulkSelection={{
                    barClassName: 'mb-2',
                    getKey: (dashboard: DashboardType): number => dashboard.id,
                    isRowSelectable: (dashboard: DashboardType) =>
                        accessLevelSatisfied(
                            AccessControlResourceType.Dashboard,
                            dashboard.user_access_level,
                            AccessControlLevel.Editor
                        )
                            ? true
                            : { disabledReason: dashboardCannotEditMessage() },
                    rowAriaLabel: (dashboard: DashboardType) =>
                        i18n.t('dashboard.list.selectRow', {
                            defaultValue: 'Select dashboard {{ name }}',
                            name: dashboard.name,
                        }),
                    headerAriaLabel: i18n.t('dashboard.list.selectAll', {
                        defaultValue: 'Select all dashboards on this page',
                    }),
                    renderActions: (ctx) => (
                        <>
                            <BulkMoveToFolderButton
                                ctx={ctx}
                                filedIds={filedDashboardIds}
                                onMove={moveDashboardsToFolder}
                            />
                            <BulkUpdateTagsButton
                                resource="dashboards"
                                selectedIds={ctx.selectedKeys}
                                onSuccess={() => {
                                    ctx.clearSelection()
                                    dashboardsModel.actions.loadDashboards()
                                }}
                            />
                        </>
                    ),
                }}
            />
        </>
    )
}
