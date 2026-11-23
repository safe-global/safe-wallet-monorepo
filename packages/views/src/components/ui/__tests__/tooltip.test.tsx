import { advanceClock, renderOnFakeClock, screen } from '@/tests/test-utils'
import { Tooltip, TooltipContent, TooltipDelay, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'

const Hint = ({ delay }: { delay?: number }) => (
  <Tooltip delay={delay}>
    <TooltipTrigger>Trigger</TooltipTrigger>
    <TooltipContent>Hint</TooltipContent>
  </Tooltip>
)

/** Hovers the trigger and says whether the hint is open after `before` ms and after `after` ms */
const openAt = async (ui: React.ReactElement, before: number, after: number) => {
  const { user } = renderOnFakeClock(ui)
  await user.hover(screen.getByText('Trigger'))
  await advanceClock(before)
  const openBefore = screen.queryByText('Hint') !== null
  await advanceClock(after - before)
  return [openBefore, screen.queryByText('Hint') !== null]
}

describe('Tooltip delay', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('opens at once by default', async () => {
    expect(await openAt(<Hint />, 10, 20)).toEqual([true, true])
  })

  it('opens after the delay of the enclosing TooltipDelay', async () => {
    expect(
      await openAt(
        <TooltipDelay delay={150}>
          <Hint />
        </TooltipDelay>,
        100,
        200,
      ),
    ).toEqual([false, true])
  })

  it("keeps a tooltip's own delay over the enclosing one", async () => {
    expect(
      await openAt(
        <TooltipDelay delay={500}>
          <Hint delay={0} />
        </TooltipDelay>,
        10,
        20,
      ),
    ).toEqual([true, true])
  })
})
