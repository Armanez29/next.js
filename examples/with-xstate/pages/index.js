import { useMachine } from '@xstate/react'
import { inspect } from '@xstate/inspect'
import { Counter, Toggle } from '../components'
import { toggleMachine } from '../machines/toggleMachine'
import { counterMachine } from '../machines/counterMachine'

/**
 * In order to use the xstate inspect module,
 * we should check that we are on client, rather than the server
 */
if (typeof window !== 'undefined') {
  inspect({
    iframe: false,
  })
}

const IndexPage = () => {
  const [toggleCurrent, toggleSend] = useMachine(toggleMachine, {
    devTools: true,
  })
  const [counterCurrent, counterSend] = useMachine(counterMachine, {
    devTools: true,
    context: { count: 999 },
  })

  return (
    <div>
      <Counter
        counter={{
          count: counterCurrent.context.count,
          increment: () => counterSend('INC'),
          decrement: () => counterSend('DEC'),
          reset: () => counterSend('RESET'),
        }}
      />
      <hr />
      <Toggle
        onToggle={() => toggleSend('TOGGLE')}
        active={toggleCurrent.matches('active')}
      />
    </div>
  )
}

export default IndexPage
