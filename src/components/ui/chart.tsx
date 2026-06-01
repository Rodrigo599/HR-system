"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"
import { type TooltipProps } from "recharts"
import {
  type NameType,
  type Payload,
} from "recharts/types/component/Tooltip"

import { cn } from "@/lib/utils"

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

const ChartContext = React.createContext<{
  config: ChartConfig
} | null>(null)

interface ChartConfig {
  [key: string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: Record<string, string> }
    | { color?: string; theme?: Record<string, string> }
  )
}

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }
  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config: ChartConfig
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "ChartContainer"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || typeof config.color === "string"
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: [
          `#${id} {`,
          ...colorConfig.map(
            ([key, { color, theme }]) =>
              `--color-${key}: ${color || theme?.light || theme?.dark};`
          ),
          "}",
          `@media (prefers-color-scheme: dark) {`,
          `#${id} {`,
          ...colorConfig.map(
            ([key, { color, theme }]) =>
              `--color-${key}: ${color || theme?.dark || theme?.light};`
          ),
          "}",
          "}",
        ].join("\n"),
      }}
    />
  )
}

const ChartTooltip = React.forwardRef<
  React.ElementRef<typeof RechartsPrimitive.Tooltip>,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    typeof RechartsPrimitive.Tooltip.defaultProps & {
      hideLabel?: boolean
      hideNameKey?: boolean
      indicator?: "line" | "dot" | "dashed"
    }
>(
  (
    {
      active,
      payload,
      label,
      hideLabel = false,
      hideNameKey = false,
      indicator = "dot",
      contentStyle,
      labelStyle,
      ...props
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload || !payload.length) {
        return null
      }

      if (
        payload[0].payload &&
        !("value" in payload[0].payload)
      ) {
        return null
      }

      const [item] = payload
      const key = `${item.dataKey}`
      const itemConfig = config[key]
      const value =
        !hideNameKey && itemConfig?.label
          ? itemConfig.label
          : item.name

      if (item.payload[item.dataKey as keyof typeof item.payload] === null) {
        return null
      }

      return value
    }, [config, hideLabel, hideNameKey, payload])

    return (
      <RechartsPrimitive.Tooltip
        ref={ref}
        active={active}
        payload={payload}
        label={label}
        defaultShowTooltip={true}
        content={({ active, payload, label }) => {
          return (
            <ChartTooltipContent
              active={active}
              payload={payload}
              label={label}
              hideLabel={hideLabel}
              hideNameKey={hideNameKey}
              indicator={indicator}
            />
          )
        }}
        {...props}
      />
    )
  }
)
ChartTooltip.displayName = RechartsPrimitive.Tooltip.displayName

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  Omit<TooltipProps<NameType, string>, "content"> & {
    hideLabel?: boolean
    hideNameKey?: boolean
    indicator?: "line" | "dot" | "dashed"
    labelFormatter?: (value: any) => React.ReactNode
  }
>(
  (
    {
      active,
      payload,
      label,
      hideLabel = false,
      hideNameKey = false,
      indicator = "dot",
      labelFormatter,
      labelStyle,
      ...props
    },
    ref
  ) => {
    const { config } = useChart()

    if (!active || !payload || payload.length === 0) {
      return null
    }

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !label) {
        return null
      }

      if (
        payload[0].payload &&
        !("value" in payload[0].payload)
      ) {
        return null
      }

      return typeof labelFormatter === "function"
        ? labelFormatter(label)
        : label
    }, [label, hideLabel, labelFormatter, payload])

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-xl dark:border-slate-800 dark:bg-slate-950",
          props.className
        )}
        {...props}
      >
        {tooltipLabel ? (
          <div className="mb-2 font-medium text-slate-900 dark:text-slate-50">
            {tooltipLabel}
          </div>
        ) : null}
        <div className="space-y-1.5">
          {payload.map((item: Payload<NameType, string>, index: number) => {
            const key = `${item.dataKey}`
            const itemConfig = config[key]
            const indicatorColor =
              typeof item.color === "string"
                ? item.color
                : `hsl(var(--color-${key}))`

            return (
              <div
                key={`${item.dataKey}-${index}`}
                className="flex w-max items-center gap-1.5"
              >
                {indicator === "dot" ? (
                  <div
                    className="h-2 w-2 shrink-0 rounded-[2px]"
                    style={{
                      backgroundColor: indicatorColor,
                    }}
                  />
                ) : indicator === "line" ? (
                  <div
                    className="h-0.5 w-3 shrink-0"
                    style={{
                      backgroundColor: indicatorColor,
                    }}
                  />
                ) : indicator === "dashed" ? (
                  <div
                    className="h-0.5 w-3 shrink-0"
                    style={{
                      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="2"><line x1="0" y1="1" x2="12" y2="1" stroke="${indicatorColor}" stroke-dasharray="2" /></svg>')`,
                      backgroundRepeat: "repeat-x",
                    }}
                  />
                ) : null}
                <span className="text-slate-700 dark:text-slate-400">
                  {!hideNameKey && itemConfig?.label
                    ? itemConfig.label
                    : item.name}
                </span>
                <span className="ml-auto pl-1.5 font-mono font-medium text-slate-900 dark:text-slate-50">
                  {item.value}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltipContent"

const ChartLegend = React.forwardRef<
  React.ElementRef<typeof RechartsPrimitive.Legend>,
  React.ComponentProps<typeof RechartsPrimitive.Legend> &
    typeof RechartsPrimitive.Legend.defaultProps & {
      hideNameKey?: boolean
    }
>(({ hideNameKey = false, ...props }, ref) => (
  <RechartsPrimitive.Legend
    ref={ref}
    content={({ payload }) => (
      <ChartLegendContent hideNameKey={hideNameKey} payload={payload} />
    )}
    {...props}
  />
))
ChartLegend.displayName = "ChartLegend"

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  {
    hideNameKey?: boolean
    payload?: Payload<NameType, string>[]
  }
>(({ hideNameKey = false, payload }, ref) => {
  const { config } = useChart()

  if (!payload || payload.length === 0) {
    return null
  }

  return (
    <div
      ref={ref}
      className="flex flex-wrap justify-center gap-4"
    >
      {payload.map((item) => {
        const key = `${item.dataKey}`
        const itemConfig = config[key]

        return (
          <div key={`legend-${item.dataKey}`} className="flex items-center gap-2">
            <div
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{
                backgroundColor:
                  typeof item.color === "string"
                    ? item.color
                    : `hsl(var(--color-${key}))`,
              }}
            />
            <span className="text-xs text-slate-700 dark:text-slate-400">
              {!hideNameKey && itemConfig?.label
                ? itemConfig.label
                : item.name}
            </span>
          </div>
        )
      })}
    </div>
  )
})
ChartLegendContent.displayName = "ChartLegendContent"

export {
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  COLORS,
}
