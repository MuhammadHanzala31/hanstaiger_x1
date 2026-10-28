"use client";

import { useState } from "react";
import { CheckoutCta, PanelHeader, PlusMinusIcon, Sheet, StepButtons, type CtaProps } from "@/components/booking/ui";
import type { ServiceOption, ServiceWithOptions } from "@/lib/booking/types";
import type { SelectedOption } from "@/lib/types";

export function ServicesPanel({
  services,
  selected,
  onChange,
  onClear,
  onBack,
  onContinue,
  cta,
}: {
  services: ServiceWithOptions[];
  selected: SelectedOption[];
  onChange: (opts: SelectedOption[]) => void;
  onClear: () => void;
  onBack: () => void;
  onContinue: () => void;
  cta: CtaProps;
}) {
  // Desktop expands the row in place; below the breakpoint it opens the sheet.
  const [open, setOpen] = useState<string | null>(null);
  const isOn = (id: string) => selected.some((o) => o.optionId === id);
  const toggle = (o: ServiceOption) =>
    onChange(isOn(o.id) ? selected.filter((s) => s.optionId !== o.id) : [...selected, { optionId: o.id, name: o.name, price: o.price }]);
  const row = "t-caption3 flex w-full items-center justify-between text-left uppercase text-grey-600";

  return (
    <>
      <PanelHeader step={3} title="Enhance your experience" onClear={onClear} />
      <div className="mt-8 flex flex-col gap-4 pb-7">
        {services.map((s) => (
          <div key={s.id}>
            <button type="button" aria-expanded={open === s.id} onClick={() => setOpen(open === s.id ? null : s.id)} className={`${row} h-[15px]`}>
              {s.name}
              <PlusMinusIcon open={open === s.id} />
            </button>
            {open === s.id && (
              <ul className="mt-4 hidden grid-cols-3 gap-1 pb-7 desk:grid">
                {s.options.map((o) => (
                  <li key={o.id}>
                    <button type="button" aria-pressed={isOn(o.id)} onClick={() => toggle(o)} className="t-button2 flex items-center gap-2 text-left text-grey-800">
                      <span className="flex size-4 shrink-0 items-center justify-center">
                        <span className={`size-2 rounded-full ${isOn(o.id) ? "bg-orange-400" : "bg-grey-200"}`} />
                      </span>
                      {o.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
      <StepButtons onBack={onBack} canContinue={selected.length > 0} onContinue={onContinue} />

      {open && (
        <Sheet
          onClose={() => setOpen(null)}
          bar={
            <>
              Services<span className="ml-4">{selected.length}</span>
            </>
          }
        >
          <div className="mt-10">
            <PanelHeader step={3} title="Enhance your experience" onClear={onClear} />
          </div>
          <div className="mt-[30px] flex flex-col gap-0.5">
            {services.map((s) =>
              s.id === open ? (
                <div key={s.id} className="pb-5 pt-4">
                  <button type="button" aria-expanded onClick={() => setOpen(null)} className={`${row} h-[15px]`}>
                    {s.name}
                    <PlusMinusIcon open />
                  </button>
                  <ul className="mt-7 flex flex-col gap-6">
                    {s.options.map((o) => (
                      <li key={o.id}>
                        <button type="button" aria-pressed={isOn(o.id)} onClick={() => toggle(o)} className="t-button1 flex items-center gap-2 text-left text-grey-700">
                          <span className="flex size-5 shrink-0 items-center justify-center">
                            <span className={`size-[15px] rounded-full ${isOn(o.id) ? "bg-orange-400" : "bg-grey-200"}`} />
                          </span>
                          {o.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <button key={s.id} type="button" onClick={() => setOpen(s.id)} className={`${row} h-[47.857px]`}>
                  {s.name}
                  <PlusMinusIcon size={15.86} />
                </button>
              ),
            )}
          </div>
          <CheckoutCta className="mt-[41px]" dark {...cta} />
        </Sheet>
      )}
    </>
  );
}
