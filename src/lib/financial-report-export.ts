import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { triggerDownload } from "@/lib/table-export";
import { monthLabel, periodLabel } from "@/lib/report-periods";
import type {
  FinancialReport,
  MemberStatement,
} from "@/services/report.service";

const fileRange = (r: { from: string; to: string }) => `${r.from}_to_${r.to}`;
const par30 = (r: FinancialReport) =>
  r.loans.outstandingBalance
    ? r.loans.par30Amount / r.loans.outstandingBalance
    : 0;
const share = (value: number, total: number) =>
  total ? +((value / total) * 100).toFixed(1) : 0;

/** Every table in the report as rows — shared by Excel and PDF so both carry the same figures. */
function tables(r: FinancialReport) {
  const savingsTotal = r.members.reduce((sum, m) => sum + m.closing, 0);
  return {
    summary: [
      ["Report period", periodLabel(r)],
      ["Co-operative", r.cooperativeName],
      ["Currency", r.currency],
      ["Generated", new Date(r.generatedAt).toLocaleString("en-GB")],
      [],
      ["SAVINGS (period)"],
      ["Opening balance", r.savings.openingBalance],
      ["Deposits", r.savings.deposits],
      ["Number of deposits", r.savings.depositCount],
      ["Withdrawals", r.savings.withdrawals],
      [
        "Charges and withdrawal fees",
        r.income.savingsCharges + r.income.withdrawalFees,
      ],
      ["Closing balance", r.savings.closingBalance],
      ["Lent from savings (Within loans)", r.savings.withinLoanDebits],
      ["Returned to savings (Within loans)", r.savings.withinLoanCredits],
      [],
      ["LOANS (period)"],
      ["Applications", r.loans.applications],
      ["Amount requested", r.loans.appliedAmount],
      ["Fully approved", r.loans.approved],
      ["Paid out (count)", r.loans.paidOut],
      ["Paid out (amount)", r.loans.principalPaidOut],
      ["Rejected", r.loans.rejected],
      ["Repayments collected", r.loans.repaymentsCollected],
      ["Number of repayments", r.loans.repaymentCount],
      [],
      ["LOANS (today)"],
      ["Active loans", r.loans.activeLoans],
      ["Outstanding", r.loans.outstandingBalance],
      [
        "Over 30 days late (share of outstanding)",
        `${(par30(r) * 100).toFixed(1)}%`,
      ],
      [],
      ["INCOME (period)"],
      ["Interest earned", r.income.interestEarned],
      ["Loan application fees", r.income.applicationFees],
      ["Loan charges", r.income.loanCharges],
      ["Savings charges", r.income.savingsCharges],
      ["Withdrawal fees", r.income.withdrawalFees],
      ["Total income", r.income.total],
    ] as (string | number)[][],
    monthly: [
      [
        "Month",
        "Deposits",
        "Withdrawals",
        "Loans paid out",
        "Repayments",
        "Income",
        "Savings balance",
      ],
      ...r.monthly.map((m) => [
        monthLabel(m.month),
        m.deposits,
        m.withdrawals,
        m.loansPaidOut,
        m.repayments,
        m.income,
        m.closingBalance,
      ]),
    ],
    savers: [
      [
        "Membership ID",
        "Name",
        "Opening",
        "Deposits",
        "Withdrawals",
        "Charges",
        "Closing",
        "Share %",
      ],
      ...r.members.map((m) => [
        m.memberId,
        m.name,
        m.opening,
        m.deposits,
        m.withdrawals,
        m.charges,
        m.closing,
        share(m.closing, savingsTotal),
      ]),
    ],
    types: [
      [
        "Loan type",
        "Months",
        "Interest",
        "Applications",
        "Paid out",
        "Repaid",
        "Interest earned",
        "Outstanding (today)",
        "Overdue (today)",
      ],
      ...r.byLoanType.map((t) => [
        t.loanType,
        t.months,
        t.interestType === "NoInterest" || !t.interestType
          ? "None"
          : t.interestType === "Fixed"
            ? t.interestAmount
            : `${t.interestAmount}%`,
        t.applications,
        t.principal,
        t.repaid,
        t.interest,
        t.outstanding,
        t.overdue,
      ]),
    ],
    ageing: [
      ["Days late", "Loans", "Outstanding"],
      ...r.ageing.map((b) => [b.name, b.count, b.amount]),
    ],
    overdue: [
      [
        "Membership ID",
        "Name",
        "Loan type",
        "Days late",
        "Instalments missed",
        "Past due",
        "Outstanding",
        "First missed due date",
      ],
      ...r.overdue.map((o) => [
        o.memberId,
        o.memberName,
        o.loanType,
        o.daysLate,
        o.overdueInstallments,
        o.amountDue,
        o.outstanding,
        o.oldestDueDate ?? "",
      ]),
    ],
    members: [
      [
        "Membership ID",
        "Name",
        "Role",
        "Savings",
        "Deposited in period",
        "Owes on loans",
        "On-time repayments %",
        "Attendance %",
        "Last activity",
      ],
      ...r.members.map((m) => [
        m.memberId,
        m.name,
        m.role,
        m.closing,
        m.deposits,
        m.outstanding,
        m.onTimeRate ?? "",
        m.attendanceRate ?? "",
        m.lastActivity ?? "",
      ]),
    ],
  };
}

export function exportFinancialReportExcel(r: FinancialReport) {
  const t = tables(r);
  const workbook = XLSX.utils.book_new();
  const sheet = (rows: (string | number)[][], widths: number[]) => {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = widths.map((wch) => ({ wch }));
    return ws;
  };
  XLSX.utils.book_append_sheet(workbook, sheet(t.summary, [40, 26]), "Summary");
  XLSX.utils.book_append_sheet(
    workbook,
    sheet(t.monthly, [10, 14, 14, 16, 14, 12, 16]),
    "Month by month",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    sheet(t.savers, [14, 24, 14, 14, 14, 12, 14, 9]),
    "Savings by member",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    sheet(t.types, [22, 8, 10, 12, 14, 14, 14, 18, 16]),
    "Loans by type",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    sheet([...t.ageing, [], ...t.overdue], [20, 24, 18, 10, 18, 14, 14, 20]),
    "Overdue",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    sheet(t.members, [14, 24, 14, 14, 18, 14, 20, 12, 14]),
    "Members",
  );
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  triggerDownload(
    new Blob([buffer], { type: "application/octet-stream" }),
    `tcoop-report-${fileRange(r)}.xlsx`,
  );
}

/** A4 PDF helper: title, label/value lists and tables, with page footers. */
function pdfWriter(
  title: string,
  sub: string,
  orgName: string,
  currency: string,
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 44;
  let y = M;
  // jsPDF's built-in fonts can't draw currency symbols like ₦, so amounts carry the code.
  const money = (value: number) =>
    `${currency} ${Math.round(value).toLocaleString("en-NG")}`;
  const need = (h: number) => {
    if (y + h > H - M) {
      doc.addPage();
      y = M;
    }
  };
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(23, 33, 29);
  doc.text(title, M, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(91, 103, 97);
  doc.text(`${orgName} · ${sub}`, M, y);
  doc.setDrawColor(229, 234, 231);
  doc.line(M, y + 14, W - M, y + 14);
  y += 34;

  return {
    doc,
    money,
    heading(text: string) {
      need(40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(23, 33, 29);
      doc.text(text, M, y);
      y += 16;
    },
    pairs(list: [string, string, boolean?][]) {
      doc.setFontSize(10);
      list.forEach(([label, value, bold]) => {
        need(16);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setTextColor(bold ? 23 : 91, bold ? 33 : 103, bold ? 29 : 97);
        doc.text(label, M, y);
        doc.setTextColor(23, 33, 29);
        doc.text(value, W - M, y, { align: "right" });
        y += 15;
      });
      y += 8;
    },
    table(head: string[], body: (string | number)[][], numericFrom = 1) {
      need(40);
      autoTable(doc, {
        startY: y - 6,
        margin: { left: M, right: M },
        head: [head],
        body: body.map((row) => row.map(String)),
        theme: "plain",
        styles: { fontSize: 9, textColor: [23, 33, 29], cellPadding: 5 },
        headStyles: {
          fillColor: [244, 246, 245],
          textColor: [91, 103, 97],
          fontStyle: "bold",
          fontSize: 8,
        },
        bodyStyles: { lineColor: [236, 240, 238], lineWidth: { bottom: 0.5 } },
        columnStyles: Object.fromEntries(
          head.map((_, i) => [
            i,
            { halign: i >= numericFrom ? "right" : "left" },
          ]),
        ),
      });
      y =
        (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
          .finalY + 22;
    },
    finish(filename: string) {
      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(139, 150, 144);
        doc.text(
          `Generated ${new Date().toLocaleString("en-GB")} · Outstanding and overdue figures are as of the day generated`,
          M,
          H - 24,
        );
        doc.text(`Page ${i} of ${pages}`, W - M, H - 24, { align: "right" });
      }
      doc.save(filename);
    },
  };
}

export function exportFinancialReportPdf(r: FinancialReport) {
  const p = pdfWriter(
    "Financial report",
    periodLabel(r),
    r.cooperativeName,
    r.currency,
  );
  const N = p.money;
  p.heading("Savings");
  p.pairs([
    ["Opening balance", N(r.savings.openingBalance)],
    ["Deposits", N(r.savings.deposits)],
    ["Withdrawals", N(r.savings.withdrawals)],
    [
      "Charges and withdrawal fees",
      N(r.income.savingsCharges + r.income.withdrawalFees),
    ],
    ["Closing balance", N(r.savings.closingBalance), true],
  ]);
  p.heading("Loans");
  p.pairs([
    ["Applications", String(r.loans.applications)],
    [
      "Paid out",
      `${N(r.loans.principalPaidOut)} (${r.loans.paidOut} ${r.loans.paidOut === 1 ? "loan" : "loans"})`,
    ],
    ["Rejected", String(r.loans.rejected)],
    ["Repayments collected", N(r.loans.repaymentsCollected)],
    ["Outstanding today", N(r.loans.outstandingBalance), true],
    ["Over 30 days late (today)", `${(par30(r) * 100).toFixed(1)}%`],
  ]);
  p.heading("Income");
  p.pairs([
    ["Interest earned", N(r.income.interestEarned)],
    ["Loan application fees", N(r.income.applicationFees)],
    ...(r.income.loanCharges
      ? [["Loan charges", N(r.income.loanCharges)] as [string, string]]
      : []),
    ["Savings charges", N(r.income.savingsCharges)],
    ["Withdrawal fees", N(r.income.withdrawalFees)],
    ["Total income", N(r.income.total), true],
  ]);
  p.heading("Month by month");
  p.table(
    ["Month", "Deposits", "Withdrawals", "Paid out", "Repaid", "Income"],
    r.monthly.map((m) => [
      monthLabel(m.month),
      N(m.deposits),
      N(m.withdrawals),
      N(m.loansPaidOut),
      N(m.repayments),
      N(m.income),
    ]),
  );
  p.heading("Loans by type");
  p.table(
    ["Type", "Paid out", "Repaid", "Interest", "Outstanding"],
    r.byLoanType.map((t) => [
      t.loanType,
      N(t.principal),
      N(t.repaid),
      N(t.interest),
      N(t.outstanding),
    ]),
  );
  if (r.overdue.length) {
    p.heading("Overdue loans (today)");
    p.table(
      ["Member", "Loan type", "Days late", "Past due", "Outstanding"],
      r.overdue.map((o) => [
        o.memberName,
        o.loanType,
        o.daysLate,
        N(o.amountDue),
        N(o.outstanding),
      ]),
      2,
    );
  }
  p.heading("Savings by member");
  p.table(
    ["Member", "Opening", "Deposits", "Withdrawals", "Closing"],
    r.members.map((m) => [
      m.name,
      N(m.opening),
      N(m.deposits),
      N(m.withdrawals),
      N(m.closing),
    ]),
  );
  p.finish(`tcoop-report-${fileRange(r)}.pdf`);
}

/* ---------------- One member's statement ---------------- */

export function exportStatementCsv(s: MemberStatement) {
  const rows: (string | number)[][] = [
    ["Date", "Type", "Details", "Amount", "Balance"],
    ...s.savingsRows.map((row) => [
      row.date,
      row.type,
      row.details,
      row.amount,
      row.balance,
    ]),
    [],
    ["Loan activity"],
    ["Date", "Details", "Amount"],
    ...s.loanRows.map((row) => [row.date, row.details, row.amount]),
  ];
  const csv = XLSX.utils.sheet_to_csv(XLSX.utils.aoa_to_sheet(rows));
  triggerDownload(
    new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }),
    `statement-${s.memberId}-${fileRange(s)}.csv`,
  );
}

export function exportStatementPdf(s: MemberStatement, orgName: string) {
  const p = pdfWriter(
    `Member statement — ${s.memberName}`,
    `${s.memberId} · ${periodLabel(s)}`,
    orgName,
    s.currency,
  );
  const N = p.money;
  p.pairs([
    ["Opening savings", N(s.opening)],
    ["Closing savings", N(s.closing), true],
    ["Owes on loans today", N(s.owesToday)],
  ]);
  p.heading("Savings");
  p.table(
    ["Date", "Type", "Details", "Amount", "Balance"],
    s.savingsRows.map((row) => [
      row.date,
      row.type,
      row.details,
      `${row.amount < 0 ? "-" : ""}${N(Math.abs(row.amount))}`,
      N(row.balance),
    ]),
    3,
  );
  if (s.loanRows.length) {
    p.heading("Loan activity");
    p.table(
      ["Date", "Details", "Amount"],
      s.loanRows.map((row) => [
        row.date,
        row.details,
        `${row.amount > 0 ? "Paid out" : "Repaid"} ${N(Math.abs(row.amount))}`,
      ]),
      2,
    );
  }
  p.finish(`statement-${s.memberId}-${fileRange(s)}.pdf`);
}
