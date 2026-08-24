'use client'

import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import {
  Background,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  useReactFlow,
  useStore,
  type Edge,
  type Node,
  type NodeChange,
  type NodeProps,
} from '@xyflow/react'
import {
  DEFAULT_SELECTED_SUBSYSTEM_ID,
  edgeSpecs,
  kindLegend,
  subsystemById,
  subsystemGroups,
  type EdgeClass,
  type Subsystem,
} from '@/components/site/architecture'

import '@xyflow/react/dist/style.css'

const NODE_W = 240

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
      <p className="arch-node-sub">{subsystem.sub}</p>
      <Handle type="source" position={Position.Bottom} id="b" className="arch-handle" isConnectable={false} />
      <Handle type="target" position={Position.Left} id="l" className="arch-handle" isConnectable={false} />
      <Handle type="source" position={Position.Right} id="r" className="arch-handle" isConnectable={false} />
      <Handle
        type="source"
        position={Position.Right}
        id="r2"
        style={{ top: '72%' }}
        className="arch-handle"
        isConnectable={false}
      />
    </div>
  )
}

const nodeTypes = { subsystem: KindNode, archgroup: GroupNode }

const groupDefs: ReadonlyArray<{ id: string; x: number; y: number; w: number; h: number; label: string }> = [
  { id: 'context', x: 0, y: 0, w: 280, h: 212, label: 'Context' },
  { id: 'requirements', x: 320, y: 0, w: 840, h: 212, label: 'Requirements' },
  { id: 'decision', x: 660, y: 264, w: 800, h: 212, label: 'Decision' },
  { id: 'observation', x: 0, y: 672, w: 840, h: 212, label: 'Observation' },
  { id: 'state', x: 880, y: 672, w: 560, h: 212, label: 'State' },
]

const childPlacement: ReadonlyArray<[id: string, groupId: string, x: number, y: number]> = [
  ['event-context', 'context', 20, 52],
  ['suggestion', 'requirements', 20, 52],
  ['approval', 'requirements', 300, 52],
  ['requirements', 'requirements', 580, 52],
  ['timing', 'decision', 20, 52],
  ['readiness', 'decision', 300, 52],
  ['intervention', 'decision', 580, 52],
  ['registered-items', 'observation', 20, 52],
  ['observation', 'observation', 300, 52],
  ['evidence', 'observation', 580, 52],
  ['reconciliation', 'state', 20, 52],
  ['belief', 'state', 300, 52],
]

const baseNodes: Node[] = [
  ...groupDefs.map((group) => ({
    id: `group-${group.id}`,
    type: 'archgroup',
    position: { x: group.x, y: group.y },
    style: { width: group.w, height: group.h, background: 'rgba(243, 237, 227, 0.025)', border: '1px solid rgba(243, 237, 227, 0.15)' },
    data: { label: group.label } satisfies GroupNodeData,
    deletable: false,
    draggable: false,
    selectable: false,
  })),
  ...childPlacement.map(([id, groupId, x, y]) => ({
    id,
    type: 'subsystem',
    parentId: `group-${groupId}`,
    position: { x, y },
    data: { subsystemId: id } satisfies SubsystemNodeData,
    style: { width: NODE_W },
    selected: id === DEFAULT_SELECTED_SUBSYSTEM_ID,
    draggable: false,
    connectable: false,
  })),
]

const edgeClassStyle: Record<EdgeClass, { stroke: string; width: number; dashed?: boolean }> = {
  primary: { stroke: 'rgba(243, 237, 227, 0.52)', width: 1.7 },
  evidence: { stroke: 'rgba(243, 237, 227, 0.28)', width: 1.2 },
  state: { stroke: 'rgba(243, 237, 227, 0.34)', width: 1.3 },
  timing: { stroke: 'rgba(243, 237, 227, 0.4)', width: 1.2, dashed: true },
}

function relatedSets(selectedId: string | null) {
  const incoming = new Set<string>()
  const outgoing = new Set<string>()
  if (selectedId) {
    for (const spec of edgeSpecs) {
      if (spec.target === selectedId) incoming.add(spec.source)
      if (spec.source === selectedId) outgoing.add(spec.target)
    }
  }
  return { incoming, outgoing }
}

function buildEdges(selectedId: string | null): Edge[] {
  return edgeSpecs.map((spec) => {
    const active = selectedId !== null && (spec.source === selectedId || spec.target === selectedId)
    const dimmed = selectedId !== null && !active
    const cls = edgeClassStyle[spec.cls]
    const stroke = active ? '#e8d9b0' : cls.stroke
    return {
      id: spec.id,
      source: spec.source,
      target: spec.target,
      sourceHandle: spec.sourceHandle,
      targetHandle: spec.targetHandle,
      type: 'smoothstep',
      pathOptions: { borderRadius: 12 },
      style: {
        stroke,
        strokeWidth: active ? 2 : cls.width,
        strokeDasharray: cls.dashed && !active ? '5 4' : undefined,
        opacity: dimmed ? 0.2 : 1,
        transition: 'opacity 200ms ease, stroke 200ms ease',
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 12,
        height: 12,
        color: active ? '#e8d9b0' : cls.stroke,
      },
      zIndex: active ? 1 : 0,
    }
  })
}

function buildNodes(nodes: Node[], selectedId: string | null): Node[] {
  const { incoming, outgoing } = relatedSets(selectedId)
  return nodes.map((node) => {
    if (node.type !== 'subsystem') return node
    let className: string | undefined
    if (selectedId) {
      if (node.id === selectedId) className = 'arch-node-emphasis'
      else if (incoming.has(node.id)) className = 'arch-node-input'
      else if (outgoing.has(node.id)) className = 'arch-node-output'
      else className = 'arch-node-dim'
    }
    return { ...node, className }
  })
}

const subscribe = () => () => undefined
const getClientSnapshot = () => true
const getServerSnapshot = () => false

export interface ArchitectureExplorerProps {
  selectedId: string | null
  onSelect: (id: string | null) => void
}

function Toolbar({ selectedId, onSelect }: ArchitectureExplorerProps) {
  const { getNodes, fitView } = useReactFlow()

  const focusGroup = useCallback(
    (groupId: string) => {
      const members = getNodes().filter((node) => node.parentId === `group-${groupId}`)
      if (members.length === 0) return
      fitView({ nodes: members.map(({ id }) => ({ id })), padding: 0.3, duration: 420 })
    },
    [getNodes, fitView],
  )

  return (
    <div className="arch-toolbar">
      <nav className="arch-nav mono" aria-label="Subsystem regions">
        <button
          type="button"
          className={selectedId === null ? 'arch-nav-active' : undefined}
          onClick={() => {
            onSelect(null)
            fitView({ padding: 0.06, duration: 420 })
          }}
        >
          Overview
        </button>
        {subsystemGroups.map((group) => (
          <button key={group.id} type="button" onClick={() => focusGroup(group.id)}>
            {group.label}
          </button>
        ))}
      </nav>
      <ul className="arch-legend" aria-label="Trust boundaries">
        {kindLegend.map((entry) => (
          <li key={entry.kind}>
            <span className={`arch-legend-swatch arch-node-${entry.kind}`} aria-hidden="true" />
            {entry.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ZoomControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const zoomLabel = useStore((state) => `${Math.round(state.transform[2] * 100)}%`)

  return (
    <div className="arch-zoom mono" role="group" aria-label="Zoom controls">
      <button type="button" onClick={() => zoomOut({ duration: 200 })} aria-label="Zoom out">
        −
      </button>
      <span aria-hidden="true">{zoomLabel}</span>
      <button type="button" onClick={() => zoomIn({ duration: 200 })} aria-label="Zoom in">
        +
      </button>
      <button type="button" onClick={() => fitView({ padding: 0.06, duration: 420 })}>
        Fit
      </button>
    </div>
  )
}

function ExplorerCanvas({ selectedId, onSelect }: ArchitectureExplorerProps) {
  const isClient = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)
  const edges = useMemo(() => buildEdges(selectedId), [selectedId])
  const [nodes, setNodes] = useState<Node[]>(baseNodes)
  const userHasSelected = useRef(false)

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((current) => applyNodeChanges(changes, current))
  }, [])

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
        nodes={buildNodes(nodes, selectedId)}
        edges={edges}
        nodeTypes={nodeTypes}
        colorMode="dark"
        fitView
        fitViewOptions={{ padding: 0.04 }}
        minZoom={0.22}
        maxZoom={1.6}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        nodesFocusable
        edgesFocusable={false}
        panOnScroll
        selectionOnDrag={false}
        onNodesChange={handleNodesChange}
        onSelectionChange={handleSelectionChange}
        proOptions={{ hideAttribution: false }}
      >
        <Background color="rgba(243, 237, 227, 0.08)" gap={24} size={1} />
      </ReactFlow>
      <ZoomControls />
      <ol className="arch-flow-sr">
        {Object.values(subsystemById).map((subsystem) => (
          <li key={subsystem.id}>
            {subsystem.title}. {subsystem.body}
          </li>
        ))}
      </ol>
    </div>
  )
}

export function ArchitectureExplorer({ selectedId, onSelect }: ArchitectureExplorerProps) {
  const selected = selectedId ? subsystemById[selectedId] : undefined

  return (
    <ReactFlowProvider>
      <Toolbar selectedId={selectedId} onSelect={onSelect} />
      <div className="arch-layout">
        <ExplorerCanvas selectedId={selectedId} onSelect={onSelect} />
        <Inspector subsystem={selected} />
      </div>
    </ReactFlowProvider>
  )
}

function Inspector({ subsystem }: { subsystem: Subsystem | undefined }) {
  if (!subsystem) {
    return (
      <aside className="arch-panel" aria-live="polite">
        <p className="arch-panel-hint">Select a subsystem to inspect it.</p>
      </aside>
    )
  }

  return (
    <aside className="arch-panel" aria-live="polite">
      <article>
        <p className={`arch-panel-tag arch-panel-tag-${subsystem.kind}`}>{subsystem.tag}</p>
        <h2>{subsystem.title}</h2>
        <p className="arch-panel-sub">{subsystem.sub}</p>
        <p className="arch-panel-body">{subsystem.body}</p>

        <dl className="arch-panel-io">
          <div>
            <dt>Inputs</dt>
            <dd>
              {subsystem.inputs.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </dd>
          </div>
          <div>
            <dt>Output</dt>
            <dd>
              {subsystem.outputs.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </dd>
          </div>
        </dl>

        <p className="arch-panel-trust">
          <span className="arch-panel-trust-label mono">Trust boundary</span>
          {subsystem.trust}
        </p>

        <p className="arch-panel-impl">
          <span className="arch-panel-trust-label mono">Implementation</span>
          {subsystem.impl.map((file) => (
            <code key={file} className="mono">
              {file}
            </code>
          ))}
        </p>
      </article>
    </aside>
  )
}
