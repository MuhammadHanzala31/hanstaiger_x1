import Link from "next/link";

const SUPPORT_EMAIL = "info@hanstaiger.com";

export default function BookingNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-grey-900 px-6 text-center">
      <p className="eyebrow">Hanstaiger</p>
      <h1 className="t-h3 max-w-xl text-white">This yacht is currently under maintenance</h1>
      <p className="t-body3 max-w-md text-grey-400">
        Send us an email at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-orange-400 hover:text-orange-500">
          {SUPPORT_EMAIL}
        </a>{" "}
        and our team will help you find another date or vessel.
      </p>
      <Link
        href="https://jygr5f-6j.myshopify.com/"
        className="t-button1 rounded-sm bg-orange-400 px-7 py-3 text-white transition-colors hover:bg-orange-500"
      >
        Back to home
      </Link>
    </main>
  );
}
