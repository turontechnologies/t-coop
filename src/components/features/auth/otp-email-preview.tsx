import { LogoMark } from "@/components/brand/logo-mark";

interface OtpEmailPreviewProps {
  name: string;
  otp: string;
}

export function OtpEmailPreview({ name, otp }: OtpEmailPreviewProps) {
  const firstName = name.trim().split(/\s+/)[0] ?? name;

  return (
    <div className="overflow-hidden rounded-2xl bg-white text-slate-900 shadow-sm ring-1 ring-black/5">
      <div className="bg-[linear-gradient(160deg,#00654A_0%,#00543D_45%,#003224_100%)] px-6 py-8 text-center">
        <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-white/10">
          <LogoMark className="size-6 text-white" />
        </span>
        <p className="mt-3 text-sm font-semibold tracking-wide text-white">
          T-Cooperative
        </p>
      </div>

      <div className="space-y-5 px-6 py-7 sm:px-8">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase">
            Secure access
          </p>
          <h3 className="text-lg font-semibold text-slate-900">
            Your one-time password
          </h3>
        </div>

        <p className="text-sm leading-relaxed text-slate-600">
          Hi {firstName}, we received a request to verify your identity. Use the
          code below to continue — it&apos;s only valid for a few minutes.
        </p>

        <div className="flex justify-center gap-1.5 sm:gap-2">
          {otp.split("").map((digit, index) => (
            <span
              key={index}
              className="flex size-10 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-lg font-bold text-emerald-800 tabular-nums sm:size-11 sm:text-xl"
            >
              {digit}
            </span>
          ))}
        </div>

        <p className="text-center text-xs text-slate-500">
          This code expires in 10 minutes. If you didn&apos;t request this, you
          can safely ignore this email.
        </p>

        <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
          Need help?{" "}
          <a
            href="mailto:support@turon.tech"
            className="font-medium text-emerald-700 hover:underline"
          >
            Contact our support team
          </a>
        </div>
      </div>
    </div>
  );
}
