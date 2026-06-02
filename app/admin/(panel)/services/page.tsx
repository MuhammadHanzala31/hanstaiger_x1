import { listServicesWithOptions } from "@/lib/admin/queries";
import { formatEUR } from "@/lib/money";
import {
  addService,
  deleteService,
  addOption,
  updateOption,
  deleteOption,
} from "./actions";

interface OptionRow {
  id: string;
  name: string;
  price: number;
  sort_order: number;
}
interface ServiceRow {
  id: string;
  name: string;
  category: string;
  service_options: OptionRow[];
}

export default async function ServicesPage() {
  const services = (await listServicesWithOptions()) as unknown as ServiceRow[];

  return (
    <div className="max-w-3xl">
      <h1 className="t-h3 mb-1 text-white">Services</h1>
      <p className="t-body3 mb-6 text-grey-400">
        The global catalog. New services are offered on every yacht automatically.
      </p>

      <form action={addService} className="mb-8 flex items-end gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
        <label className="flex flex-1 flex-col gap-1">
          <span className="t-caption3 text-grey-400">New service name</span>
          <input name="name" required className="admin-input" placeholder="e.g. Helicopter transfer" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="t-caption3 text-grey-400">Category</span>
          <input name="category" className="admin-input" placeholder="general" />
        </label>
        <button className="t-button1 rounded-sm bg-orange-400 px-5 py-2 text-white hover:bg-orange-500">
          Add service
        </button>
      </form>

      <div className="flex flex-col gap-6">
        {services.map((s) => {
          const removeService = deleteService.bind(null, s.id);
          const options = [...s.service_options].sort((a, b) => a.sort_order - b.sort_order);
          return (
            <section key={s.id} className="rounded-lg border border-white/10 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="t-h6 text-white">{s.name}</h2>
                  <span className="t-caption3 text-grey-500">{s.category}</span>
                </div>
                <form action={removeService}>
                  <button className="t-caption3 text-grey-500 hover:text-obsession-red">Delete service</button>
                </form>
              </div>

              <div className="flex flex-col gap-2">
                {options.map((o) => {
                  const removeOption = deleteOption.bind(null, o.id);
                  return (
                    <div key={o.id} className="flex items-center gap-2">
                      <form action={updateOption} className="flex flex-1 items-center gap-2">
                        <input type="hidden" name="id" value={o.id} />
                        <input name="name" defaultValue={o.name} className="admin-input flex-1" />
                        <input
                          name="price"
                          type="number"
                          step="0.01"
                          defaultValue={(o.price / 100).toFixed(2)}
                          className="admin-input w-28"
                        />
                        <span className="t-caption3 w-20 text-grey-500">{formatEUR(o.price)}</span>
                        <button className="t-caption3 text-grey-400 hover:text-white">Save</button>
                      </form>
                      <form action={removeOption}>
                        <button className="t-caption3 text-grey-500 hover:text-obsession-red">Remove</button>
                      </form>
                    </div>
                  );
                })}
              </div>

              <form action={addOption} className="mt-4 flex items-end gap-2 border-t border-white/10 pt-4">
                <input type="hidden" name="service_id" value={s.id} />
                <label className="flex flex-1 flex-col gap-1">
                  <span className="t-caption3 text-grey-400">New option</span>
                  <input name="name" required className="admin-input" placeholder="e.g. Half day" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="t-caption3 text-grey-400">Price (€)</span>
                  <input name="price" type="number" step="0.01" className="admin-input w-28" />
                </label>
                <button className="t-button2 rounded-sm border border-white/20 px-3 py-2 text-grey-200 hover:bg-white/10">
                  Add option
                </button>
              </form>
            </section>
          );
        })}
      </div>
    </div>
  );
}
