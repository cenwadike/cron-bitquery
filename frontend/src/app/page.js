import Image from "next/image";
import IntervalForm from "./components/IntervalForm";
import TransactionTable from "./components/TransactionTable";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <IntervalForm />
        </div>
        <div className="min-h-screen bg-white dark:bg-gray-900">
          <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Transactions</h1>
            <TransactionTable />
          </div>
        </div>
      </main>
    </div>
  );
}
