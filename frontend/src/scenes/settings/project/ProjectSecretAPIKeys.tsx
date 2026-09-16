import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'
import { useTranslation } from 'react-i18next'

import { IconPlus } from '@posthog/icons'
import { LemonButton, LemonInput, LemonModal, LemonSelect } from '@posthog/lemon-ui'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { ScopeAccessRow } from 'lib/components/ScopeAccessRow/ScopeAccessRow'
import { TeamMembershipLevel } from 'lib/constants'
import { LemonField } from 'lib/lemon-ui/LemonField'

import { APIKeyTable } from '../shared/APIKeyTable'
import { MAX_PROJECT_API_KEYS_PER_PROJECT, projectSecretAPIKeysLogic } from './projectSecretAPIKeysLogic'

function EditKeyModal(): JSX.Element {
    const { t } = useTranslation()
    const {
        editingKey,
        editingKeyId,
        isEditingKeySubmitting,
        editingKeyChanged,
        formScopeRadioValues,
        filteredScopes,
        availablePresets,
        searchTerm,
    } = useValues(projectSecretAPIKeysLogic)
    const { setEditingKeyId, setScopeRadioValue, submitEditingKey, setSearchTerm } =
        useActions(projectSecretAPIKeysLogic)

    const isNew = editingKeyId === 'new'

    const submitDisabledReason = !editingKeyChanged
        ? t('settings.noChangesToSave', { defaultValue: 'No changes to save' })
        : !editingKey.label
          ? t('settings.project.apiKeys.addLabel', { defaultValue: 'Add a label' })
          : !editingKey.scopes?.length
            ? t('settings.project.apiKeys.selectScope', { defaultValue: 'Select at least one scope' })
            : undefined

    return (
        <Form logic={projectSecretAPIKeysLogic} formKey="editingKey">
            <LemonModal
                title={
                    isNew
                        ? t('settings.project.apiKeys.createTitle', { defaultValue: 'Create project secret API key' })
                        : t('settings.project.apiKeys.editTitle', { defaultValue: 'Edit project secret API key' })
                }
                onClose={() => setEditingKeyId(null)}
                isOpen={!!editingKeyId}
                width="40rem"
                hasUnsavedInput={editingKeyChanged}
                footer={
                    <>
                        <LemonButton type="secondary" onClick={() => setEditingKeyId(null)}>
                            {t('settings.cancel', { defaultValue: 'Cancel' })}
                        </LemonButton>
                        <LemonButton
                            type="primary"
                            htmlType="submit"
                            loading={isEditingKeySubmitting}
                            disabledReason={submitDisabledReason}
                            onClick={submitEditingKey}
                        >
                            {isNew
                                ? t('settings.project.apiKeys.createKey', { defaultValue: 'Create key' })
                                : t('settings.project.apiKeys.save', { defaultValue: 'Save' })}
                        </LemonButton>
                    </>
                }
            >
                <LemonField name="label" label={t('settings.project.apiKeys.label', { defaultValue: 'Label' })}>
                    <LemonInput
                        placeholder={t('settings.project.apiKeys.labelPlaceholder', {
                            defaultValue: 'e.g., CI/CD Pipeline',
                        })}
                        maxLength={40}
                    />
                </LemonField>

                <div className="flex items-center justify-between mt-4 mb-2">
                    <label className="font-semibold">
                        {t('settings.project.apiKeys.scopes', { defaultValue: 'Scopes' })}
                    </label>
                    <LemonField name="preset">
                        <LemonSelect
                            size="small"
                            placeholder={t('settings.project.apiKeys.selectPreset', {
                                defaultValue: 'Select preset',
                            })}
                            options={availablePresets}
                            dropdownMatchSelectWidth={false}
                        />
                    </LemonField>
                </div>

                <p className="text-sm text-muted mb-4">
                    {t('settings.project.apiKeys.scopesHint', {
                        defaultValue:
                            'Project secret API keys have limited scopes. Select only the permissions needed.',
                    })}
                </p>

                <LemonInput
                    type="search"
                    placeholder={t('settings.project.apiKeys.searchScopes', { defaultValue: 'Search scopes...' })}
                    value={searchTerm}
                    onChange={setSearchTerm}
                    className="mb-2"
                    size="small"
                />

                <LemonField name="scopes">
                    <div className="max-h-[50vh] overflow-y-auto space-y-2">
                        {filteredScopes.length === 0 ? (
                            <div className="text-muted text-sm py-2">
                                {t('settings.project.apiKeys.noScopesMatch', {
                                    defaultValue: 'No scopes match "{{ term }}"',
                                    term: searchTerm,
                                })}
                            </div>
                        ) : (
                            filteredScopes.map(({ key, label, disabledActions }) => (
                                <ScopeAccessRow
                                    key={key}
                                    label={label}
                                    value={formScopeRadioValues[key] ?? 'none'}
                                    onChange={(value) => setScopeRadioValue(key, value)}
                                    readDisabledReason={
                                        disabledActions?.includes('read')
                                            ? t('settings.project.apiKeys.scopeUnavailable', {
                                                  defaultValue: 'Not available for project secret API keys',
                                              })
                                            : undefined
                                    }
                                    writeDisabledReason={
                                        disabledActions?.includes('write')
                                            ? t('settings.project.apiKeys.scopeUnavailable', {
                                                  defaultValue: 'Not available for project secret API keys',
                                              })
                                            : undefined
                                    }
                                />
                            ))
                        )}
                    </div>
                </LemonField>
            </LemonModal>
        </Form>
    )
}

export function ProjectSecretAPIKeys(): JSX.Element {
    const { t } = useTranslation()
    const { keys, keysLoading } = useValues(projectSecretAPIKeysLogic)
    const { setEditingKeyId, deleteKey, rollKey } = useActions(projectSecretAPIKeysLogic)

    const restrictionReason = useRestrictedArea({
        minimumAccessLevel: TeamMembershipLevel.Admin,
        scope: RestrictionScope.Project,
    })

    return (
        <>
            <p>
                {t('settings.project.apiKeys.description', {
                    defaultValue:
                        'Project secret API keys allow programmatic access to a very limited set of scopes and endpoints. Unlike personal API keys, project secret API keys are not tied to a specific user.',
                })}
            </p>
            <p className="font-bold">
                {t('settings.project.apiKeys.warning', {
                    defaultValue:
                        "They should be kept secret as they can have scopes that allow access to the project's data.",
                })}
            </p>

            {!restrictionReason && (
                <LemonButton
                    type="primary"
                    icon={<IconPlus />}
                    onClick={() => setEditingKeyId('new')}
                    disabledReason={
                        keys.length >= MAX_PROJECT_API_KEYS_PER_PROJECT
                            ? t('settings.project.apiKeys.maximumKeys', {
                                  defaultValue: 'Maximum {{ number }} keys per project',
                                  number: MAX_PROJECT_API_KEYS_PER_PROJECT,
                              })
                            : undefined
                    }
                >
                    {t('settings.project.apiKeys.createTitle', {
                        defaultValue: 'Create project secret API key',
                    })}
                </LemonButton>
            )}

            <APIKeyTable
                keys={keys}
                loading={keysLoading}
                onEdit={setEditingKeyId}
                onRoll={rollKey}
                onDelete={deleteKey}
                noun={t('settings.project.apiKeys.noun', { defaultValue: 'project secret API key' })}
                showCreatedBy={true}
                showActions={!restrictionReason}
            />

            <EditKeyModal />
        </>
    )
}
