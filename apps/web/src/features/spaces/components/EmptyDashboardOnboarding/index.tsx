import { useState, type ReactElement } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'motion/react'
import { Plus, Import, X, Sparkles, Wallet, ArrowRight } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/utils/cn'
import SafeLogo from '@/public/images/logo-no-text.svg'
import { AppRoutes } from '@/config/routes'
import FlowSelector from '../FlowSelector'
import { containerVariants, itemVariants, iconVariants } from '../CreateSpaceOnboarding/utils'

const EmptyDashboardOnboarding = (): ReactElement => {
  const isDarkMode = useDarkMode()
  const router = useRouter()
  const [isAddSafesOpen, setIsAddSafesOpen] = useState(false)

  return (
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-secondary p-3">
        {/* Animated background orbs */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1, x: [0, 35, -20, 10, 0], y: [0, -30, 20, -10, 0] }}
            transition={{
              opacity: { duration: 1.4, ease: 'easeOut' },
              scale: { duration: 1.4, ease: 'easeOut' },
              x: { duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 1.5 },
              y: { duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1.5 },
            }}
          >
            <div className="h-[560px] w-[560px] rounded-full bg-gradient-to-br from-green-200/40 via-green-100/20 to-transparent blur-3xl dark:from-green-900/25 dark:via-green-800/10 dark:to-transparent" />
          </motion.div>
        </div>

        {/* Main card */}
        <motion.div
          className="relative w-[480px] overflow-hidden rounded-3xl bg-background"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex flex-col items-center gap-8 px-10 py-12">
            {/* Logo */}
            <motion.div variants={iconVariants} className="relative">
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                <SafeLogo alt="Safe logo" width={51} height={39} />
              </motion.div>
            </motion.div>

            {/* Workspace created badge */}
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#12FF80]/[0.08] px-3 py-1.5">
                <Sparkles className="size-3.5 text-[#12FF80]" />
                <span className="text-sm font-medium text-foreground">Workspace created</span>
              </span>
            </motion.div>

            {/* Heading */}
            <motion.div variants={itemVariants} className="flex flex-col items-center gap-3">
              <Typography variant="h2" align="center">
                Your workspace is ready
              </Typography>
              <Typography variant="paragraph" align="center" color="muted" className="max-w-[340px]">
                Add your first Safe Account to start managing assets, signers, and transactions.
              </Typography>
            </motion.div>

            {/* Empty state illustration */}
            <motion.div
              variants={itemVariants}
              className="flex w-full flex-col items-center gap-4 rounded-2xl border border-dashed border-border/60 bg-secondary/50 px-8 py-10"
            >
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#12FF80]/[0.08]">
                <Wallet className="size-7 text-[#12FF80]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">No Safe Accounts yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Create a new one or add an existing Safe</p>
              </div>
            </motion.div>

            {/* Add Safes CTA */}
            <motion.div variants={itemVariants} className="w-full">
              <Button
                type="button"
                size="lg"
                className="w-full"
                onClick={() => setIsAddSafesOpen(true)}
              >
                Add Safe Accounts
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Add Safes popup */}
      {isAddSafesOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsAddSafesOpen(false)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            {/* Close button — outside popup */}
            <button
              type="button"
              onClick={() => setIsAddSafesOpen(false)}
              className="absolute -right-9 -top-9 z-50 flex size-8 items-center justify-center rounded-full bg-white/15 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/25 hover:text-white"
            >
              <X className="size-4" />
            </button>

            <motion.div
              className="w-[460px] overflow-hidden rounded-3xl bg-background shadow-2xl"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <div className="flex flex-col gap-6 p-8">
                <div className="flex flex-col gap-2">
                  <Typography variant="h3">Add Safe Accounts</Typography>
                  <Typography variant="paragraph" color="muted" className="text-sm">
                    Choose how you&apos;d like to add a Safe to your workspace.
                  </Typography>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Create new safe */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddSafesOpen(false)
                      router.push(AppRoutes.newSafe.create)
                    }}
                    className="group flex items-center gap-4 rounded-2xl border border-border p-5 text-left transition-all hover:border-[#12FF80]/30 hover:bg-[#12FF80]/[0.04]"
                  >
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-[12px] bg-[#f0fdf4] dark:bg-[#12FF80]/10">
                      <Plus className="size-6 text-[#16a34a] dark:text-[#12FF80]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[15px] font-semibold text-foreground">Create new Safe</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Deploy a new Safe Account with your own signers and threshold
                      </p>
                    </div>
                    <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </button>

                  {/* Add existing safe */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddSafesOpen(false)
                      router.push(AppRoutes.welcome.selectSafes)
                    }}
                    className="group flex items-center gap-4 rounded-2xl border border-border p-5 text-left transition-all hover:border-[#12FF80]/30 hover:bg-[#12FF80]/[0.04]"
                  >
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-[12px] bg-[#f0fdf4] dark:bg-[#12FF80]/10">
                      <Import className="size-6 text-[#16a34a] dark:text-[#12FF80]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[15px] font-semibold text-foreground">Add existing Safe</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Import a Safe Account you already own or are a signer on
                      </p>
                    </div>
                    <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      <FlowSelector />
    </div>
  )
}

export default EmptyDashboardOnboarding
