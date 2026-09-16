import { useActions, useValues } from 'kea'
import { Trans, useTranslation } from 'react-i18next'

import { IconPencil, IconTrash } from '@posthog/icons'
import { LemonButton, LemonDialog, LemonInput, LemonModal, LemonTable, LemonTag, Link } from '@posthog/lemon-ui'

import { CodeSnippet, Language } from 'lib/components/CodeSnippet'
import { IconKey } from 'lib/lemon-ui/icons'
import { LemonBanner } from 'lib/lemon-ui/LemonBanner'
import { humanFriendlyDetailedTime } from 'lib/utils/datetime'

import { cimdVerificationTokensLogic, validateCimdUrl, CIMDVerificationToken } from './cimdVerificationTokensLogic'

export function CIMDVerificationTokens(): JSX.Element {
    const { t } = useTranslation()
    const {
        tokens,
        tokensLoading,
        isCreateDialogOpen,
        isCreatingToken,
        newTokenLabel,
        newTokenUrl,
        justCreatedToken,
        bindingToken,
        bindUrl,
        isBindingToken,
    } = useValues(cimdVerificationTokensLogic)
    const {
        showCreateDialog,
        hideCreateDialog,
        setNewTokenLabel,
        setNewTokenUrl,
        createToken,
        deleteToken,
        setJustCreatedToken,
        showBindDialog,
        hideBindDialog,
        setBindUrl,
        bindToken,
    } = useActions(cimdVerificationTokensLogic)
    const hasUnboundToken = tokens.some((token) => !token.cimd_url)

    return (
        <div className="space-y-4">
            <p className="text-secondary">
                <Trans
                    i18nKey="settings.organization.cimd.description"
                    components={{
                        code: <code />,
                        DocsLink: (
                            <Link
                                to="https://posthog.com/docs/integrate/provisioning#host-a-cimd-metadata-document"
                                target="_blank"
                            />
                        ),
                    }}
                    defaults="Verification tokens link a CIMD partner application to this organization. Add the token to your CIMD metadata document as <code>verification_token</code> inside the <code>com.posthog</code> object. Verified partners get a higher default rate limit for account provisioning and a clear identity trail. Each token verifies only at the metadata URL you name when creating it. See the <DocsLink>docs</DocsLink> for the metadata format."
                />
            </p>

            <div className="flex justify-end">
                <LemonButton type="primary" onClick={showCreateDialog} data-attr="create-cimd-verification-token">
                    {t('settings.organization.cimd.createToken', { defaultValue: 'Create verification token' })}
                </LemonButton>
            </div>

            {hasUnboundToken && (
                <LemonBanner type="warning">
                    {t('settings.organization.cimd.unboundWarning', {
                        defaultValue:
                            'Some tokens were issued before URL binding and have stopped verifying. Set a metadata URL on each one below to restore verification.',
                    })}
                </LemonBanner>
            )}

            {!tokensLoading && tokens.length === 0 ? (
                <div className="border border-dashed rounded-lg p-8 text-center">
                    <IconKey className="text-4xl text-secondary mx-auto mb-3" />
                    <h3 className="text-base font-semibold mb-1">
                        {t('settings.organization.cimd.empty', { defaultValue: 'No verification tokens' })}
                    </h3>
                    <p className="text-secondary">
                        {t('settings.organization.cimd.emptyDescription', {
                            defaultValue: 'Create one to link a CIMD partner app to this organization.',
                        })}
                    </p>
                </div>
            ) : (
                <LemonTable
                    loading={tokensLoading}
                    dataSource={tokens}
                    columns={[
                        {
                            title: t('settings.organization.cimd.columns.label', { defaultValue: 'Label' }),
                            key: 'label',
                            render: (_, row: CIMDVerificationToken) => (
                                <span className="font-semibold">{row.label}</span>
                            ),
                        },
                        {
                            title: t('settings.organization.cimd.columns.metadataUrl', {
                                defaultValue: 'Metadata URL',
                            }),
                            key: 'cimd_url',
                            render: (_, row: CIMDVerificationToken) =>
                                row.cimd_url ? (
                                    <span className="text-xs font-mono break-all">{row.cimd_url}</span>
                                ) : (
                                    <LemonTag type="warning">
                                        {t('settings.organization.cimd.notVerifying', {
                                            defaultValue: 'Not verifying',
                                        })}
                                    </LemonTag>
                                ),
                        },
                        {
                            title: t('settings.organization.cimd.columns.token', { defaultValue: 'Token' }),
                            key: 'mask_value',
                            render: (_, row: CIMDVerificationToken) => (
                                <code className="text-xs bg-fill-primary rounded px-1.5 py-0.5 font-mono">
                                    {row.mask_value ?? '—'}
                                </code>
                            ),
                        },
                        {
                            title: t('settings.apiKeys.columns.created', { defaultValue: 'Created' }),
                            key: 'created_at',
                            render: (_, row: CIMDVerificationToken) => (
                                <span className="text-muted text-sm">{humanFriendlyDetailedTime(row.created_at)}</span>
                            ),
                        },
                        {
                            title: t('settings.apiKeys.columns.lastUsed', { defaultValue: 'Last used' }),
                            key: 'last_used_at',
                            render: (_, row: CIMDVerificationToken) => (
                                <span className="text-muted text-sm">
                                    {row.last_used_at
                                        ? humanFriendlyDetailedTime(row.last_used_at)
                                        : t('settings.organization.members.never', { defaultValue: 'Never' })}
                                </span>
                            ),
                        },
                        {
                            title: '',
                            key: 'actions',
                            width: 0,
                            render: (_, row: CIMDVerificationToken) => (
                                <div className="flex gap-1">
                                    {!row.cimd_url && (
                                        <LemonButton
                                            icon={<IconPencil />}
                                            size="small"
                                            tooltip={t('settings.organization.cimd.setMetadataUrl', {
                                                defaultValue: 'Set metadata URL',
                                            })}
                                            onClick={() => showBindDialog(row)}
                                        />
                                    )}
                                    <LemonButton
                                        icon={<IconTrash />}
                                        size="small"
                                        status="danger"
                                        tooltip={t('settings.organization.cimd.revokeToken', {
                                            defaultValue: 'Revoke token',
                                        })}
                                        onClick={() =>
                                            LemonDialog.open({
                                                title: t('settings.organization.cimd.revokeTitle', {
                                                    defaultValue: 'Revoke token "{{ label }}"?',
                                                    label: row.label,
                                                }),
                                                description: t('settings.organization.cimd.revokeDescription', {
                                                    defaultValue:
                                                        'Partners using this token in their CIMD metadata will no longer be recognized and will fall back to the anonymous rate limit tier.',
                                                }),
                                                primaryButton: {
                                                    children: t('settings.organization.cimd.revoke', {
                                                        defaultValue: 'Revoke',
                                                    }),
                                                    status: 'danger',
                                                    onClick: () => deleteToken(row),
                                                },
                                                secondaryButton: {
                                                    children: t('settings.cancel', { defaultValue: 'Cancel' }),
                                                },
                                            })
                                        }
                                    />
                                </div>
                            ),
                        },
                    ]}
                />
            )}

            <LemonModal
                isOpen={isCreateDialogOpen}
                onClose={hideCreateDialog}
                title={t('settings.organization.cimd.createTitle', {
                    defaultValue: 'Create CIMD verification token',
                })}
                footer={
                    <>
                        <LemonButton type="secondary" onClick={hideCreateDialog}>
                            {t('settings.cancel', { defaultValue: 'Cancel' })}
                        </LemonButton>
                        <LemonButton
                            type="primary"
                            onClick={() => createToken()}
                            loading={isCreatingToken}
                            disabledReason={
                                !newTokenLabel.trim()
                                    ? t('settings.organization.cimd.labelRequired', {
                                          defaultValue: 'Please enter a label',
                                      })
                                    : (validateCimdUrl(newTokenUrl.trim()) ?? undefined)
                            }
                            data-attr="confirm-create-cimd-verification-token"
                        >
                            {t('settings.organization.cimd.create', { defaultValue: 'Create token' })}
                        </LemonButton>
                    </>
                }
            >
                <div className="space-y-2">
                    <label className="text-sm font-semibold" htmlFor="cimd-token-label">
                        {t('settings.organization.cimd.fields.label', { defaultValue: 'Label' })}
                    </label>
                    <LemonInput
                        id="cimd-token-label"
                        placeholder={t('settings.organization.cimd.labelPlaceholder', {
                            defaultValue: 'e.g. Production CIMD partner',
                        })}
                        value={newTokenLabel}
                        onChange={setNewTokenLabel}
                        autoFocus
                    />
                    <p className="text-secondary text-xs">
                        {t('settings.organization.cimd.labelHint', {
                            defaultValue:
                                "Pick a label that helps you identify this token later. You'll only see the plaintext value once.",
                        })}
                    </p>

                    <label className="text-sm font-semibold pt-2 block" htmlFor="cimd-token-url">
                        {t('settings.organization.cimd.fields.metadataUrl', { defaultValue: 'CIMD metadata URL' })}
                    </label>
                    <LemonInput
                        id="cimd-token-url"
                        placeholder="https://example.com/.well-known/oauth-client-metadata.json"
                        value={newTokenUrl}
                        onChange={setNewTokenUrl}
                    />
                    <p className="text-secondary text-xs">
                        {t('settings.organization.cimd.urlHint', {
                            defaultValue:
                                'The token only verifies at this URL, so a copy published anywhere else is ignored. Must be HTTPS and include a path, and the path is case-sensitive.',
                        })}
                    </p>
                </div>
            </LemonModal>

            <LemonModal
                isOpen={!!justCreatedToken}
                onClose={() => setJustCreatedToken(null)}
                closable={false}
                title={t('settings.organization.cimd.createdTitle', { defaultValue: 'Token created' })}
                footer={
                    <LemonButton type="primary" onClick={() => setJustCreatedToken(null)}>
                        {t('settings.organization.cimd.done', { defaultValue: 'Done' })}
                    </LemonButton>
                }
            >
                {justCreatedToken && (
                    <div className="space-y-3">
                        <LemonBanner type="warning">
                            {t('settings.organization.cimd.copyNow', {
                                defaultValue:
                                    "Copy this token now - you won't be able to see it again. If you lose it, you'll need to revoke and create a new one.",
                            })}
                        </LemonBanner>
                        <p className="text-secondary">
                            <Trans
                                i18nKey="settings.organization.cimd.addToMetadata"
                                components={{ code: <code /> }}
                                defaults="Add it to your CIMD metadata document as <code>verification_token</code> inside the <code>com.posthog</code> object."
                            />
                        </p>
                        <CodeSnippet language={Language.Text}>{justCreatedToken.value}</CodeSnippet>
                    </div>
                )}
            </LemonModal>

            <LemonModal
                isOpen={!!bindingToken}
                onClose={hideBindDialog}
                title={t('settings.organization.cimd.setMetadataUrl', { defaultValue: 'Set metadata URL' })}
                footer={
                    <>
                        <LemonButton type="secondary" onClick={hideBindDialog}>
                            {t('settings.cancel', { defaultValue: 'Cancel' })}
                        </LemonButton>
                        <LemonButton
                            type="primary"
                            onClick={() => bindToken()}
                            loading={isBindingToken}
                            disabledReason={validateCimdUrl(bindUrl.trim()) ?? undefined}
                            data-attr="confirm-bind-cimd-verification-token"
                        >
                            {t('settings.organization.cimd.setUrl', { defaultValue: 'Set URL' })}
                        </LemonButton>
                    </>
                }
            >
                {bindingToken && (
                    <div className="space-y-2">
                        <p className="text-secondary text-sm">
                            {t('settings.organization.cimd.bindDescription', {
                                defaultValue:
                                    '"{{ label }}" was issued before URL binding and has stopped verifying. Set the metadata URL it should verify at to restore verification.',
                                label: bindingToken.label,
                            })}
                        </p>
                        <label className="text-sm font-semibold" htmlFor="cimd-token-bind-url">
                            {t('settings.organization.cimd.fields.metadataUrl', { defaultValue: 'CIMD metadata URL' })}
                        </label>
                        <LemonInput
                            id="cimd-token-bind-url"
                            placeholder="https://example.com/.well-known/oauth-client-metadata.json"
                            value={bindUrl}
                            onChange={setBindUrl}
                            autoFocus
                        />
                        <p className="text-secondary text-xs">
                            {t('settings.organization.cimd.urlHint', {
                                defaultValue:
                                    'The token only verifies at this URL, so a copy published anywhere else is ignored. Must be HTTPS and include a path, and the path is case-sensitive.',
                            })}
                        </p>
                    </div>
                )}
            </LemonModal>
        </div>
    )
}
