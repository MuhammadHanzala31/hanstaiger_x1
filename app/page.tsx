import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-grey-900 px-6 text-center">
      <p className="eyebrow">Hanstaiger</p>
      <h1 className="t-title3 max-w-2xl text-white">Book the X1 experience</h1>
      <Link
        href="/book/x1"
        className="t-button1 rounded-sm bg-orange-400 px-7 py-3 text-white transition-colors hover:bg-orange-500"
      >
        Customize your experience
      </Link>
    </main>
  );
}
