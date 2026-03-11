import XLSX from 'xlsx';
import { writeFileSync } from 'fs';

const wb = XLSX.readFile('Andes_Daily_Record.xlsx');
const result = {};

wb.SheetNames.forEach(s => {
  const ws = wb.Sheets[s];
  const data = XLSX.utils.sheet_to_json(ws);
  result[s] = {
    rowCount: data.length,
    columns: data.length > 0 ? Object.keys(data[0]) : [],
    allRows: data
  };
});

writeFileSync('/tmp/excel_data.json', JSON.stringify(result, null, 2));
console.log('Written to /tmp/excel_data.json');
console.log('Sheets:', wb.SheetNames);
wb.SheetNames.forEach(s => {
  console.log(`  ${s}: ${result[s].rowCount} rows, cols: ${JSON.stringify(result[s].columns)}`);
});
