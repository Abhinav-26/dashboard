import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import Tippy from '@tippyjs/react'

import {
    abortPreviousRequests,
    DEPLOYMENT_HISTORY_CONFIGURATION_LIST_MAP,
    DeploymentHistoryDiffView,
    getIsRequestAborted,
    Progressing,
    showError,
    useAsync,
    useUserEmail,
} from '@devtron-labs/devtron-fe-common-lib'

import { ReactComponent as InfoIconOutlined } from '@Icons/ic-info-outline-grey.svg'
import { hasApproverAccess, importComponentFromFELibrary } from '@Components/common'
import { prepareHistoryData } from '@Components/app/details/cdDetails/service'
import { DeploymentHistoryDetail } from '@Components/app/details/cdDetails/cd.type'
import {
    CMSecretComponentType,
    CMSecretProtectedTab,
    DraftState,
    ProtectedConfigMapSecretProps,
} from '@Pages/Shared/ConfigMapSecret/ConfigMapSecret.types'

import { CM_SECRET_COMPONENT_NAME, CM_SECRET_STATE } from './ConfigMapSecret.constants'
import { ConfigMapSecretForm } from './ConfigMapSecretForm'
import { getCMSecret } from './ConfigMapSecret.service'

const ApproveRequestTippy = importComponentFromFELibrary('ApproveRequestTippy')

export const ProtectedConfigMapSecretDetails = ({
    appChartRef,
    data,
    id,
    componentType,
    cmSecretStateLabel,
    isJobView,
    selectedTab,
    draftData,
    parentName,
    reloadEnvironments,
    updateCMSecret,
    openDeleteModal,
    setOpenDeleteModal,
}: ProtectedConfigMapSecretProps) => {
    // HOOKS
    const { appId, name } = useParams<{ appId: string; name: string }>()
    const { email } = useUserEmail()

    // STATES
    const [baseData, setBaseData] = useState(data)

    // REFS
    const abortControllerRef = useRef<AbortController>(new AbortController())

    // ASYNC CALLS
    const [baseDataLoading, baseDataRes, baseDataErr] = useAsync(
        () =>
            abortPreviousRequests(
                () =>
                    getCMSecret(componentType, id, appId, data.name, {
                        signal: abortControllerRef.current.signal,
                    }),
                abortControllerRef,
            ),
        [],
        draftData.action === 3 &&
            cmSecretStateLabel === CM_SECRET_STATE.OVERRIDDEN &&
            componentType === CMSecretComponentType.Secret &&
            !data.unAuthorized,
    )

    useEffect(() => {
        if (baseDataRes?.result?.configData?.length) {
            const _baseData = { ...baseDataRes.result.configData[0], unAuthorized: false }
            setBaseData(_baseData)
        }

        if (baseDataErr && !getIsRequestAborted(baseDataErr)) {
            showError(baseDataErr)
        }
    }, [baseDataRes, baseDataErr])

    const getData = () => {
        try {
            if (selectedTab === CMSecretProtectedTab.Draft) {
                return draftData.action === 3 && cmSecretStateLabel === CM_SECRET_STATE.OVERRIDDEN
                    ? baseData
                    : { ...JSON.parse(draftData.data).configData[0], unAuthorized: draftData?.dataEncrypted }
            }
            if (cmSecretStateLabel === CM_SECRET_STATE.UNPUBLISHED) {
                return null
            }
            return data
        } catch (error) {
            return null
        }
    }

    const getObfuscatedData = (codeEditorData) => {
        const _codeEditorData = { ...codeEditorData }
        if (
            componentType === CMSecretComponentType.Secret &&
            (data.unAuthorized || draftData?.dataEncrypted) &&
            _codeEditorData
        ) {
            Object.keys(_codeEditorData).reduce(
                (acc, curr) => ({ ...acc, [acc[curr]]: Array(8).fill('*').join('') }),
                _codeEditorData,
            )
        }
        return _codeEditorData
    }

    const getCodeEditorData = (cmSecretData, isOverridden) => {
        if (isOverridden) {
            if (Object.keys(cmSecretData.defaultData ?? {}).length > 0) {
                return getObfuscatedData(cmSecretData.defaultData)
            }
            if (componentType === CMSecretComponentType.Secret) {
                if (Object.keys(cmSecretData.defaultSecretData ?? {}).length > 0) {
                    return cmSecretData.defaultSecretData
                }
                if (Object.keys(data.defaultESOSecretData ?? {}).length > 0) {
                    return cmSecretData.defaultESOSecretData
                }
            }
        }
        if (Object.keys(cmSecretData.data ?? {}).length > 0) {
            return getObfuscatedData(cmSecretData.data)
        }
        if (componentType === CMSecretComponentType.Secret) {
            if (Object.keys(cmSecretData.secretData ?? {}).length > 0) {
                return cmSecretData.secretData
            }
            if (Object.keys(cmSecretData.esoSecretData ?? {}).length > 0) {
                return cmSecretData.esoSecretData
            }
        }

        return null
    }

    const getCurrentConfig = (): DeploymentHistoryDetail => {
        let currentConfigData = {}
        const codeEditorValue = { displayName: 'data', value: '' }
        try {
            currentConfigData =
                draftData.action === 3 && cmSecretStateLabel === CM_SECRET_STATE.OVERRIDDEN
                    ? baseData
                    : JSON.parse(draftData.data).configData[0]
            codeEditorValue.value = JSON.stringify(getCodeEditorData(currentConfigData, false)) ?? ''
        } catch (error) {
            // do nothing
        }
        return prepareHistoryData(
            { ...currentConfigData, codeEditorValue },
            componentType === CMSecretComponentType.Secret
                ? DEPLOYMENT_HISTORY_CONFIGURATION_LIST_MAP.SECRET.VALUE
                : DEPLOYMENT_HISTORY_CONFIGURATION_LIST_MAP.CONFIGMAP.VALUE,
            componentType === CMSecretComponentType.Secret && (data.unAuthorized ?? draftData?.unAuthorized),
        )
    }

    const getBaseConfig = (): DeploymentHistoryDetail => {
        const _data = { ...data }
        if (cmSecretStateLabel === CM_SECRET_STATE.INHERITED && !_data.mountPath) {
            _data.mountPath = _data.defaultMountPath
        }
        const codeEditorValue = {
            displayName: 'data',
            value: JSON.stringify(getCodeEditorData(_data, cmSecretStateLabel === CM_SECRET_STATE.INHERITED)) ?? '',
        }

        return prepareHistoryData(
            { ..._data, codeEditorValue },
            componentType === CMSecretComponentType.Secret
                ? DEPLOYMENT_HISTORY_CONFIGURATION_LIST_MAP.SECRET.VALUE
                : DEPLOYMENT_HISTORY_CONFIGURATION_LIST_MAP.CONFIGMAP.VALUE,
            componentType === CMSecretComponentType.Secret && (data.unAuthorized ?? draftData?.unAuthorized),
        )
    }

    const renderApproveButton = (): JSX.Element => {
        if (draftData.draftState !== DraftState.AwaitApproval || !ApproveRequestTippy) {
            return null
        }
        const hasAccess = hasApproverAccess(email, draftData.approvers)
        return (
            <div
                className={`flex left p-16 dc__border-top crud-btn dc__bottom-0 dc__left-0 dc__right-0 dc__position-abs bcn-0 dc__zi-10 ${
                    hasAccess && draftData.canApprove ? 'tippy-over' : ''
                }`}
            >
                {hasAccess && draftData.canApprove ? (
                    <ApproveRequestTippy
                        draftId={draftData.draftId}
                        draftVersionId={draftData.draftVersionId}
                        resourceName={CM_SECRET_COMPONENT_NAME[componentType]}
                        reload={updateCMSecret}
                        envName={parentName}
                    >
                        <button
                            data-testid="approve-config-button"
                            type="button"
                            className="cta dc__bg-g5 m-0-imp h-32 lh-20-imp p-6-12-imp"
                        >
                            Approve changes
                        </button>
                    </ApproveRequestTippy>
                ) : (
                    <Tippy
                        className="default-tt w-200"
                        arrow={false}
                        placement="top-end"
                        content={
                            hasAccess
                                ? 'You have made changes to this file. Users who have edited cannot approve the changes.'
                                : 'You do not have permission to approve configuration changes for this application - environment combination.'
                        }
                    >
                        <button
                            data-testid="approve-config-button"
                            type="button"
                            className="cta dc__bg-g5 approval-config-disabled m-0-imp h-32 lh-20-imp p-6-12-imp"
                        >
                            Approve changes
                        </button>
                    </Tippy>
                )}
            </div>
        )
    }

    const renderDiffView = (): JSX.Element => {
        if (baseDataLoading || getIsRequestAborted(baseDataErr)) {
            return (
                <div className="h-300">
                    <Progressing />
                </div>
            )
        }
        return (
            <div>
                <div className="en-2 bw-1 bcn-1 dc__top-radius-4 deployment-diff__upper dc__no-bottom-border">
                    <div className="pl-12 pr-12 pt-6 pb-6 fs-12 fw-6 cn-9 dc__border-right">
                        {cmSecretStateLabel === CM_SECRET_STATE.UNPUBLISHED
                            ? 'No published version available'
                            : 'Published'}
                    </div>
                    <div className="pl-12 pr-12 pt-6 pb-6 fs-12 fw-6 cn-9">Last saved draft</div>
                </div>
                {draftData.action === 3 && cmSecretStateLabel === CM_SECRET_STATE.OVERRIDDEN && (
                    <div className="en-2 bw-1 deployment-diff__upper dc__no-bottom-border">
                        <div className="pl-16 pr-16 pt-8 fs-12 cn-6 code-editor-red-diff">Configuration</div>
                        <div className="pl-16 pr-16 pt-8 fs-12 cn-6 code-editor-green-diff">Configuration</div>
                        <div className="pl-16 pr-16 pb-8 fs-13 cn-9 code-editor-red-diff">Override base</div>
                        <div className="pl-16 pr-16 pb-8 fs-13 cn-9 code-editor-green-diff">Inherit from base</div>
                    </div>
                )}
                <DeploymentHistoryDiffView
                    currentConfiguration={getBaseConfig()}
                    baseTemplateConfiguration={getCurrentConfig()}
                    previousConfigAvailable
                    isUnpublished={cmSecretStateLabel === CM_SECRET_STATE.UNPUBLISHED}
                    isDeleteDraft={draftData.action === 3 && cmSecretStateLabel !== CM_SECRET_STATE.OVERRIDDEN}
                    rootClassName="dc__no-top-radius mt-0-imp m-0-imp mb-16-imp"
                    comparisonBodyClassName="m-0-imp"
                />
                {renderApproveButton()}
            </div>
        )
    }

    const renderEmptyMessage = (message: string): JSX.Element => {
        return (
            <div className="h-200 flex">
                <div className="dc__align-center">
                    <InfoIconOutlined className="icon-dim-20 mb-8" />
                    <div className="fs-13 fw-4 cn-7">{message}</div>
                </div>
            </div>
        )
    }

    const renderForm = (): JSX.Element => {
        if (selectedTab === CMSecretProtectedTab.Published && cmSecretStateLabel === CM_SECRET_STATE.UNPUBLISHED) {
            return renderEmptyMessage('No published version of this file is available')
        }
        if (
            selectedTab === CMSecretProtectedTab.Draft &&
            draftData.action === 3 &&
            cmSecretStateLabel !== CM_SECRET_STATE.OVERRIDDEN
        ) {
            return renderEmptyMessage(`This ${CM_SECRET_COMPONENT_NAME[componentType]} will be deleted on approval`)
        }
        return (
            <ConfigMapSecretForm
                name={name}
                appChartRef={appChartRef}
                configMapSecretData={getData()}
                id={id}
                componentType={componentType}
                updateCMSecret={updateCMSecret}
                cmSecretStateLabel={
                    selectedTab === CMSecretProtectedTab.Draft &&
                    draftData.action === 3 &&
                    cmSecretStateLabel === CM_SECRET_STATE.OVERRIDDEN
                        ? CM_SECRET_STATE.INHERITED
                        : cmSecretStateLabel
                }
                isJobView={isJobView}
                readonlyView={selectedTab === CMSecretProtectedTab.Published}
                isProtectedView
                draftMode={
                    selectedTab === CMSecretProtectedTab.Draft &&
                    (draftData.action !== 3 || cmSecretStateLabel !== CM_SECRET_STATE.OVERRIDDEN)
                }
                latestDraftData={
                    draftData?.draftId
                        ? {
                              draftId: draftData?.draftId,
                              draftState: draftData?.draftState,
                              draftVersionId: draftData?.draftVersionId,
                              action: draftData.action,
                          }
                        : null
                }
                reloadEnvironments={reloadEnvironments}
                isAppAdmin={draftData.isAppAdmin}
                openDeleteModal={openDeleteModal}
                setOpenDeleteModal={setOpenDeleteModal}
            />
        )
    }

    return selectedTab === CMSecretProtectedTab.Compare ? renderDiffView() : renderForm()
}
