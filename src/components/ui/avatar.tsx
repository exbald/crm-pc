import { Root as AvatarPrimitiveRoot, Image as AvatarPrimitiveImage, Fallback as AvatarPrimitiveFallback } from "@radix-ui/react-avatar";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn, getInitials } from "@/lib/utils";

const Avatar = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof AvatarPrimitiveRoot> & { size?: "sm" | "md" | "lg" }
>(({ className, size = "md", ...props }, ref) => {
  const sizeClasses = { sm: "h-6 w-6 text-xs", md: "h-8 w-8 text-sm", lg: "h-10 w-10 text-base" };
  return (
  <AvatarPrimitiveRoot
    ref={ref}
    className={cn(
      "relative flex shrink-0 overflow-hidden rounded-full",
      sizeClasses[size],
      className
    )}
    {...props}
  />
  );
});
Avatar.displayName = "Avatar";

const AvatarImage = forwardRef<
  HTMLImageElement,
  ComponentPropsWithoutRef<typeof AvatarPrimitiveImage>
>(({ className, ...props }, ref) => (
  <AvatarPrimitiveImage
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
));
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof AvatarPrimitiveFallback> & {
    name?: string;
  }
>(({ className, name, ...props }, ref) => (
  <AvatarPrimitiveFallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-700",
      className
    )}
    {...props}
  >
    {name ? getInitials(name) : props.children}
  </AvatarPrimitiveFallback>
));
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };
