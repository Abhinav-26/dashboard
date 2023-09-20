import React, { useState, useRef, useMemo } from 'react'
import Draggable from 'react-draggable'
import { useAsync } from '../helpers/Helpers'
import Suggestions from './Suggestions'
import { getScopedVariables } from './service'
import { FloatingVariablesSuggestionsProps } from './types'
import { ReactComponent as ICDrag } from '../../../assets/icons/drag.svg'
import { ReactComponent as ICGridView } from '../../../assets/icons/ic-grid-view.svg'
import { SUGGESTIONS_SIZE } from './constants'
import Tippy from '@tippyjs/react'

/**
 * Component uses react-draggable and handles the re-sizing and positioning of the suggestions on the assumption that the suggestions are going to expand to the right and bottom of the collapsed state
 * @param zIndex - To Set the zIndex of the suggestions
 * @param appId -  To fetch the scoped variables
 * @param envId - (Optional)
 * @param clusterId - (Optional)
 * @returns
 */
export default function FloatingVariablesSuggestions({
    zIndex,
    appId,
    envId,
    clusterId,
}: FloatingVariablesSuggestionsProps) {
    const [isActive, setIsActive] = useState<boolean>(false)
    const [collapsedPosition, setCollapsedPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
    const [expandedPosition, setExpandedPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

    const [loadingScopedVariables, variablesData, error, reloadScopedVariables] = useAsync(
        () => getScopedVariables(appId, envId, clusterId),
        [appId, envId, clusterId],
    )

    // In case of StrictMode, we get error findDOMNode is deprecated in StrictMode
    // So we use useRef to get the DOM node
    const nodeRef = useRef(null)

    // nodeRef.current is dependency even though its a ref as initially its null and we need to get the
    // first value that it gets and after that is not going to trigger again
    const initialPosition = useMemo(() => {
        const initialPosition = nodeRef.current?.getBoundingClientRect() || {
            x: 0,
            y: 0,
        }
        return { x: initialPosition.x, y: initialPosition.y }
    }, [nodeRef.current])

    const handleActivation = () => {
        const currentPosInScreen = {
            x: initialPosition.x + collapsedPosition.x,
            y: initialPosition.y + collapsedPosition.y,
        }

        // The fixed height is 58+54+45 = 157px, taking it as 170px
        // In case of no variables, the height is 58+45 = 103px, to have some buffer taking it as 120px
        // In case of loading, not computing the height since the height is going to change
        // In case of no variables the height is going to be 120+200 = 320px
        const calculatedHeight =
            !loadingScopedVariables && !error && !variablesData?.result
                ? 320
                : variablesData?.result?.length <= 3
                ? variablesData.result.length * 100 + 170
                : null

        setExpandedPosition({
            x: collapsedPosition.x,
            y: collapsedPosition.y,
        })

        if (currentPosInScreen.y > window.innerHeight - (calculatedHeight ?? SUGGESTIONS_SIZE.height)) {
            setExpandedPosition({
                x: collapsedPosition.x,
                y: window.innerHeight - (calculatedHeight ?? SUGGESTIONS_SIZE.height) - initialPosition.y,
            })
        }

        if (currentPosInScreen.x > window.innerWidth - SUGGESTIONS_SIZE.width) {
            setExpandedPosition({
                x: window.innerWidth - SUGGESTIONS_SIZE.width - initialPosition.x,
                y: collapsedPosition.y,
            })
        }

        if (
            currentPosInScreen.x > window.innerWidth - SUGGESTIONS_SIZE.width &&
            currentPosInScreen.y > window.innerHeight - (calculatedHeight ?? SUGGESTIONS_SIZE.height)
        ) {
            setExpandedPosition({
                x: window.innerWidth - SUGGESTIONS_SIZE.width - initialPosition.x,
                y: window.innerHeight - (calculatedHeight ?? SUGGESTIONS_SIZE.height) - initialPosition.y,
            })
        }

        setIsActive(true)
    }

    // Need to memoize this function since it is passed as a prop to Suggestions
    const handleDeActivation = useMemo(
        () => (e: React.MouseEvent<HTMLOrSVGElement>) => {
            e.stopPropagation()
            setIsActive(false)
        },
        [],
    )

    // e will be unused, but we need to pass it as a parameter since Draggable expects it
    const handleCollapsedDrag = (e, data: { x: number; y: number }) => {
        setCollapsedPosition(data)
    }

    const handleExpandedDrag = (e, data: { x: number; y: number }) => {
        setExpandedPosition(data)
        // Only Need to retain the collapsed position if the user has not dragged the suggestions, so need to update
        setCollapsedPosition(data)
    }

    if (!isActive)
        return (
            <Draggable
                handle=".handle-drag"
                nodeRef={nodeRef}
                position={collapsedPosition}
                onDrag={handleCollapsedDrag}
            >
                <div
                    className="bcn-7 dc__outline-none-imp dc__border-n0 br-48 flex h-40 pt-8 pb-8 pl-12 pr-12 dc__gap-8 dc__no-shrink dc__position-abs"
                    style={{ zIndex, boxShadow: '0px 4px 8px 0px rgba(0, 0, 0, 0.20)' }}
                    ref={nodeRef}
                    data-testid="collapsed-state"
                >
                    <button type="button" className="dc__outline-none-imp dc__no-border p-0 bcn-7 h-20">
                        <ICDrag className="handle-drag dc__grabbable scn-4 icon-dim-20" />
                    </button>
                    {/* DUMMY ICON */}

                    <Tippy content="Scoped variables" placement="top" className="default-tt" arrow={false}>
                        <button
                            className="dc__outline-none-imp dc__no-border p-0 bcn-7 h-20"
                            type="button"
                            onClick={handleActivation}
                            data-testid="activate-suggestions"
                        >
                            <ICGridView className="scn-0 icon-dim-20" />
                        </button>
                    </Tippy>
                </div>
            </Draggable>
        )

    return (
        <Draggable handle=".handle-drag" nodeRef={nodeRef} position={expandedPosition} onDrag={handleExpandedDrag}>
            <div
                className="flex column dc__no-shrink w-356 dc__content-space dc__border-radius-8-imp dc__border-n7 dc__overflow-hidden dc__position-abs mxh-504"
                style={{
                    zIndex,
                    boxShadow: '0px 4px 8px 0px rgba(0, 0, 0, 0.25)',
                }}
                ref={nodeRef}
            >
                <Suggestions
                    handleDeActivation={handleDeActivation}
                    loading={loadingScopedVariables}
                    variables={variablesData?.result ?? []}
                    reloadVariables={reloadScopedVariables}
                    error={error}
                />
            </div>
        </Draggable>
    )
}
