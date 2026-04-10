import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "orange" | "purple";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-neutral-100 text-neutral-700",
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
  danger: "bg-danger-50 text-danger-700",
  info: "bg-info-50 text-info-700",
  orange: "bg-orange-50 text-orange-700",
  purple: "bg-purple-50 text-purple-700",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  filled?: boolean;
}

const filledVariantClasses: Record<BadgeVariant, string> = {
  default: "bg-neutral-400 text-white",
  success: "bg-success-500 text-white",
  warning: "bg-warning-500 text-white",
  danger: "bg-danger-500 text-white",
  info: "bg-info-500 text-white",
  orange: "bg-orange-500 text-white",
  purple: "bg-purple-500 text-white",
};

export function Badge({
  className,
  variant = "default",
  filled = false,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full px-2 text-xs font-medium",
        filled
          ? filledVariantClasses[variant]
          : variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
