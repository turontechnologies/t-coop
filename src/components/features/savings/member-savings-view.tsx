"use client";

import { useMemo, useState } from "react";
import { PiggyBank, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AddSavingsModal } from "@/components/features/savings/add-savings-modal";
import { PaymentSuccessModal } from "@/components/features/savings/payment-success-modal";
import { SavingsRecordsTable } from "@/components/features/savings/savings-records-table";
import { openPaystackCheckout } from "@/lib/paystack";
import { formatNaira } from "@/lib/format";
import { useSavingsStore } from "@/store/savings.store";

interface MemberSavingsViewProps {
  memberId: string;
  memberName: string;
  memberEmail: string;
  heading?: string;
}

export function MemberSavingsView({
  memberId,
  memberName,
  memberEmail,
  heading = "My Savings Record",
}: MemberSavingsViewProps) {
  const records = useSavingsStore((state) => state.records);
  const addRecord = useSavingsStore((state) => state.addRecord);

  const memberRecords = useMemo(
    () => records.filter((record) => record.memberId === memberId),
    [records, memberId],
  );
  const total = useMemo(
    () => memberRecords.reduce((sum, record) => sum + record.amount, 0),
    [memberRecords],
  );

  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [lastAmount, setLastAmount] = useState(0);

  const handleProceed = async (savingsType: string, amount: number) => {
    setBusy(true);
    try {
      await openPaystackCheckout({
        email: memberEmail,
        amountNaira: amount,
        reference: `TCOOP-${Date.now()}`,
        onSuccess: (reference) => {
          addRecord({
            id: reference,
            memberId,
            memberName,
            savingsType,
            amount,
            balanceAfter: total + amount,
            method: "Paystack",
            transactionId: reference,
            date: new Date().toISOString().slice(0, 10),
            status: "Success",
          });
          setAddOpen(false);
          setLastAmount(amount);
          setSuccessOpen(true);
        },
        onClose: () => setBusy(false),
      });
    } catch (error) {
      toast.error("Couldn't start payment", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Quick Summary</h2>
        <Button onClick={() => setAddOpen(true)}>+ New Savings</Button>
      </div>

      <Card className="max-w-xs">
        <CardContent className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">My Savings</p>
            <p className="text-xl font-semibold text-foreground sm:text-2xl">
              {formatNaira(total)}
            </p>
          </div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <PiggyBank className="size-5" aria-hidden="true" />
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">{heading}</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.info("Coming soon", {
                  description: "Export/import isn't wired up yet.",
                })
              }
            >
              <Upload className="size-3.5" aria-hidden="true" />
              Export / Import
            </Button>
          </div>
          <SavingsRecordsTable records={memberRecords} />
        </CardContent>
      </Card>

      <AddSavingsModal
        open={addOpen}
        onOpenChange={setAddOpen}
        busy={busy}
        onProceed={handleProceed}
      />
      <PaymentSuccessModal
        open={successOpen}
        onOpenChange={setSuccessOpen}
        amount={lastAmount}
      />
    </div>
  );
}
