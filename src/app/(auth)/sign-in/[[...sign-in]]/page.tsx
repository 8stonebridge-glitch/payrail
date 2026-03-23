import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-lg font-bold">
              PR
            </div>
            <h1 className="text-2xl font-semibold text-white">Payrail</h1>
          </div>
          <p className="text-sm text-slate-400">
            Approval & Disbursement Platform
          </p>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
