import React, { useEffect, useRef, useState } from 'react'
import { Drawer, noop, Progressing, showError } from '../../../common'
import { ReactComponent as Close } from '../../../../assets/icons/ic-cross.svg'
import { ReactComponent as DeployIcon } from '../../../../assets/icons/ic-nav-rocket.svg'
import { ReactComponent as PlayIcon } from '../../../../assets/icons/ic-play-medium.svg'
import { ReactComponent as Error } from '../../../../assets/icons/ic-warning.svg'
import { getCDMaterialList } from '../../../app/service'
import { CDMaterial } from '../../../app/details/triggerView/cdMaterial'
import { DeploymentNodeType, MATERIAL_TYPE } from '../../../app/details/triggerView/types'
import { BulkCDDetailType, BulkCDTriggerType } from '../../Environments.types'
import { ButtonTitle } from '../../Constants'
import TriggerResponseModal from './TriggerResponseModal'

export default function BulkCDTrigger({
    stage,
    appList,
    closePopup,
    updateBulkInputMaterial,
    onClickTriggerBulkCD,
    changeTab,
    toggleSourceInfo,
    selectImage,
    responseList
}: BulkCDTriggerType) {
    const ciTriggerDetailRef = useRef<HTMLDivElement>(null)
    const [isLoading, setLoading] = useState(true)
    const [selectedApp, setSelectedApp] = useState<BulkCDDetailType>(
        appList.find((app) => !app.notFoundMessage) || appList[0],
    )
    const escKeyPressHandler = (evt): void => {
        if (evt && evt.key === 'Escape' && typeof closePopup === 'function') {
            evt.preventDefault()
            closePopup(evt)
        }
    }
    const outsideClickHandler = (evt): void => {
        if (
            ciTriggerDetailRef.current &&
            !ciTriggerDetailRef.current.contains(evt.target) &&
            typeof closePopup === 'function'
        ) {
            closePopup(evt)
        }
    }

    useEffect(() => {
        document.addEventListener('keydown', escKeyPressHandler)
        return (): void => {
            document.removeEventListener('keydown', escKeyPressHandler)
        }
    }, [escKeyPressHandler])

    useEffect(() => {
        document.addEventListener('click', outsideClickHandler)
        return (): void => {
            document.removeEventListener('click', outsideClickHandler)
        }
    }, [outsideClickHandler])

    const getMaterialData = (): void => {
        const _CIMaterialPromiseList = appList.map((appDetails) =>
            appDetails.notFoundMessage ? null : getCDMaterialList(appDetails.cdPipelineId, appDetails.stageType),
        )
        const _materialListMap: Record<string, any[]> = {}
        Promise.all(_CIMaterialPromiseList)
            .then((responses) => {
                responses.forEach((res, index) => {
                    _materialListMap[appList[index]?.appId] = res
                })
                updateBulkInputMaterial(_materialListMap)
                setLoading(false)
            })
            .catch((error) => {
                showError(error)
            })
    }

    useEffect(() => {
        getMaterialData()
    }, [])

    const renderHeaderSection = (): JSX.Element => {
        return (
            <div className="flex flex-align-center flex-justify dc__border-bottom bcn-0 pt-17 pr-20 pb-17 pl-20">
                <h2 className="fs-16 fw-6 lh-1-43 m-0 title-padding">Deploy to {appList[0].envName}</h2>
                <button type="button" className="dc__transparent flex icon-dim-24" onClick={closePopup}>
                    <Close className="icon-dim-24" />
                </button>
            </div>
        )
    }

    const changeApp = (e): void => {
        const _selectedApp = appList[e.currentTarget.dataset.index]
        if (_selectedApp.notFoundMessage) {
            return
        }
        setSelectedApp(_selectedApp)
    }

    const renderBodySection = (): JSX.Element => {
        if (isLoading) {
            return <Progressing pageLoader />
        }
        const _material = appList.find((app) => app.appId === selectedApp.appId)?.material || []
        return (
            <div className="bulk-ci-trigger">
                <div className="sidebar bcn-0 dc__height-inherit dc__overflow-auto">
                    <div
                        className="dc__position-sticky dc__top-0 bcn-0 dc__border-bottom fw-6 fs-13 cn-9 pt-12 pr-16 pb-12 pl-16"
                        style={{ zIndex: 1 }}
                    >
                        Applications
                    </div>
                    {appList.map((app, index) => (
                        <div
                            key={`app-${index}`}
                            className={`p-16 cn-9 fw-6 fs-13 dc__border-bottom-n1 ${
                                app.appId === selectedApp.appId ? 'dc__window-bg' : ''
                            } ${!app.notFoundMessage && app.appId !== selectedApp.appId ? 'cursor' : ''}`}
                            data-index={index}
                            onClick={changeApp}
                        >
                            {app.name}
                            {app.notFoundMessage && (
                                <span className="flex left cy-7 fw-4 fs-12">
                                    <Error className="icon-dim-12 warning-icon-y7 mr-4" />
                                    {app.notFoundMessage}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
                <div className="main-content dc__window-bg dc__height-inherit">
                    <CDMaterial
                        appId={selectedApp.appId}
                        pipelineId={+selectedApp.cdPipelineId}
                        stageType={selectedApp.stageType}
                        material={_material}
                        materialType={MATERIAL_TYPE.inputMaterialList}
                        envName={selectedApp.envName}
                        isLoading={isLoading}
                        changeTab={changeTab}
                        triggerDeploy={onClickStartDeploy}
                        onClickRollbackMaterial={noop}
                        closeCDModal={closePopup}
                        selectImage={selectImage}
                        toggleSourceInfo={toggleSourceInfo}
                        parentPipelineId={selectedApp.parentPipelineId}
                        parentPipelineType={selectedApp.parentPipelineType}
                        parentEnvironmentName={selectedApp.parentEnvironmentName}
                        isFromBulkCD={true}
                    />
                </div>
            </div>
        )
    }

    const onClickStartDeploy = (): void => {
      onClickTriggerBulkCD()
    }

    const renderFooterSection = (): JSX.Element => {
        return (
            <div
                className="dc__border-top flex right bcn-0 pt-16 pr-20 pb-16 pl-20 dc__position-fixed dc__bottom-0"
                style={{ width: '75%', minWidth: '1024px', maxWidth: '1200px' }}
            >
                <button className="cta flex h-36" onClick={onClickStartDeploy}>
                    {isLoading ? (
                        <Progressing />
                    ) : (
                        <>
                            {stage === DeploymentNodeType.CD ? (
                                <DeployIcon className="icon-dim-16 dc__no-svg-fill mr-8" />
                            ) : (
                                <PlayIcon className="icon-dim-16 dc__no-svg-fill scn-0 mr-8" />
                            )}
                            {ButtonTitle[stage]}
                        </>
                    )}
                </button>
            </div>
        )
    }

    return (
        <Drawer position="right" width="75%" minWidth="1024px" maxWidth="1200px">
            <div className="dc__window-bg h-100 bulk-ci-trigger-container" ref={ciTriggerDetailRef}>
                {renderHeaderSection()}
                {responseList.length ? (
                    <TriggerResponseModal
                        closePopup={closePopup}
                        responseList={responseList}
                        isLoading={isLoading}
                        onClickRetryBuild={onClickTriggerBulkCD}
                    />
                ) : (
                    <>
                        {renderBodySection()}
                        {renderFooterSection()}
                    </>
                )}
            </div>
        </Drawer>
    )
}
