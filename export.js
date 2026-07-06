function exportDailyPdf() {
  const attendanceDateInput = document.getElementById("attendanceDateInput");

  const selectedDateKey = attendanceDateInput && getDateControlValue(attendanceDateInput)
    ? getDateControlValue(attendanceDateInput)
    : getDateKey(new Date());

  const dayEvents = attendanceEvents
    .filter((event) => event.dateKey === selectedDateKey)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const employeeIds = [...new Set(dayEvents.map((event) => event.employeeId))];

  const summaries = employeeIds.map((employeeId) => {
    const employee = employees.find((item) => item.id === employeeId);
    const firstEvent = dayEvents.find((event) => event.employeeId === employeeId);

    return calculateDailySummary({
      employeeId,
      employeeName: employee ? employee.name : firstEvent.employeeName || "-",
      department: employee ? employee.department || "-" : firstEvent.department || "-",
      dateKey: selectedDateKey
    });
  });

  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    alert(t("print.printError"));
    return;
  }

  const eventsRowsHtml = dayEvents.length === 0
    ? `
      <tr>
        <td colspan="6" class="empty-row">${escapeHtml(t("print.noEvents"))}</td>
      </tr>
    `
    : dayEvents
        .map((event) => {
          const employee = employees.find((item) => item.id === event.employeeId);

          const employeeName = employee
            ? employee.name
            : event.employeeName || "-";

          const department = employee
            ? employee.department || "-"
            : event.department || "-";

          return `
            <tr>
              <td>${escapeHtml(formatTimeFromIso(event.createdAt))}</td>
              <td>${escapeHtml(getAttendanceTypeLabel(event.type))}</td>
              <td><strong>${escapeHtml(event.employeeId)}</strong></td>
              <td>${escapeHtml(employeeName)}</td>
              <td>${escapeHtml(department)}</td>
              <td>${escapeHtml(getAttendanceSourceLabel(event.source))}</td>
            </tr>
          `;
        })
        .join("");

  const summaryRowsHtml = summaries.length === 0
    ? `
      <tr>
        <td colspan="12" class="empty-row">${escapeHtml(t("print.noSummary"))}</td>
      </tr>
    `
    : summaries
        .map((summary) => {
          return `
            <tr>
              <td><strong>${escapeHtml(summary.employeeId)}</strong></td>
              <td>${escapeHtml(summary.employeeName)}</td>
              <td>${escapeHtml(summary.department || "-")}</td>
              <td>${escapeHtml(summary.firstArrival || "-")}</td>
              <td>${escapeHtml(summary.lastDeparture || "-")}</td>
              <td>${escapeHtml(formatDuration(summary.rawWorkedMinutes))}</td>
              <td>${escapeHtml(formatDuration(summary.lunchDeductionMinutes))}</td>
              <td><strong>${escapeHtml(formatDuration(summary.netWorkedMinutes))}</strong></td>
              <td class="balance-positive"><strong>${escapeHtml(formatDuration(summary.overtimeMinutes))}</strong></td>
              <td class="balance-negative"><strong>${escapeHtml(formatDuration(summary.missingMinutes))}</strong></td>
              <td><strong>${escapeHtml(formatSignedDuration(summary.balanceMinutes))}</strong></td>
              <td>${escapeHtml(summary.statusText)}</td>
            </tr>
          `;
        })
        .join("");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>${escapeHtml(t("print.dailyAttendanceTitle"))}</title>

      <style>
        body {
          margin: 0;
          padding: 18px;
          font-family: Arial, sans-serif;
          color: #111827;
          background: white;
          font-size: 12px;
        }

        h1 {
          margin: 0 0 8px;
          text-align: center;
          font-size: 22px;
        }

        h2 {
          margin: 22px 0 8px;
          font-size: 16px;
        }

        .print-header {
          border: 1.5px solid #6b7280;
          padding: 10px;
          margin-bottom: 16px;
        }

        .print-header-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 5px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
        }

        th,
        td {
          border: 1.5px solid #6b7280;
          padding: 6px;
          text-align: left;
          vertical-align: top;
        }

        th {
          background: #e5e7eb;
          font-weight: bold;
        }

        .empty-row {
          text-align: center;
          color: #6b7280;
        }

        .small-text {
          color: #374151;
          font-size: 11px;
        }

        @page {
          size: A4 portrait;
          margin: 10mm;
        }
      </style>
    </head>

    <body>
      <h1>${escapeHtml(t("print.dailyAttendanceTitle"))}</h1>

      <div class="print-header">
        <div class="print-header-row">
          <div>
            <strong>${escapeHtml(t("print.company"))}:</strong>
            ${escapeHtml(appSettings.companyName || "Centru de sticla")}
          </div>

          <div>
            <strong>${escapeHtml(t("attendance.date"))}:</strong>
            ${escapeHtml(formatDisplayDate(selectedDateKey))}
          </div>
        </div>

        <div class="print-header-row small-text">
          <div>
            <strong>${escapeHtml(t("print.generatedAt"))}:</strong>
            ${escapeHtml(formatDisplayDate(getDateKey(new Date())))} ${escapeHtml(formatTimeFromIso(new Date().toISOString()))}
          </div>

          <div>
            <strong>${escapeHtml(t("statistics.employeesWithEvents"))}:</strong>
            ${escapeHtml(String(employeeIds.length))}
          </div>
        </div>
      </div>

      <h2>${escapeHtml(t("print.dailyEvents"))}</h2>

      <table>
        <thead>
          <tr>
            <th>${escapeHtml(t("attendance.time"))}</th>
            <th>${escapeHtml(t("attendance.eventType"))}</th>
            <th>${escapeHtml(t("attendance.code"))}</th>
            <th>${escapeHtml(t("attendance.employee"))}</th>
            <th>${escapeHtml(t("attendance.department"))}</th>
            <th>${escapeHtml(t("attendance.source"))}</th>
          </tr>
        </thead>

        <tbody>
          ${eventsRowsHtml}
        </tbody>
      </table>

      <h2>${escapeHtml(t("print.dailySummary"))}</h2>

      <table>
        <thead>
          <tr>
            <th>${escapeHtml(t("attendance.code"))}</th>
            <th>${escapeHtml(t("attendance.employee"))}</th>
            <th>${escapeHtml(t("attendance.department"))}</th>
            <th>${escapeHtml(t("attendance.firstArrival"))}</th>
            <th>${escapeHtml(t("attendance.lastDeparture"))}</th>
            <th>${escapeHtml(t("attendance.rawWorked"))}</th>
            <th>${escapeHtml(t("attendance.lunchDeduction"))}</th>
            <th>${escapeHtml(t("attendance.netWorked"))}</th>
            <th>${escapeHtml(t("attendance.overtime"))}</th>
            <th>${escapeHtml(t("attendance.missing"))}</th>
            <th>${escapeHtml(t("attendance.balance"))}</th>
            <th>${escapeHtml(t("attendance.dayStatus"))}</th>
          </tr>
        </thead>

        <tbody>
          ${summaryRowsHtml}
        </tbody>
      </table>

      <script>
        window.onload = function () {
          setTimeout(function () {
            window.print();
          }, 500);
        };
      <\/script>
    </body>
    </html>
  `);

  removeHiddenOvertimeFromPrintDocument(printWindow.document);
  printWindow.document.close();
}

function exportDailyXlsx() {
  try {
    const attendanceDateInput = document.getElementById("attendanceDateInput");

    const selectedDateKey = attendanceDateInput && getDateControlValue(attendanceDateInput)
      ? getDateControlValue(attendanceDateInput)
      : getDateKey(new Date());

    const dayEvents = attendanceEvents
      .filter((event) => event.dateKey === selectedDateKey)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const employeeIds = [...new Set(dayEvents.map((event) => event.employeeId))];

    const summaries = employeeIds.map((employeeId) => {
      const employee = employees.find((item) => item.id === employeeId);
      const firstEvent = dayEvents.find((event) => event.employeeId === employeeId);

      return calculateDailySummary({
        employeeId,
        employeeName: employee ? employee.name : firstEvent.employeeName || "-",
        department: employee ? employee.department || "-" : firstEvent.department || "-",
        dateKey: selectedDateKey
      });
    });

    const rows = [];

    rows.push([t("print.dailyAttendanceTitle")]);
    rows.push([t("print.company"), appSettings.companyName || "Centru de sticla"]);
    rows.push([t("attendance.date"), formatDisplayDate(selectedDateKey)]);
    rows.push([
      t("print.generatedAt"),
      `${formatDisplayDate(getDateKey(new Date()))} ${formatTimeFromIso(new Date().toISOString())}`
    ]);
    rows.push([t("statistics.employeesWithEvents"), String(employeeIds.length)]);
    rows.push([]);

    rows.push([t("print.dailyEvents")]);
    rows.push([
      t("attendance.time"),
      t("attendance.eventType"),
      t("attendance.code"),
      t("attendance.employee"),
      t("attendance.department"),
      t("attendance.source")
    ]);

    if (dayEvents.length === 0) {
      rows.push([t("print.noEvents")]);
    } else {
      dayEvents.forEach((event) => {
        const employee = employees.find((item) => item.id === event.employeeId);

        rows.push([
          formatTimeFromIso(event.createdAt),
          getAttendanceTypeLabel(event.type),
          event.employeeId,
          employee ? employee.name : event.employeeName || "-",
          employee ? employee.department || "-" : event.department || "-",
          getAttendanceSourceLabel(event.source)
        ]);
      });
    }

    rows.push([]);
    rows.push([t("print.dailySummary")]);
    rows.push([
      t("attendance.code"),
      t("attendance.employee"),
      t("attendance.department"),
      t("attendance.firstArrival"),
      t("attendance.lastDeparture"),
      t("attendance.rawWorked"),
      t("attendance.lunchDeduction"),
      t("attendance.netWorked"),
      t("attendance.overtime"),
      t("attendance.missing"),
      t("attendance.balance"),
      t("attendance.dayStatus")
    ]);

    if (summaries.length === 0) {
      rows.push([t("print.noSummary")]);
    } else {
      summaries.forEach((summary) => {
        rows.push([
          summary.employeeId,
          summary.employeeName,
          summary.department || "-",
          summary.firstArrival || "-",
          summary.lastDeparture || "-",
          formatDuration(summary.rawWorkedMinutes),
          formatDuration(summary.lunchDeductionMinutes),
          formatDuration(summary.netWorkedMinutes),
          formatDuration(summary.overtimeMinutes),
          formatDuration(summary.missingMinutes),
          formatSignedDuration(summary.balanceMinutes),
          summary.statusText
        ]);
      });
    }

    const fileName = `jelenleti-napi-lista-${selectedDateKey}.xlsx`;
    const xlsxBlob = createSimpleXlsxBlob(rows, t("print.dailyAttendanceTitle"));

    downloadBlobFile(xlsxBlob, fileName);
    alert(t("export.xlsxSaved"));
  } catch (error) {
    console.error("XLSX export hiba:", error);
    alert(t("export.xlsxError"));
  }
}

function createSimpleXlsxBlob(rows, sheetName) {
  const files = buildSimpleXlsxFiles(prepareRowsForOvertimeVisibility(rows), sheetName);
  const zipContent = createZipFile(files);

  return new Blob([zipContent], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
}

function getHiddenOvertimeExportLabels() {
  return new Set([
    t("attendance.overtime"),
    t("payment.overtimeValue"),
    t("payment.overtimeRate"),
    t("statistics.mostOvertime"),
    t("payment.totalPayment")
  ]);
}

function prepareRowsForOvertimeVisibility(rows) {
  if (typeof shouldShowOvertimeData !== "function" || shouldShowOvertimeData()) {
    return rows;
  }

  const labels = getHiddenOvertimeExportLabels();
  let hiddenIndexes = [];

  return rows.reduce((result, row) => {
    const cells = Array.isArray(row) ? row : [];

    if (cells.length === 0) {
      hiddenIndexes = [];
      result.push(cells);
      return result;
    }

    if (cells.length <= 2 && labels.has(String(cells[0] || "").trim())) {
      return result;
    }

    const headerHiddenIndexes = cells
      .map((cell, index) => labels.has(String(cell || "").trim()) ? index : -1)
      .filter((index) => index >= 0);

    if (headerHiddenIndexes.length > 0) {
      hiddenIndexes = headerHiddenIndexes;
    } else if (cells.length === 1) {
      hiddenIndexes = [];
    }

    result.push(cells.filter((cell, index) => !hiddenIndexes.includes(index)));
    return result;
  }, []);
}

function removeHiddenOvertimeFromPrintDocument(printDocument) {
  if (typeof shouldShowOvertimeData !== "function" || shouldShowOvertimeData()) {
    return;
  }

  const labels = getHiddenOvertimeExportLabels();

  printDocument.querySelectorAll("table").forEach((table) => {
    table.querySelectorAll("tr").forEach((row) => {
      const firstCell = row.cells && row.cells[0];
      if (row.cells.length <= 2 && firstCell && labels.has(firstCell.textContent.trim())) {
        row.remove();
      }
    });

    const headers = [...table.querySelectorAll("thead th")];
    const indexes = headers
      .map((cell, index) => labels.has(cell.textContent.trim()) ? index : -1)
      .filter((index) => index >= 0)
      .sort((a, b) => b - a);

    indexes.forEach((index) => {
      table.querySelectorAll("tr").forEach((row) => {
        if (row.cells && row.cells[index]) {
          row.deleteCell(index);
        }
      });
    });
  });
}

function buildSimpleXlsxFiles(rows, sheetName) {
  const safeSheetName = String(sheetName || "Sheet1")
    .replace(/[\\/?*\[\]:]/g, " ")
    .slice(0, 31) || "Sheet1";

  return [
    {
      path: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`
    },
    {
      path: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
    },
    {
      path: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${escapeXmlValue(safeSheetName)}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`
    },
    {
      path: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
    },
    {
      path: "xl/styles.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`
    },
    {
      path: "xl/worksheets/sheet1.xml",
      content: buildWorksheetXml(rows)
    }
  ];
}

function buildWorksheetXml(rows) {
  const rowsXml = rows
    .map((row, rowIndex) => {
      const rowNumber = rowIndex + 1;
      const cellsXml = row
        .map((cellValue, columnIndex) => {
          return buildWorksheetCell(cellValue, rowNumber, columnIndex + 1);
        })
        .join("");

      return `<row r="${rowNumber}">${cellsXml}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
    <col min="1" max="10" width="20" customWidth="1"/>
  </cols>
  <sheetData>${rowsXml}</sheetData>
</worksheet>`;
}

function buildWorksheetCell(value, rowNumber, columnNumber) {
  const cellReference = `${getExcelColumnName(columnNumber)}${rowNumber}`;
  const cellText = escapeXmlValue(value === null || value === undefined ? "" : value);

  return `<c r="${cellReference}" t="inlineStr"><is><t xml:space="preserve">${cellText}</t></is></c>`;
}

function getExcelColumnName(columnNumber) {
  let columnName = "";
  let currentNumber = columnNumber;

  while (currentNumber > 0) {
    const remainder = (currentNumber - 1) % 26;
    columnName = String.fromCharCode(65 + remainder) + columnName;
    currentNumber = Math.floor((currentNumber - 1) / 26);
  }

  return columnName;
}

function escapeXmlValue(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function downloadBlobFile(blob, fileName) {
  const downloadUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");

  downloadLink.href = downloadUrl;
  downloadLink.download = fileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  URL.revokeObjectURL(downloadUrl);
}

function encodeUtf8(value) {
  return new TextEncoder().encode(String(value));
}

function createZipFile(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = encodeUtf8(file.path);
    const contentBytes = encodeUtf8(file.content);
    const crc = calculateCrc32(contentBytes);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    writeUint32(localHeader, 0, 0x04034b50);
    writeUint16(localHeader, 4, 20);
    writeUint16(localHeader, 6, 0);
    writeUint16(localHeader, 8, 0);
    writeUint16(localHeader, 10, 0);
    writeUint16(localHeader, 12, 0);
    writeUint32(localHeader, 14, crc);
    writeUint32(localHeader, 18, contentBytes.length);
    writeUint32(localHeader, 22, contentBytes.length);
    writeUint16(localHeader, 26, nameBytes.length);
    writeUint16(localHeader, 28, 0);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, contentBytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    writeUint32(centralHeader, 0, 0x02014b50);
    writeUint16(centralHeader, 4, 20);
    writeUint16(centralHeader, 6, 20);
    writeUint16(centralHeader, 8, 0);
    writeUint16(centralHeader, 10, 0);
    writeUint16(centralHeader, 12, 0);
    writeUint16(centralHeader, 14, 0);
    writeUint32(centralHeader, 16, crc);
    writeUint32(centralHeader, 20, contentBytes.length);
    writeUint32(centralHeader, 24, contentBytes.length);
    writeUint16(centralHeader, 28, nameBytes.length);
    writeUint16(centralHeader, 30, 0);
    writeUint16(centralHeader, 32, 0);
    writeUint16(centralHeader, 34, 0);
    writeUint16(centralHeader, 36, 0);
    writeUint32(centralHeader, 38, 0);
    writeUint32(centralHeader, 42, offset);
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + contentBytes.length;
  });

  const centralDirectorySize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const endRecord = new Uint8Array(22);

  writeUint32(endRecord, 0, 0x06054b50);
  writeUint16(endRecord, 4, 0);
  writeUint16(endRecord, 6, 0);
  writeUint16(endRecord, 8, files.length);
  writeUint16(endRecord, 10, files.length);
  writeUint32(endRecord, 12, centralDirectorySize);
  writeUint32(endRecord, 16, offset);
  writeUint16(endRecord, 20, 0);

  return concatUint8Arrays([...localParts, ...centralParts, endRecord]);
}

function concatUint8Arrays(parts) {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  parts.forEach((part) => {
    result.set(part, offset);
    offset += part.length;
  });

  return result;
}

function writeUint16(array, offset, value) {
  array[offset] = value & 0xff;
  array[offset + 1] = (value >>> 8) & 0xff;
}

function writeUint32(array, offset, value) {
  array[offset] = value & 0xff;
  array[offset + 1] = (value >>> 8) & 0xff;
  array[offset + 2] = (value >>> 16) & 0xff;
  array[offset + 3] = (value >>> 24) & 0xff;
}

let xlsxCrcTable = null;

function calculateCrc32(bytes) {
  if (!xlsxCrcTable) {
    xlsxCrcTable = buildCrc32Table();
  }

  let crc = 0 ^ -1;

  for (let index = 0; index < bytes.length; index += 1) {
    crc = (crc >>> 8) ^ xlsxCrcTable[(crc ^ bytes[index]) & 0xff];
  }

  return (crc ^ -1) >>> 0;
}

function buildCrc32Table() {
  const table = [];

  for (let index = 0; index < 256; index += 1) {
    let crc = index;

    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }

    table[index] = crc >>> 0;
  }

  return table;
}

function exportWeeklyPdf() {
  const attendanceDateInput = document.getElementById("attendanceDateInput");

  const selectedDateKey = attendanceDateInput && getDateControlValue(attendanceDateInput)
    ? getDateControlValue(attendanceDateInput)
    : getDateKey(new Date());

  const weeklyData = getWeeklyAttendanceReportData(selectedDateKey);

  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    alert(t("print.printError"));
    return;
  }

  const weeklySummaryRowsHtml = weeklyData.employeeSummaries.length === 0
    ? `
      <tr>
        <td colspan="9" class="empty-row">${escapeHtml(t("print.noWeeklySummary"))}</td>
      </tr>
    `
    : weeklyData.employeeSummaries
        .map((summary) => {
          const balanceClass = getBalanceClass(summary.balanceMinutes);

          return `
            <tr>
              <td><strong>${escapeHtml(summary.employeeId)}</strong></td>
              <td>${escapeHtml(summary.employeeName)}</td>
              <td>${escapeHtml(summary.department || "-")}</td>
              <td>${escapeHtml(String(summary.workDays))}</td>
              <td>${escapeHtml(formatDuration(summary.rawWorkedMinutes))}</td>
              <td>${escapeHtml(formatDuration(summary.lunchDeductionMinutes))}</td>
              <td><strong>${escapeHtml(formatDuration(summary.netWorkedMinutes))}</strong></td>
              <td class="balance-positive"><strong>${escapeHtml(formatDuration(summary.overtimeMinutes))}</strong></td>
              <td class="balance-negative"><strong>${escapeHtml(formatDuration(summary.missingMinutes))}</strong></td>
              <td class="${balanceClass}">
                <strong>${escapeHtml(formatSignedDuration(summary.balanceMinutes))}</strong>
              </td>
              <td>${escapeHtml(String(summary.openDays))}</td>
            </tr>
          `;
        })
        .join("");

  const dailyBreakdownRowsHtml = weeklyData.dailyRows.length === 0
    ? `
      <tr>
        <td colspan="11" class="empty-row">${escapeHtml(t("print.noWeeklySummary"))}</td>
      </tr>
    `
    : weeklyData.dailyRows
        .map((summary) => {
          const balanceClass = getBalanceClass(summary.balanceMinutes);

          return `
            <tr>
              <td>${escapeHtml(formatDisplayDate(summary.dateKey))}</td>
              <td><strong>${escapeHtml(summary.employeeId)}</strong></td>
              <td>${escapeHtml(summary.employeeName)}</td>
              <td>${escapeHtml(summary.department || "-")}</td>
              <td>${escapeHtml(summary.firstArrival || "-")}</td>
              <td>${escapeHtml(summary.lastDeparture || "-")}</td>
              <td><strong>${escapeHtml(formatDuration(summary.netWorkedMinutes))}</strong></td>
              <td class="balance-positive"><strong>${escapeHtml(formatDuration(summary.overtimeMinutes))}</strong></td>
              <td class="balance-negative"><strong>${escapeHtml(formatDuration(summary.missingMinutes))}</strong></td>
              <td class="${balanceClass}">
                <strong>${escapeHtml(formatSignedDuration(summary.balanceMinutes))}</strong>
              </td>
              <td>${escapeHtml(summary.statusText)}</td>
            </tr>
          `;
        })
        .join("");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>${escapeHtml(t("print.weeklyAttendanceTitle"))}</title>

      <style>
        body {
          margin: 0;
          padding: 18px;
          font-family: Arial, sans-serif;
          color: #111827;
          background: white;
          font-size: 12px;
        }

        h1 {
          margin: 0 0 8px;
          text-align: center;
          font-size: 22px;
        }

        h2 {
          margin: 22px 0 8px;
          font-size: 16px;
        }

        .print-header {
          border: 1.5px solid #6b7280;
          padding: 10px;
          margin-bottom: 16px;
        }

        .print-header-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 5px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
        }

        th,
        td {
          border: 1.5px solid #6b7280;
          padding: 6px;
          text-align: left;
          vertical-align: top;
        }

        th {
          background: #e5e7eb;
          font-weight: bold;
        }

        .empty-row {
          text-align: center;
          color: #6b7280;
        }

        .small-text {
          color: #374151;
          font-size: 11px;
        }

        .balance-positive {
          color: #166534;
        }

        .balance-negative {
          color: #991b1b;
        }

        .balance-neutral {
          color: #374151;
        }

        @page {
          size: A4 portrait;
          margin: 10mm;
        }
      </style>
    </head>

    <body>
      <h1>${escapeHtml(t("print.weeklyAttendanceTitle"))}</h1>

      <div class="print-header">
        <div class="print-header-row">
          <div>
            <strong>${escapeHtml(t("print.company"))}:</strong>
            ${escapeHtml(appSettings.companyName || "Centru de sticla")}
          </div>

          <div>
            <strong>${escapeHtml(t("print.weekRange"))}:</strong>
            ${escapeHtml(formatDisplayDate(weeklyData.weekStartKey))}
            -
            ${escapeHtml(formatDisplayDate(weeklyData.weekEndKey))}
          </div>
        </div>

        <div class="print-header-row small-text">
          <div>
            <strong>${escapeHtml(t("print.generatedAt"))}:</strong>
            ${escapeHtml(formatDisplayDate(getDateKey(new Date())))} ${escapeHtml(formatTimeFromIso(new Date().toISOString()))}
          </div>

          <div>
            <strong>${escapeHtml(t("statistics.employeesWithEvents"))}:</strong>
            ${escapeHtml(String(weeklyData.employeeSummaries.length))}
          </div>
        </div>
      </div>

      <h2>${escapeHtml(t("print.weeklySummary"))}</h2>

      <table>
        <thead>
          <tr>
            <th>${escapeHtml(t("attendance.code"))}</th>
            <th>${escapeHtml(t("attendance.employee"))}</th>
            <th>${escapeHtml(t("attendance.department"))}</th>
            <th>${escapeHtml(t("print.workDays"))}</th>
            <th>${escapeHtml(t("attendance.rawWorked"))}</th>
            <th>${escapeHtml(t("attendance.lunchDeduction"))}</th>
            <th>${escapeHtml(t("attendance.netWorked"))}</th>
            <th>${escapeHtml(t("attendance.overtime"))}</th>
            <th>${escapeHtml(t("attendance.missing"))}</th>
            <th>${escapeHtml(t("attendance.balance"))}</th>
            <th>${escapeHtml(t("print.openDays"))}</th>
          </tr>
        </thead>

        <tbody>
          ${weeklySummaryRowsHtml}
        </tbody>
      </table>

      <h2>${escapeHtml(t("print.weeklyDailyBreakdown"))}</h2>

      <table>
        <thead>
          <tr>
            <th>${escapeHtml(t("attendance.date"))}</th>
            <th>${escapeHtml(t("attendance.code"))}</th>
            <th>${escapeHtml(t("attendance.employee"))}</th>
            <th>${escapeHtml(t("attendance.department"))}</th>
            <th>${escapeHtml(t("attendance.firstArrival"))}</th>
            <th>${escapeHtml(t("attendance.lastDeparture"))}</th>
            <th>${escapeHtml(t("attendance.netWorked"))}</th>
            <th>${escapeHtml(t("attendance.overtime"))}</th>
            <th>${escapeHtml(t("attendance.missing"))}</th>
            <th>${escapeHtml(t("attendance.balance"))}</th>
            <th>${escapeHtml(t("attendance.dayStatus"))}</th>
          </tr>
        </thead>

        <tbody>
          ${dailyBreakdownRowsHtml}
        </tbody>
      </table>

      <script>
        window.onload = function () {
          setTimeout(function () {
            window.print();
          }, 500);
        };
      <\/script>
    </body>
    </html>
  `);

  removeHiddenOvertimeFromPrintDocument(printWindow.document);
  printWindow.document.close();
}

function getWeeklyAttendanceReportData(selectedDateKey) {
  const weekRange = getWeekRangeFromDateKey(selectedDateKey);
  const weekDateKeys = getDateKeysBetween(weekRange.startKey, weekRange.endKey);

  const dailyRows = [];
  const employeeSummaryMap = new Map();

  weekDateKeys.forEach((dateKey) => {
    const eventsForDay = attendanceEvents
      .filter((event) => event.dateKey === dateKey)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const employeeIds = [...new Set(eventsForDay.map((event) => event.employeeId))];

    employeeIds.forEach((employeeId) => {
      const employee = employees.find((item) => item.id === employeeId);
      const firstEvent = eventsForDay.find((event) => event.employeeId === employeeId);

      const dailySummary = calculateDailySummary({
        employeeId,
        employeeName: employee ? employee.name : firstEvent.employeeName || "-",
        department: employee ? employee.department || "-" : firstEvent.department || "-",
        dateKey
      });

      dailyRows.push(dailySummary);

      if (!employeeSummaryMap.has(employeeId)) {
        employeeSummaryMap.set(employeeId, {
          employeeId,
          employeeName: dailySummary.employeeName,
          department: dailySummary.department,
          workDays: 0,
          openDays: 0,
          rawWorkedMinutes: 0,
          lunchDeductionMinutes: 0,
          netWorkedMinutes: 0,
          overtimeMinutes: 0,
          missingMinutes: 0,
          balanceMinutes: 0
        });
      }

      const weeklySummary = employeeSummaryMap.get(employeeId);

      weeklySummary.workDays += 1;
      weeklySummary.rawWorkedMinutes += dailySummary.rawWorkedMinutes;
      weeklySummary.lunchDeductionMinutes += dailySummary.lunchDeductionMinutes;
      weeklySummary.netWorkedMinutes += dailySummary.netWorkedMinutes;
      weeklySummary.overtimeMinutes += dailySummary.overtimeMinutes;
      weeklySummary.missingMinutes += dailySummary.missingMinutes;
      weeklySummary.balanceMinutes += dailySummary.balanceMinutes;

      if (dailySummary.isOpen) {
        weeklySummary.openDays += 1;
      }
    });
  });

  const employeeSummaries = Array.from(employeeSummaryMap.values())
    .map((summary) => ({
      ...summary,
      overtimeMinutes: Math.max(0, summary.balanceMinutes),
      missingMinutes: Math.max(0, -summary.balanceMinutes)
    }))
    .sort((a, b) => {
      return String(a.employeeName).localeCompare(String(b.employeeName), "hu");
    });

  dailyRows.sort((a, b) => {
    if (a.dateKey !== b.dateKey) {
      return a.dateKey.localeCompare(b.dateKey);
    }

    return String(a.employeeName).localeCompare(String(b.employeeName), "hu");
  });

  return {
    weekStartKey: weekRange.startKey,
    weekEndKey: weekRange.endKey,
    weekDateKeys,
    dailyRows,
    employeeSummaries
  };
}

function getWeekRangeFromDateKey(dateKey) {
  const date = buildDateFromDateKey(dateKey);
  const dayNumber = date.getDay();
  const diffToMonday = dayNumber === 0 ? -6 : 1 - dayNumber;

  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    startKey: getDateKey(monday),
    endKey: getDateKey(sunday)
  };
}

function getDateKeysBetween(startDateKey, endDateKey) {
  const dateKeys = [];
  const currentDate = buildDateFromDateKey(startDateKey);
  const endDate = buildDateFromDateKey(endDateKey);

  while (currentDate <= endDate) {
    dateKeys.push(getDateKey(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dateKeys;
}

function buildDateFromDateKey(dateKey) {
  const parts = String(dateKey).split("-").map(Number);

  if (parts.length !== 3) {
    return new Date();
  }

  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  return new Date(year, month - 1, day);
}

function exportWeeklyXlsx() {
  try {
    const attendanceDateInput = document.getElementById("attendanceDateInput");

    const selectedDateKey = attendanceDateInput && getDateControlValue(attendanceDateInput)
      ? getDateControlValue(attendanceDateInput)
      : getDateKey(new Date());

    const weeklyData = getWeeklyAttendanceReportData(selectedDateKey);

    const rows = [];

    rows.push([t("print.weeklyAttendanceTitle")]);
    rows.push([t("print.company"), appSettings.companyName || "Centru de sticla"]);
    rows.push([
      t("print.weekRange"),
      `${formatDisplayDate(weeklyData.weekStartKey)} - ${formatDisplayDate(weeklyData.weekEndKey)}`
    ]);
    rows.push([
      t("print.generatedAt"),
      `${formatDisplayDate(getDateKey(new Date()))} ${formatTimeFromIso(new Date().toISOString())}`
    ]);
    rows.push([t("statistics.employeesWithEvents"), String(weeklyData.employeeSummaries.length)]);
    rows.push([]);

    rows.push([t("print.weeklySummary")]);
    rows.push([
      t("attendance.code"),
      t("attendance.employee"),
      t("attendance.department"),
      t("print.workDays"),
      t("attendance.rawWorked"),
      t("attendance.lunchDeduction"),
      t("attendance.netWorked"),
      t("attendance.overtime"),
      t("attendance.missing"),
      t("attendance.balance"),
      t("print.openDays")
    ]);

    if (weeklyData.employeeSummaries.length === 0) {
      rows.push([t("print.noWeeklySummary")]);
    } else {
      weeklyData.employeeSummaries.forEach((summary) => {
        rows.push([
          summary.employeeId,
          summary.employeeName,
          summary.department || "-",
          String(summary.workDays),
          formatDuration(summary.rawWorkedMinutes),
          formatDuration(summary.lunchDeductionMinutes),
          formatDuration(summary.netWorkedMinutes),
          formatDuration(summary.overtimeMinutes),
          formatDuration(summary.missingMinutes),
          formatSignedDuration(summary.balanceMinutes),
          String(summary.openDays)
        ]);
      });
    }

    rows.push([]);
    rows.push([t("print.weeklyDailyBreakdown")]);
    rows.push([
      t("attendance.date"),
      t("attendance.code"),
      t("attendance.employee"),
      t("attendance.department"),
      t("attendance.firstArrival"),
      t("attendance.lastDeparture"),
      t("attendance.netWorked"),
      t("attendance.overtime"),
      t("attendance.missing"),
      t("attendance.balance"),
      t("attendance.dayStatus")
    ]);

    if (weeklyData.dailyRows.length === 0) {
      rows.push([t("print.noWeeklySummary")]);
    } else {
      weeklyData.dailyRows.forEach((summary) => {
        rows.push([
          formatDisplayDate(summary.dateKey),
          summary.employeeId,
          summary.employeeName,
          summary.department || "-",
          summary.firstArrival || "-",
          summary.lastDeparture || "-",
          formatDuration(summary.netWorkedMinutes),
          formatDuration(summary.overtimeMinutes),
          formatDuration(summary.missingMinutes),
          formatSignedDuration(summary.balanceMinutes),
          summary.statusText
        ]);
      });
    }

    const fileName = `jelenleti-heti-lista-${weeklyData.weekStartKey}-${weeklyData.weekEndKey}.xlsx`;
    const xlsxBlob = createSimpleXlsxBlob(rows, t("print.weeklyAttendanceTitle"));

    downloadBlobFile(xlsxBlob, fileName);
    alert(t("export.xlsxSaved"));
  } catch (error) {
    console.error("Heti XLSX export hiba:", error);
    alert(t("export.xlsxError"));
  }
}

function exportMonthlyPdf() {
  const attendanceDateInput = document.getElementById("attendanceDateInput");

  const selectedDateKey = attendanceDateInput && getDateControlValue(attendanceDateInput)
    ? getDateControlValue(attendanceDateInput)
    : getDateKey(new Date());

  const monthlyData = getMonthlyAttendanceReportData(selectedDateKey);

  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    alert(t("print.printError"));
    return;
  }

  const monthlySummaryRowsHtml = monthlyData.employeeSummaries.length === 0
    ? `
      <tr>
        <td colspan="9" class="empty-row">${escapeHtml(t("print.noMonthlySummary"))}</td>
      </tr>
    `
    : monthlyData.employeeSummaries
        .map((summary) => {
          const balanceClass = getBalanceClass(summary.balanceMinutes);

          return `
            <tr>
              <td><strong>${escapeHtml(summary.employeeId)}</strong></td>
              <td>${escapeHtml(summary.employeeName)}</td>
              <td>${escapeHtml(summary.department || "-")}</td>
              <td>${escapeHtml(String(summary.workDays))}</td>
              <td>${escapeHtml(formatDuration(summary.rawWorkedMinutes))}</td>
              <td>${escapeHtml(formatDuration(summary.lunchDeductionMinutes))}</td>
              <td><strong>${escapeHtml(formatDuration(summary.netWorkedMinutes))}</strong></td>
              <td class="balance-positive"><strong>${escapeHtml(formatDuration(summary.overtimeMinutes))}</strong></td>
              <td class="balance-negative"><strong>${escapeHtml(formatDuration(summary.missingMinutes))}</strong></td>
              <td class="${balanceClass}">
                <strong>${escapeHtml(formatSignedDuration(summary.balanceMinutes))}</strong>
              </td>
              <td>${escapeHtml(String(summary.openDays))}</td>
            </tr>
          `;
        })
        .join("");

  const dailyBreakdownRowsHtml = monthlyData.dailyRows.length === 0
    ? `
      <tr>
        <td colspan="10" class="empty-row">${escapeHtml(t("print.noMonthlySummary"))}</td>
      </tr>
    `
    : monthlyData.dailyRows
        .map((summary) => {
          const balanceClass = getBalanceClass(summary.balanceMinutes);

          return `
            <tr>
              <td>${escapeHtml(formatDisplayDate(summary.dateKey))}</td>
              <td><strong>${escapeHtml(summary.employeeId)}</strong></td>
              <td>${escapeHtml(summary.employeeName)}</td>
              <td>${escapeHtml(summary.department || "-")}</td>
              <td>${escapeHtml(summary.firstArrival || "-")}</td>
              <td>${escapeHtml(summary.lastDeparture || "-")}</td>
              <td>${escapeHtml(formatDuration(summary.rawWorkedMinutes))}</td>
              <td>${escapeHtml(formatDuration(summary.lunchDeductionMinutes))}</td>
              <td><strong>${escapeHtml(formatDuration(summary.netWorkedMinutes))}</strong></td>
              <td class="balance-positive"><strong>${escapeHtml(formatDuration(summary.overtimeMinutes))}</strong></td>
              <td class="balance-negative"><strong>${escapeHtml(formatDuration(summary.missingMinutes))}</strong></td>
              <td class="${balanceClass}">
                <strong>${escapeHtml(formatSignedDuration(summary.balanceMinutes))}</strong>
              </td>
            </tr>
          `;
        })
        .join("");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>${escapeHtml(t("print.monthlyAttendanceTitle"))}</title>

      <style>
        body {
          margin: 0;
          padding: 18px;
          font-family: Arial, sans-serif;
          color: #111827;
          background: white;
          font-size: 12px;
        }

        h1 {
          margin: 0 0 8px;
          text-align: center;
          font-size: 22px;
        }

        h2 {
          margin: 22px 0 8px;
          font-size: 16px;
        }

        .print-header {
          border: 1.5px solid #6b7280;
          padding: 10px;
          margin-bottom: 16px;
        }

        .print-header-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 5px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
        }

        th,
        td {
          border: 1.5px solid #6b7280;
          padding: 6px;
          text-align: left;
          vertical-align: top;
        }

        th {
          background: #e5e7eb;
          font-weight: bold;
        }

        .empty-row {
          text-align: center;
          color: #6b7280;
        }

        .small-text {
          color: #374151;
          font-size: 11px;
        }

        .balance-positive {
          color: #166534;
        }

        .balance-negative {
          color: #991b1b;
        }

        .balance-neutral {
          color: #374151;
        }

        @page {
          size: A4 portrait;
          margin: 10mm;
        }
      </style>
    </head>

    <body>
      <h1>${escapeHtml(t("print.monthlyAttendanceTitle"))}</h1>

      <div class="print-header">
        <div class="print-header-row">
          <div>
            <strong>${escapeHtml(t("print.company"))}:</strong>
            ${escapeHtml(appSettings.companyName || "Centru de sticla")}
          </div>

          <div>
            <strong>${escapeHtml(t("print.monthRange"))}:</strong>
            ${escapeHtml(formatDisplayDate(monthlyData.monthStartKey))}
            -
            ${escapeHtml(formatDisplayDate(monthlyData.monthEndKey))}
          </div>
        </div>

        <div class="print-header-row small-text">
          <div>
            <strong>${escapeHtml(t("print.generatedAt"))}:</strong>
            ${escapeHtml(formatDisplayDate(getDateKey(new Date())))} ${escapeHtml(formatTimeFromIso(new Date().toISOString()))}
          </div>

          <div>
            <strong>${escapeHtml(t("statistics.employeesWithEvents"))}:</strong>
            ${escapeHtml(String(monthlyData.employeeSummaries.length))}
          </div>
        </div>
      </div>

      <h2>${escapeHtml(t("print.monthlySummary"))}</h2>

      <table>
        <thead>
          <tr>
            <th>${escapeHtml(t("attendance.code"))}</th>
            <th>${escapeHtml(t("attendance.employee"))}</th>
            <th>${escapeHtml(t("attendance.department"))}</th>
            <th>${escapeHtml(t("print.workDays"))}</th>
            <th>${escapeHtml(t("attendance.rawWorked"))}</th>
            <th>${escapeHtml(t("attendance.lunchDeduction"))}</th>
            <th>${escapeHtml(t("attendance.netWorked"))}</th>
            <th>${escapeHtml(t("attendance.overtime"))}</th>
            <th>${escapeHtml(t("attendance.missing"))}</th>
            <th>${escapeHtml(t("attendance.balance"))}</th>
            <th>${escapeHtml(t("print.openDays"))}</th>
          </tr>
        </thead>

        <tbody>
          ${monthlySummaryRowsHtml}
        </tbody>
      </table>

      <h2>${escapeHtml(t("print.monthlyDailyBreakdown"))}</h2>

      <table>
        <thead>
          <tr>
            <th>${escapeHtml(t("attendance.date"))}</th>
            <th>${escapeHtml(t("attendance.code"))}</th>
            <th>${escapeHtml(t("attendance.employee"))}</th>
            <th>${escapeHtml(t("attendance.department"))}</th>
            <th>${escapeHtml(t("attendance.firstArrival"))}</th>
            <th>${escapeHtml(t("attendance.lastDeparture"))}</th>
            <th>${escapeHtml(t("attendance.rawWorked"))}</th>
            <th>${escapeHtml(t("attendance.lunchDeduction"))}</th>
            <th>${escapeHtml(t("attendance.netWorked"))}</th>
            <th>${escapeHtml(t("attendance.overtime"))}</th>
            <th>${escapeHtml(t("attendance.missing"))}</th>
            <th>${escapeHtml(t("attendance.balance"))}</th>
          </tr>
        </thead>

        <tbody>
          ${dailyBreakdownRowsHtml}
        </tbody>
      </table>

      <script>
        window.onload = function () {
          setTimeout(function () {
            window.print();
          }, 500);
        };
      <\/script>
    </body>
    </html>
  `);

  removeHiddenOvertimeFromPrintDocument(printWindow.document);
  printWindow.document.close();
}

function getMonthlyAttendanceReportData(selectedDateKey) {
  const monthRange = getMonthRangeFromDateKey(selectedDateKey);
  const monthDateKeys = getDateKeysBetween(monthRange.startKey, monthRange.endKey);

  const dailyRows = [];
  const employeeSummaryMap = new Map();

  monthDateKeys.forEach((dateKey) => {
    const eventsForDay = attendanceEvents
      .filter((event) => event.dateKey === dateKey)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const employeeIds = [...new Set(eventsForDay.map((event) => event.employeeId))];

    employeeIds.forEach((employeeId) => {
      const employee = employees.find((item) => item.id === employeeId);
      const firstEvent = eventsForDay.find((event) => event.employeeId === employeeId);

      const dailySummary = calculateDailySummary({
        employeeId,
        employeeName: employee ? employee.name : firstEvent.employeeName || "-",
        department: employee ? employee.department || "-" : firstEvent.department || "-",
        dateKey
      });

      dailyRows.push(dailySummary);

      if (!employeeSummaryMap.has(employeeId)) {
        employeeSummaryMap.set(employeeId, {
          employeeId,
          employeeName: dailySummary.employeeName,
          department: dailySummary.department,
          workDays: 0,
          openDays: 0,
          rawWorkedMinutes: 0,
          lunchDeductionMinutes: 0,
          netWorkedMinutes: 0,
          overtimeMinutes: 0,
          missingMinutes: 0,
          balanceMinutes: 0
        });
      }

      const monthlySummary = employeeSummaryMap.get(employeeId);

      monthlySummary.workDays += 1;
      monthlySummary.rawWorkedMinutes += dailySummary.rawWorkedMinutes;
      monthlySummary.lunchDeductionMinutes += dailySummary.lunchDeductionMinutes;
      monthlySummary.netWorkedMinutes += dailySummary.netWorkedMinutes;
      monthlySummary.overtimeMinutes += dailySummary.overtimeMinutes;
      monthlySummary.missingMinutes += dailySummary.missingMinutes;
      monthlySummary.balanceMinutes += dailySummary.balanceMinutes;

      if (dailySummary.isOpen) {
        monthlySummary.openDays += 1;
      }
    });
  });

  const employeeSummaries = Array.from(employeeSummaryMap.values())
    .map((summary) => ({
      ...summary,
      overtimeMinutes: Math.max(0, summary.balanceMinutes),
      missingMinutes: Math.max(0, -summary.balanceMinutes)
    }))
    .sort((a, b) => {
      return String(a.employeeName).localeCompare(String(b.employeeName), "hu");
    });

  dailyRows.sort((a, b) => {
    if (a.dateKey !== b.dateKey) {
      return a.dateKey.localeCompare(b.dateKey);
    }

    return String(a.employeeName).localeCompare(String(b.employeeName), "hu");
  });

  return {
    monthStartKey: monthRange.startKey,
    monthEndKey: monthRange.endKey,
    monthDateKeys,
    dailyRows,
    employeeSummaries
  };
}

function getMonthRangeFromDateKey(dateKey) {
  const date = buildDateFromDateKey(dateKey);

  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  return {
    startKey: getDateKey(firstDay),
    endKey: getDateKey(lastDay)
  };
}

function exportMonthlyXlsx() {
  try {
    const attendanceDateInput = document.getElementById("attendanceDateInput");

    const selectedDateKey = attendanceDateInput && getDateControlValue(attendanceDateInput)
      ? getDateControlValue(attendanceDateInput)
      : getDateKey(new Date());

    const monthlyData = getMonthlyAttendanceReportData(selectedDateKey);

    const rows = [];

    rows.push([t("print.monthlyAttendanceTitle")]);
    rows.push([t("print.company"), appSettings.companyName || "Centru de sticla"]);
    rows.push([
      t("print.monthRange"),
      `${formatDisplayDate(monthlyData.monthStartKey)} - ${formatDisplayDate(monthlyData.monthEndKey)}`
    ]);
    rows.push([
      t("print.generatedAt"),
      `${formatDisplayDate(getDateKey(new Date()))} ${formatTimeFromIso(new Date().toISOString())}`
    ]);
    rows.push([t("statistics.employeesWithEvents"), String(monthlyData.employeeSummaries.length)]);
    rows.push([]);

    rows.push([t("print.monthlySummary")]);
    rows.push([
      t("attendance.code"),
      t("attendance.employee"),
      t("attendance.department"),
      t("print.workDays"),
      t("attendance.rawWorked"),
      t("attendance.lunchDeduction"),
      t("attendance.netWorked"),
      t("attendance.overtime"),
      t("attendance.missing"),
      t("attendance.balance"),
      t("print.openDays")
    ]);

    if (monthlyData.employeeSummaries.length === 0) {
      rows.push([t("print.noMonthlySummary")]);
    } else {
      monthlyData.employeeSummaries.forEach((summary) => {
        rows.push([
          summary.employeeId,
          summary.employeeName,
          summary.department || "-",
          String(summary.workDays),
          formatDuration(summary.rawWorkedMinutes),
          formatDuration(summary.lunchDeductionMinutes),
          formatDuration(summary.netWorkedMinutes),
          formatDuration(summary.overtimeMinutes),
          formatDuration(summary.missingMinutes),
          formatSignedDuration(summary.balanceMinutes),
          String(summary.openDays)
        ]);
      });
    }

    rows.push([]);
    rows.push([t("print.monthlyDailyBreakdown")]);
    rows.push([
      t("attendance.date"),
      t("attendance.code"),
      t("attendance.employee"),
      t("attendance.department"),
      t("attendance.firstArrival"),
      t("attendance.lastDeparture"),
      t("attendance.rawWorked"),
      t("attendance.lunchDeduction"),
      t("attendance.netWorked"),
      t("attendance.overtime"),
      t("attendance.missing"),
      t("attendance.balance"),
      t("attendance.dayStatus")
    ]);

    if (monthlyData.dailyRows.length === 0) {
      rows.push([t("print.noMonthlySummary")]);
    } else {
      monthlyData.dailyRows.forEach((summary) => {
        rows.push([
          formatDisplayDate(summary.dateKey),
          summary.employeeId,
          summary.employeeName,
          summary.department || "-",
          summary.firstArrival || "-",
          summary.lastDeparture || "-",
          formatDuration(summary.rawWorkedMinutes),
          formatDuration(summary.lunchDeductionMinutes),
          formatDuration(summary.netWorkedMinutes),
          formatDuration(summary.overtimeMinutes),
          formatDuration(summary.missingMinutes),
          formatSignedDuration(summary.balanceMinutes),
          summary.statusText
        ]);
      });
    }

    const monthKey = String(selectedDateKey).slice(0, 7);
    const fileName = `jelenleti-havi-lista-${monthKey}.xlsx`;
    const xlsxBlob = createSimpleXlsxBlob(rows, t("print.monthlyAttendanceTitle"));

    downloadBlobFile(xlsxBlob, fileName);
    alert(t("export.xlsxSaved"));
  } catch (error) {
    console.error("Havi XLSX export hiba:", error);
    alert(t("export.xlsxError"));
  }
}

function exportEmployeePdf() {
  const employeeSelect = document.getElementById("profileEmployeeSelect");
  const monthInput = document.getElementById("profileMonthInput");

  if (!employeeSelect || !monthInput) {
    return;
  }

  const employeeId = employeeSelect.value;
  const monthKey = monthInput.value || getMonthKey(new Date());
  const employee = employees.find((item) => item.id === employeeId);

  if (!employee) {
    alert(t("profile.selectEmployee"));
    return;
  }

  const employeeData = getEmployeeMonthlyReportData(employee.id, monthKey);

  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    alert(t("print.printError"));
    return;
  }

  const summaryRowsHtml = `
    <tr>
      <td>${escapeHtml(t("profile.workDays"))}</td>
      <td><strong>${escapeHtml(String(employeeData.workDays))}</strong></td>
    </tr>

    <tr>
      <td>${escapeHtml(t("attendance.rawWorked"))}</td>
      <td><strong>${escapeHtml(formatDuration(employeeData.rawWorkedMinutes))}</strong></td>
    </tr>

    <tr>
      <td>${escapeHtml(t("attendance.lunchDeduction"))}</td>
      <td><strong>${escapeHtml(formatDuration(employeeData.lunchDeductionMinutes))}</strong></td>
    </tr>

    <tr>
      <td>${escapeHtml(t("attendance.netWorked"))}</td>
      <td><strong>${escapeHtml(formatDuration(employeeData.netWorkedMinutes))}</strong></td>
    </tr>

    <tr>
      <td>${escapeHtml(t("attendance.overtime"))}</td>
      <td class="balance-positive"><strong>${escapeHtml(formatDuration(employeeData.payableOvertimeMinutes))}</strong></td>
    </tr>

    <tr>
      <td>${escapeHtml(t("payment.overtimeRate"))}</td>
      <td><strong>${escapeHtml(formatMoneyValue(employeeData.overtimeHourlyRate))}</strong></td>
    </tr>

    <tr>
      <td>${escapeHtml(t("payment.overtimeValue"))}</td>
      <td class="balance-positive"><strong>${escapeHtml(formatMoneyValue(employeeData.overtimeValue))}</strong></td>
    </tr>

    <tr>
      <td>${escapeHtml(t("payment.mealVoucherDailyValue"))}</td>
      <td><strong>${escapeHtml(formatMoneyValue(employeeData.mealVoucherDailyValue))}</strong></td>
    </tr>

    <tr>
      <td>${escapeHtml(t("payment.mealVoucherDays"))}</td>
      <td><strong>${escapeHtml(String(employeeData.mealVoucherDays))}</strong></td>
    </tr>

    <tr>
      <td>${escapeHtml(t("payment.mealVoucherValue"))}</td>
      <td><strong>${escapeHtml(formatMoneyValue(employeeData.mealVoucherValue))}</strong></td>
    </tr>

    <tr>
      <td>${escapeHtml(t("payment.totalPayment"))}</td>
      <td><strong>${escapeHtml(formatMoneyValue(employeeData.paymentTotal))}</strong></td>
    </tr>

    <tr>
      <td>${escapeHtml(t("attendance.missing"))}</td>
      <td class="balance-negative"><strong>${escapeHtml(formatDuration(employeeData.missingMinutes))}</strong></td>
    </tr>

    <tr>
      <td>${escapeHtml(t("attendance.balance"))}</td>
      <td class="${getBalanceClass(employeeData.balanceMinutes)}">
        <strong>${escapeHtml(formatSignedDuration(employeeData.balanceMinutes))}</strong>
      </td>
    </tr>

    <tr>
      <td>${escapeHtml(t("profile.openDays"))}</td>
      <td><strong>${escapeHtml(String(employeeData.openDays))}</strong></td>
    </tr>
  `;

  const dailyRowsHtml = employeeData.dailyRows.length === 0
    ? `
      <tr>
        <td colspan="10" class="empty-row">${escapeHtml(t("print.employeeNoData"))}</td>
      </tr>
    `
    : employeeData.dailyRows
        .map((summary) => {
          const balanceClass = getBalanceClass(summary.balanceMinutes);

          return `
            <tr>
              <td>${escapeHtml(formatDisplayDate(summary.dateKey))}</td>
              <td>${escapeHtml(summary.firstArrival || "-")}</td>
              <td>${escapeHtml(summary.lastDeparture || "-")}</td>
              <td>${escapeHtml(formatDuration(summary.rawWorkedMinutes))}</td>
              <td>${escapeHtml(formatDuration(summary.lunchDeductionMinutes))}</td>
              <td><strong>${escapeHtml(formatDuration(summary.netWorkedMinutes))}</strong></td>
              <td class="balance-positive"><strong>${escapeHtml(formatDuration(summary.overtimeMinutes))}</strong></td>
              <td class="balance-negative"><strong>${escapeHtml(formatDuration(summary.missingMinutes))}</strong></td>
              <td class="${balanceClass}">
                <strong>${escapeHtml(formatSignedDuration(summary.balanceMinutes))}</strong>
              </td>
              <td>${escapeHtml(summary.statusText)}</td>
            </tr>
          `;
        })
        .join("");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>${escapeHtml(t("print.employeeAttendanceTitle"))}</title>

      <style>
        body {
          margin: 0;
          padding: 18px;
          font-family: Arial, sans-serif;
          color: #111827;
          background: white;
          font-size: 12px;
        }

        h1 {
          margin: 0 0 8px;
          text-align: center;
          font-size: 22px;
        }

        h2 {
          margin: 22px 0 8px;
          font-size: 16px;
        }

        .print-header {
          border: 1.5px solid #6b7280;
          padding: 10px;
          margin-bottom: 16px;
        }

        .print-header-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 5px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
        }

        th,
        td {
          border: 1.5px solid #6b7280;
          padding: 6px;
          text-align: left;
          vertical-align: top;
        }

        th {
          background: #e5e7eb;
          font-weight: bold;
        }

        .empty-row {
          text-align: center;
          color: #6b7280;
        }

        .small-text {
          color: #374151;
          font-size: 11px;
        }

        .balance-positive {
          color: #166534;
        }

        .balance-negative {
          color: #991b1b;
        }

        .balance-neutral {
          color: #374151;
        }

        @page {
          size: A4 portrait;
          margin: 10mm;
        }
      </style>
    </head>

    <body>
      <h1>${escapeHtml(t("print.employeeAttendanceTitle"))}</h1>

      <div class="print-header">
        <div class="print-header-row">
          <div>
            <strong>${escapeHtml(t("print.company"))}:</strong>
            ${escapeHtml(appSettings.companyName || "Centru de sticla")}
          </div>

          <div>
            <strong>${escapeHtml(t("print.employeePeriod"))}:</strong>
            ${escapeHtml(formatDisplayDate(employeeData.monthStartKey))}
            -
            ${escapeHtml(formatDisplayDate(employeeData.monthEndKey))}
          </div>
        </div>

        <div class="print-header-row">
          <div>
            <strong>${escapeHtml(t("attendance.employee"))}:</strong>
            ${escapeHtml(employee.name)}
          </div>

          <div>
            <strong>${escapeHtml(t("attendance.code"))}:</strong>
            ${escapeHtml(employee.id)}
          </div>
        </div>

        <div class="print-header-row">
          <div>
            <strong>${escapeHtml(t("attendance.department"))}:</strong>
            ${escapeHtml(employee.department || "-")}
          </div>

          <div>
            <strong>${escapeHtml(t("employee.status"))}:</strong>
            ${escapeHtml(employee.active ? t("employee.active") : t("employee.inactive"))}
          </div>
        </div>

        <div class="print-header-row small-text">
          <div>
            <strong>${escapeHtml(t("print.generatedAt"))}:</strong>
            ${escapeHtml(formatDisplayDate(getDateKey(new Date())))} ${escapeHtml(formatTimeFromIso(new Date().toISOString()))}
          </div>
        </div>
      </div>

      <h2>${escapeHtml(t("print.employeeSummary"))}</h2>

      <table>
        <tbody>
          ${summaryRowsHtml}
        </tbody>
      </table>

      <h2>${escapeHtml(t("print.employeeDailyBreakdown"))}</h2>

      <table>
        <thead>
          <tr>
            <th>${escapeHtml(t("attendance.date"))}</th>
            <th>${escapeHtml(t("attendance.firstArrival"))}</th>
            <th>${escapeHtml(t("attendance.lastDeparture"))}</th>
            <th>${escapeHtml(t("attendance.rawWorked"))}</th>
            <th>${escapeHtml(t("attendance.lunchDeduction"))}</th>
            <th>${escapeHtml(t("attendance.netWorked"))}</th>
            <th>${escapeHtml(t("attendance.overtime"))}</th>
            <th>${escapeHtml(t("attendance.missing"))}</th>
            <th>${escapeHtml(t("attendance.balance"))}</th>
            <th>${escapeHtml(t("attendance.dayStatus"))}</th>
          </tr>
        </thead>

        <tbody>
          ${dailyRowsHtml}
        </tbody>
      </table>

      <script>
        window.onload = function () {
          setTimeout(function () {
            window.print();
          }, 500);
        };
      <\/script>
    </body>
    </html>
  `);

  removeHiddenOvertimeFromPrintDocument(printWindow.document);
  printWindow.document.close();
}

function getEmployeeMonthlyReportData(employeeId, monthKey) {
  const employee = employees.find((item) => item.id === employeeId);
  const safeMonthKey = monthKey || getMonthKey(new Date());
  const monthRange = getMonthRangeFromDateKey(`${safeMonthKey}-01`);
  const monthDateKeys = getDateKeysBetween(monthRange.startKey, monthRange.endKey);

  const dailyRows = [];

  monthDateKeys.forEach((dateKey) => {
    const eventsForDay = attendanceEvents
      .filter((event) => event.employeeId === employeeId && event.dateKey === dateKey)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    if (eventsForDay.length === 0) {
      return;
    }

    const firstEvent = eventsForDay[0];

    const dailySummary = calculateDailySummary({
      employeeId,
      employeeName: employee ? employee.name : firstEvent.employeeName || "-",
      department: employee ? employee.department || "-" : firstEvent.department || "-",
      dateKey
    });

    dailyRows.push(dailySummary);
  });

  const rawWorkedMinutes = dailyRows.reduce((sum, item) => sum + item.rawWorkedMinutes, 0);
  const lunchDeductionMinutes = dailyRows.reduce((sum, item) => sum + item.lunchDeductionMinutes, 0);
  const netWorkedMinutes = dailyRows.reduce((sum, item) => sum + item.netWorkedMinutes, 0);
  const overtimeMinutes = dailyRows.reduce((sum, item) => sum + item.overtimeMinutes, 0);
  const openDays = dailyRows.filter((item) => item.isOpen).length;
  const workDays = dailyRows.length;
  const balanceMinutes = dailyRows.reduce((sum, item) => sum + item.balanceMinutes, 0);
  const missingMinutes = Math.max(0, -balanceMinutes);

  const paymentValues = calculateEmployeePaymentValues({
    dailyRows,
    balanceMinutes
  });

  return {
    employeeId,
    monthKey: safeMonthKey,
    monthStartKey: monthRange.startKey,
    monthEndKey: monthRange.endKey,
    dailyRows,
    workDays,
    openDays,
    rawWorkedMinutes,
    lunchDeductionMinutes,
    netWorkedMinutes,
    overtimeMinutes,
    missingMinutes,
    balanceMinutes,
    ...paymentValues
  };
}

function exportEmployeeXlsx() {
  try {
    const employeeSelect = document.getElementById("profileEmployeeSelect");
    const monthInput = document.getElementById("profileMonthInput");

    if (!employeeSelect || !monthInput) {
      return;
    }

    const employeeId = employeeSelect.value;
    const monthKey = monthInput.value || getMonthKey(new Date());
    const employee = employees.find((item) => item.id === employeeId);

    if (!employee) {
      alert(t("profile.selectEmployee"));
      return;
    }

    const employeeData = getEmployeeMonthlyReportData(employee.id, monthKey);

    const rows = [];

    rows.push([t("print.employeeAttendanceTitle")]);
    rows.push([t("print.company"), appSettings.companyName || "Centru de sticla"]);
    rows.push([
      t("print.employeePeriod"),
      `${formatDisplayDate(employeeData.monthStartKey)} - ${formatDisplayDate(employeeData.monthEndKey)}`
    ]);
    rows.push([t("attendance.employee"), employee.name]);
    rows.push([t("attendance.code"), employee.id]);
    rows.push([t("attendance.department"), employee.department || "-"]);
    rows.push([t("employee.status"), employee.active ? t("employee.active") : t("employee.inactive")]);
    rows.push([
      t("print.generatedAt"),
      `${formatDisplayDate(getDateKey(new Date()))} ${formatTimeFromIso(new Date().toISOString())}`
    ]);
    rows.push([]);

    rows.push([t("print.employeeSummary")]);
    rows.push([t("profile.workDays"), String(employeeData.workDays)]);
    rows.push([t("attendance.rawWorked"), formatDuration(employeeData.rawWorkedMinutes)]);
    rows.push([t("attendance.lunchDeduction"), formatDuration(employeeData.lunchDeductionMinutes)]);
    rows.push([t("attendance.netWorked"), formatDuration(employeeData.netWorkedMinutes)]);
    rows.push([t("attendance.overtime"), formatDuration(employeeData.payableOvertimeMinutes)]);
    rows.push([t("payment.overtimeRate"), formatMoneyValue(employeeData.overtimeHourlyRate)]);
    rows.push([t("payment.overtimeValue"), formatMoneyValue(employeeData.overtimeValue)]);
    rows.push([t("payment.mealVoucherDailyValue"), formatMoneyValue(employeeData.mealVoucherDailyValue)]);
    rows.push([t("payment.mealVoucherDays"), String(employeeData.mealVoucherDays)]);
    rows.push([t("payment.mealVoucherValue"), formatMoneyValue(employeeData.mealVoucherValue)]);
    rows.push([t("payment.totalPayment"), formatMoneyValue(employeeData.paymentTotal)]);
    rows.push([t("attendance.missing"), formatDuration(employeeData.missingMinutes)]);
    rows.push([t("attendance.balance"), formatSignedDuration(employeeData.balanceMinutes)]);
    rows.push([t("profile.openDays"), String(employeeData.openDays)]);
    rows.push([]);

    rows.push([t("print.employeeDailyBreakdown")]);
    rows.push([
      t("attendance.date"),
      t("attendance.firstArrival"),
      t("attendance.lastDeparture"),
      t("attendance.rawWorked"),
      t("attendance.lunchDeduction"),
      t("attendance.netWorked"),
      t("attendance.overtime"),
      t("attendance.missing"),
      t("attendance.balance"),
      t("attendance.dayStatus")
    ]);

    if (employeeData.dailyRows.length === 0) {
      rows.push([t("print.employeeNoData")]);
    } else {
      employeeData.dailyRows.forEach((summary) => {
        rows.push([
          formatDisplayDate(summary.dateKey),
          summary.firstArrival || "-",
          summary.lastDeparture || "-",
          formatDuration(summary.rawWorkedMinutes),
          formatDuration(summary.lunchDeductionMinutes),
          formatDuration(summary.netWorkedMinutes),
          formatDuration(summary.overtimeMinutes),
          formatDuration(summary.missingMinutes),
          formatSignedDuration(summary.balanceMinutes),
          summary.statusText
        ]);
      });
    }

    const safeEmployeeName = String(employee.name || employee.id)
      .replace(/[\\/:*?"<>|]/g, "-")
      .slice(0, 40);

    const fileName = `jelenleti-szemely-${employee.id}-${safeEmployeeName}-${monthKey}.xlsx`;
    const xlsxBlob = createSimpleXlsxBlob(rows, t("print.employeeAttendanceTitle"));

    downloadBlobFile(xlsxBlob, fileName);
    alert(t("export.xlsxSaved"));
  } catch (error) {
    console.error("Személy XLSX export hiba:", error);
    alert(t("export.xlsxError"));
  }
}

function exportJsonBackup() {
  try {
    const backupData = {
      appName: "Jelenléti PWA",
      appKey: "jelenleti-pwa",
      version: "2.1",
      exportedAt: new Date().toISOString(),
      settings: appSettings,
      employees: employees,
      attendanceEvents: attendanceEvents,
      absences: Array.isArray(absenceRecords) ? absenceRecords : [],
      vacationAllowances: Array.isArray(vacationAllowances) ? vacationAllowances : []
    };

    const jsonText = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonText], {
      type: "application/json;charset=utf-8"
    });

    const fileName = `jelenleti-pwa-mentes-${getBackupDateString()}.json`;
    const downloadUrl = URL.createObjectURL(blob);

    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    URL.revokeObjectURL(downloadUrl);

    showExportStatus(t("export.saved"), "success");
  } catch (error) {
    console.error("JSON export hiba:", error);
    showExportStatus(t("export.importError"), "error");
  }
}

function importJsonBackup(file) {
  if (DEMO_MODE) {
    showDemoModeNotice();
    return;
  }

  if (!file) {
    showExportStatus(t("export.importNoFile"), "error");
    return;
  }

  const reader = new FileReader();

  reader.onload = function (event) {
    try {
      const parsedData = JSON.parse(event.target.result);

      if (!isValidBackupData(parsedData)) {
        showExportStatus(t("export.importInvalid"), "error");
        return;
      }

      const confirmed = confirm(t("export.importConfirm"));

      if (!confirmed) {
        return;
      }

      appSettings = {
        ...DEFAULT_SETTINGS,
        ...parsedData.settings
      };

      employees = Array.isArray(parsedData.employees)
        ? parsedData.employees
        : [];

      attendanceEvents = Array.isArray(parsedData.attendanceEvents)
        ? parsedData.attendanceEvents
        : [];

      absenceRecords = Array.isArray(parsedData.absences)
        ? parsedData.absences
        : [];

      saveSettings(appSettings);
      saveEmployees(employees);
      saveAttendanceEvents(attendanceEvents);
      saveAbsences(absenceRecords);

      refreshAppAfterImport();

      showExportStatus(t("export.importSuccess"), "success");
    } catch (error) {
      console.error("JSON import hiba:", error);
      showExportStatus(t("export.importError"), "error");
    }
  };

  reader.onerror = function () {
    showExportStatus(t("export.importError"), "error");
  };

  reader.readAsText(file, "UTF-8");
}

function restoreAutoBackupData() {
  if (DEMO_MODE) {
    showDemoModeNotice();
    return;
  }

  try {
    if (typeof loadAutoBackup !== "function") {
      showExportStatus(t("backup.restoreMissing"), "error");
      return;
    }

    const autoBackup = loadAutoBackup();

    if (!autoBackup) {
      showExportStatus(t("backup.restoreMissing"), "error");
      return;
    }

    if (!Array.isArray(autoBackup.employees) || !Array.isArray(autoBackup.attendanceEvents)) {
      showExportStatus(t("backup.restoreInvalid"), "error");
      return;
    }

    const confirmed = confirm(t("backup.restoreConfirm"));

    if (!confirmed) {
      return;
    }

    appSettings = {
      ...DEFAULT_SETTINGS,
      ...autoBackup.settings
    };

    employees = Array.isArray(autoBackup.employees)
      ? autoBackup.employees
      : [];

    attendanceEvents = Array.isArray(autoBackup.attendanceEvents)
      ? autoBackup.attendanceEvents
      : [];

    absenceRecords = Array.isArray(autoBackup.absences)
      ? autoBackup.absences
      : [];

    saveSettings(appSettings);
    saveEmployees(employees);
    saveAttendanceEvents(attendanceEvents);
    saveAbsences(absenceRecords);

    refreshAppAfterImport();

    showExportStatus(t("backup.restoreSuccess"), "success");
  } catch (error) {
    console.error("Automatikus mentés visszaállítási hiba:", error);
    showExportStatus(t("backup.restoreError"), "error");
  }
}

function isValidBackupData(data) {
  if (!data || typeof data !== "object") {
    return false;
  }

  if (data.appKey !== "jelenleti-pwa") {
    return false;
  }

  if (!Array.isArray(data.employees)) {
    return false;
  }

  if (!Array.isArray(data.attendanceEvents)) {
    return false;
  }

  return true;
}

function refreshAppAfterImport() {
  applyLanguage(appSettings.language);
  fillSettingsFields();

  renderEmployeesTable();
  renderEmployeeCards();
  renderInsideList();
  renderAttendanceList();

  if (typeof renderEmployeeProfileEmployeeOptions === "function") {
    renderEmployeeProfileEmployeeOptions();
  }

  if (typeof renderEmployeeProfile === "function") {
    renderEmployeeProfile();
  }

  if (typeof renderStatisticsPage === "function") {
    renderStatisticsPage();
  }

  if (typeof fillAbsenceEmployeeOptions === "function") {
    fillAbsenceEmployeeOptions();
  }

  if (typeof renderMonthlyAccountingPage === "function") {
    renderMonthlyAccountingPage();
  }

  if (typeof renderExportPage === "function") {
    renderExportPage();
  }
}

function showExportStatus(message, type = "info") {
  const statusBox = document.getElementById("exportStatus");

  if (!statusBox) {
    return;
  }

  statusBox.textContent = message;
  statusBox.className = `export-status export-status-${type}`;
}

function getBackupDateString() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}-${hours}-${minutes}`;
}
