import type { TFunction } from 'i18next'
import { useValues } from 'kea'
import { router } from 'kea-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { IconCheckCircle } from '@posthog/icons'
import { LemonLabel, LemonModal, LemonSelect, LemonSelectOptions } from '@posthog/lemon-ui'

import { CLOUD_HOSTNAMES } from 'lib/constants'
import { countryCodeToFlag } from 'lib/utils/country'
import { pendingOAuthConnectionLogic } from 'scenes/authentication/shared/pendingOAuthConnectionLogic'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'

import { Region } from '~/types'

/**
 * Built from `t` rather than kept as a module constant, because a message read at import time never
 * follows a language change.
 */
function regionSections(t: TFunction): { title: string; features: string[] }[] {
    return [
        {
            title: t('login.region.usHosting', { defaultValue: 'US hosting' }),
            features: [
                t('login.region.usFeature1', {
                    defaultValue: 'Faster if you and your users are based in the US',
                }),
                t('login.region.usFeature2', { defaultValue: 'Easier to comply with some US regulations' }),
                t('login.region.usFeature3', { defaultValue: 'Hosted in Virginia, USA' }),
            ],
        },
        {
            title: t('login.region.euHosting', { defaultValue: 'EU hosting' }),
            features: [
                t('login.region.euFeature1', {
                    defaultValue: 'Faster if you and your users are based in Europe',
                }),
                t('login.region.euFeature2', {
                    defaultValue: 'Keeps data in the EU to comply with GDPR requirements',
                }),
                t('login.region.euFeature3', { defaultValue: 'Hosted in Frankfurt, Germany' }),
            ],
        },
    ]
}

function RegionModal({ open, onClose }: { open: boolean; onClose: () => void }): JSX.Element {
    const { t } = useTranslation()
    return (
        <LemonModal
            title={t('login.region.chooseTitle', { defaultValue: 'Which region would you like to choose?' })}
            description={t('login.region.chooseDescription', {
                defaultValue: "It's possible to migrate to another region later.",
            })}
            isOpen={open}
            onClose={onClose}
        >
            <ul className="list-none">
                {regionSections(t).map((section) => (
                    <li
                        key={section.title}
                        className="border-t first:border-t-0 border-dashed border-gray-accent mt-2 first:mt-0"
                    >
                        <h4 className="text-lg m-0 mt-2">{section.title}</h4>
                        <ul className="list-none p-0 my-2 deprecated-space-y-1">
                            {section.features.map((feature) => (
                                <li
                                    key={feature}
                                    className="flex items-center deprecated-space-x-2 text-gray-accent-light align-center"
                                >
                                    <IconCheckCircle className="w-[20px] flex-shrink-0" />
                                    <span className="text-black font-medium">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </LemonModal>
    )
}

const REGION_COUNTRY_CODE: Record<Region, string> = {
    [Region.US]: 'US',
    [Region.EU]: 'EU',
    [Region.DEV]: 'US',
}

function MiniFlag({ region }: { region: Region }): JSX.Element {
    return (
        <span className="shrink-0 leading-none" aria-hidden>
            {countryCodeToFlag(REGION_COUNTRY_CODE[region])}
        </span>
    )
}

function regionOptions(t: TFunction): { value: Region; label: string }[] {
    return [
        { value: Region.US, label: t('login.region.unitedStates', { defaultValue: 'United States' }) },
        { value: Region.EU, label: t('login.region.europeanUnion', { defaultValue: 'European Union' }) },
    ]
}

export function RegionField(): JSX.Element | null {
    const { t } = useTranslation()
    const { preflight } = useValues(preflightLogic)
    const { pendingConnection } = useValues(pendingOAuthConnectionLogic)
    const [devRegion, setDevRegion] = useState<Region>(Region.US)
    const [modalOpen, setModalOpen] = useState(false)

    if (!preflight?.cloud && !preflight?.is_debug) {
        return null
    }

    const activeRegion = preflight?.cloud ? (preflight.region ?? Region.US) : devRegion

    const selectRegion = (region: Region): void => {
        if (region === activeRegion) {
            return
        }
        if (preflight?.cloud) {
            const { pathname, search, hash } = router.values.currentLocation
            window.location.href = `https://${CLOUD_HOSTNAMES[region]}${pathname}${search}${hash}`
            return
        }
        setDevRegion(region)
    }

    // An OAuth client is registered in one region only, so an account created elsewhere could
    // never finish the connection that brought the person here.
    const pinnedReason = pendingConnection
        ? t('login.region.pinnedReason', {
              defaultValue:
                  'This connection started in the {{ region }} region. To use another region, start again from {{ client }}.',
              region: regionOptions(t).find((r) => r.value === activeRegion)?.label ?? activeRegion,
              client: pendingConnection.clientName,
          })
        : undefined

    const options: LemonSelectOptions<Region> = regionOptions(t).map((region) => ({
        value: region.value,
        label: (
            <span className="flex items-center gap-2">
                <MiniFlag region={region.value} />
                <span>{region.label}</span>
            </span>
        ),
    }))

    return (
        <>
            <RegionModal open={modalOpen} onClose={() => setModalOpen(false)} />
            <div className="flex flex-col gap-2">
                <LemonLabel onExplanationClick={() => setModalOpen(true)}>
                    {t('login.region.dataRegion', { defaultValue: 'Data region' })}
                </LemonLabel>
                <LemonSelect<Region>
                    value={activeRegion}
                    options={options}
                    fullWidth
                    disabledReason={pinnedReason}
                    onChange={(value) => value && selectRegion(value)}
                    renderButtonContent={(leaf) => {
                        const region = leaf?.value ?? activeRegion
                        return (
                            <span className="flex items-center gap-2">
                                <MiniFlag region={region} />
                                <span>{regionOptions(t).find((r) => r.value === region)?.label}</span>
                            </span>
                        )
                    }}
                />
                {pinnedReason && <p className="m-0 text-xs text-secondary">{pinnedReason}</p>}
            </div>
        </>
    )
}
