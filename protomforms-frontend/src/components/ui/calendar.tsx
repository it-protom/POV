"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { it } from "date-fns/locale"

import { cn } from '../../lib/utils'
import { buttonVariants } from './button'

// Locale personalizzato con abbreviazioni giorni a singola lettera
const customItLocale = {
  ...it,
  localize: {
    ...it.localize,
    day: (n: number, options?: { width?: 'narrow' | 'abbreviated' | 'wide'; context?: 'formatting' | 'standalone' }) => {
      // date-fns: 0=Dom,1=Lun,2=Mar,3=Mer,4=Gio,5=Ven,6=Sab
      if (options?.width === 'narrow') {
        // L M M G V S D (Lunedì, Martedì, Mercoledì, Giovedì, Venerdì, Sabato, Domenica)
        const narrow = ['D', 'L', 'M', 'M', 'G', 'V', 'S'];
        return narrow[n];
      }
      // fallback a locale IT standard per altre larghezze
      return it.localize.day(n, options as any);
    },
  },
  options: {
    ...it.options,
    weekStartsOn: 1 as const, // Lunedì
  },
} as typeof it;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      locale={customItLocale}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "flex w-full",
        head_cell:
          "text-muted-foreground rounded-md w-10 h-10 flex items-center justify-center font-normal text-[0.8rem] flex-shrink-0 p-0",
        row: "flex w-full",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 w-10 h-10 flex items-center justify-center [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_start:
          "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_range_end:
          "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-primary/10 text-primary font-semibold ring-2 ring-primary ring-offset-2",
        day_outside:
          "day-outside text-muted-foreground aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("size-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("size-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  )
}

export { Calendar }
