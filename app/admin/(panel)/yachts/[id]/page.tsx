import { notFound } from "next/navigation";
import Link from "next/link";
import { getYacht } from "@/lib/admin/queries";
import { upsertYacht } from "../actions";

function euros(cents: number): string {
  return (cents / 100).toFixed(2);
}

export default async function YachtForm({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNew = id === "new";
  const y = isNew ? null : await getYacht(id);
  if (!isNew && !y) notFound();

  const depositValueDisplay = y
    ? y.deposit_mode === "flat"
      ? euros(y.deposit_value)
      : String(y.deposit_value)
    : "20";

  return (
    <div className="max-w-2xl">
      <Link href="/admin/yachts" className="t-caption3 text-grey-500 hover:text-white">
        ← Yachts
      </Link>
      <h1 className="t-h3 mb-6 mt-2 text-white">{isNew ? "New yacht" : y!.name}</h1>

      <form action={upsertYacht} className="grid grid-cols-2 gap-4">
        {!isNew && <input type="hidden" name="id" value={y!.id} />}

        <Field label="Name" name="name" defaultValue={y?.name} required />
        <Field label="Slug" name="slug" defaultValue={y?.slug} required />
        <Field label="Tagline" name="tagline" defaultValue={y?.tagline ?? ""} span2 />
        <Field label="Hero image URL" name="hero_image" defaultValue={y?.hero_image ?? ""} span2 />
        <Field label="Description" name="description" defaultValue={y?.description ?? ""} span2 textarea />

        <Field label="Base price (€)" name="base_price" type="number" step="0.01" defaultValue={y ? euros(y.base_price) : "0"} />
        <Field label="Extra guest price (€)" name="extra_guest_price" type="number" step="0.01" defaultValue={y ? euros(y.extra_guest_price) : "0"} />
        <Field label="Included guests" name="included_guests" type="number" defaultValue={String(y?.included_guests ?? 1)} />
        <Field label="Max guests" name="max_guests" type="number" defaultValue={String(y?.max_guests ?? 12)} />
        <Field label="Min nights" name="min_nights" type="number" defaultValue={String(y?.min_nights ?? 1)} />
        <Field label="Max nights" name="max_nights" type="number" defaultValue={String(y?.max_nights ?? 30)} />

        <label className="flex flex-col gap-1">
          <span className="t-caption3 text-grey-400">Deposit mode</span>
          <select name="deposit_mode" defaultValue={y?.deposit_mode ?? "percent"} className="admin-input">
            <option value="percent">Percent of total</option>
            <option value="flat">Flat amount</option>
          </select>
        </label>
        <Field
          label="Deposit value (percent number, or € if flat)"
          name="deposit_value"
          type="number"
          step="0.01"
          defaultValue={depositValueDisplay}
        />

        <Field label="Season start" name="season_start" type="date" defaultValue={y?.season_start ?? ""} />
        <Field label="Season end" name="season_end" type="date" defaultValue={y?.season_end ?? ""} />
        <Field label="Sort order" name="sort_order" type="number" defaultValue={String(y?.sort_order ?? 0)} />

        <label className="col-span-2 flex items-center gap-2">
          <input type="checkbox" name="is_active" defaultChecked={y?.is_active ?? true} />
          <span className="t-body3 text-grey-300">Active (visible to customers)</span>
        </label>

        <div className="col-span-2 mt-2">
          <button type="submit" className="t-button1 rounded-sm bg-orange-400 px-6 py-3 text-white hover:bg-orange-500">
            {isNew ? "Create yacht" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  step,
  required,
  span2,
  textarea,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  step?: string;
  required?: boolean;
  span2?: boolean;
  textarea?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1 ${span2 ? "col-span-2" : ""}`}>
      <span className="t-caption3 text-grey-400">{label}</span>
      {textarea ? (
        <textarea name={name} defaultValue={defaultValue} rows={3} className="admin-input" />
      ) : (
        <input
          name={name}
          type={type}
          step={step}
          required={required}
          defaultValue={defaultValue}
          className="admin-input"
        />
      )}
    </label>
  );
}
