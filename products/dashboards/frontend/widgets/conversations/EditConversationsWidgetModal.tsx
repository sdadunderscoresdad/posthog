import { BindLogic, useActions, useValues } from 'kea'

import { LemonButton, LemonInput, LemonModal } from '@posthog/lemon-ui'

import { i18n } from 'lib/i18n/i18n'
import { LemonField } from 'lib/lemon-ui/LemonField/LemonField'

import { EditWidgetModalTileDetailsSection } from '../EditWidgetModalTileDetailsSection'
import type { DashboardWidgetEditModalProps } from '../registry'
import { editConversationsWidgetModalLogic } from './editConversationsWidgetModalLogic'

function Contents(): JSX.Element {
    const { limit, tileName, tileDescription, saving, onClose, defaultTitle } = useValues(
        editConversationsWidgetModalLogic
    )
    const { setLimit, setTileName, setTileDescription, submit } = useActions(editConversationsWidgetModalLogic)
    return (
        <LemonModal
            isOpen
            onClose={onClose}
            title={i18n.t('dashboardWidgets.editModal.title', { defaultValue: 'Widget settings' })}
            description={i18n.t('dashboardWidgets.conversations.edit.description', {
                defaultValue: 'Configure the tile details and number of recent tickets.',
            })}
            width={680}
            footer={
                <>
                    <div className="flex-1" />
                    <LemonButton type="secondary" onClick={onClose} disabled={saving}>
                        {i18n.t('common.cancel', { defaultValue: 'Cancel' })}
                    </LemonButton>
                    <LemonButton
                        type="primary"
                        loading={saving}
                        disabledReason={
                            limit < 1 || limit > 25
                                ? i18n.t('dashboardWidgets.conversations.edit.limitInvalid', {
                                      defaultValue: 'Enter a number from 1 to 25',
                                  })
                                : undefined
                        }
                        onClick={() => submit()}
                    >
                        {i18n.t('settings.save', { defaultValue: 'Save' })}
                    </LemonButton>
                </>
            }
        >
            <div className="flex flex-col gap-4">
                <EditWidgetModalTileDetailsSection
                    tileName={tileName}
                    tileDescription={tileDescription}
                    defaultTitle={defaultTitle}
                    saving={saving}
                    setTileName={setTileName}
                    setTileDescription={setTileDescription}
                />
                <LemonField.Pure
                    label={i18n.t('dashboardWidgets.conversations.edit.numberOfTickets', {
                        defaultValue: 'Number of tickets',
                    })}
                    help={i18n.t('dashboardWidgets.conversations.edit.numberOfTicketsHelp', {
                        defaultValue: 'Show up to 25 recently updated tickets.',
                    })}
                >
                    <LemonInput
                        type="number"
                        min={1}
                        max={25}
                        value={limit}
                        onChange={(value) => setLimit(Number(value))}
                    />
                </LemonField.Pure>
            </div>
        </LemonModal>
    )
}

export function EditConversationsWidgetModal({ isOpen, ...props }: DashboardWidgetEditModalProps): JSX.Element | null {
    if (!isOpen) {
        return null
    }
    return (
        <BindLogic logic={editConversationsWidgetModalLogic} props={props}>
            <Contents />
        </BindLogic>
    )
}
