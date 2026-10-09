import { Typography } from '@/components/ui/typography'

const QUESTIONS = [
  {
    question: 'What counts as a Safe account?',
    answer:
      'Every Safe account you add to the Workspace takes one seat, on any network. Safe accounts you leave out stay available in My accounts.',
  },
  {
    question: 'What are sponsored transactions?',
    answer: 'Safe pays the network fee for these transactions, so signers do not need gas tokens on the network.',
  },
  {
    question: 'Can I switch plans later?',
    answer: 'Yes. You can move up, move down or change the number of seats from this page at any time.',
  },
  {
    question: 'Does a plan change who controls my funds?',
    answer:
      'No. A plan only unlocks Workspace features. Your Safe accounts and their signers stay exactly as they are.',
  },
]

export const PlansFaq = () => (
  <section className="mt-10 flex flex-col gap-6">
    <Typography variant="h3">Questions, answered</Typography>
    <dl className="grid gap-x-10 gap-y-6 md:grid-cols-2">
      {QUESTIONS.map(({ question, answer }) => (
        <div key={question} className="flex flex-col gap-1.5 border-t border-border pt-4">
          <dt>
            <Typography variant="paragraph-bold">{question}</Typography>
          </dt>
          <dd>
            <Typography variant="paragraph-small" color="muted">
              {answer}
            </Typography>
          </dd>
        </div>
      ))}
    </dl>
  </section>
)
