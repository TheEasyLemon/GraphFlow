import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { RiCheckboxBlankCircleLine, RiCheckboxBlankCircleFill } from 'react-icons/ri'
import { useDispatch, useSelector } from 'react-redux'

import { useOutsideClick } from '../../utils/use-outside-click';
import { useDrag } from '../../utils/use-drag'
import { Row, FlexGrow, DropdownMenu, DropdownMenuRow, SmallInput } from '../styled'
import { modifyGraphNodeName, modifyGraphNodeType, modifyGraphNodeDemand, modifyGraphNodePosition } from '../../redux/reducers/graph';

const Circle = styled.div`
  position: absolute;
  background-color: var(--primary);
  height: ${props => props.radius * 2}px;
  width: ${props => props.radius * 2}px;
  border-radius: ${props => props.radius}px;
  top: ${props => props.top}px;
  left: ${props => props.left}px;
  z-index: 1;
  box-sizing: border-box;
  border: 2px solid var(--black);

  display: flex;
  align-items: center;
  justify-content: center;

  p {
    font-size: 13px;
    color: var(--white);
  }

  ${props => props.highlight && `
    border: 2px solid var(--secondary);
  `}

  ${props => props.grab && `
    cursor: grab;
  `}
`

const RadioButton = ({trigger, input, updateType}) => {
  return (
    <Row onClick={() => updateType(trigger)} style={{marginLeft: 5}}>
      {trigger === input ?
        <RiCheckboxBlankCircleFill /> :
        <RiCheckboxBlankCircleLine />
      }
      {trigger || 'none'}
    </Row>
  )

}

export const Node = ({id, node, offsets, highlight, setHighlight, showMenu, setShowMenu, handleNodeClick, canvasRef}) => {
  const dispatch = useDispatch()
  const mode = useSelector(data => data.mode)

  const nodeRef = useRef(null)

  useOutsideClick(nodeRef, () => showMenu === id && setShowMenu(false))

  const [showName, setShowName] = useState(node.name)
  const [showType, setShowType] = useState(node.type)
  const [showDemand, setShowDemand] = useState(node.demand)

  // Dragging Functionality
  useDrag(nodeRef, canvasRef, { onPointerUp: updatePos })

  function updateName(e) {
    const value = e.target.value
    setShowName(value)
    dispatch(modifyGraphNodeName(node.id, value))
  }

  function updateType(type) {
    setShowType(type)
    dispatch(modifyGraphNodeType(node.id, type))
  }

  function updatePos(e) {
    if (mode === 'move') {
      dispatch(modifyGraphNodePosition(node.id, {
        top: e.clientY - offsets.top - node.display_data.radius,
        left: e.clientX - offsets.left - node.display_data.radius,
        radius: node.display_data.radius
      }))
    }
  }

  function updateDemand(e) {
    setShowDemand(e.target.value)

    // only update if value is valid
    const value = parseInt(e.target.value)
    if (Number.isInteger(value)) {
      dispatch(modifyGraphNodeDemand(node.id, value))
    }
  }

  function handleClick(e) {
    if (mode === 'select') {
      if (showMenu !== id) {
        setShowMenu(id)
      }
    } else {
      handleNodeClick(e, node)
    }
  }

  return (
    <div ref={nodeRef} onClick={handleClick}>
      <Circle radius={node.display_data.radius} top={node.display_data.top + offsets.top} left={node.display_data.left + offsets.left}
        highlight={highlight === id} onMouseEnter={() => setHighlight(id)}
        onMouseLeave={() => setHighlight(false)}
        grab={mode === 'move'}>
        <p>{node.name.slice(0, 3)}</p>
      </Circle>
      {showMenu === id &&
        <DropdownMenu top={node.display_data.top + node.display_data.radius + offsets.top}
          left={node.display_data.left + node.display_data.radius + offsets.left}
          width={177}>
          <DropdownMenuRow style={{width: 175}}>Node name <FlexGrow /><SmallInput style={{width: 75}} value={showName} onChange={updateName} /></DropdownMenuRow>
          <DropdownMenuRow style={{width: 175}}>
            Type <FlexGrow />
            <RadioButton trigger='s' input={showType} updateType={updateType} />
            <RadioButton trigger='t' input={showType} updateType={updateType} />
            <RadioButton trigger='' input={showType} updateType={updateType} />
          </DropdownMenuRow>
          <DropdownMenuRow style={{width: 175}}>Demand (b) <FlexGrow /><SmallInput value={showDemand} onChange={updateDemand} /></DropdownMenuRow>
        </DropdownMenu>
      }
    </div>
  )
}
