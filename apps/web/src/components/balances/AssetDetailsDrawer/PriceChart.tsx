import { type ReactElement, useEffect, useRef, useState, useCallback } from 'react'
import { Box, Typography, Stack, ToggleButtonGroup, ToggleButton, Skeleton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useChartsGetChartV1Query, type Chart } from '@safe-global/store/gateway/AUTO_GENERATED/charts'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import FiatValue from '@/components/common/FiatValue'
import css from './styles.module.css'

type Period = 'day' | 'week' | 'month' | 'year'

type PriceChartProps = {
  assetId: string
  currentPrice?: number | null
}

const PERIOD_LABELS: Record<Period, string> = {
  day: '1D',
  week: '1W',
  month: '1M',
  year: '1Y',
}

const CHART_CONFIG = {
  height: 240,
  padding: { top: 30, right: 60, bottom: 40, left: 10 },
  animation: {
    duration: 400,
    blendMultiplier: 2.0,
  },
  grid: {
    lineWidth: 1,
    dashPattern: [2, 4] as number[],
  },
  line: {
    width: 2,
    dotRadius: 6,
  },
  labels: {
    font: '11px Inter, system-ui, sans-serif',
    maxCount: 6,
  },
} as const

const PriceChart = ({ assetId, currentPrice }: PriceChartProps): ReactElement => {
  const { palette } = useTheme()
  const currency = useAppSelector(selectCurrency)
  const [period, setPeriod] = useState<Period>('day')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredPoint, setHoveredPoint] = useState<{ price: number; time: string; index: number } | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionProgress, setTransitionProgress] = useState(1)
  const previousPeriodRef = useRef<Period>(period)
  const previousChartDataRef = useRef<typeof chartData>(null)
  const isTransitioningRef = useRef(false)

  const { data: chartData, isLoading, isError } = useChartsGetChartV1Query({
    fungibleId: assetId,
    period,
    currency,
  })

  /** Sample price at any timestamp using binary search O(log n) + linear interpolation */
  const samplePriceAtTime = useCallback((data: typeof chartData, targetTime: number): number => {
    if (!data || data.points.length === 0) return 0

    const points = data.points

    if (targetTime <= points[0][0]) return points[0][1]
    if (targetTime >= points[points.length - 1][0]) return points[points.length - 1][1]

    let left = 0
    let right = points.length - 1

    while (left < right - 1) {
      const mid = Math.floor((left + right) / 2)
      const [midTime] = points[mid]

      if (midTime === targetTime) return points[mid][1]
      else if (midTime < targetTime) left = mid
      else right = mid
    }

    const [t1, p1] = points[left]
    const [t2, p2] = points[right]
    const ratio = (targetTime - t1) / (t2 - t1)
    return p1 + (p2 - p1) * ratio
  }, [])

  /** Morphs between two chart datasets by interpolating data points over time */
  const interpolateChartData = useCallback(
    (oldData: Chart, newData: Chart, progress: number): Chart => {
      if (!oldData || !newData) return newData

      const oldMinTime = oldData.points[0][0]
      const oldMaxTime = oldData.points[oldData.points.length - 1][0]
      const newMinTime = newData.points[0][0]
      const newMaxTime = newData.points[newData.points.length - 1][0]

      const currentMinTime = oldMinTime + (newMinTime - oldMinTime) * progress
      const currentMaxTime = oldMaxTime + (newMaxTime - oldMaxTime) * progress
      const currentTimeSpan = currentMaxTime - currentMinTime

      const targetPointCount = Math.round(
        oldData.points.length + (newData.points.length - oldData.points.length) * progress,
      )

      const interpolatedPoints: number[][] = []

      for (let i = 0; i < targetPointCount; i++) {
        const t = i / Math.max(targetPointCount - 1, 1)
        const timestamp = currentMinTime + t * currentTimeSpan

        const oldPrice = samplePriceAtTime(oldData, timestamp)
        const newPrice = samplePriceAtTime(newData, timestamp)

        let blendWeight = progress

        if (timestamp < oldMinTime || timestamp > oldMaxTime) {
          blendWeight = Math.min(1.0, progress * CHART_CONFIG.animation.blendMultiplier)
        }

        if (timestamp < newMinTime || timestamp > newMaxTime) {
          blendWeight = Math.max(0.0, progress * CHART_CONFIG.animation.blendMultiplier - 1)
        }

        const price = oldPrice * (1 - blendWeight) + newPrice * blendWeight
        interpolatedPoints.push([timestamp, price])
      }

      const interpolatedStats = {
        first: oldData.stats.first + (newData.stats.first - oldData.stats.first) * progress,
        min: oldData.stats.min + (newData.stats.min - oldData.stats.min) * progress,
        avg: oldData.stats.avg + (newData.stats.avg - oldData.stats.avg) * progress,
        max: oldData.stats.max + (newData.stats.max - oldData.stats.max) * progress,
        last: oldData.stats.last + (newData.stats.last - oldData.stats.last) * progress,
      }

      return {
        beginAt: newData.beginAt,
        endAt: newData.endAt,
        stats: interpolatedStats,
        points: interpolatedPoints,
      }
    },
    [samplePriceAtTime],
  )

  const handlePeriodChange = (newPeriod: Period) => {
    if (newPeriod !== period && chartData) {
      previousChartDataRef.current = chartData
      previousPeriodRef.current = period
    }
    setPeriod(newPeriod)
  }

  useEffect(() => {
    const hasPreviousData = previousChartDataRef.current !== null
    const dataChanged = previousChartDataRef.current !== chartData
    const notAnimating = !isTransitioningRef.current

    if (hasPreviousData && dataChanged && notAnimating && chartData) {
      isTransitioningRef.current = true
      setIsTransitioning(true)
      setTransitionProgress(0)

      let cancelled = false
      const startTime = Date.now()
      const duration = CHART_CONFIG.animation.duration

      const animate = () => {
        if (cancelled) return

        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2
        setTransitionProgress(eased)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          isTransitioningRef.current = false
          setIsTransitioning(false)
          previousChartDataRef.current = chartData
        }
      }

      requestAnimationFrame(animate)

      return () => {
        cancelled = true
      }
    }
  }, [chartData])

  /** Draw chart with gradient and line */
  const drawChart = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      data: typeof chartData,
      width: number,
      height: number,
      padding: { top: number; right: number; bottom: number; left: number },
      chartPeriod: Period,
      alpha: number,
      horizontalScale: number,
    ) => {
    if (!data) return

    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    const prices = data.points.map((p) => p[1])
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice || 1

    const points = data.points.map((point, index) => {
      const x = padding.left + (index / (data.points.length - 1)) * chartWidth
      const y = padding.top + chartHeight - ((point[1] - minPrice) / priceRange) * chartHeight
      return { x, y, price: point[1], timestamp: point[0] }
    })

    const firstPrice = data.points[0][1]
    const lastPrice = data.points[data.points.length - 1][1]
    const isPositive = lastPrice >= firstPrice
    const lineColor = isPositive ? palette.success.main : palette.error.main
    const gradientColor = isPositive ? `${palette.success.main}40` : `${palette.error.main}40`

    ctx.save()
    const anchorX = width - padding.right
    ctx.translate(anchorX, 0)
    ctx.scale(horizontalScale, 1)
    ctx.translate(-anchorX, 0)
    ctx.globalAlpha = alpha

    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom)
    gradient.addColorStop(0, gradientColor)
    gradient.addColorStop(1, 'transparent')

    ctx.beginPath()
    ctx.moveTo(points[0].x, height - padding.bottom)
    points.forEach((point) => {
      ctx.lineTo(point.x, point.y)
    })
    ctx.lineTo(points[points.length - 1].x, height - padding.bottom)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    points.forEach((point) => {
      ctx.lineTo(point.x, point.y)
    })
    ctx.strokeStyle = lineColor
    ctx.lineWidth = CHART_CONFIG.line.width
    ctx.lineJoin = 'round'
    ctx.stroke()

    ctx.restore()
  }, [palette])

  useEffect(() => {
    if (!chartData || !canvasRef.current || !containerRef.current) return

    const canvas = canvasRef.current
    const container = containerRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const devicePixelRatio = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()
    canvas.width = rect.width * devicePixelRatio
    canvas.height = CHART_CONFIG.height * devicePixelRatio
    ctx.scale(devicePixelRatio, devicePixelRatio)

    const width = rect.width
    const height = CHART_CONFIG.height
    const padding = CHART_CONFIG.padding
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    ctx.clearRect(0, 0, width, height)

    let dataToRender = chartData
    const previousData = previousChartDataRef.current
    if (isTransitioning && previousData) {
      dataToRender = interpolateChartData(previousData, chartData, transitionProgress)
    }

    const prices = dataToRender.points.map((p) => p[1])
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)

    ctx.font = CHART_CONFIG.labels.font
    ctx.fillStyle = palette.text.secondary

    ctx.textAlign = 'left'
    ctx.fillText(`$${maxPrice.toFixed(2)}`, width - padding.right + 5, padding.top + 5)
    ctx.fillText(`$${minPrice.toFixed(2)}`, width - padding.right + 5, height - padding.bottom)

    const numLabels = Math.min(CHART_CONFIG.labels.maxCount, dataToRender.points.length)
    const labelIndices = Array.from({ length: numLabels }, (_, i) =>
      Math.floor((i / (numLabels - 1)) * (dataToRender.points.length - 1)),
    )

    ctx.textAlign = 'center'
    labelIndices.forEach((index) => {
      const point = dataToRender.points[index]
      const x = padding.left + (index / (dataToRender.points.length - 1)) * chartWidth
      const date = new Date(point[0] * 1000)

      let label = ''
      if (period === 'day') {
        label = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      } else if (period === 'week') {
        label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      } else {
        label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      }

      ctx.fillText(label, x, height - padding.bottom + 20)
    })

    ctx.strokeStyle = `${palette.divider}`
    ctx.lineWidth = CHART_CONFIG.grid.lineWidth
    ctx.setLineDash(CHART_CONFIG.grid.dashPattern)
    ctx.beginPath()
    ctx.moveTo(padding.left, padding.top + chartHeight / 2)
    ctx.lineTo(width - padding.right, padding.top + chartHeight / 2)
    ctx.stroke()
    ctx.setLineDash([])

    drawChart(ctx, dataToRender, width, height, padding, period, 1, 1)
  }, [chartData, palette, period, isTransitioning, transitionProgress, drawChart, interpolateChartData])

  useEffect(() => {
    if (!hoveredPoint || !chartData || !overlayCanvasRef.current || !containerRef.current) {
      if (overlayCanvasRef.current) {
        const ctx = overlayCanvasRef.current.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height)
        }
      }
      return
    }

    const canvas = overlayCanvasRef.current
    const container = containerRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const devicePixelRatio = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()
    canvas.width = rect.width * devicePixelRatio
    canvas.height = CHART_CONFIG.height * devicePixelRatio
    ctx.scale(devicePixelRatio, devicePixelRatio)

    const width = rect.width
    const height = CHART_CONFIG.height
    const padding = CHART_CONFIG.padding
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    const prices = chartData.points.map((p) => p[1])
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice || 1

    ctx.clearRect(0, 0, width, height)

    const x = padding.left + (hoveredPoint.index / (chartData.points.length - 1)) * chartWidth
    const y = padding.top + chartHeight - ((hoveredPoint.price - minPrice) / priceRange) * chartHeight

    ctx.strokeStyle = palette.text.secondary
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(x, padding.top)
    ctx.lineTo(x, height - padding.bottom)
    ctx.stroke()
    ctx.setLineDash([])

    const firstPrice = chartData.points[0][1]
    const lastPrice = chartData.points[chartData.points.length - 1][1]
    const isPositive = lastPrice >= firstPrice
    const dotColor = isPositive ? palette.success.main : palette.error.main

    ctx.fillStyle = palette.background.paper
    ctx.strokeStyle = dotColor
    ctx.lineWidth = CHART_CONFIG.line.width
    ctx.beginPath()
    ctx.arc(x, y, CHART_CONFIG.line.dotRadius, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
  }, [hoveredPoint, chartData, palette])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!chartData || !canvasRef.current || !containerRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const width = rect.width
    const padding = { left: 10, right: 60 }
    const chartWidth = width - padding.left - padding.right

    const relativeX = mouseX - padding.left
    const index = Math.round((relativeX / chartWidth) * (chartData.points.length - 1))
    const clampedIndex = Math.max(0, Math.min(index, chartData.points.length - 1))
    const point = chartData.points[clampedIndex]

    if (point) {
      const date = new Date(point[0] * 1000)
      let timeStr = ''
      if (period === 'day') {
        timeStr = date.toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      } else {
        timeStr = date.toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      }
      setHoveredPoint({ price: point[1], time: timeStr, index: clampedIndex })
    }
  }

  const handleMouseLeave = () => {
    setHoveredPoint(null)
  }

  if (!assetId || isError) {
    return <></>
  }

  if (isLoading) {
    return (
      <Box className={css.chartContainer}>
        <Skeleton variant="rectangular" height={200} />
      </Box>
    )
  }

  if (!chartData || chartData.points.length === 0) {
    return <></>
  }

  const displayPrice = hoveredPoint?.price ?? currentPrice ?? chartData.stats.last
  const displayTime = hoveredPoint?.time

  return (
    <Box className={css.chartContainer}>
      {/* Price Display */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            <FiatValue value={displayPrice.toString()} />
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ minHeight: '18px', display: 'block' }}>
            {displayTime || '\u00A0'}
          </Typography>
        </Box>

        {/* Period Selector */}
        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={(_, value) => value && handlePeriodChange(value)}
          size="small"
        >
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <ToggleButton key={p} value={p}>
              {PERIOD_LABELS[p]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      {/* Canvas Chart */}
      <Box ref={containerRef} className={css.chartCanvas}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: `${CHART_CONFIG.height}px`, position: 'absolute' }}
        />
        <canvas
          ref={overlayCanvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ width: '100%', height: `${CHART_CONFIG.height}px`, cursor: 'crosshair', position: 'absolute' }}
        />
      </Box>
    </Box>
  )
}

export default PriceChart
