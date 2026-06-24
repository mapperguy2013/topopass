import type { ReactNode } from "react";

export type AtlasPageBaseImageProps = {
  imagePath: string;
  pixelWidth: number;
  pixelHeight: number;
  title?: string;
};

export function AtlasPageBaseImage({
  imagePath,
  pixelWidth,
  pixelHeight,
  title
}: AtlasPageBaseImageProps) {
  return (
    <image
      height={pixelHeight}
      href={imagePath}
      preserveAspectRatio="none"
      width={pixelWidth}
      x="0"
      y="0"
    >
      {title ? <title>{title}</title> : null}
    </image>
  );
}

export type AtlasPageMapProps = AtlasPageBaseImageProps & {
  ariaLabel: string;
  children?: ReactNode;
  className?: string;
  viewBox?: string;
};

export function AtlasPageMap({
  ariaLabel,
  children,
  className,
  imagePath,
  pixelWidth,
  pixelHeight,
  title,
  viewBox = `0 0 ${pixelWidth} ${pixelHeight}`
}: AtlasPageMapProps) {
  return (
    <svg aria-label={ariaLabel} className={className} role="img" viewBox={viewBox}>
      <AtlasPageBaseImage
        imagePath={imagePath}
        pixelHeight={pixelHeight}
        pixelWidth={pixelWidth}
        title={title}
      />
      {children}
    </svg>
  );
}
