import { CloseIcon } from "./ui";
import { Wordmark } from "./Wordmark";

export function TopBar() {
  return (
    <header className="absolute inset-x-0 top-0 flex justify-center pt-[39px] desk:pt-[45px]">
      <Wordmark />
      <a
        href="https://jygr5f-6j.myshopify.com/"
        aria-label="Close"
        className="absolute right-20 top-[30px] hidden size-9 items-center justify-center rounded-[2px] bg-[#373737]/30 text-white backdrop-blur-[30px] transition-colors hover:bg-[#373737]/50 desk:flex"
      >
        <CloseIcon />
      </a>
    </header>
  );
}
