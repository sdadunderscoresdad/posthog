import { BindLogic, useActions, useValues } from 'kea'

import { i18n } from 'lib/i18n/i18n'
import { LemonButton } from 'lib/lemon-ui/LemonButton'
import { LemonModal } from 'lib/lemon-ui/LemonModal'

import { EditWidgetModalTileDetailsSection } from '../EditWidgetModalTileDetailsSection'
import type { DashboardWidgetEditModalProps } from '../registry'
import { editExperimentResultsWidgetModalLogic } from './editExperimentResultsWidgetModalLogic'

function EditExperimentResultsWidgetModalContents(): JSX.Element {
    const { tileName, tileDescription, saving, saveDisabledReason, onClose, defaultTitle } = useValues(
        editExperimentResultsWidgetModalLogic
    )
    const { setTileName, setTileDescription, submit } = useActions(editExperimentResultsWidgetModalLogic)

    return (
        <LemonModal
            isOpen
            onClose={onClose}
            title={i18n.t('dashboardWidgets.editModal.title', { defaultValue: 'Widget settings' })}
            description={i18n.t('dashboardWidgets.experimentResults.edit.description', {
                defaultValue:
                    "Configure the tile details. Pick which experiment's results to show from the tile's filter bar.",
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
                        disabledReason={saveDisabledReason}
                        onClick={() => submit()}
                    >
                        {i18n.t('settings.save', { defaultValue: 'Save' })}
                    </LemonButton>
                </>
            }
        >
            <EditWidgetModalTileDetailsSection
                tileName={tileName}
                tileDescription={tileDescription}
                defaultTitle={defaultTitle}
                saving={saving}
                setTileName={setTileName}
                setTileDescription={setTileDescription}
            />
        </LemonModal>
    )
}

export function EditExperimentResultsWidgetModal({
    isOpen,
    onClose,
    config,
    onSave,
    name,
    defaultTitle,
    description,
}: DashboardWidgetEditModalProps): JSX.Element | null {
    if (!isOpen) {
        return null
    }

    return (
        <BindLogic
            logic={editExperimentResultsWidgetModalLogic}
            props={{ onClose, config, onSave, name, defaultTitle, description }}
        >
            <EditExperimentResultsWidgetModalContents />
        </BindLogic>
    )
}
