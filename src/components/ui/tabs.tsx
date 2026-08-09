"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cn } from "@/lib/utils";

function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("w-full", className)}
      {...props}
    />
  );
}

function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return (
    <div className="relative -mx-px [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)] sm:mx-0 sm:[mask-image:none]">
      <TabsPrimitive.List
        data-slot="tabs-list"
        className={cn(
          "relative flex items-center gap-6 overflow-x-auto border-b border-border px-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function TabsTab({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-tab"
      className={cn(
        "relative shrink-0 py-2.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors data-selected:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function TabsIndicator({ className, ...props }: TabsPrimitive.Indicator.Props) {
  return (
    <TabsPrimitive.Indicator
      data-slot="tabs-indicator"
      className={cn(
        "absolute bottom-0 left-0 h-0.5 w-(--active-tab-width) translate-x-(--active-tab-left) rounded-full bg-primary transition-all duration-300 ease-out",
        className,
      )}
      {...props}
    />
  );
}

function TabsPanel({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-panel"
      className={cn("pt-6 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTab, TabsIndicator, TabsPanel };
