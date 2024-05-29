import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { URLS } from '../../config'
import { CreateResource } from './ResourceList/CreateResource'
import { CreateResourceButtonType, CreateResourceType } from './Types'
import { ReactComponent as Add } from '../../assets/icons/ic-add.svg'

export const CreateResourceButton: React.FC<CreateResourceButtonType> = ({ clusterId, closeModal }) => {
    const [showModal, setShowModal] = useState(false)

    const handleModalOpen = () => setShowModal(true)

    const handleModalClose = () => {
        setShowModal(false)
        closeModal(true)
    }

    return (
        <>
            <button
                className="cursor flex cta small h-28 pl-8 pr-10 pt-5 pb-5 lh-n fcb-5 mr-16"
                data-testid="create-resource"
                type="button"
                onClick={handleModalOpen}
            >
                <Add className="icon-dim-16 fcb-5 mr-5" />
                Create resource
            </button>
            {showModal && <CreateResource closePopup={handleModalClose} clusterId={clusterId} />}
        </>
    )
}

export const renderCreateResourceButton = (clusterId: string, callback: CreateResourceType['closePopup']) => () => (
    <CreateResourceButton closeModal={callback} clusterId={clusterId} />
)

export const AddClusterButton = (): JSX.Element => (
    <div>
        <NavLink
            className="flex dc__no-decor cta small h-28 pl-8 pr-10 pt-5 pb-5 lh-n fcb-5 mr-16"
            to={URLS.GLOBAL_CONFIG_CLUSTER}
        >
            <Add data-testid="add_cluster_button" className="icon-dim-16 mr-4 fcb-5 dc__vertical-align-middle" />
            Add cluster
        </NavLink>
        <span className="dc__divider" />
    </div>
)
