import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { triggerDownload } from "@/lib/table-export";
import type { FinancialReport } from "@/services/report.service";

/** The report's headline figures as label/value rows — shared by the Excel and PDF exports so
 * both always carry the same numbers as the page. */
function summaryRows(report: FinancialReport): [string, string, number][] {
  const { savings, loans, income } = report;
  return [
    ["Savings", "Deposits", savings.deposits],
    ["Savings", "Withdrawals", savings.withdrawals],
    ["Savings", "Taken for Within loans", savings.withinLoanDebits],
    ["Savings", "Returned from Within loans", savings.withinLoanCredits],
    ["Savings", "Net change", savings.netChange],
    ["Savings", "Total savings at period end", savings.closingBalance],
    ["Loans", "Applications", loans.applications],
    ["Loans", "Loans paid out", loans.paidOut],
    ["Loans", "Principal paid out", loans.principalPaidOut],
    ["Loans", "Paid to members (after charges)", loans.netPaidOut],
    ["Loans", "Rejected", loans.rejected],
    ["Loans", "Repayments collected", loans.repaymentsCollected],
    ["Loans", "Active loans (today)", loans.activeLoans],
    ["Loans", "Outstanding balance (today)", loans.outstandingBalance],
    ["Loans", "Overdue loans (today)", loans.overdueLoans],
    ["Loans", "Overdue outstanding (today)", loans.overdueOutstanding],
    ["Income", "Interest earned", income.interestEarned],
    ["Income", "Loan charges", income.loanCharges],
    ["Income", "Savings charges", income.savingsCharges],
    ["Income", "Withdrawal fees", income.withdrawalFees],
    ["Income", "Total income", income.total],
  ];
}

function fileBase(report: FinancialReport) {
  return `${report.cooperativeId}-financial-report-${report.from}-to-${report.to}`;
}

export function exportFinancialReportExcel(report: FinancialReport) {
  const workbook = XLSX.utils.book_new();
  const header = [
    [`${report.cooperativeName} — Financial report`],
    [
      `Period: ${report.from} to ${report.to}`,
      "",
      `Currency: ${report.currency}`,
    ],
    [],
  ];
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ...header,
      ["Section", "Item", "Amount / count"],
      ...summaryRows(report),
    ]),
    "Summary",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ["Month", "Deposits", "Withdrawals", "Loans paid out", "Repayments"],
      ...report.monthly.map((m) => [
        m.month,
        m.deposits,
        m.withdrawals,
        m.loansPaidOut,
        m.repayments,
      ]),
    ]),
    "Monthly",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ["Loan type", "Loans paid out", "Principal", "Repaid", "Outstanding"],
      ...report.byLoanType.map((t) => [
        t.loanType,
        t.loansPaidOut,
        t.principal,
        t.repaid,
        t.outstanding,
      ]),
    ]),
    "By loan type",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      [
        "Member ID",
        "Member",
        "Loan type",
        "Outstanding",
        "Installments overdue",
        "Overdue since",
      ],
      ...report.overdue.map((o) => [
        o.memberId,
        o.memberName,
        o.loanType,
        o.outstanding,
        o.overdueInstallments,
        o.oldestDueDate ?? "",
      ]),
    ]),
    "Overdue loans",
  );
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  triggerDownload(
    new Blob([buffer], { type: "application/octet-stream" }),
    `${fileBase(report)}.xlsx`,
  );
}

export function exportFinancialReportPdf(report: FinancialReport) {
  // jsPDF's built-in fonts can't draw currency symbols like ₦, so amounts carry the ISO code.
  const amount = (value: number) =>
    `${report.currency} ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const isCount = (item: string) =>
    [
      "Applications",
      "Loans paid out",
      "Rejected",
      "Active loans (today)",
      "Overdue loans (today)",
    ].includes(item);

  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(`${report.cooperativeName} — Financial report`, 14, 16);
  doc.setFontSize(9);
  doc.text(
    `Period: ${report.from} to ${report.to}   ·   Generated ${report.generatedAt.slice(0, 10)}`,
    14,
    22,
  );

  const theme = {
    styles: { fontSize: 8.5 },
    headStyles: { fillColor: [15, 76, 60] as [number, number, number] },
  };
  autoTable(doc, {
    ...theme,
    startY: 27,
    head: [["Section", "Item", "Amount"]],
    body: summaryRows(report).map(([section, item, value]) => [
      section,
      item,
      isCount(item) ? String(value) : amount(value),
    ]),
  });
  const after = () =>
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 8;

  autoTable(doc, {
    ...theme,
    startY: after(),
    head: [
      ["Month", "Deposits", "Withdrawals", "Loans paid out", "Repayments"],
    ],
    body: report.monthly.map((m) => [
      m.month,
      amount(m.deposits),
      amount(m.withdrawals),
      amount(m.loansPaidOut),
      amount(m.repayments),
    ]),
  });
  if (report.byLoanType.length > 0) {
    autoTable(doc, {
      ...theme,
      startY: after(),
      head: [["Loan type", "Paid out", "Principal", "Repaid", "Outstanding"]],
      body: report.byLoanType.map((t) => [
        t.loanType,
        String(t.loansPaidOut),
        amount(t.principal),
        amount(t.repaid),
        amount(t.outstanding),
      ]),
    });
  }
  autoTable(doc, {
    ...theme,
    startY: after(),
    head: [
      [
        "Overdue loans",
        "Loan type",
        "Outstanding",
        "Installments overdue",
        "Overdue since",
      ],
    ],
    body:
      report.overdue.length === 0
        ? [["None", "", "", "", ""]]
        : report.overdue.map((o) => [
            `${o.memberName} (${o.memberId})`,
            o.loanType,
            amount(o.outstanding),
            String(o.overdueInstallments),
            o.oldestDueDate ?? "",
          ]),
  });
  doc.save(`${fileBase(report)}.pdf`);
}
