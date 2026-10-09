import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Typography } from '@/components/ui/typography'
import { FeatureCheck } from './FeatureCheck'

type CompareValue = boolean | string

type CompareRow = {
  feature: string
  isComingSoon?: boolean
  starter: CompareValue
  business: CompareValue
  enterprise: CompareValue
}

// Placeholder content for the layout. The real values belong in the plan catalog and come from a developer.
const SECTIONS: { title: string; rows: CompareRow[] }[] = [
  {
    title: 'Limits',
    rows: [
      { feature: 'Workspaces', starter: '1', business: '1', enterprise: '1' },
      { feature: 'Members', starter: 'Unlimited', business: 'Unlimited', enterprise: 'Unlimited' },
      { feature: 'Safe accounts', starter: '2', business: '5, 10 or 20', enterprise: 'More than 20' },
      { feature: 'Sponsored transactions per month', starter: '10', business: '50', enterprise: 'Unlimited' },
    ],
  },
  {
    title: 'Operations',
    rows: [
      { feature: 'Shared address book', starter: true, business: true, enterprise: true },
      { feature: 'Workspace activity log', starter: true, business: true, enterprise: true },
      { feature: 'Policies', starter: false, business: true, enterprise: true },
      { feature: 'Pay gas from your Safe', isComingSoon: true, starter: false, business: true, enterprise: true },
    ],
  },
  {
    title: 'Security',
    rows: [
      { feature: 'Security Hub', starter: true, business: true, enterprise: true },
      { feature: 'Advanced threat analysis', starter: true, business: true, enterprise: true },
      { feature: 'Transaction simulation', starter: true, business: true, enterprise: true },
    ],
  },
  {
    title: 'Support',
    rows: [
      { feature: 'In-app and email support', starter: true, business: true, enterprise: true },
      { feature: 'Named support contact', starter: false, business: false, enterprise: true },
      { feature: 'Guided onboarding', starter: false, business: 'One 60-minute session', enterprise: 'Tailored' },
    ],
  },
]

const Value = ({ value }: { value: CompareValue }) =>
  value === true ? (
    <>
      <FeatureCheck />
      <span className="sr-only">Included</span>
    </>
  ) : value === false ? (
    <>
      <span aria-hidden className="text-muted-foreground">
        —
      </span>
      <span className="sr-only">Not included</span>
    </>
  ) : (
    <Typography variant="paragraph-small-medium">{value}</Typography>
  )

export const PlanCompareTable = () => (
  <section className="mt-10 flex flex-col gap-4">
    <div className="flex flex-col gap-1">
      <Typography variant="h3">Compare all features</Typography>
      <Typography variant="paragraph-small" color="muted">
        Limits, operations, security and support for every plan
      </Typography>
    </div>

    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted-secondary hover:bg-muted-secondary">
            <TableHead scope="col" className="h-11 w-[34%] px-4 font-semibold">
              Features
            </TableHead>
            <TableHead scope="col" className="h-11 px-4 font-semibold">
              Starter plan
            </TableHead>
            <TableHead scope="col" className="h-11 px-4 font-semibold">
              Business plan
            </TableHead>
            <TableHead scope="col" className="h-11 px-4 font-semibold">
              Enterprise plan
            </TableHead>
          </TableRow>
        </TableHeader>
        {SECTIONS.map((section) => (
          <TableBody key={section.title}>
            <TableRow className="hover:bg-transparent">
              <TableHead
                colSpan={4}
                scope="colgroup"
                className="h-auto px-4 pt-5 pb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
              >
                {section.title}
              </TableHead>
            </TableRow>
            {section.rows.map((row) => (
              <TableRow key={row.feature} className="hover:bg-transparent">
                <TableHead scope="row" className="h-auto px-4 py-3 font-normal whitespace-normal">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {row.feature}
                    {row.isComingSoon && (
                      <Badge variant="subtle" size="status" shape="status">
                        Soon
                      </Badge>
                    )}
                  </span>
                </TableHead>
                <TableCell className="px-4 py-3">
                  <Value value={row.starter} />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Value value={row.business} />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Value value={row.enterprise} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        ))}
      </Table>
    </div>
  </section>
)
