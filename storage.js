const DEMO_MODE = true;
const DEMO_DATA_URL = "demo-data.json";

const DEFAULT_SETTINGS = {
  language: "hu",
  companyName: "ShiftPoint Demo Kft.",
  dailyNormMinutes: 480,
  lunchBreakMinutes: 30,
  companyDays: [],
  overtimeHourlyRate: 50,
  mealVoucherDailyValue: 40,
  storageMode: "demo"
};

let demoReferenceDateKey = "2026-06-30";

async function initializeStorage() {
  const response = await fetch(DEMO_DATA_URL, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`A demóadatok nem tölthetők be (${response.status}).`);
  }

  const demoData = await response.json();
  validateDemoData(demoData);

  demoReferenceDateKey = demoData.demoReferenceDate || demoReferenceDateKey;
  appSettings = cloneDemoValue({ ...DEFAULT_SETTINGS, ...demoData.settings, storageMode: "demo" });
  employees = cloneDemoValue(demoData.employees);
  absenceRecords = buildDemoAbsences(demoData.absencePlans || []);
  vacationAllowances = cloneDemoValue(demoData.vacationAllowances || []);
  attendanceEvents = buildDemoAttendanceEvents(demoData);
}

function validateDemoData(demoData) {
  if (!demoData || !Array.isArray(demoData.employees)) {
    throw new Error("A demo-data.json employees mezője hiányzik.");
  }

  if (!demoData.generation || !demoData.generation.startDate || !demoData.generation.endDate) {
    throw new Error("A demo-data.json generation időszaka hiányzik.");
  }
}

function buildDemoAttendanceEvents(demoData) {
  const events = [];
  const absencePlans = demoData.absencePlans || [];
  const companyDays = demoData.settings && Array.isArray(demoData.settings.companyDays)
    ? demoData.settings.companyDays
    : [];
  const startDate = parseDemoDateKey(demoData.generation.startDate);
  const endDate = parseDemoDateKey(demoData.generation.endDate);

  demoData.employees.forEach((employee, employeeIndex) => {
    const cursor = new Date(startDate);

    while (cursor <= endDate) {
      const dateKey = formatDemoDateKey(cursor);
      const isWeekend = cursor.getDay() === 0 || cursor.getDay() === 6;
      const isAbsent = absencePlans.some((plan) => (
        plan.employeeId === employee.id && dateKey >= plan.startDate && dateKey <= plan.endDate
      ));
      const isCompanyDayOff = companyDays.some((day) => (
        dateKey >= day.startDate && dateKey <= day.endDate
      ));
      const worksOnCompanyDayOff = employee.id === "EMP-001" && dateKey === "2026-06-01";

      if (!isWeekend && !isAbsent && (!isCompanyDayOff || worksOnCompanyDayOff)) {
        addGeneratedWorkday(events, employee, employeeIndex, dateKey);
      }

      cursor.setDate(cursor.getDate() + 1);
    }
  });

  return events.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

function addGeneratedWorkday(events, employee, employeeIndex, dateKey) {
  const pattern = employee.demoPattern || {};
  const dayNumber = Number(dateKey.slice(-2));
  const arrivalBase = parseDemoTime(pattern.arrival || "07:30");
  const variation = ((dayNumber + employeeIndex * 2) % 11) - 5;
  const arrivalMinutes = arrivalBase + variation;
  const overtimeCycle = [0, 15, -20, 35, 5, -10];
  const durationMinutes = Number(pattern.durationMinutes || 510) + overtimeCycle[(dayNumber + employeeIndex) % overtimeCycle.length];

  if (employee.id === "EMP-003" && dateKey === "2026-06-12") {
    addDemoEvent(events, employee, dateKey, arrivalMinutes, "in", "QR-kód");
    addDemoEvent(events, employee, dateKey, arrivalMinutes + 210, "out", "QR-kód");
    addDemoEvent(events, employee, dateKey, arrivalMinutes + 260, "in", "QR-kód");
    addDemoEvent(events, employee, dateKey, arrivalMinutes + 560, "out", "QR-kód");
    return;
  }

  addDemoEvent(events, employee, dateKey, arrivalMinutes, "in", "QR-kód");

  const isOpenDemoDay = dateKey === demoReferenceDateKey && employee.id === "EMP-002";
  if (!isOpenDemoDay) {
    addDemoEvent(events, employee, dateKey, arrivalMinutes + durationMinutes, "out", "QR-kód");
  }
}

function addDemoEvent(events, employee, dateKey, minuteOfDay, type, source) {
  const createdAt = buildDemoTimestamp(dateKey, minuteOfDay);
  events.push({
    id: `DEMO-${employee.id}-${dateKey}-${type}-${String(minuteOfDay)}`,
    employeeId: employee.id,
    employeeName: employee.name,
    department: employee.department,
    type,
    createdAt,
    timeValue: formatDemoTime(minuteOfDay),
    source,
    dateKey
  });
}

function buildDemoAbsences(absencePlans) {
  return absencePlans.map((plan, index) => ({
    id: `DEMO-ABS-${String(index + 1).padStart(3, "0")}`,
    employeeId: plan.employeeId,
    employeeName: plan.employeeName,
    department: plan.department,
    startDate: plan.startDate,
    endDate: plan.endDate,
    type: plan.type,
    note: plan.note || "",
    createdAt: `${plan.startDate}T08:00:00.000Z`,
    updatedAt: `${plan.startDate}T08:00:00.000Z`
  }));
}

function parseDemoDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function formatDemoDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDemoTime(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function buildDemoTimestamp(dateKey, minuteOfDay) {
  const date = parseDemoDateKey(dateKey);
  date.setHours(Math.floor(minuteOfDay / 60), minuteOfDay % 60, 0, 0);
  return date.toISOString();
}

function formatDemoTime(minuteOfDay) {
  const normalizedMinutes = ((minuteOfDay % 1440) + 1440) % 1440;
  const hours = String(Math.floor(normalizedMinutes / 60)).padStart(2, "0");
  const minutes = String(normalizedMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function cloneDemoValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function getDemoReferenceDate() {
  return parseDemoDateKey(demoReferenceDateKey);
}

function loadSettings() {
  return cloneDemoValue(appSettings || DEFAULT_SETTINGS);
}

async function loadSettingsAsync() {
  return loadSettings();
}

function loadEmployees() {
  return cloneDemoValue(employees || []);
}

async function loadEmployeesAsync() {
  return loadEmployees();
}

function loadAttendanceEvents() {
  return cloneDemoValue(attendanceEvents || []);
}

async function loadAttendanceEventsAsync() {
  return loadAttendanceEvents();
}

function loadAbsences() {
  return cloneDemoValue(absenceRecords || []);
}

async function loadAbsencesAsync() {
  return loadAbsences();
}

function loadVacationAllowances() {
  return cloneDemoValue(vacationAllowances || []);
}

async function loadVacationAllowancesAsync() {
  return loadVacationAllowances();
}

function saveSettings() {
  return false;
}

function saveEmployees() {
  return false;
}

function saveAttendanceEvents() {
  return false;
}

function saveAbsences() {
  return false;
}

function saveVacationAllowances() {
  return false;
}

function createAutoBackup() {
  return false;
}

function loadAutoBackup() {
  return null;
}
