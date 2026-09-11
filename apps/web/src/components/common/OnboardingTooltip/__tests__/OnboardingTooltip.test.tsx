import local from '@/services/local-storage/local'
import { act, render } from '@/tests/test-utils'
import { Button } from '@/components/ui/button'
import { OnboardingTooltip } from '..'

describe('<OnboardingWidget>', () => {
  test('renders widget on initial render and hides it after click on button', () => {
    const text = 'New feature available!'

    const result = render(
      <OnboardingTooltip text={text} widgetLocalStorageId="someTestId">
        <Button>Testbutton</Button>
      </OnboardingTooltip>,
    )

    expect(result.getByText(new RegExp(text))).toBeInTheDocument()
    act(() => result.getByText(/Got it/).click())

    expect(result.queryByText(new RegExp(text))).not.toBeInTheDocument()
    expect(result.getByText(/Testbutton/)).toBeInTheDocument()
  })

  test('renders multiple widgets with different local storage ids', () => {
    const text1 = 'New feature available!'

    const text2 = 'Some other feature is available too!'

    const result = render(
      <div>
        <OnboardingTooltip text={text1} widgetLocalStorageId="someTestId1">
          <Button>First Button</Button>
        </OnboardingTooltip>
        <OnboardingTooltip text={text2} widgetLocalStorageId="someTestId2">
          <Button>Second Button</Button>
        </OnboardingTooltip>
      </div>,
    )

    expect(result.getByText(new RegExp(text1))).toBeInTheDocument()
    expect(result.getByText(new RegExp(text2))).toBeInTheDocument()

    act(() => result.getAllByText(/Got it/)[0].click())

    expect(result.queryByText(new RegExp(text1))).not.toBeInTheDocument()
    expect(result.getByText(new RegExp(text2))).toBeInTheDocument()

    act(() => result.getByText(/Got it/).click())
    expect(result.queryByText(new RegExp(text1))).not.toBeInTheDocument()
    expect(result.queryByText(new RegExp(text2))).not.toBeInTheDocument()

    expect(result.getByText(/First Button/)).toBeInTheDocument()
    expect(result.getByText(/Second Button/)).toBeInTheDocument()
  })

  test('renders only children if the widget has been hidden', () => {
    const widgetStorageId = 'alreadyHiddenId'
    local.setItem(widgetStorageId, true)
    const text = 'New feature available!'

    const result = render(
      <OnboardingTooltip text={text} widgetLocalStorageId={widgetStorageId}>
        <Button>Testbutton</Button>
      </OnboardingTooltip>,
    )
    expect(result.queryByText(new RegExp(text))).not.toBeInTheDocument()
    expect(result.getByText(/Testbutton/)).toBeInTheDocument()
  })
})
