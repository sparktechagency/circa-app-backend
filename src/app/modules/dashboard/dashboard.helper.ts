type DateRangeType = "week" | "month" | "year";

function getCurrentDateRange(type: DateRangeType) {
  const now = new Date();

  let startDate: Date | null = null;
  let endDate: Date | null = null;
  let dates: number[] = [];

  if (type === "week") {
    const day = now.getDay(); // 0 (Sun) - 6 (Sat)
    const diffToMonday = day === 0 ? -6 : 1 - day;

    startDate = new Date(now);
    startDate.setDate(now.getDate() + diffToMonday);
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);
    endDate.setHours(23, 59, 59, 999);

    for (let i = 0; i < 8; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      dates.push(d.getDate());
    }
  }

  if (type === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);
  }

  if (type === "year") {
    startDate = new Date(now.getFullYear(), 0, 1);
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(now.getFullYear(), 11, 31);
    endDate.setHours(23, 59, 59, 999);
  }

  if (!startDate || !endDate) {
    throw new Error("Invalid date range type");
  }

  return {
    startDate,
    endDate,
    dates, // filled only for week
  };
}


export const DashboardHelper = { getCurrentDateRange };