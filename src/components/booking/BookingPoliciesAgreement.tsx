type BookingPoliciesAgreementProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  showError?: boolean;
  href?: string;
  inputId?: string;
};

export function BookingPoliciesAgreement({
  checked,
  onCheckedChange,
  showError = false,
  href = '/booking-policies',
  inputId = 'booking-policies-agreement',
}: BookingPoliciesAgreementProps) {
  return (
    <>
      <div className="mt-3 flex items-start gap-3 rounded-[1rem] border border-slate-200 bg-white px-3 py-3 text-sm text-[#0f172a] shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          onChange={(event) => onCheckedChange(event.target.checked)}
          className="mt-1 h-5 w-5 rounded border-slate-300 text-[#1f3fd1] focus:ring-[#1f3fd1]"
        />
        <div className="space-y-2">
          <label htmlFor={inputId} className="block cursor-pointer">
            Please check this box to indicate that you have read and agree to the{' '}
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="font-semibold text-[#0b6ddc] underline underline-offset-4 transition hover:text-[#084f9c]"
            >
              Booking Policies
            </a>
            .
          </label>
          <p className="text-xs text-slate-500">Booking Policies opens in a new tab so your checkout stays here.</p>
        </div>
      </div>
      {showError ? (
        <p className="mt-3 text-sm text-rose-500">Accept the booking policies to enable the final booking confirmation.</p>
      ) : null}
    </>
  );
}
