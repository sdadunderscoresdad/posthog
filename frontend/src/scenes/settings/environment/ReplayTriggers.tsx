import { useActions, useValues } from 'kea'
import { Trans, useTranslation } from 'react-i18next'

import { LemonBanner, LemonCollapse, LemonDivider, LemonLabel, LemonTab, LemonTabs, Tooltip } from '@posthog/lemon-ui'

import IngestionControls from 'lib/components/IngestionControls'
import { IngestionControlsSummary } from 'lib/components/IngestionControls/Summary'
import { replayTriggersV2Logic } from 'lib/components/IngestionControls/triggers/triggerGroups/replayTriggersV2Logic'
import { TriggerGroupsEditor } from 'lib/components/IngestionControls/triggers/triggerGroups/TriggerGroupsEditor'
import { FeatureFlagTrigger, Trigger, TriggerType } from 'lib/components/IngestionControls/types'
import { PayGateMini } from 'lib/components/PayGateMini/PayGateMini'
import { FEATURE_FLAGS } from 'lib/constants'
import { featureFlagLogic } from 'lib/logic/featureFlagLogic'
import { humanFriendlyNumber } from 'lib/utils/numbers'
import {
    ReplayPlatform,
    replayTriggersLogic,
    TRIGGER_GROUPS_MIN_SDK_VERSION,
} from 'scenes/settings/environment/replayTriggersLogic'
import { Since } from 'scenes/settings/environment/SessionRecordingSettings'
import { teamLogic } from 'scenes/teamLogic'

import { AccessControlResourceType, AvailableFeature, TeamPublicType, TeamType } from '~/types'

export { TRIGGER_GROUPS_MIN_SDK_VERSION }

/** Convert the stored sample-rate string (decimal 0–1) to a display percentage (0–100). */
function toDisplaySampleRate(rate: string | null | undefined): number {
    return typeof rate === 'string' ? Math.floor(parseFloat(rate) * 100) : 100
}

function AnyWith100SamplingWarning({
    currentTeam,
    isV2TriggersEnabled,
}: {
    currentTeam: TeamType | TeamPublicType | null | undefined
    isV2TriggersEnabled: boolean
}): JSX.Element | null {
    const { urlTriggerConfig, eventTriggerConfig } = useValues(replayTriggersLogic)

    const matchType = currentTeam?.session_recording_trigger_match_type_config || 'all'
    const storedSampleRate = currentTeam?.session_recording_sample_rate
    const sampleRate = toDisplaySampleRate(storedSampleRate)
    const hasOtherCondition =
        (urlTriggerConfig?.length ?? 0) > 0 ||
        (eventTriggerConfig?.length ?? 0) > 0 ||
        !!currentTeam?.session_recording_linked_flag

    if (matchType !== 'any' || sampleRate !== 100 || storedSampleRate == null || !hasOtherCondition) {
        return null
    }

    return (
        <LemonBanner type="error">
            <Trans
                i18nKey="settings.environment.replayTriggers.anyWith100SamplingWarning"
                components={{ Strong: <strong /> }}
                defaults='<Strong>100% sampling rate with "any" matching records every session.</Strong> To fix this, either lower the sample rate or switch to "all" matching.'
            />
            {isV2TriggersEnabled && (
                <>
                    {' '}
                    <Trans
                        i18nKey="settings.environment.replayTriggers.anyWith100SamplingWarningSuggestion"
                        components={{ Strong: <strong /> }}
                        defaults="Consider using <Strong>trigger groups</Strong> above for more precise control over when sessions are recorded."
                    />
                </>
            )}
        </LemonBanner>
    )
}

function TriggerPanelHeader({
    title,
    status,
    showMatchTag = false,
}: {
    title: string
    status: string
    showMatchTag?: boolean
}): JSX.Element {
    return (
        <div className="flex items-center justify-between w-full">
            <span className="font-semibold flex items-center gap-1">
                {showMatchTag && <IngestionControls.MatchTypeTag />}
                {title}
            </span>
            <span className="text-muted text-xs font-normal">{status}</span>
        </div>
    )
}

function LinkedFlagSelector(): JSX.Element | null {
    const { t } = useTranslation()
    const { updateCurrentTeam } = useActions(teamLogic)
    const { currentTeam } = useValues(teamLogic)

    return (
        <PayGateMini
            feature={AvailableFeature.REPLAY_FEATURE_FLAG_BASED_RECORDING}
            featureDetail="replay-feature-flag-trigger"
        >
            <IngestionControls.FlagTrigger
                logicKey="session-replay-linked-flag"
                flag={currentTeam?.session_recording_linked_flag ?? null}
                onChange={(v) => updateCurrentTeam({ session_recording_linked_flag: v })}
            >
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <LemonLabel className="text-base">
                            {t('settings.environment.replayTriggers.linkedFlag.selectFeatureFlag', {
                                defaultValue: 'Select feature flag',
                            })}{' '}
                            <Since
                                web={{ version: '1.110.0' }}
                                ios={{ version: '3.11.0' }}
                                android={{ version: '3.11.0' }}
                                reactNative={{ version: '3.6.3' }}
                                flutter={{ version: '4.7.0' }}
                            />
                        </LemonLabel>
                        <IngestionControls.FlagSelector />
                    </div>

                    <p>
                        <Trans
                            i18nKey="settings.environment.replayTriggers.linkedFlag.description"
                            components={{ Strong: <strong /> }}
                            defaults="Only record when this flag is enabled. <Strong>Shared across web and mobile.</Strong>"
                        />
                    </p>
                    <IngestionControls.FlagVariantSelector
                        tooltip={
                            <>
                                <p>
                                    {t('settings.environment.replayTriggers.linkedFlag.variantTooltip', {
                                        defaultValue: 'Record for "any" variant, or only for a specific variant.',
                                    })}
                                </p>
                                <p>
                                    {t('settings.environment.replayTriggers.linkedFlag.variantVersionTooltip', {
                                        defaultValue: 'Variant targeting requires posthog-js v1.110.0+',
                                    })}
                                </p>
                            </>
                        }
                    />
                </div>
            </IngestionControls.FlagTrigger>
        </PayGateMini>
    )
}

function UrlTriggerOptions(): JSX.Element | null {
    const { t } = useTranslation()
    const {
        isAddUrlTriggerConfigFormVisible,
        urlTriggerConfig,
        editUrlTriggerIndex,
        isProposedUrlTriggerSubmitting,
        checkUrlTrigger,
        checkUrlTriggerResults,
        urlTriggerInputValidationWarning,
    } = useValues(replayTriggersLogic)
    const {
        addUrlTrigger,
        newUrlTrigger,
        removeUrlTrigger,
        setEditUrlTriggerIndex,
        cancelProposingUrlTrigger,
        setCheckUrlTrigger,
    } = useActions(replayTriggersLogic)

    return (
        <IngestionControls.UrlConfig
            logic={replayTriggersLogic}
            logicProps={{}}
            formKey="proposedUrlTrigger"
            addUrl={addUrlTrigger}
            validationWarning={urlTriggerInputValidationWarning}
            title={t('settings.environment.replayTriggers.urlTrigger.title', {
                defaultValue: 'Enable recordings when URL matches',
            })}
            titleBadge={<Since web={{ version: '1.171.0' }} />}
            description={t('settings.environment.replayTriggers.urlTrigger.description', {
                defaultValue:
                    'Adding a URL trigger means recording will only be started when the user visits a page that matches the URL.',
            })}
            checkUrl={checkUrlTrigger}
            checkUrlResults={checkUrlTriggerResults}
            setCheckUrl={setCheckUrlTrigger}
            isAddFormVisible={isAddUrlTriggerConfigFormVisible}
            config={urlTriggerConfig}
            editIndex={editUrlTriggerIndex}
            isSubmitting={isProposedUrlTriggerSubmitting}
            onAdd={newUrlTrigger}
            onCancel={cancelProposingUrlTrigger}
            onEdit={setEditUrlTriggerIndex}
            onRemove={removeUrlTrigger}
        />
    )
}

function UrlBlocklistOptions(): JSX.Element | null {
    const { t } = useTranslation()
    const {
        isAddUrlBlocklistConfigFormVisible,
        urlBlocklistConfig,
        editUrlBlocklistIndex,
        isProposedUrlBlocklistSubmitting,
        checkUrlBlocklist,
        checkUrlBlocklistResults,
        urlBlocklistInputValidationWarning,
    } = useValues(replayTriggersLogic)
    const {
        addUrlBlocklist,
        newUrlBlocklist,
        removeUrlBlocklist,
        setEditUrlBlocklistIndex,
        cancelProposingUrlBlocklist,
        setCheckUrlBlocklist,
    } = useActions(replayTriggersLogic)

    return (
        <IngestionControls.UrlConfig
            logic={replayTriggersLogic}
            logicProps={{}}
            formKey="proposedUrlBlocklist"
            addUrl={addUrlBlocklist}
            validationWarning={urlBlocklistInputValidationWarning}
            title={t('settings.environment.replayTriggers.urlBlocklist.title', {
                defaultValue: 'Pause recordings when URL matches',
            })}
            description={t('settings.environment.replayTriggers.urlBlocklist.description', {
                defaultValue: 'Pause recordings while the user is on a page that matches the URL.',
            })}
            checkUrl={checkUrlBlocklist}
            checkUrlResults={checkUrlBlocklistResults}
            setCheckUrl={setCheckUrlBlocklist}
            isAddFormVisible={isAddUrlBlocklistConfigFormVisible}
            config={urlBlocklistConfig}
            editIndex={editUrlBlocklistIndex}
            isSubmitting={isProposedUrlBlocklistSubmitting}
            onAdd={newUrlBlocklist}
            onCancel={cancelProposingUrlBlocklist}
            onEdit={setEditUrlBlocklistIndex}
            onRemove={removeUrlBlocklist}
        />
    )
}

function EventTriggerOptions(): JSX.Element | null {
    const { t } = useTranslation()
    const { eventTriggerConfig } = useValues(replayTriggersLogic)
    const { updateEventTriggerConfig } = useActions(replayTriggersLogic)

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 justify-between">
                <LemonLabel className="text-base">
                    {t('settings.environment.replayTriggers.eventTrigger.selectEvents', {
                        defaultValue: 'Select events',
                    })}{' '}
                    <Since web={{ version: '1.186.0' }} />
                </LemonLabel>
                <IngestionControls.EventTriggerSelect events={eventTriggerConfig} onChange={updateEventTriggerConfig} />
            </div>
            <p>
                {t('settings.environment.replayTriggers.eventTrigger.description', {
                    defaultValue: 'Start recording when a PostHog event is queued.',
                })}
            </p>

            <div className="flex gap-2 flex-wrap">
                {eventTriggerConfig?.map((trigger) => (
                    <IngestionControls.EventTrigger
                        key={trigger}
                        trigger={trigger}
                        onClose={() => updateEventTriggerConfig(eventTriggerConfig?.filter((e) => e !== trigger))}
                    />
                ))}
            </div>
        </div>
    )
}

function Sampling(): JSX.Element {
    const { t } = useTranslation()
    const { updateCurrentTeam } = useActions(teamLogic)
    const { currentTeam } = useValues(teamLogic)

    const storedSampleRate = currentTeam?.session_recording_sample_rate

    return (
        <PayGateMini feature={AvailableFeature.SESSION_REPLAY_SAMPLING} featureDetail="session-replay-sampling">
            <div className="flex flex-col gap-2">
                <div className="flex flex-row justify-between items-center">
                    <LemonLabel className="text-base">
                        {t('settings.environment.replayTriggers.sampling.label', { defaultValue: 'Sample rate' })}{' '}
                        <Since
                            web={{ version: '1.85.0' }}
                            android={{ version: '3.34.0' }}
                            ios={{ version: '3.42.0' }}
                            reactNative={{ version: '4.37.0' }}
                        />
                        {storedSampleRate == null && (
                            <span className="text-muted font-normal">
                                {' '}
                                {t('settings.environment.replayTriggers.sampling.default', {
                                    defaultValue: '(default)',
                                })}
                            </span>
                        )}
                    </LemonLabel>
                    <IngestionControls.SamplingTrigger
                        initialSampleRate={toDisplaySampleRate(storedSampleRate)}
                        onChange={(v) => updateCurrentTeam({ session_recording_sample_rate: v.toString() })}
                    />
                </div>
                <p>
                    {t('settings.environment.replayTriggers.sampling.description', {
                        defaultValue:
                            'Choose how many sessions to record. 100% = record every session, 50% = record roughly half.',
                    })}
                </p>
            </div>
        </PayGateMini>
    )
}

function MobileSampling(): JSX.Element {
    const { t } = useTranslation()
    const { updateCurrentTeam } = useActions(teamLogic)
    const { currentTeam } = useValues(teamLogic)

    const storedSampleRate = currentTeam?.session_recording_sample_rate

    return (
        <PayGateMini feature={AvailableFeature.SESSION_REPLAY_SAMPLING} featureDetail="session-replay-sampling">
            <div className="flex flex-col gap-2">
                <div className="flex flex-row justify-between items-center">
                    <LemonLabel className="text-base">
                        {t('settings.environment.replayTriggers.sampling.label', { defaultValue: 'Sample rate' })}{' '}
                        <Since
                            android={{ version: '3.34.0' }}
                            ios={{ version: '3.42.0' }}
                            reactNative={{ version: '4.37.0' }}
                        />
                        {storedSampleRate == null && (
                            <span className="text-muted font-normal">
                                {' '}
                                {t('settings.environment.replayTriggers.sampling.default', {
                                    defaultValue: '(default)',
                                })}
                            </span>
                        )}
                    </LemonLabel>
                    <IngestionControls.SamplingTrigger
                        initialSampleRate={toDisplaySampleRate(storedSampleRate)}
                        onChange={(v) => updateCurrentTeam({ session_recording_sample_rate: v.toString() })}
                    />
                </div>
                <p>
                    {t('settings.environment.replayTriggers.sampling.description', {
                        defaultValue:
                            'Choose how many sessions to record. 100% = record every session, 50% = record roughly half.',
                    })}
                </p>
            </div>
        </PayGateMini>
    )
}

function MobileEventTriggers(): JSX.Element {
    const { t } = useTranslation()
    const { eventTriggerConfig } = useValues(replayTriggersLogic)
    const { updateEventTriggerConfig } = useActions(replayTriggersLogic)

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 justify-between">
                <LemonLabel className="text-base">
                    {t('settings.environment.replayTriggers.eventTrigger.eventEmitted', {
                        defaultValue: 'Event emitted',
                    })}{' '}
                    <Since
                        ios={{ version: '3.48.0' }}
                        android={{ version: '3.40.1' }}
                        reactNative={{ version: '4.52.0' }}
                        flutter={{ version: '5.25.0' }}
                    />
                </LemonLabel>
                <IngestionControls.EventTriggerSelect events={eventTriggerConfig} onChange={updateEventTriggerConfig} />
            </div>
            <p>
                {t('settings.environment.replayTriggers.eventTrigger.description', {
                    defaultValue: 'Start recording when a PostHog event is queued.',
                })}
            </p>

            <div className="flex gap-2 flex-wrap">
                {eventTriggerConfig?.map((trigger) => (
                    <IngestionControls.EventTrigger
                        key={trigger}
                        trigger={trigger}
                        onClose={() => updateEventTriggerConfig(eventTriggerConfig?.filter((e) => e !== trigger))}
                    />
                ))}
            </div>
        </div>
    )
}

function MobileMinimumDuration(): JSX.Element {
    const { t } = useTranslation()
    const { updateCurrentTeam } = useActions(teamLogic)
    const { currentTeam } = useValues(teamLogic)

    return (
        <PayGateMini
            feature={AvailableFeature.REPLAY_RECORDING_DURATION_MINIMUM}
            featureDetail="replay-minimum-recording-duration"
        >
            <div className="flex flex-col gap-2">
                <div className="flex flex-row justify-between items-center">
                    <LemonLabel className="text-base">
                        {t('settings.environment.replayTriggers.minDuration.label', {
                            defaultValue: 'Duration threshold',
                        })}{' '}
                        <Since
                            ios={{ version: '3.53.0' }}
                            android={{ version: '3.44.0' }}
                            reactNative={{ version: '4.52.0' }}
                            flutter={{ version: '5.24.3' }}
                        />
                    </LemonLabel>
                    <IngestionControls.MinDuration
                        value={currentTeam?.session_recording_minimum_duration_milliseconds}
                        onChange={(v) => updateCurrentTeam({ session_recording_minimum_duration_milliseconds: v })}
                    />
                </div>
                <p>
                    {t('settings.environment.replayTriggers.minDuration.mobileDescription', {
                        defaultValue:
                            'Only collect sessions that last longer than this. This helps you avoid recording sessions that are too short to be useful.',
                    })}
                </p>
            </div>
        </PayGateMini>
    )
}

function MinimumDurationSetting(): JSX.Element | null {
    const { t } = useTranslation()
    const { updateCurrentTeam } = useActions(teamLogic)
    const { currentTeam } = useValues(teamLogic)

    return (
        <PayGateMini
            feature={AvailableFeature.REPLAY_RECORDING_DURATION_MINIMUM}
            featureDetail="replay-minimum-recording-duration"
        >
            <div className="flex flex-col gap-2">
                <div className="flex flex-row justify-between items-center">
                    <LemonLabel className="text-base">
                        {t('settings.environment.replayTriggers.minDuration.label', {
                            defaultValue: 'Duration threshold',
                        })}{' '}
                        <Since web={{ version: '1.85.0' }} ios={{ version: '3.53.0' }} />
                    </LemonLabel>
                    <IngestionControls.MinDuration
                        value={currentTeam?.session_recording_minimum_duration_milliseconds}
                        onChange={(v) => updateCurrentTeam({ session_recording_minimum_duration_milliseconds: v })}
                    />
                </div>
                <Tooltip
                    delayMs={200}
                    docLink="https://posthog.com/docs/session-replay/how-to-control-which-sessions-you-record#limitations"
                    title={t('settings.environment.replayTriggers.minDuration.tooltip', {
                        defaultValue:
                            'The JS SDK has an in-memory queue. This means that for traditional web apps the minimum duration control is best effort.',
                    })}
                >
                    {t('settings.environment.replayTriggers.minDuration.description', {
                        defaultValue:
                            'Setting a minimum session duration will ensure that only sessions that last longer than that value are collected. This helps you avoid collecting sessions that are too short to be useful.',
                    })}
                </Tooltip>
            </div>
        </PayGateMini>
    )
}

function useHeaderStatuses(currentTeam: TeamType | TeamPublicType | null): {
    urlStatus: string
    eventStatus: string
    flagStatus: string
    samplingStatus: string
    minDurationStatus: string
    blocklistStatus: string
} {
    const { t } = useTranslation()
    const { urlTriggerConfig, eventTriggerConfig } = useValues(replayTriggersLogic)

    const urlCount = urlTriggerConfig?.length ?? 0
    const eventCount = eventTriggerConfig?.length ?? 0
    const flagKey = currentTeam?.session_recording_linked_flag?.key
    const numericSampleRate = toDisplaySampleRate(currentTeam?.session_recording_sample_rate)
    const minDurationMs = currentTeam?.session_recording_minimum_duration_milliseconds
    const blocklistCount = currentTeam?.session_recording_url_blocklist_config?.length ?? 0

    return {
        urlStatus:
            urlCount > 0
                ? t('settings.environment.replayTriggers.headerStatus.patternCount', {
                      count: urlCount,
                      defaultValue_one: '{{ count }} pattern',
                      defaultValue_other: '{{ count }} patterns',
                  })
                : t('settings.environment.replayTriggers.headerStatus.notConfigured', {
                      defaultValue: 'Not configured',
                  }),
        eventStatus:
            eventCount > 0
                ? t('settings.environment.replayTriggers.headerStatus.eventCount', {
                      count: eventCount,
                      defaultValue_one: '{{ count }} event',
                      defaultValue_other: '{{ count }} events',
                  })
                : t('settings.environment.replayTriggers.headerStatus.notConfigured', {
                      defaultValue: 'Not configured',
                  }),
        flagStatus:
            flagKey ??
            t('settings.environment.replayTriggers.headerStatus.notConfigured', {
                defaultValue: 'Not configured',
            }),
        samplingStatus: `${numericSampleRate}%${
            numericSampleRate === 100
                ? ` ${t('settings.environment.replayTriggers.sampling.default', { defaultValue: '(default)' })}`
                : ''
        }`,
        minDurationStatus: minDurationMs
            ? `${minDurationMs / 1000}s`
            : t('settings.environment.replayTriggers.headerStatus.noMinimum', { defaultValue: 'No minimum' }),
        blocklistStatus:
            blocklistCount > 0
                ? t('settings.environment.replayTriggers.headerStatus.patternCount', {
                      count: blocklistCount,
                      defaultValue_one: '{{ count }} pattern',
                      defaultValue_other: '{{ count }} patterns',
                  })
                : t('settings.environment.replayTriggers.headerStatus.notConfigured', {
                      defaultValue: 'Not configured',
                  }),
    }
}

function LegacyRecordingConditions(): JSX.Element {
    const { t } = useTranslation()
    const { selectedPlatform } = useValues(replayTriggersLogic)
    const { currentTeam } = useValues(teamLogic)
    const { featureFlags } = useValues(featureFlagLogic)
    const statuses = useHeaderStatuses(currentTeam)

    const isV2TriggersEnabled = featureFlags[FEATURE_FLAGS.REPLAY_TRIGGERS_V2]

    return (
        <>
            {currentTeam && <RecordingTriggersSummary currentTeam={currentTeam} selectedPlatform={selectedPlatform} />}

            <IngestionControls.MatchTypeSelect />

            <AnyWith100SamplingWarning currentTeam={currentTeam} isV2TriggersEnabled={!!isV2TriggersEnabled} />

            <div>
                <h3 className="text-sm font-semibold mb-2">
                    {t('settings.environment.replayTriggers.conditions.heading', {
                        defaultValue: 'Recording conditions',
                    })}
                </h3>
                <LemonCollapse
                    multiple
                    panels={[
                        {
                            key: 'url',
                            header: (
                                <TriggerPanelHeader
                                    title={t('settings.environment.replayTriggers.conditions.urlMatches', {
                                        defaultValue: 'URL matches',
                                    })}
                                    status={statuses.urlStatus}
                                    showMatchTag
                                />
                            ),
                            content: <UrlTriggerOptions />,
                        },
                        {
                            key: 'event',
                            header: (
                                <TriggerPanelHeader
                                    title={t('settings.environment.replayTriggers.eventTrigger.eventEmitted', {
                                        defaultValue: 'Event emitted',
                                    })}
                                    status={statuses.eventStatus}
                                    showMatchTag
                                />
                            ),
                            content: <EventTriggerOptions />,
                        },
                        {
                            key: 'flag',
                            header: (
                                <TriggerPanelHeader
                                    title={t('settings.environment.replayTriggers.conditions.featureFlag', {
                                        defaultValue: 'Feature flag',
                                    })}
                                    status={statuses.flagStatus}
                                    showMatchTag
                                />
                            ),
                            content: <LinkedFlagSelector />,
                        },
                    ]}
                />
            </div>

            <div>
                <h3 className="text-sm font-semibold mb-2">
                    {t('settings.environment.replayTriggers.limits.heading', { defaultValue: 'Recording limits' })}
                </h3>
                <LemonCollapse
                    multiple
                    panels={[
                        {
                            key: 'sampling',
                            header: (
                                <TriggerPanelHeader
                                    title={t('settings.environment.replayTriggers.limits.sampling', {
                                        defaultValue: 'Sampling',
                                    })}
                                    status={statuses.samplingStatus}
                                    showMatchTag
                                />
                            ),
                            content: <Sampling />,
                        },
                        {
                            key: 'min-duration',
                            header: (
                                <TriggerPanelHeader
                                    title={t('settings.environment.replayTriggers.limits.minimumDuration', {
                                        defaultValue: 'Minimum duration',
                                    })}
                                    status={statuses.minDurationStatus}
                                />
                            ),
                            content: <MinimumDurationSetting />,
                        },
                    ]}
                />
            </div>

            <div>
                <h3 className="text-base font-semibold mb-2">
                    {t('settings.environment.replayTriggers.exclusions.heading', {
                        defaultValue: 'Recording exclusions',
                    })}{' '}
                    <Since web={{ version: '1.171.0' }} />
                </h3>
                <LemonCollapse
                    multiple
                    panels={[
                        {
                            key: 'blocklist',
                            header: (
                                <TriggerPanelHeader
                                    title={t('settings.environment.replayTriggers.exclusions.urlBlocklist', {
                                        defaultValue: 'URL blocklist',
                                    })}
                                    status={statuses.blocklistStatus}
                                />
                            ),
                            content: <UrlBlocklistOptions />,
                        },
                    ]}
                />
            </div>
        </>
    )
}

function SdkCompatibilityBanner(): JSX.Element {
    const { t } = useTranslation()
    const {
        shouldMinimizeLegacyConditions,
        webTrafficIsRecent,
        hasV2TriggerGroups,
        hasOutdatedWebSdk,
        outdatedWebTraffic,
    } = useValues(replayTriggersLogic)
    const { hasLegacyTriggers } = useValues(replayTriggersV2Logic)
    const { showCreateFromLegacyModal, setIsAddingGroup } = useActions(replayTriggersV2Logic)

    if (shouldMinimizeLegacyConditions) {
        return (
            <LemonBanner type="success">
                <Trans
                    i18nKey="settings.environment.replayTriggers.sdkCompatibility.allRecent"
                    values={{ version: TRIGGER_GROUPS_MIN_SDK_VERSION }}
                    defaults="Your recent web SDK traffic is effectively all on v{{ version }}+, so trigger groups apply to essentially every session. The legacy recording conditions below are kept only as a fallback for older SDKs."
                />
            </LemonBanner>
        )
    }

    if (webTrafficIsRecent && !hasV2TriggerGroups) {
        return (
            <LemonBanner
                type="info"
                action={
                    hasLegacyTriggers
                        ? {
                              children: t('settings.environment.replayTriggers.sdkCompatibility.migrate', {
                                  defaultValue: 'Migrate legacy conditions',
                              }),
                              onClick: showCreateFromLegacyModal,
                          }
                        : {
                              children: t('settings.environment.replayTriggers.sdkCompatibility.addTriggerGroup', {
                                  defaultValue: 'Add trigger group',
                              }),
                              onClick: () => setIsAddingGroup(true),
                          }
                }
            >
                <Trans
                    i18nKey="settings.environment.replayTriggers.sdkCompatibility.noGroupsYet"
                    values={{ version: TRIGGER_GROUPS_MIN_SDK_VERSION }}
                    defaults="Your recent web SDK traffic is on v{{ version }}+, but you haven't set up trigger groups yet. Recording still uses the legacy conditions below. Newer SDKs fall back to them when no trigger groups exist, so nothing changes until you migrate."
                />
            </LemonBanner>
        )
    }

    if (hasOutdatedWebSdk) {
        const pct = outdatedWebTraffic.share < 0.01 ? '<1' : Math.round(outdatedWebTraffic.share * 100).toString()
        const events = t('settings.environment.replayTriggers.sdkCompatibility.eventCount', {
            count: outdatedWebTraffic.outdatedCount,
            defaultValue_one: '{{ count }} event',
            defaultValue_other: '{{ count }} events',
        })
        return (
            <LemonBanner type="info">
                <Trans
                    i18nKey="settings.environment.replayTriggers.sdkCompatibility.someOutdated"
                    values={{
                        pct,
                        count: humanFriendlyNumber(outdatedWebTraffic.outdatedCount),
                        events,
                        version: TRIGGER_GROUPS_MIN_SDK_VERSION,
                    }}
                    components={{ Strong: <strong /> }}
                    defaults="About <Strong>{{ pct }}%</Strong> of recent web traffic ({{ count }} {{ events }}) is on a posthog-js before v{{ version }}. Those sessions still record using the legacy recording conditions below. Upgrade to v{{ version }}+ for full trigger-group coverage. Both configurations are sent meanwhile, so nothing is lost."
                />
            </LemonBanner>
        )
    }

    return (
        <LemonBanner type="warning">
            <strong>
                {t('settings.environment.replayTriggers.sdkCompatibility.title', {
                    defaultValue: 'JavaScript SDK version compatibility',
                })}
            </strong>
            <ul className="list-disc ml-4 mt-2 space-y-1">
                <li>
                    <Trans
                        i18nKey="settings.environment.replayTriggers.sdkCompatibility.supportedVersions"
                        values={{ version: TRIGGER_GROUPS_MIN_SDK_VERSION }}
                        defaults="SDK versions &gt;= v{{ version }} use trigger groups if configured, otherwise fall back to the legacy recording conditions"
                    />
                </li>
                <li>
                    {t('settings.environment.replayTriggers.sdkCompatibility.bothConfigurations', {
                        defaultValue:
                            'Both configurations are sent to ensure backward compatibility with all JavaScript SDK versions',
                    })}
                </li>
            </ul>
        </LemonBanner>
    )
}

export function ReplayTriggers(): JSX.Element {
    const { t } = useTranslation()
    const { selectedPlatform, shouldMinimizeLegacyConditions } = useValues(replayTriggersLogic)
    const { selectPlatform } = useActions(replayTriggersLogic)
    const { updateCurrentTeam } = useActions(teamLogic)
    const { currentTeam } = useValues(teamLogic)
    const { featureFlags } = useValues(featureFlagLogic)

    const isV2TriggersEnabled = featureFlags[FEATURE_FLAGS.REPLAY_TRIGGERS_V2]

    const tabs: LemonTab<'web' | 'mobile'>[] = [
        {
            key: 'web',
            label: t('settings.environment.replayTriggers.platforms.web', { defaultValue: 'Web' }),
            content: (
                <div className="flex flex-col gap-y-4">
                    {isV2TriggersEnabled && (
                        <>
                            <SdkCompatibilityBanner />

                            <TriggerGroupsEditor />
                        </>
                    )}

                    {isV2TriggersEnabled && (
                        <div className="mt-2">
                            <LemonDivider className="mb-4" />
                            <h3 className="text-base font-semibold mb-1">
                                {t('settings.environment.replayTriggers.legacyConditions.heading', {
                                    defaultValue: 'Legacy recording conditions',
                                })}
                            </h3>
                        </div>
                    )}

                    {isV2TriggersEnabled && shouldMinimizeLegacyConditions ? (
                        <LemonCollapse
                            panels={[
                                {
                                    key: 'legacy-recording-conditions',
                                    header: (
                                        <span className="text-muted text-sm font-normal">
                                            <Trans
                                                i18nKey="settings.environment.replayTriggers.legacyConditions.hidden"
                                                values={{ version: TRIGGER_GROUPS_MIN_SDK_VERSION }}
                                                defaults="Hidden because your web SDKs (v{{ version }}+) use trigger groups. Expand to configure fallbacks for older SDK versions."
                                            />
                                        </span>
                                    ),
                                    content: (
                                        <div className="flex flex-col gap-y-4 pt-2">
                                            <LegacyRecordingConditions />
                                        </div>
                                    ),
                                },
                            ]}
                        />
                    ) : (
                        <>
                            {isV2TriggersEnabled && (
                                <LemonBanner type="warning">
                                    <Trans
                                        i18nKey="settings.environment.replayTriggers.legacyConditions.fallbackNotice"
                                        values={{ version: TRIGGER_GROUPS_MIN_SDK_VERSION }}
                                        defaults="Used by SDK versions &lt; v{{ version }} and as fallback for newer versions if trigger groups are not configured."
                                    />
                                </LemonBanner>
                            )}
                            <LegacyRecordingConditions />
                        </>
                    )}
                </div>
            ),
        },
        {
            key: 'mobile',
            label: t('settings.environment.replayTriggers.platforms.mobile', { defaultValue: 'Mobile' }),
            content: (
                <div className="flex flex-col gap-y-2">
                    <LemonBanner type="info">
                        {t('settings.environment.replayTriggers.platforms.mobileNotice', {
                            defaultValue:
                                "Trigger groups aren't available on mobile yet. Mobile recording uses the settings below, which are shared with web. Changing a setting here also changes it on web.",
                        })}
                    </LemonBanner>
                    {currentTeam && (
                        <RecordingTriggersSummary currentTeam={currentTeam} selectedPlatform={selectedPlatform} />
                    )}
                    <IngestionControls.MatchTypeSelect
                        lockedToAllReason={t('settings.environment.replayTriggers.platforms.mobileMatchTypeLocked', {
                            defaultValue: "Mobile only supports trigger matching of type 'all'.",
                        })}
                    />
                    <MobileEventTriggers />
                    <LinkedFlagSelector />
                    <MobileSampling />
                    <MobileMinimumDuration />
                </div>
            ),
        },
    ]

    return (
        <IngestionControls
            logicKey="session-replay"
            resourceType={AccessControlResourceType.SessionRecording}
            matchType={currentTeam?.session_recording_trigger_match_type_config || 'all'}
            onChangeMatchType={(value) => updateCurrentTeam({ session_recording_trigger_match_type_config: value })}
        >
            <div className="flex flex-col gap-y-2">
                <LemonTabs activeKey={selectedPlatform} onChange={selectPlatform} tabs={tabs} />
            </div>
        </IngestionControls>
    )
}

const RecordingTriggersSummary = ({
    currentTeam,
    selectedPlatform,
}: {
    currentTeam: TeamType | TeamPublicType
    selectedPlatform: ReplayPlatform
}): JSX.Element => {
    const { t } = useTranslation()
    const triggers = useTriggers(currentTeam, selectedPlatform)

    if (!currentTeam?.session_recording_opt_in) {
        return (
            <LemonBanner type="warning">
                <Trans
                    i18nKey="settings.environment.replayTriggers.summary.recordingDisabled"
                    components={{ Strong: <strong /> }}
                    defaults="<Strong>Recording is disabled.</Strong> Enable it in General settings."
                />
            </LemonBanner>
        )
    }

    return (
        <IngestionControlsSummary
            triggers={triggers}
            controlDescription={t('settings.environment.replayTriggers.summary.controlDescription', {
                defaultValue: 'sessions recorded',
            })}
            docsLink={{
                to: 'https://posthog.com/docs/session-replay/how-to-control-which-sessions-you-record',
                label: t('settings.environment.replayTriggers.summary.docsLink', {
                    defaultValue: 'Read about how to start and stop sessions in our docs.',
                }),
            }}
        />
    )
}

const useTriggers = (currentTeam: TeamType | TeamPublicType, selectedPlatform: 'web' | 'mobile'): Trigger[] => {
    const { urlTriggerConfig, eventTriggerConfig } = useValues(replayTriggersLogic)

    const hasUrlTriggers = (urlTriggerConfig?.length ?? 0) > 0
    const hasEventTriggers = (eventTriggerConfig?.length ?? 0) > 0
    const hasFeatureFlag = !!currentTeam.session_recording_linked_flag
    const sampleRate = currentTeam.session_recording_sample_rate
    const hasSampling = toDisplaySampleRate(sampleRate) < 100
    const hasMinDuration = !!currentTeam.session_recording_minimum_duration_milliseconds
    const hasUrlBlocklist = (currentTeam.session_recording_url_blocklist_config?.length ?? 0) > 0

    const isWebPlatform = selectedPlatform === 'web'

    const flagTrigger: FeatureFlagTrigger = {
        type: TriggerType.FEATURE_FLAG,
        enabled: hasFeatureFlag,
        key: currentTeam.session_recording_linked_flag?.key ?? null,
    }

    if (isWebPlatform) {
        return [
            {
                type: TriggerType.URL_MATCH,
                enabled: hasUrlTriggers,
                urls: urlTriggerConfig,
            },
            {
                type: TriggerType.EVENT,
                enabled: hasEventTriggers,
                events: eventTriggerConfig,
            },
            flagTrigger,
            {
                type: TriggerType.SAMPLING,
                enabled: hasSampling,
                sampleRate: sampleRate ? parseFloat(sampleRate) : null,
            },
            {
                type: TriggerType.MIN_DURATION,
                enabled: hasMinDuration,
                minDurationMs: hasMinDuration
                    ? (currentTeam.session_recording_minimum_duration_milliseconds ?? 0)
                    : null,
            },
            {
                type: TriggerType.URL_BLOCKLIST,
                enabled: hasUrlBlocklist,
                urls: currentTeam.session_recording_url_blocklist_config ?? null,
            },
        ]
    }

    return [
        {
            type: TriggerType.EVENT,
            enabled: hasEventTriggers,
            events: eventTriggerConfig,
        },
        flagTrigger,
        {
            type: TriggerType.SAMPLING,
            enabled: hasSampling,
            sampleRate: sampleRate ? parseFloat(sampleRate) : null,
        },
        {
            type: TriggerType.MIN_DURATION,
            enabled: hasMinDuration,
            minDurationMs: hasMinDuration ? (currentTeam.session_recording_minimum_duration_milliseconds ?? 0) : null,
        },
    ]
}
