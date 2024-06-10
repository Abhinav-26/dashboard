/*
 * Copyright (c) 2024. Devtron Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    MODAL_TYPE,
    Progressing,
    VisibleModal,
    showError,
    stopPropagation,
    ButtonWithLoader,
} from '@devtron-labs/devtron-fe-common-lib'
import React, { useEffect, useState } from 'react'
import { ReactComponent as UnhibernateModalIcon } from '../../../../assets/icons/ic-medium-unhibernate.svg'
import { manageApps } from './service'
import { importComponentFromFELibrary } from '../../../common'
import { UnhibernateModalProps } from '../../AppGroup.types'

const ResistantInput = importComponentFromFELibrary('ResistantInput')

export const UnhibernateModal = ({
    selectedAppIds,
    appDetailsList,
    envName,
    envId,
    setOpenUnhiberateModal,
    setAppStatusResponseList,
    setShowHibernateStatusDrawer,
    showDefaultDrawer,
    isDeploymentLoading,
    httpProtocol,
    isDeploymentBlockedViaWindow
}: UnhibernateModalProps) => {
    const [loader, setLoader] = useState<boolean>(false)
    const [isActionButtonDisabled, setActionButtonDisabled] = useState<boolean>(true)

    useEffect(() => {
        setActionButtonDisabled(isDeploymentBlockedViaWindow)
    }, [isDeploymentBlockedViaWindow])


    const unhibernateApps = (e) => {
        e.preventDefault()
        setLoader(true)
        setOpenUnhiberateModal(false)
        setShowHibernateStatusDrawer({
            hibernationOperation: false,
            showStatus: false,
            inProgress: true,
        })
        manageApps(selectedAppIds, appDetailsList, Number(envId), envName, 'unhibernate', httpProtocol)
            .then((res) => {
                setAppStatusResponseList(res)
                setShowHibernateStatusDrawer({
                    hibernationOperation: false,
                    showStatus: true,
                    inProgress: false,
                })
            })
            .finally(() => {
                setLoader(false)
            })
    }

    const closeModal = () => {
        setOpenUnhiberateModal(false)
    }

    const renderHibernateModalBody = () => {
        if (showDefaultDrawer || !isDeploymentBlockedViaWindow) {
            return (
                <>
                    <span>
                        Pods for the selected applications will be &nbsp;
                        <span className="fw-6">scaled up to its original count on {envName} environment.</span>
                    </span>
                    <span> Are you sure you want to continue?</span>
                </>
            )
        }
        return (
            <>
                <div>Unhibernating some applications is blocked due to deployment window</div>
                {ResistantInput && (
                    <ResistantInput type={MODAL_TYPE.UNHIBERNATE} setActionButtonDisabled={setActionButtonDisabled} />
                )}
            </>
        )
    }

    return (
        <VisibleModal close={closeModal} onEscape={closeModal} className="generate-token-modal">
            <div onClick={stopPropagation} className="modal__body w-400 pl-24 pr-24 pt-24 pb-24 fs-14 flex column">
                {isDeploymentLoading ? (
                    <div className="mh-320 flex">
                        <Progressing pageLoader />
                    </div>
                ) : (
                    <>
                        <div className="flexbox-col dc__gap-12">
                            <UnhibernateModalIcon className="dc__align-left" />
                            <span className="fs-16 fw-6">
                                Unhibernate '{selectedAppIds.length} applications' on '{envName}'
                            </span>
                            {renderHibernateModalBody()}
                        </div>
                        <div className="pt-40 flexbox dc__content-end w-100 dc__align-end dc__gap-12">
                            <button
                                onClick={closeModal}
                                className="flex bcn-0 dc__border-radius-4-imp h-36 pl-16 pr-16 pt-8 pb-8 dc__border"
                                disabled={loader}
                            >
                                Cancel
                            </button>
                            <ButtonWithLoader
                                rootClassName="cta flex h-36 pl-16 pr-16 pt-8 pb-8 w-96 dc__border-radius-4-imp"
                                isLoading={loader}
                                disabled={!showDefaultDrawer && isActionButtonDisabled}
                                onClick={unhibernateApps}
                            >
                                Unhibernate
                            </ButtonWithLoader>
                        </div>
                    </>
                )}
            </div>
        </VisibleModal>
    )
}
