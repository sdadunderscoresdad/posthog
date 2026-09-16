import { useActions, useValues } from 'kea'
import { Trans, useTranslation } from 'react-i18next'

import { LemonSelect } from '@posthog/lemon-ui'

import { BridgePage } from 'lib/components/BridgePage/BridgePage'
import { LemonBanner } from 'lib/lemon-ui/LemonBanner'
import { SpinnerOverlay } from 'lib/lemon-ui/Spinner'
import { SceneExport } from 'scenes/sceneTypes'

import { cliLiveLogic } from './cliLiveLogic'

export const scene: SceneExport = {
    component: CLILive,
    logic: cliLiveLogic,
}

export function CLILive(): JSX.Element {
    const { t } = useTranslation()
    const { port, projects, projectsLoading, error, redirected, selectedProjectId } = useValues(cliLiveLogic)
    const { selectProject } = useActions(cliLiveLogic)

    if (!port) {
        return (
            <BridgePage view="login">
                <div className="text-center space-y-4">
                    <h2>{t('cliLive.missingPort', { defaultValue: 'Missing port parameter' })}</h2>
                    <LemonBanner type="error">
                        <Trans
                            i18nKey="cliLive.missingPortDetail"
                            components={{ code: <code /> }}
                            defaults="This page should be opened from the PostHog Live TUI. Please run <code>posthog-live</code> in your terminal."
                        />
                    </LemonBanner>
                </div>
            </BridgePage>
        )
    }

    if (redirected) {
        return (
            <BridgePage view="login">
                <div className="text-center space-y-4">
                    <h2>{t('cliLive.complete', { defaultValue: 'Authorization complete' })}</h2>
                    <LemonBanner type="success">
                        <div className="space-y-2">
                            <p className="font-semibold">
                                {t('cliLive.completeDetail', {
                                    defaultValue: 'You can close this tab and return to your terminal.',
                                })}
                            </p>
                        </div>
                    </LemonBanner>
                </div>
            </BridgePage>
        )
    }

    if (error) {
        return (
            <BridgePage view="login">
                <div className="text-center space-y-4">
                    <h2>{t('cliLive.failed', { defaultValue: 'Authorization failed' })}</h2>
                    <LemonBanner type="error">{error}</LemonBanner>
                </div>
            </BridgePage>
        )
    }

    if (projectsLoading || projects.length === 1) {
        return (
            <BridgePage view="login">
                <div className="text-center space-y-4">
                    <h2>{t('cliLive.authorizing', { defaultValue: 'Authorizing PostHog Live...' })}</h2>
                    <SpinnerOverlay />
                </div>
            </BridgePage>
        )
    }

    return (
        <BridgePage view="login">
            <div className="space-y-4">
                <h2>{t('cliLive.selectProject', { defaultValue: 'Select a project' })}</h2>
                <p className="text-muted text-sm">
                    {t('cliLive.selectProjectDetail', {
                        defaultValue: 'Choose which project to stream live events from.',
                    })}
                </p>
                <LemonSelect
                    data-attr="cli-live-project-select"
                    placeholder={t('vercelConnect.selectProject', { defaultValue: 'Select a project' })}
                    value={selectedProjectId}
                    onChange={(value) => {
                        if (value) {
                            selectProject(value)
                        }
                    }}
                    options={projects.map((project) => ({
                        label: project.name,
                        value: project.id,
                    }))}
                    fullWidth
                />
            </div>
        </BridgePage>
    )
}
