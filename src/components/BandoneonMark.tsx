export function BandoneonMark({ size = 44, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/bandoneon-icon.png"
      width={size}
      height={size}
      className={className}
      alt="Bandoneon Lab"
    />
  );
}
