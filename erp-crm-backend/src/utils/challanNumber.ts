import prisma from "../config/prisma";

/**
 * Generates the next sequential challan number for the current year.
 * Format: CH-YYYY-NNNN  (e.g. CH-2026-0001)
 * Must be called inside a transaction to be race-condition safe.
 */
export async function generateChallanNumber(
  tx: Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CH-${year}-`;

  // Find the highest existing number for this year
  const last = await tx.challan.findFirst({
    where: { challanNumber: { startsWith: prefix } },
    orderBy: { challanNumber: "desc" },
    select: { challanNumber: true },
  });

  let nextSeq = 1;
  if (last) {
    const parts = last.challanNumber.split("-");
    nextSeq = parseInt(parts[2], 10) + 1;
  }

  return `${prefix}${String(nextSeq).padStart(4, "0")}`;
}
