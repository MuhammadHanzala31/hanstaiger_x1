"use client";

import { useState, useTransition } from "react";
import { formatEUR } from "@/lib/money";
import type { ServiceWithOptions } from "@/lib/booking/types";
import type { SelectedOption } from "@/lib/types";

export function ServicePicker({
  services,
  selected,
  onChange,
}: {
  services: ServiceWithOptions[];
  selected: SelectedOption[];
  onChange: (opts: SelectedOption[]) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState<SelectedOption[]>(selected);
  const [open, setOpen] = useState<string | null>(services[0]?.id ?? null);

  const isSelected = (id: string) => optimistic.some((o) => o.optionId === id);

  const commit = (next: SelectedOption[]) => {
    setOptimistic(next);
    startTransition(async () => {
      await onChange(next);
    });
  };

  const toggle = (optionId: string, name: string, price: number) => {
    const next = isSelected(optionId)
      ? optimistic.filter((o) => o.optionId !== optionId)
      : [...optimistic, { optionId, name, price }];
    commit(next);
  };

  return (
    <div className="frost rounded-md border border-white/10">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <span className="eyebrow">Select your services</span>
        <button
          type="button"
          onClick={() => commit([])}
          className="t-caption3 text-grey-400 transition-colors hover:text-white"
          disabled={optimistic.length === 0}
        >
          Clear all{pending ? " · …" : ""}
        </button>
      </div>

      <div className="max-h-72 overflow-y-auto">
        {services.map((service) => {
          const expanded = open === service.id;
          const count = service.options.filter((o) => isSelected(o.id)).length;
          return (
            <div key={service.id} className="border-b border-white/5 last:border-0">
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : service.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <span className="t-body3 text-white">{service.name}</span>
                <span className="t-caption3 text-grey-500">
                  {count > 0 ? `${count} · ` : ""}
                  {expanded ? "–" : "+"}
                </span>
              </button>
              {expanded && (
                <ul className="pb-2">
                  {service.options.map((opt) => {
                    const on = isSelected(opt.id);
                    return (
                      <li key={opt.id}>
                        <button
                          type="button"
                          onClick={() => toggle(opt.id, opt.name, opt.price)}
                          className="flex w-full items-center justify-between px-4 py-2 text-left transition-colors hover:bg-white/5"
                        >
                          <span className="flex items-center gap-3">
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] ${
                                on
                                  ? "border-orange-400 bg-orange-400 text-white"
                                  : "border-white/30 text-grey-400"
                              }`}
                            >
                              {on ? "✓" : "+"}
                            </span>
                            <span className="t-body4 text-grey-200">{opt.name}</span>
                          </span>
                          <span className="t-body4 text-grey-400">{formatEUR(opt.price)}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
