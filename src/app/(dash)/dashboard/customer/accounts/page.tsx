import AccountsView from "@/components/dashboard/customer/AccountsView";

export default function CustomerAllAccPage() {
  return (
    <AccountsView>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-400">
        Overview
      </p>
      <h1 className="text-3xl font-bold tracking-tight text-black">
        My Accounts
      </h1>
    </AccountsView>
  );
}
