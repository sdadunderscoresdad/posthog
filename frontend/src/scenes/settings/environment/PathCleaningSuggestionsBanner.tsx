import { useActions, useValues } from 'kea'
import { Trans, useTranslation } from 'react-i18next'

import { IconArrowRight } from '@posthog/icons'
import { LemonBanner, LemonButton, LemonModal, Spinner } from '@posthog/lemon-ui'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TeamMembershipLevel } from 'lib/constants'
import { useFeatureFlag } from 'lib/hooks/useFeatureFlag'
import { humanFriendlyLargeNumber } from 'lib/utils/numbers'

import { pathCleaningSuggestionsLogic } from './pathCleaningSuggestionsLogic'

function PathCleaningPreviewModal({
    suggestionId,
    restrictedReason,
}: {
    suggestionId: string
    restrictedReason: string | null
}): JSX.Element {
    const { t } = useTranslation()
    const { previewOpen, preview, previewLoading, applying } = useValues(pathCleaningSuggestionsLogic)
    const { closePreview, applySuggestion } = useActions(pathCleaningSuggestionsLogic)

    return (
        <LemonModal
            isOpen={previewOpen}
            onClose={closePreview}
            title={t('settings.environment.pathCleaningSuggestions.previewTitle', {
                defaultValue: 'Preview on your real paths',
            })}
            description={t('settings.environment.pathCleaningSuggestions.previewDescription', {
                defaultValue:
                    'Your most-viewed paths from the last 30 days, with all suggested rules applied in order. Nothing changes until you apply.',
            })}
            width={720}
            footer={
                <>
                    <LemonButton type="secondary" onClick={closePreview}>
                        {t('settings.environment.pathCleaningSuggestions.close', { defaultValue: 'Close' })}
                    </LemonButton>
                    <LemonButton
                        type="primary"
                        onClick={() => applySuggestion(suggestionId)}
                        disabledReason={restrictedReason}
                        loading={applying}
                    >
                        {t('settings.environment.pathCleaningSuggestions.applyAll', { defaultValue: 'Apply all' })}
                    </LemonButton>
                </>
            }
        >
            {previewLoading || !preview ? (
                <div className="flex items-center justify-center py-8">
                    <Spinner className="text-2xl" />
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <span className="text-secondary">
                        <Trans
                            i18nKey="settings.environment.pathCleaningSuggestions.previewSummary"
                            values={{
                                changed: preview.changed_path_count,
                                sampled: preview.sampled_path_count,
                            }}
                            components={{ Strong: <strong /> }}
                            defaults="These rules group <Strong>{{ changed }}</Strong> of your top <Strong>{{ sampled }}</Strong> paths"
                        />
                        {preview.changed_path_count > preview.examples.length
                            ? ` ${t('settings.environment.pathCleaningSuggestions.previewSummaryTruncated', {
                                  defaultValue: '(showing the first {{ shown }})',
                                  shown: preview.examples.length,
                              })}`
                            : ''}
                        .
                    </span>
                    <div className="flex flex-col gap-1 max-h-[30rem] overflow-y-auto">
                        {preview.examples.map((example) => (
                            <div
                                key={example.before}
                                className="flex flex-wrap items-center gap-2 font-mono text-xs border rounded p-2"
                            >
                                <code>{example.before}</code>
                                <IconArrowRight />
                                <code className="font-semibold">{example.after}</code>
                                <span className="text-secondary ml-auto font-sans">
                                    {t('settings.environment.pathCleaningSuggestions.views', {
                                        count: example.views,
                                        defaultValue_one: '{{ value }} view',
                                        defaultValue_other: '{{ value }} views',
                                        value: humanFriendlyLargeNumber(example.views),
                                    })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </LemonModal>
    )
}

export function PathCleaningSuggestionsBanner(): JSX.Element | null {
    const { t } = useTranslation()
    const flagEnabled = useFeatureFlag('WEB_ANALYTICS_PATH_CLEANING_SUGGESTIONS')
    const { latestSuggestion, suggestionsLoading, applying } = useValues(pathCleaningSuggestionsLogic)
    const { applySuggestion, dismissSuggestion, openPreview } = useActions(pathCleaningSuggestionsLogic)
    // Applying writes path_cleaning_filters, an admin-gated team field — mirror the backend gate.
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    if (!flagEnabled || suggestionsLoading || !latestSuggestion || latestSuggestion.rules.length === 0) {
        return null
    }

    const ruleCount = latestSuggestion.rules.length

    return (
        <>
            <LemonBanner
                type="info"
                className="mb-4"
                action={{
                    children: t('settings.environment.pathCleaningSuggestions.applyAll', {
                        defaultValue: 'Apply all',
                    }),
                    onClick: () => applySuggestion(latestSuggestion.id),
                    disabledReason: restrictedReason,
                    loading: applying,
                }}
                onClose={() => dismissSuggestion(latestSuggestion.id)}
            >
                <div className="flex flex-col gap-2">
                    <span>
                        <Trans
                            i18nKey="settings.environment.pathCleaningSuggestions.bannerSummary"
                            values={{
                                count: ruleCount,
                                rules: t('settings.environment.pathCleaningSuggestions.ruleCount', {
                                    count: ruleCount,
                                    defaultValue_one: 'rule',
                                    defaultValue_other: 'rules',
                                }),
                            }}
                            components={{ Strong: <strong /> }}
                            defaults="We analyzed your traffic and suggest <Strong>{{ count }}</Strong> path cleaning {{ rules }} to group similar pages. Review and apply them:"
                        />
                    </span>
                    <div className="flex flex-col gap-1">
                        {latestSuggestion.rules.map((rule) => (
                            <div key={rule.order} className="flex flex-wrap items-center gap-2 font-mono text-xs">
                                <code>{rule.regex}</code>
                                <IconArrowRight />
                                <code>{rule.alias}</code>
                                <span className="text-secondary">
                                    {t('settings.environment.pathCleaningSuggestions.ruleMatchSummary', {
                                        defaultValue: 'groups {{ matched }} of your top {{ sampled }} paths',
                                        matched: rule.match_count,
                                        sampled: latestSuggestion.sampled_path_count,
                                    })}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div>
                        <LemonButton type="secondary" size="xsmall" onClick={() => openPreview(latestSuggestion.id)}>
                            {t('settings.environment.pathCleaningSuggestions.previewOnYourPaths', {
                                defaultValue: 'Preview on your paths',
                            })}
                        </LemonButton>
                    </div>
                </div>
            </LemonBanner>
            <PathCleaningPreviewModal suggestionId={latestSuggestion.id} restrictedReason={restrictedReason} />
        </>
    )
}
