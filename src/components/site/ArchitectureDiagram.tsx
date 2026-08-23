'use client'

import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react'
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import { subsystemById, subsystems, subsystemGroups } from '@/components/site/architecture'

import '@xyflow/react/dist/style.css'

const NODE_WIDTH = 216

interface SubsystemNodeData extends Record<string, unknown> {
  subsystemId: string
}

interface GroupNodeData extends Record<string, unknown> {
  label: string
}

function GroupNode({ data }: NodeProps) {
  const { label } = data as GroupNodeData
  return <p className="arch-group-label">{label}</p>
}

function KindNode({ data, selected }: NodeProps) {
  const { subsystemId } = data as SubsystemNodeData
  const subsystem = subsystemById[subsystemId]
  if (!subsystem) return null
  return (
    <div className={`arch-node arch-node-${subsystem.kind}${selected ? ' arch-node-selected' : ''}`}>
      <Handle type="target" position={Position.Top} id="t" className="arch-handle" isConnectable={false} />
      <p className="arch-node-tag">{subsystem.tag}</p>
      <p className="arch-node-title">{subsystem.title}</p>
      {subsystem.sub ? <p className="arch-node-sub">{subsystem.sub}</p> : null}
      <Handle type="source" position={Position.Bottom} id="b" className="arch-handle" isConnectable={false} />
      <Handle type="target" position={Position.Left} id="l" className="arch-handle" isConnectable={false} />
      <Handle type="source" position={Position.Right} id="r" className="arch-handle" isConnectable={false} />
    </div>
  )
}

const nodeTypes = { subsystem: KindNode, archgroup: GroupNode }

const GROUP_W = 268

const groupStyle = (height: number) => ({
  width: GROUP_W,
  height,
  border: '1px solid rgba(243, 237, 227, 0.14)',
  borderRadius: 0,
  background: 'rgba(11, 21, 17, 0.55)',
})

const nodes: Node[] = [
  {
    id: 'group-context',
    type: 'archgroup',
    position: { x: 0, y: 190 },
    style: groupStyle(150),
    data: { label: 'CONTEXT' },
    deletable: false,
    draggable: false,
    selectable: false,
  },
  {
    id: 'group-requirements',
    type: 'archgroup',
    position: { x: 336, y: 40 },
    style: groupStyle(438),
    data: { label: 'REQUIREMENTS' },
    deletable: false,
    draggable: false,
    selectable: false,
  },
  {
    id: 'group-observation',
    type: 'archgroup',
    position: { x: 336, y: 546 },
    style: groupStyle(396),
    data: { label: 'OBSERVATION' },
    deletable: false,
    draggable: false,
    selectable: false,
  },
  {
    id: 'group-state',
    type: 'archgroup',
    position: { x: 880, y: 40 },
    style: groupStyle(320),
    data: { label: 'STATE' },
    deletable: false,
    draggable: false,
    selectable: false,
  },
  {
    id: 'group-decision',
    type: 'archgroup',
    position: { x: 1224, y: 40 },
    style: groupStyle(482),
    data: { label: 'DECISION' },
    deletable: false,
    draggable: false,
    selectable: false,
  },

  ...(
    [
      ['event-context', 'context', 44],
      ['suggestion', 'requirements', 52],
      ['approval', 'requirements', 182],
      ['requirements', 'requirements', 312],
      ['registered-items', 'observation', 50],
      ['observation', 'observation', 172],
      ['evidence', 'observation', 298],
      ['reconciliation', 'state', 52],
      ['belief', 'state', 186],
      ['readiness', 'decision', 56],
      ['intervention', 'decision', 208],
      ['timing', 'decision', 356],
    ] as const
  ).map(([id, groupId, y]) => ({
    id,
    type: 'subsystem',
    parentId: `group-${groupId}`,
    position: { x: 26, y },
    data: { subsystemId: id } satisfies SubsystemNodeData,
    style: { width: NODE_WIDTH },
    selected: id === 'readiness',
    draggable: false,
    connectable: false,
  })),
]

const baseEdge = {
  type: 'smoothstep',
  pathOptions: { borderRadius: 10 },
  markerEnd: { type: MarkerType.ArrowClosed, width: 13, height: 13 },
} as const

type EdgeSpec = {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

const edgeSpecs: readonly EdgeSpec[] = [
  { id: 'e-ctx-sug', source: 'event-context', target: 'suggestion', sourceHandle: 'r', targetHandle: 'l' },
  { id: 'e-sug-app', source: 'suggestion', target: 'approval', sourceHandle: 'b', targetHandle: 't' },
  { id: 'e-app-req', source: 'approval', target: 'requirements', sourceHandle: 'b', targetHandle: 't' },
  { id: 'e-req-ready', source: 'requirements', target: 'readiness', sourceHandle: 'r', targetHandle: 't' },
  { id: 'e-reg-obs', source: 'registered-items', target: 'observation', sourceHandle: 'b', targetHandle: 't' },
  { id: 'e-obs-ev', source: 'observation', target: 'evidence', sourceHandle: 'b', targetHandle: 't' },
  { id: 'e-ev-rec', source: 'evidence', target: 'reconciliation', sourceHandle: 'r', targetHandle: 'b' },
  { id: 'e-rec-bel', source: 'reconciliation', target: 'belief', sourceHandle: 'b', targetHandle: 't' },
  { id: 'e-bel-ready', source: 'belief', target: 'readiness', sourceHandle: 'r', targetHandle: 'l' },
  { id: 'e-ready-int', source: 'readiness', target: 'intervention', sourceHandle: 'b', targetHandle: 't' },
  { id: 'e-timing-int', source: 'timing', target: 'intervention', sourceHandle: 't', targetHandle: 'b' },
  { id: 'e-ctx-time', source: 'event-context', target: 'timing', sourceHandle: 'b', targetHandle: 'l' },
]

function buildEdges(selectedId: string | null): Edge[] {
  return edgeSpecs.map((spec) => {
    const active = selectedId !== null && (spec.source === selectedId || spec.target === selectedId)
    const dimmed = selectedId !== null && !active
    return {
      ...baseEdge,
      id: spec.id,
      source: spec.source,
      target: spec.target,
      sourceHandle: spec.sourceHandle,
      targetHandle: spec.targetHandle,
      style: {
        stroke: active ? '#e8d9b0' : 'rgba(243, 237, 227, 0.34)',
        strokeWidth: active ? 1.8 : 1.2,
        opacity: dimmed ? 0.28 : 1,
        transition: 'opacity 200ms ease, stroke 200ms ease',
      },
      markerEnd: { ...baseEdge.markerEnd, color: active ? '#e8d9b0' : 'rgba(243, 237, 227, 0.55)' },
    }
  })
}

const subscribe = () => () => undefined
const getClientSnapshot = () => true
const getServerSnapshot = () => false

export interface ArchitectureDiagramProps {
  selectedId: string | null
  onSelect: (id: string | null) => void
}

function Diagram({ selectedId, onSelect }: ArchitectureDiagramProps) {
  const isClient = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)
  const edges = useMemo(() => buildEdges(selectedId), [selectedId])
  const userHasSelected = useRef(false)

  const handleSelectionChange = useCallback(
    ({ nodes: nextNodes }: { nodes: Node[] }) => {
      const next = nextNodes.find((node) => node.type === 'subsystem')
      if (next) {
        userHasSelected.current = true
        onSelect(next.id)
        return
      }
      if (userHasSelected.current) onSelect(null)
    },
    [onSelect],
  )

  if (!isClient) {
    return <div className="arch-canvas" aria-hidden="true" />
  }

  return (
    <div className="arch-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        colorMode="dark"
        fitView
        fitViewOptions={{ padding: 0.12 }}
        minZoom={0.35}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        nodesFocusable
        edgesFocusable={false}
        panOnScroll
        selectionOnDrag={false}
        onSelectionChange={handleSelectionChange}
        proOptions={{ hideAttribution: false }}
      >
        <Background color="rgba(243, 237, 227, 0.09)" gap={24} size={1} />
        <Controls showInteractive={false} position="top-right" />
      </ReactFlow>
      <ol className="arch-flow-sr">
        {subsystems.map((subsystem) => (
          <li key={subsystem.id}>
            {subsystemGroups.find((group) => group.id === subsystem.groupId)?.label}: {subsystem.title}.{' '}
            {subsystem.body}
          </li>
        ))}
      </ol>
    </div>
  )
}

export function ArchitectureDiagram(props: ArchitectureDiagramProps) {
  return (
    <ReactFlowProvider>
      <Diagram {...props} />
    </ReactFlowProvider>
  )
}
