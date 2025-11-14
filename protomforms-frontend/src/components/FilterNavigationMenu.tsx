import * as React from "react"
import { Check, Grid3X3, List } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"

interface FilterNavigationMenuProps {
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  sortBy: string
  onSortByChange: (value: string) => void
  viewMode: 'grid' | 'list'
  onViewModeChange: (value: 'grid' | 'list') => void
}

const statusOptions = [
  { value: 'all', label: 'Tutti' },
  { value: 'published', label: 'Pubblicati' },
  { value: 'draft', label: 'Bozze' },
]

const sortOptions = [
  { value: 'updated', label: 'Ultima modifica' },
  { value: 'created', label: 'Creazione' },
  { value: 'title', label: 'Nome' },
]

const viewOptions = [
  { value: 'list' as const, label: 'Elenco', icon: List },
  { value: 'grid' as const, label: 'Griglia', icon: Grid3X3 },
]

export function FilterNavigationMenu({
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  viewMode,
  onViewModeChange,
}: FilterNavigationMenuProps) {
  const isMobile = useIsMobile()
  const [activeValue, setActiveValue] = React.useState<string>("")
  const [viewportPosition, setViewportPosition] = React.useState(0)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const itemRefs = React.useRef<{ [key: string]: HTMLButtonElement | null }>({})

  const handleValueChange = (value: string) => {
    setActiveValue(value)

    // Calculate position of active item with RAF for smooth updates
    if (value && itemRefs.current[value] && menuRef.current) {
      requestAnimationFrame(() => {
        if (itemRefs.current[value] && menuRef.current) {
          const itemRect = itemRefs.current[value]!.getBoundingClientRect()
          const menuRect = menuRef.current.getBoundingClientRect()
          const position = itemRect.left - menuRect.left + (itemRect.width / 2)
          setViewportPosition(position)
        }
      })
    }
  }

  const handleStatusClick = (value: string) => {
    onStatusFilterChange(value)
  }

  const handleSortClick = (value: string) => {
    onSortByChange(value)
  }

  const handleViewClick = (value: 'grid' | 'list') => {
    onViewModeChange(value)
  }

  return (
    <div className="rounded-2xl bg-white px-4 py-2">
      <NavigationMenu
        ref={menuRef}
        viewport={!isMobile}
        onValueChange={handleValueChange}
        className="relative"
        style={
          {
            '--viewport-position': `${viewportPosition}px`,
          } as React.CSSProperties
        }
      >
        <NavigationMenuList className="flex-wrap">
        <NavigationMenuItem value="status">
          <NavigationMenuTrigger
            ref={(el) => (itemRefs.current["status"] = el)}
            className="bg-transparent hover:bg-accent/50 data-[state=open]:bg-accent/50"
          >
            Filtra per stato
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[180px] gap-0.5 p-1.5">
              {statusOptions.map((option) => (
                <li key={option.value}>
                  <NavigationMenuLink asChild>
                    <button
                      onClick={() => handleStatusClick(option.value)}
                      className={cn(
                        "!flex-row flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm transition-colors outline-none",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus-visible:bg-accent focus-visible:text-accent-foreground",
                        statusFilter === option.value && "bg-accent/60 text-accent-foreground font-medium"
                      )}
                    >
                      <Check
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 transition-opacity",
                          statusFilter === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span>{option.label}</span>
                    </button>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem value="sort">
          <NavigationMenuTrigger
            ref={(el) => (itemRefs.current["sort"] = el)}
            className="bg-transparent hover:bg-accent/50 data-[state=open]:bg-accent/50"
          >
            Ordinamento
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[180px] gap-0.5 p-1.5">
              {sortOptions.map((option) => (
                <li key={option.value}>
                  <NavigationMenuLink asChild>
                    <button
                      onClick={() => handleSortClick(option.value)}
                      className={cn(
                        "!flex-row flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm transition-colors outline-none",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus-visible:bg-accent focus-visible:text-accent-foreground",
                        sortBy === option.value && "bg-accent/60 text-accent-foreground font-medium"
                      )}
                    >
                      <Check
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 transition-opacity",
                          sortBy === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span>{option.label}</span>
                    </button>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem value="view">
          <NavigationMenuTrigger
            ref={(el) => (itemRefs.current["view"] = el)}
            className="bg-transparent hover:bg-accent/50 data-[state=open]:bg-accent/50"
          >
            Visualizzazione
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[180px] gap-0.5 p-1.5">
              {viewOptions.map((option) => {
                const Icon = option.icon
                return (
                  <li key={option.value}>
                    <NavigationMenuLink asChild>
                      <button
                        onClick={() => handleViewClick(option.value)}
                        className={cn(
                          "!flex-row flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm transition-colors outline-none",
                          "hover:bg-accent hover:text-accent-foreground",
                          "focus-visible:bg-accent focus-visible:text-accent-foreground",
                          viewMode === option.value && "bg-accent/60 text-accent-foreground font-medium"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-3.5 w-3.5 shrink-0",
                            viewMode === option.value && "text-primary"
                          )}
                        />
                        <span>{option.label}</span>
                      </button>
                    </NavigationMenuLink>
                  </li>
                )
              })}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
    </div>
  )
}
