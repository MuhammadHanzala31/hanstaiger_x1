/** Pre-blurred X1 photo, scaled exactly like the Figma frame fill (134% × 145%, centred). */
export function Backdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 bg-grey-900 bg-center bg-no-repeat"
      style={{ backgroundImage: "url(/booking/backdrop.webp)", backgroundSize: "134.09% 145%" }}
    />
  );
}
