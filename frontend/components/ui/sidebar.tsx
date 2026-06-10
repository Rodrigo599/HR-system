import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronRight, Menu } from "lucide-react"

import { cn } from "@/lib/utils"

const SIDEBAR_COOKIE_NAME = "sidebar:state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

type SidebarContext = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | undefined>(
  undefined
)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    defaultOpen?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = false
    const [openMobile, setOpenMobile] = React.useState(false)

    // This is the internal state of the sidebar.
    // We define this here because we can't use a hook to define it conditionally.
    const [_open, _setOpen] = React.useState(defaultOpen)
    const open = openProp ?? _open
    const setOpen = React.useCallback(
      (value: boolean | ((state: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }

        // This is a workaround for the Firefox sidebar issue.
        // https://github.com/shadcn-ui/ui/issues/1818
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
      },
      [open, setOpenProp]
    )

    const state = open ? "expanded" : "collapsed"

    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((open) => !open)
        : setOpen((open) => !open)
    }, [isMobile, setOpen, setOpenMobile])

    // Expose the sidebar state through a context.
    const value = React.useMemo<SidebarContext>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
    )

    return (
      <SidebarContext.Provider value={value}>
        <div
          ref={ref}
          className={cn(
            "flex h-full w-full flex-col bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50",
            className
          )}
          style={
            {
              "--sidebar-width": "16rem",
              ...style,
            } as React.CSSProperties
          }
          {...props}
        >
          {children}
        </div>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    side?: "left" | "right"
    variant?: "sidebar" | "floating" | "inset"
    collapsible?: "offcanvas" | "icon" | "none"
  }
>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

    if (collapsible === "none") {
      return (
        <div
          className={cn(
            "flex h-full w-[--sidebar-width] flex-col bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      )
    }

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
          <SheetContent
            side={side}
            className="w-[--sidebar-width] border-r-0 p-0 [&>button]:hidden"
          >
            <div className="flex h-full w-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      )
    }

    return (
      <div
        ref={ref}
        className="group/sidebar-wrapper flex h-full w-full has-[[data-variant=inset]]:bg-slate-50 dark:has-[[data-variant=inset]]:bg-slate-950"
        {...props}
      >
        <aside
          className={cn(
            "peer/sidebar-toggle relative hidden h-svh w-[--sidebar-width] transition-[width,margin] duration-200 ease-linear after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-slate-200 dark:after:bg-slate-800 group-has-[[data-sidebar=mobile]]/sidebar-wrapper:z-40 group-has-[[data-sidebar=mobile]]/sidebar-wrapper:absolute group-has-[[data-sidebar=mobile]]/sidebar-wrapper:inset-y-0 group-has-[[data-sidebar=mobile]]/sidebar-wrapper:left-0 group-has-[[data-sidebar=mobile]]/sidebar-wrapper:w-[--sidebar-width] group-has-[[data-sidebar=mobile]]/sidebar-wrapper:translate-x-0 sm:flex",
            state === "collapsed" &&
              "w-[calc(var(--sidebar-width)_*_0.3)] md:w-16",
            className
          )}
          data-state={state}
          data-collapsible={collapsible}
          data-variant={variant}
          data-side={side}
        >
          <div className="flex h-full w-full flex-col bg-slate-50 dark:bg-slate-950">
            {children}
          </div>
        </aside>
      </div>
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef<
  React.ElementRef<"button">,
  React.ComponentProps<"button">
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      ref={ref}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 dark:text-slate-50 dark:hover:bg-slate-800 dark:focus-visible:ring-slate-300 h-10 w-10 bg-slate-100 dark:bg-slate-800",
        className
      )}
      {...props}
    >
      <Menu className="h-4 w-4" />
    </button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarRail = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      ref={ref}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "absolute inset-y-0 left-full z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 hover:after:bg-slate-300 group-data-[side=left]/sidebar-wrapper:right-full group-data-[side=right]/sidebar-wrapper:left-full group-data-[state=collapsed]/sidebar-wrapper:group-hover/sidebar-wrapper:flex group-data-[state=expanded]/sidebar-wrapper:group-hover/sidebar-wrapper:flex dark:hover:after:bg-slate-700 sm:flex",
        className
      )}
      {...props}
    />
  )
})
SidebarRail.displayName = "SidebarRail"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]/sidebar-wrapper:overflow-hidden",
      className
    )}
    {...props}
  />
))
SidebarContent.displayName = "SidebarContent"

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex w-full min-w-0 flex-col gap-2 p-2 group-data-[collapsible=icon]/sidebar-wrapper:p-2",
      className
    )}
    {...props}
  />
))
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      ref={ref}
      className={cn(
        "display: flex;height: 2rem;align-items: center;padding: 0 0.5rem;font-size: 0.75rem;font-weight: 600;color: hsl(var(--sidebar-accent-foreground));text-transform: uppercase;group-data-[collapsible=icon]/sidebar-wrapper:px-2;group-data-[collapsible=icon]/sidebar-wrapper:[&>svg]:hidden;group-data-[state=collapsed]/sidebar-wrapper:hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarGroupAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      className={cn(
        "display: inline-flex;align-items: center;justify-content: center;width: 2rem;height: 2rem;border-radius: 0.375rem;color: hsl(var(--sidebar-foreground));opacity: 0.6;transition-opacity: opacity 200ms ease;hover:opacity: 1;focus-visible:outline: 2px solid transparent;focus-visible:outline-offset: 2px;focus-visible:ring: 2px;focus-visible:ring: hsl(var(--sidebar-ring));disabled:opacity: 0.5;disabled:cursor: not-allowed;group-data-[collapsible=icon]/sidebar-wrapper:h-8;group-data-[collapsible=icon]/sidebar-wrapper:w-8;group-data-[collapsible=icon]/sidebar-wrapper:p-0;group-data-[state=collapsed]/sidebar-wrapper:hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarGroupAction.displayName = "SidebarGroupAction"

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("w-full text-sm", className)}
    {...props}
  />
))
SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn(
      "flex w-full min-w-0 flex-col gap-1",
      className
    )}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("group/menu-item relative", className)}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md px-2 py-1.5 text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-data-[collapsible=icon]/sidebar-wrapper:h-10 group-data-[collapsible=icon]/sidebar-wrapper:w-10 group-data-[collapsible=icon]/sidebar-wrapper:p-0 group-data-[state=collapsed]/sidebar-wrapper:hidden [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-slate-100 dark:hover:bg-slate-800",
        outline:
          "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:text-slate-50",
      },
      size: {
        default: "h-8",
        sm: "h-7 text-xs",
        lg: "h-12 text-base group-data-[collapsible=icon]/sidebar-wrapper:!p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    isActive?: boolean
    tooltip?: string | React.ComponentType<any>
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = "default",
      size = "default",
      className,
      tooltip,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    const { state } = useSidebar()

    return (
      <Comp
        ref={ref}
        data-active={isActive}
        className={cn(
          sidebarMenuButtonVariants({ variant, size }),
          "group-data-[active=true]/menu-item:bg-slate-100 group-data-[active=true]/menu-item:text-slate-900 dark:group-data-[active=true]/menu-item:bg-slate-800 dark:group-data-[active=true]/menu-item:text-slate-50",
          className
        )}
        {...props}
      />
    )
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    showOnHover?: boolean
  }
>(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      className={cn(
        "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-slate-900 outline-none ring-sidebar-ring transition-opacity hover:bg-slate-100 focus-visible:ring-2 dark:text-slate-200 dark:hover:bg-slate-800 [&>svg]:size-4 [&>svg]:shrink-0",
        // Adjust opacity based on state
        "opacity-0 peer-hover/menu-button:opacity-100 peer-data-[size=lg]/menu-button:top-2",
        showOnHover && "group-data-[state=collapsed]/sidebar-wrapper:opacity-100",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuAction.displayName = "SidebarMenuAction"

const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md bg-slate-900 px-1 text-xs font-medium text-slate-50 tabular-nums dark:bg-slate-50 dark:text-slate-900 peer-hover/menu-button:opacity-100 group-data-[collapsible=icon]/sidebar-wrapper:peer-data-[size=lg]/menu-button:top-2 group-data-[state=collapsed]/sidebar-wrapper:opacity-0",
      className
    )}
    {...props}
  />
))
SidebarMenuBadge.displayName = "SidebarMenuBadge"

const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    showIcon?: boolean
  }
>(({ className, showIcon = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "space-y-2 rounded-md",
      className
    )}
    {...props}
  >
    <div className="flex items-center gap-2 rounded-md h-8">
      {showIcon && <div className="h-4 w-4 rounded-md bg-slate-200 dark:bg-slate-800" />}
      <div className="h-4 flex-1 rounded-md bg-slate-200 dark:bg-slate-800" />
    </div>
  </div>
))
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton"

const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<"a"> & {
    asChild?: boolean
    isActive?: boolean
    size?: "sm" | "md"
  }
>(
  (
    { asChild = false, isActive = false, size = "md", className, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "a"

    return (
      <Comp
        ref={ref}
        data-active={isActive}
        className={cn(
          "relative flex h-7 w-full min-w-0 items-center gap-2 rounded-md px-2 text-sm outline-none ring-sidebar-ring transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 active:bg-slate-100 active:text-slate-900 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-50 dark:active:bg-slate-800 dark:active:text-slate-50",
          "group-data-[state=collapsed]/sidebar-wrapper:hidden",
          isActive &&
            "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50",
          className
        )}
        {...props}
      />
    )
  }
)
SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

// Placeholder Sheet component for mobile sidebar
const Sheet = ({ children }: { children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) => (
  <div>{children}</div>
)

const SheetContent = ({ children }: { children: React.ReactNode; side?: string; className?: string }) => (
  <div>{children}</div>
)

export {
  Sidebar,
  SidebarProvider,
  useSidebar,
  SidebarTrigger,
  SidebarRail,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
  SidebarMenuSubButton,
}
