import { useActions, useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { IconRefresh } from '@posthog/icons'

import { CodeSnippet, Language } from 'lib/components/CodeSnippet'
import { LemonButton } from 'lib/lemon-ui/LemonButton'
import { LemonInput } from 'lib/lemon-ui/LemonInput'
import { LemonModal } from 'lib/lemon-ui/LemonModal'
import { LemonSegmentedButton } from 'lib/lemon-ui/LemonSegmentedButton'
import { LemonTable, LemonTableColumns } from 'lib/lemon-ui/LemonTable'
import { LemonTag, LemonTagType } from 'lib/lemon-ui/LemonTag/LemonTag'
import { PaginationManual } from 'lib/lemon-ui/PaginationControl'

import { SCIMRequestLogApi } from '~/generated/core/api.schemas'

import { verifiedDomainsLogic } from './verifiedDomainsLogic'

function statusTagType(status: number): LemonTagType {
    if (status >= 200 && status < 300) {
        return 'success'
    }
    if (status >= 400 && status < 500) {
        return 'warning'
    }
    if (status >= 500) {
        return 'danger'
    }
    return 'default'
}

function LogDetailExpanded({ log }: { log: SCIMRequestLogApi }): JSX.Element {
    const { t } = useTranslation()
    return (
        <div className="space-y-4 p-4">
            <div>
                <h4 className="font-semibold mb-1">
                    {t('settings.organization.verifiedDomains.scimLogs.requestHeaders', {
                        defaultValue: 'Request headers',
                    })}
                </h4>
                <CodeSnippet language={Language.JSON} wrap>
                    {JSON.stringify(log.request_headers, null, 2)}
                </CodeSnippet>
            </div>
            {log.request_body ? (
                <div>
                    <h4 className="font-semibold mb-1">
                        {t('settings.organization.verifiedDomains.scimLogs.requestBody', {
                            defaultValue: 'Request body',
                        })}
                    </h4>
                    <CodeSnippet language={Language.JSON} wrap>
                        {JSON.stringify(log.request_body, null, 2)}
                    </CodeSnippet>
                </div>
            ) : null}
            {log.response_body ? (
                <div>
                    <h4 className="font-semibold mb-1">
                        {t('settings.organization.verifiedDomains.scimLogs.responseBody', {
                            defaultValue: 'Response body',
                        })}
                    </h4>
                    <CodeSnippet language={Language.JSON} wrap>
                        {JSON.stringify(log.response_body, null, 2)}
                    </CodeSnippet>
                </div>
            ) : null}
        </div>
    )
}

export function ScimLogsModal({
    emptyStateScope = 'domain',
}: {
    emptyStateScope?: 'domain' | 'configuration'
}): JSX.Element {
    const { t } = useTranslation()
    const { scimLogsModalId, scimLogs, scimLogsLoading, scimLogsStatusFilter, scimLogsSearch, scimLogsPage } =
        useValues(verifiedDomainsLogic)
    const { setScimLogsModalId, setScimLogsStatusFilter, setScimLogsSearch, setScimLogsPage, reloadScimLogs } =
        useActions(verifiedDomainsLogic)

    const columns: LemonTableColumns<SCIMRequestLogApi> = [
        {
            key: 'created_at',
            title: t('settings.organization.verifiedDomains.scimLogs.columns.time', { defaultValue: 'Time' }),
            render: (_, { created_at }) => new Date(created_at).toLocaleString(),
        },
        {
            key: 'request_method',
            title: t('settings.organization.verifiedDomains.scimLogs.columns.method', { defaultValue: 'Method' }),
            dataIndex: 'request_method',
        },
        {
            key: 'request_path',
            title: t('settings.organization.verifiedDomains.scimLogs.columns.path', { defaultValue: 'Path' }),
            dataIndex: 'request_path',
        },
        {
            key: 'response_status',
            title: t('settings.organization.verifiedDomains.scimLogs.columns.status', { defaultValue: 'Status' }),
            render: (_, { response_status }) => (
                <LemonTag type={statusTagType(response_status)}>{response_status}</LemonTag>
            ),
        },
        {
            key: 'identity_provider',
            title: t('settings.organization.verifiedDomains.scimLogs.columns.idp', { defaultValue: 'IdP' }),
            dataIndex: 'identity_provider',
        },
        {
            key: 'duration_ms',
            title: t('settings.organization.verifiedDomains.scimLogs.columns.duration', { defaultValue: 'Duration' }),
            render: (_, { duration_ms }) => (duration_ms !== null ? `${duration_ms}ms` : '–'),
        },
    ]

    const pagination: PaginationManual | undefined = scimLogs
        ? {
              controlled: true,
              pageSize: 20,
              currentPage: scimLogsPage,
              entryCount: scimLogs.count,
              onForward: scimLogs.next ? () => setScimLogsPage(scimLogsPage + 1) : undefined,
              onBackward: scimLogs.previous ? () => setScimLogsPage(scimLogsPage - 1) : undefined,
          }
        : undefined

    const handleClose = (): void => setScimLogsModalId(null)

    return (
        <LemonModal
            onClose={handleClose}
            isOpen={!!scimLogsModalId}
            title={t('settings.organization.verifiedDomains.scimLogs.title', { defaultValue: 'SCIM request logs' })}
            width={960}
        >
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <LemonSegmentedButton
                        value={scimLogsStatusFilter}
                        onChange={(value) => setScimLogsStatusFilter(value)}
                        options={[
                            {
                                value: 'all',
                                label: t('settings.organization.verifiedDomains.scimLogs.filters.all', {
                                    defaultValue: 'All',
                                }),
                            },
                            {
                                value: 'success',
                                label: t('settings.organization.verifiedDomains.scimLogs.filters.success', {
                                    defaultValue: 'Success',
                                }),
                            },
                            { value: '4xx', label: '4xx' },
                            { value: '5xx', label: '5xx' },
                        ]}
                        size="small"
                    />
                    <LemonInput
                        type="search"
                        placeholder={t('settings.organization.verifiedDomains.scimLogs.searchPlaceholder', {
                            defaultValue: 'Search by path or email...',
                        })}
                        value={scimLogsSearch}
                        onChange={setScimLogsSearch}
                        className="max-w-60"
                        size="small"
                    />
                    <LemonButton
                        className="ml-auto"
                        type="secondary"
                        size="small"
                        icon={<IconRefresh />}
                        onClick={reloadScimLogs}
                        loading={scimLogsLoading}
                    >
                        {t('settings.organization.verifiedDomains.scimLogs.refresh', { defaultValue: 'Refresh' })}
                    </LemonButton>
                </div>

                <LemonTable
                    dataSource={scimLogs?.results ?? []}
                    columns={columns}
                    loading={scimLogsLoading}
                    rowKey="id"
                    pagination={pagination}
                    expandable={{
                        expandedRowRender: (log) => <LogDetailExpanded log={log} />,
                    }}
                    emptyState={
                        scimLogsStatusFilter !== 'all' || scimLogsSearch
                            ? t('settings.organization.verifiedDomains.scimLogs.noMatches', {
                                  defaultValue: 'No SCIM requests match the current filters.',
                              })
                            : t('settings.organization.verifiedDomains.scimLogs.empty', {
                                  defaultValue: 'No SCIM requests logged yet for this {{ scope }}.',
                                  scope:
                                      emptyStateScope === 'domain'
                                          ? t('settings.organization.verifiedDomains.scimLogs.scopeDomain', {
                                                defaultValue: 'domain',
                                            })
                                          : t('settings.organization.verifiedDomains.scimLogs.scopeConfiguration', {
                                                defaultValue: 'configuration',
                                            }),
                              })
                    }
                />
            </div>
        </LemonModal>
    )
}
