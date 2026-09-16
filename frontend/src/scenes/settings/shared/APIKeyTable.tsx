import { useTranslation } from 'react-i18next'

import { IconEllipsis } from '@posthog/icons'
import { LemonButton, LemonDialog, LemonMenu, LemonTable, LemonTableColumn, LemonTag, Tooltip } from '@posthog/lemon-ui'

import { Link } from 'lib/lemon-ui/Link'
import { detailedTime, humanFriendlyDetailedTime } from 'lib/utils/datetime'

export interface APIKeyTableRow {
    id: string
    label: string
    mask_value?: string | null
    scopes: string[]
    created_at: string
    created_by?: {
        email: string
        first_name?: string
    } | null
    last_used_at: string | null
    last_rolled_at: string | null
}

interface APIKeyTableProps<T extends APIKeyTableRow = APIKeyTableRow> {
    keys: T[]
    loading: boolean
    onEdit: (id: string) => void
    onRoll: (id: string) => void
    onDelete: (id: string) => void
    noun: string
    showCreatedBy?: boolean
    showActions?: boolean

    /** Render override for the label cell — defaults to a plain Link that opens the edit modal. */
    renderLabel?: (key: T) => JSX.Element
    /** Render override for the secret-key (mask_value) cell — defaults to a monospace span. */
    renderMaskValue?: (key: T) => JSX.Element
    /** Render override for the scopes cell — defaults to a TagList. */
    renderScopes?: (key: T) => JSX.Element
    /** Extra columns inserted between Label and Secret key. */
    extraColumnsAfterLabel?: LemonTableColumn<T, any>[]
    /** Extra columns inserted between Scopes and Last used. */
    extraColumnsAfterScopes?: LemonTableColumn<T, any>[]
    /** Per-row className (e.g. for opacity on disabled keys). */
    rowClassName?: (key: T) => string
    /** Override the delete dialog description. */
    deleteDescription?: string
}

function TagList({ tags, onMoreClick }: { tags: string[]; onMoreClick: () => void }): JSX.Element {
    const { t } = useTranslation()
    return (
        <span className="flex flex-wrap gap-1">
            {tags.slice(0, 4).map((x) => (
                <LemonTag key={x}>{x}</LemonTag>
            ))}
            {tags.length > 4 && (
                <Tooltip title={tags.slice(4).join(', ')}>
                    <LemonTag onClick={onMoreClick}>
                        {t('settings.apiKeys.moreTags', {
                            defaultValue: '+{{ number }} more',
                            number: tags.length - 4,
                        })}
                    </LemonTag>
                </Tooltip>
            )}
        </span>
    )
}

export function APIKeyTable<T extends APIKeyTableRow = APIKeyTableRow>({
    keys,
    loading,
    onEdit,
    onRoll,
    onDelete,
    noun,
    showCreatedBy = false,
    showActions = false,
    renderLabel,
    renderMaskValue,
    renderScopes,
    extraColumnsAfterLabel,
    extraColumnsAfterScopes,
    rowClassName,
    deleteDescription,
}: APIKeyTableProps<T>): JSX.Element {
    const { t } = useTranslation()
    const labelColumn: LemonTableColumn<T, any> = {
        title: t('settings.apiKeys.columns.label', { defaultValue: 'Label' }),
        dataIndex: 'label',
        key: 'label',
        render: function RenderLabel(_label: any, key: T) {
            if (renderLabel) {
                return renderLabel(key)
            }
            return (
                <Link subtle className="text-left font-semibold truncate" onClick={() => onEdit(key.id)}>
                    {String(key.label)}
                </Link>
            )
        },
    }

    const secretKeyColumn: LemonTableColumn<T, any> = {
        title: t('settings.apiKeys.columns.maskValue', { defaultValue: 'Secret key' }),
        dataIndex: 'mask_value',
        key: 'mask_value',
        render: (_: any, key: T) => {
            if (renderMaskValue) {
                return renderMaskValue(key)
            }
            return key.mask_value ? (
                <span className="font-mono">{key.mask_value}</span>
            ) : (
                <Tooltip
                    title={t('settings.apiKeys.noPreviewReason', {
                        defaultValue: 'This key was created before the introduction of previews',
                    })}
                >
                    <span className="inline-flex items-center gap-1">
                        <span>{t('settings.apiKeys.noPreview', { defaultValue: 'No preview' })}</span>
                    </span>
                </Tooltip>
            )
        },
    }

    const scopesColumn: LemonTableColumn<T, any> = {
        title: t('settings.apiKeys.columns.scopes', { defaultValue: 'Scopes' }),
        key: 'scopes',
        dataIndex: 'scopes',
        render: function RenderScopes(_: any, key: T) {
            if (renderScopes) {
                return renderScopes(key)
            }
            return <TagList tags={key.scopes} onMoreClick={() => onEdit(key.id)} />
        },
    }

    const createdByColumn: LemonTableColumn<T, any> = {
        title: t('settings.apiKeys.columns.createdBy', { defaultValue: 'Created by' }),
        key: 'created_by',
        dataIndex: 'created_by',
        render: (_: any, key: T) =>
            key.created_by
                ? `${key.created_by.first_name || key.created_by.email}`
                : t('settings.apiKeys.unknown', { defaultValue: 'Unknown' }),
    }

    const lastUsedColumn: LemonTableColumn<T, any> = {
        title: t('settings.apiKeys.columns.lastUsed', { defaultValue: 'Last used' }),
        dataIndex: 'last_used_at',
        key: 'lastUsedAt',
        sorter: (a: T, b: T) => {
            if (!a.last_used_at && !b.last_used_at) {
                return 0
            }
            if (!a.last_used_at) {
                return -1
            }
            if (!b.last_used_at) {
                return 1
            }
            return new Date(a.last_used_at).getTime() - new Date(b.last_used_at).getTime()
        },
        render: (_: any, key: T) => (
            <Tooltip title={detailedTime(key.last_used_at)}>
                {humanFriendlyDetailedTime(key.last_used_at, 'MMMM DD, YYYY', 'h A')}
            </Tooltip>
        ),
    }

    const createdColumn: LemonTableColumn<T, any> = {
        title: t('settings.apiKeys.columns.created', { defaultValue: 'Created' }),
        dataIndex: 'created_at',
        key: 'createdAt',
        render: (_: any, key: T) => (
            <Tooltip title={detailedTime(key.created_at)}>{humanFriendlyDetailedTime(key.created_at)}</Tooltip>
        ),
    }

    const lastRolledColumn: LemonTableColumn<T, any> = {
        title: t('settings.apiKeys.columns.lastRolled', { defaultValue: 'Last rolled' }),
        dataIndex: 'last_rolled_at',
        key: 'lastRolledAt',
        render: (_: any, key: T) => (
            <Tooltip title={detailedTime(key.last_rolled_at)}>
                {humanFriendlyDetailedTime(key.last_rolled_at, 'MMMM DD, YYYY', 'h A')}
            </Tooltip>
        ),
    }

    const actionsColumn: LemonTableColumn<T, any> = {
        title: '',
        key: 'actions',
        align: 'right' as const,
        width: 0,
        render: (_: any, key: T) => (
            <LemonMenu
                items={[
                    {
                        label: t('settings.apiKeys.actions.edit', { defaultValue: 'Edit' }),
                        onClick: () => onEdit(key.id),
                    },
                    {
                        label: t('settings.apiKeys.actions.roll', { defaultValue: 'Roll' }),
                        onClick: () => {
                            LemonDialog.open({
                                title: t('settings.apiKeys.rollDialog.title', {
                                    defaultValue: 'Roll key "{{ label }}"?',
                                    label: key.label,
                                }),
                                description: t('settings.apiKeys.rollDialog.description', {
                                    defaultValue:
                                        'This will generate a new key. The old key will immediately stop working.',
                                }),
                                primaryButton: {
                                    status: 'danger',
                                    children: t('settings.apiKeys.actions.roll', { defaultValue: 'Roll' }),
                                    onClick: () => onRoll(key.id),
                                },
                                secondaryButton: {
                                    children: t('settings.apiKeys.actions.cancel', { defaultValue: 'Cancel' }),
                                },
                            })
                        },
                    },
                    {
                        label: t('settings.apiKeys.actions.delete', { defaultValue: 'Delete' }),
                        status: 'danger',
                        onClick: () => {
                            LemonDialog.open({
                                title: t('settings.apiKeys.deleteDialog.title', {
                                    defaultValue: 'Permanently delete key "{{ label }}"?',
                                    label: key.label,
                                }),
                                description:
                                    deleteDescription ??
                                    t('settings.apiKeys.deleteDialog.description', {
                                        defaultValue: 'This action cannot be undone.',
                                    }),
                                primaryButton: {
                                    status: 'danger',
                                    children: t('settings.apiKeys.actions.permanentlyDelete', {
                                        defaultValue: 'Permanently delete',
                                    }),
                                    onClick: () => onDelete(key.id),
                                },
                            })
                        },
                    },
                ]}
            >
                <LemonButton size="small" icon={<IconEllipsis />} />
            </LemonMenu>
        ),
    }

    const columns: LemonTableColumn<T, any>[] = [
        labelColumn,
        ...(extraColumnsAfterLabel ?? []),
        secretKeyColumn,
        scopesColumn,
        ...(extraColumnsAfterScopes ?? []),
        ...(showCreatedBy ? [createdByColumn] : []),
        lastUsedColumn,
        createdColumn,
        lastRolledColumn,
        ...(showActions ? [actionsColumn] : []),
    ]

    return (
        <LemonTable
            dataSource={keys}
            loading={loading}
            loadingSkeletonRows={3}
            className="mt-4"
            nouns={[noun, `${noun}s`]}
            rowClassName={rowClassName}
            columns={columns}
        />
    )
}
