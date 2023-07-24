import edgeThenNode from 'edge-then-node'
import nodeThenEdge from 'node-then-edge'
import ClientComponent from '../client'

export const runtime = 'edge'

export default function AppEdge() {
  return (
    <>
      <div id="server">
        {JSON.stringify({
          edgeThenNode,
          nodeThenEdge,
        })}
      </div>
      <ClientComponent />
    </>
  )
}
