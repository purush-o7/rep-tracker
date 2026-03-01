"use client";

import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

interface ResponsiveSheetDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function ResponsiveSheetDrawer({
  open,
  onOpenChange,
  title,
  description,
  icon,
  children,
  footer,
}: ResponsiveSheetDrawerProps) {
  const isMobile = useIsMobile();

  const headerInner = (
    <div className="flex items-center gap-3">
      {icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        {/* Title & description rendered via slots below */}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <div className="flex items-center gap-3">
              {icon && (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  {icon}
                </div>
              )}
              <div className="min-w-0 flex-1 text-left">
                <DrawerTitle className="text-base truncate">
                  {title}
                </DrawerTitle>
                {description && (
                  <DrawerDescription className="text-xs">
                    {description}
                  </DrawerDescription>
                )}
              </div>
            </div>
          </DrawerHeader>
          <DrawerBody>{children}</DrawerBody>
          {footer && <DrawerFooter className="pb-6">{footer}</DrawerFooter>}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                {icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-base truncate">
                {title}
              </SheetTitle>
              {description && (
                <SheetDescription className="text-xs">
                  {description}
                </SheetDescription>
              )}
            </div>
          </div>
        </SheetHeader>
        <SheetBody>{children}</SheetBody>
        {footer && <SheetFooter>{footer}</SheetFooter>}
      </SheetContent>
    </Sheet>
  );
}
