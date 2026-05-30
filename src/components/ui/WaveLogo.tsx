export function WaveLogo({ size = 24 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-start overflow-hidden rounded-md shadow-sm"
      style={{ width: size, height: size }}>
      <img
        src="/wave-nav-logo.png"
        alt=""
        className="block h-full max-w-none"
        style={{ width: "auto" }}
      />
    </span>
  );
}
