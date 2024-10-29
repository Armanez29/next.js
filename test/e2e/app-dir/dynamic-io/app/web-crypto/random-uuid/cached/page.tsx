import { SentinelValue } from '../../../getSentinelValue'

export default async function Page() {
  const first = await getRandomUUID(1)
  const second = await getRandomUUID(2)
  return (
    <div>
      <dl>
        <dt>[first] crypto.randomUUID()</dt>
        <dd id="first">{first.toString()}</dd>
        <dt>[second] crypto.randomUUID()</dt>
        <dd id="second">{second.toString()}</dd>
      </dl>
      <span id="page">
        <SentinelValue />
      </span>
    </div>
  )
}

async function getRandomUUID(_nonce: number) {
  'use cache'
  return crypto.randomUUID()
}
