import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'
import { Trans, useTranslation } from 'react-i18next'

import { LemonBanner, LemonButton, LemonSkeleton, LemonTextArea } from '@posthog/lemon-ui'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TeamMembershipLevel } from 'lib/constants'
import { LemonField } from 'lib/lemon-ui/LemonField'
import { projectLogic } from 'scenes/projectLogic'

import { CORE_MEMORY_MAX_CHARACTERS, maxSettingsLogic } from './maxSettingsLogic'

export function MaxMemorySettings(): JSX.Element {
    const { t } = useTranslation()
    const { currentProject, currentProjectLoading } = useValues(projectLogic)
    const { isLoading, isUpdating, coreMemoryLoadError, coreMemoryOverLimit } = useValues(maxSettingsLogic)
    const { loadCoreMemory, trimCoreMemoryToFit } = useActions(maxSettingsLogic)
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    return (
        <Form
            logic={maxSettingsLogic}
            formKey="coreMemoryForm"
            enableFormOnSubmit
            className="w-full deprecated-space-y-4"
        >
            <p className="max-w-160 text-sm text-secondary mb-4">
                <Trans
                    i18nKey="settings.environment.maxMemory.sizeHint"
                    values={{ max: CORE_MEMORY_MAX_CHARACTERS.toLocaleString() }}
                    defaults="When memory exceeds 5,000 characters, only the first and last 2,500 characters are visible to PostHog AI. The maximum memory size is {{ max }} characters."
                />
            </p>
            {currentProjectLoading || isLoading ? (
                <div className="gap-2 flex flex-col">
                    <LemonSkeleton className="h-6 w-32" />
                    <LemonSkeleton className="h-16" />
                </div>
            ) : coreMemoryLoadError ? (
                <LemonBanner
                    type="error"
                    action={{
                        children: t('settings.environment.maxMemory.retry', { defaultValue: 'Retry' }),
                        onClick: () => loadCoreMemory(),
                    }}
                    className="max-w-160"
                >
                    {t('settings.environment.maxMemory.loadError', {
                        defaultValue:
                            "Could not load PostHog AI's memory. This does not mean your memory is empty. Your saved memory is safe.",
                    })}{' '}
                    {coreMemoryLoadError}
                </LemonBanner>
            ) : (
                <>
                    {coreMemoryOverLimit && (
                        <LemonBanner
                            type="warning"
                            action={{
                                children: t('settings.environment.maxMemory.trimToFit', {
                                    defaultValue: 'Trim to fit',
                                }),
                                onClick: () => trimCoreMemoryToFit(),
                                disabledReason: restrictedReason,
                            }}
                            className="max-w-160"
                        >
                            <Trans
                                i18nKey="settings.environment.maxMemory.overLimit"
                                values={{ max: CORE_MEMORY_MAX_CHARACTERS.toLocaleString() }}
                                defaults="This memory is over the {{ max }}-character limit and can't be saved until it fits. Trimming keeps the first {{ max }} characters."
                            />
                        </LemonBanner>
                    )}
                    <LemonField
                        name="text"
                        label={t('settings.environment.maxMemory.fieldLabel', { defaultValue: "PostHog AI's memory" })}
                    >
                        <LemonTextArea
                            id="product-description-textarea" // Slightly dirty ID for .focus() elsewhere
                            placeholder={t('settings.environment.maxMemory.placeholder', {
                                defaultValue: 'What should PostHog AI know about {{ subject }}?',
                                subject: currentProject
                                    ? currentProject.name
                                    : t('settings.environment.maxMemory.placeholderFallbackSubject', {
                                          defaultValue: 'your company or this product',
                                      }),
                            })}
                            maxLength={CORE_MEMORY_MAX_CHARACTERS}
                            maxRows={5}
                            disabled={!!restrictedReason}
                        />
                    </LemonField>
                </>
            )}
            <LemonButton
                type="primary"
                htmlType="submit"
                disabledReason={
                    !currentProject || isLoading
                        ? t('settings.environment.maxMemory.loading', { defaultValue: 'Loading project and memory...' })
                        : coreMemoryLoadError
                          ? t('settings.environment.maxMemory.loadFailed', {
                                defaultValue: 'Memory could not be loaded',
                            })
                          : coreMemoryOverLimit
                            ? t('settings.environment.maxMemory.overLimitReason', {
                                  defaultValue: 'Memory is over the character limit. Trim it to fit first.',
                              })
                            : restrictedReason
                }
                loading={isUpdating}
            >
                {t('settings.environment.maxMemory.save', { defaultValue: 'Save memory' })}
            </LemonButton>
        </Form>
    )
}
