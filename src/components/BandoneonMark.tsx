export function BandoneonMark({ size = 44, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/icon-192.png"
      width={size}
      height={size}
      className={className}
      alt="Bandoneon Lab"
    />
  );
}
