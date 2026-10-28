import Image from "next/image";
import thumb from "@/public/booking/thumb.png";

/** Fixed bottom bar below the desktop breakpoint, glass card above it. */
export function TotalCard({ amount }: { amount: string }) {
  return (
    <div className="total-bar fixed inset-x-0 bottom-0 z-40 flex h-[88px] items-center gap-6 bg-[#373737]/30 p-4 desk:static desk:h-[68px] desk:rounded-[4px] desk:p-[6px] desk:pr-3 desk:backdrop-blur-[30px]">
      <Image src={thumb} alt="" className="size-14 shrink-0 rounded-[3.667px] bg-white" />
      <div className="min-w-0 flex-1">
        <p className="t-caption3 flex justify-between uppercase text-grey-150">
          <span>Total charter rate</span>
          <span>Per day</span>
        </p>
        <p className="t-h6 mt-1 text-white">{amount}</p>
      </div>
    </div>
  );
}
