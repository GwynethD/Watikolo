import { Button } from '@/components/ui/Button';
import { InputField, TextAreaField } from '@/components/ui/FormField';

export function CustomerProfilePage() {
  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <h1 className="text-3xl font-semibold text-ink">Profile settings</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">A frontend-ready profile page where customer identity and contact preferences can later sync with backend user records.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
        <div className="panel p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <InputField label="First name" defaultValue="Sophia" />
            <InputField label="Last name" defaultValue="Reyes" />
            <InputField label="Email" type="email" defaultValue="sophia@example.com" />
            <InputField label="Phone number" defaultValue="0917 555 1824" />
            <div className="md:col-span-2">
              <TextAreaField label="Address" defaultValue="Tagum City, Davao del Norte" />
            </div>
            <div className="md:col-span-2">
              <TextAreaField label="Event preferences" defaultValue="Usually books elegant indoor venues for weddings and family celebrations." />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button>Save changes</Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel p-6">
            <h2 className="text-2xl font-semibold text-ink">Profile completion</h2>
            <div className="mt-5 rounded-full bg-slate-100 p-2">
              <div className="h-3 w-[82%] rounded-full bg-gold-500" />
            </div>
            <p className="mt-3 text-sm text-slate-500">82% complete. Add billing preferences and backup contact details next.</p>
          </div>
          <div className="rounded-[2rem] bg-ink p-6 text-white shadow-soft">
            <p className="text-sm uppercase tracking-[0.22em] text-gold-300">Future integration</p>
            <h3 className="mt-3 text-2xl font-semibold">Authentication and profile APIs can plug in here later.</h3>
            <p className="mt-4 text-sm leading-7 text-slate-300">The current form structure already separates presentation from service concerns, making backend hookup straightforward.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
