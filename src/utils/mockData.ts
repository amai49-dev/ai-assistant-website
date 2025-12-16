// /utils/mockData.ts (หรือ .tsx)

// ------------------- Types -------------------

export interface ScheduleItem {
    id: number;
    type: 'Holiday' | 'Service' | 'Task' | string;
    typeName?: string;
    name: string;
    start: string; // ISO 8601 string (e.g., "2025-03-25T17:00:00.000Z")
    end: string;   // ISO 8601 string
    color: string;
    allDay: boolean;
    assignee_firstname: (string | null)[] | string | null;
    department_name: string | null;
    license_plate: string | null;
}

// ------------------- Mock Participant Data -------------------

export const MOCK_ALL_PARTICIPANTS = [
  'piriwat',
  'partner1',
  'partner2',
  'ทักษ์ดนัย',
  'สัมฤทธิ์',
  'มารุต',
  'Test',
  'วีระศักดิ์',
  'กรต',
  'มนต์ชัย'
];

// ------------------- REAL SCHEDULE DATA (เพิ่ม Service Event ใหม่ในเดือน 12) -------------------

export const REAL_SCHEDULE_DATA: ScheduleItem[] = [
  // ------------------- HOLIDAY EVENTS (คงเดิม) -------------------
  {
    "id": 1,
    "type": "Holiday",
    "typeName": "วันหยุดตามกฏหมาย",
    "name": "วันเข้าพรรษา",
    "start": "2025-12-03",
    "end": "2025-01-03",
    "color": "#FF3F3F",
    "allDay": true,
    "assignee_firstname": "",
    "department_name": "",
    "license_plate": ""
  },
  {
    "id": 3,
    "type": "Holiday",
    "typeName": "วันหยุดบริษัท",
    "name": "วันพระ",
    "start": "2025-02-28",
    "end": "2025-02-28",
    "color": "#FF3F3F",
    "allDay": true,
    "assignee_firstname": "",
    "department_name": "",
    "license_plate": ""
  },
  {
    "id": 139,
    "type": "Holiday",
    "typeName": "วันหยุดตามกฏหมาย",
    "name": "วันพ่อแห่งชาติ",
    "start": "2025-12-05",
    "end": "2025-12-05",
    "color": "#FF3F3F",
    "allDay": true,
    "assignee_firstname": "",
    "department_name": "",
    "license_plate": ""
  },
  {
    "id": 143,
    "type": "Holiday",
    "typeName": "วันหยุดบริษัท",
    "name": "วันสิ้นปี",
    "start": "2025-12-31",
    "end": "2025-12-31",
    "color": "#FF3F3F",
    "allDay": true,
    "assignee_firstname": "",
    "department_name": "",
    "license_plate": ""
  },
  
  // ------------------- NEW SERVICE EVENTS (เพิ่มใหม่) -------------------
  
  { // New 1: มารุต ไม่ว่าง วันที่ 6 ธันวาคม (13:00 - 15:00 Local)
    "id": 1001,
    "type": "Service",
    "name": "Service: ติดตั้งอุปกรณ์",
    "start": "2025-12-06T06:00:00.000Z", // 13:00 Local (GMT+7)
    "end": "2025-12-06T08:00:00.000Z",   // 15:00 Local
    "color": "#17a777ff",
    "allDay": false,
    "assignee_firstname": [
      "มารุต"
    ],
    "department_name": "ฝ่ายช่าง",
    "license_plate": null
  },
  { // New 2: ทักษ์ดนัย & วีระศักดิ์ ไม่ว่าง วันที่ 18 ธันวาคม (14:00 - 16:00 Local)
    "id": 1002,
    "type": "Service",
    "name": "Service: ตรวจสอบระบบ",
    "start": "2025-12-18T07:00:00.000Z", // 14:00 Local
    "end": "2025-12-18T09:00:00.000Z",   // 16:00 Local
    "color": "#ff7043",
    "allDay": false,
    "assignee_firstname": [
      "ทักษ์ดนัย",
      "วีระศักดิ์"
    ],
    "department_name": "ฝ่าย IT Supprot",
    "license_plate": null
  },
  { // New 3: กรต ไม่ว่าง วันที่ 26 ธันวาคม (08:00 - 10:00 Local)
    "id": 1003,
    "type": "Service",
    "name": "Service: ซ่อมบำรุงประจำปี",
    "start": "2025-12-26T01:00:00.000Z", // 08:00 Local
    "end": "2025-12-26T03:00:00.000Z",   // 10:00 Local
    "color": "#a83577",
    "allDay": false,
    "assignee_firstname": [
      "กรต"
    ],
    "department_name": "ฝ่ายออกแบบ",
    "license_plate": null
  },

  // ------------------- EXISTING SERVICE EVENTS (คงเดิม) -------------------

  {
    "id": 140,
    "type": "Service",
    "name": "ซ่อมประตูบ้าน",
    "start": "2025-12-29T08:00:00.000Z",
    "end": "2025-12-29T09:00:00.000Z",
    "color": "#77a717ff",
    "allDay": false,
    "assignee_firstname": [
      "กรต"
    ],
    "department_name": "ฝ่ายออกแบบ",
    "license_plate": null
  },
  {
    "id": 141,
    "type": "Service",
    "name": "ddd",
    "start": "2025-12-04T01:00:00.000Z",
    "end": "2025-12-04T11:00:00.000Z",
    "color": "#c7afaf",
    "allDay": false,
    "assignee_firstname": [
      "วีระศักดิ์"
    ],
    "department_name": "ฝ่าย IT Supprot",
    "license_plate": null
  },
  {
    "id": 142, // กิจกรรม piriwat วันที่ 8
    "type": "Service",
    "name": "ประชุมกับพี่วัต",
    "start": "2025-12-08T01:00:00.000Z",
    "end": "2025-12-08T04:00:00.000Z",
    "color": "#c7afaf",
    "allDay": false,
    "assignee_firstname": [
      "piriwat"
    ],
    "department_name": "ฝ่าย IT Supprot",
    "license_plate": null
  },
  {
    "id": 144, // กิจกรรม piriwat วันที่ 11
    "type": "Service",
    "name": "ประชุมกับพี่วัต",
    "start": "2025-12-11T01:00:00.000Z",
    "end": "2025-12-11T04:00:00.000Z",
    "color": "#c7afaf",
    "allDay": false,
    "assignee_firstname": [
      "piriwat"
    ],
    "department_name": "ฝ่าย IT Supprot",
    "license_plate": null
  },
  {
    "id": 145, // กิจกรรม partner1 & partner2 วันที่ 12
    "type": "Service",
    "name": "ประชุมกับพี่วัต",
    "start": "2025-12-12T01:00:00.000Z",
    "end": "2025-12-12T04:00:00.000Z",
    "color": "#c7afaf",
    "allDay": false,
    "assignee_firstname": [
      "partner1",
      "partner2"
    ],
    "department_name": "ฝ่าย IT Supprot",
    "license_plate": null
  },
  {
    "id": 146, // กิจกรรม ทักษ์ดนัย & partner1 วันที่ 13
    "type": "Service",
    "name": "ประชุมกับพี่วัต",
    "start": "2025-12-13T01:00:00.000Z",
    "end": "2025-12-13T11:00:00.000Z",
    "color": "#c7afaf",
    "allDay": false,
    "assignee_firstname": [
      "ทักษ์ดนัย",
      "partner1"
    ],
    "department_name": "ฝ่าย IT Supprot",
    "license_plate": null
  },
  {
    "id": 147, // กิจกรรม ทักษ์ดนัย & piriwat วันที่ 14
    "type": "Service",
    "name": "ประชุมกับพี่วัต",
    "start": "2025-12-14T02:00:00.000Z",
    "end": "2025-12-14T01:00:00.000Z",
    "color": "#c7afaf",
    "allDay": false,
    "assignee_firstname": [
      "ทักษ์ดนัย",
      "piriwat"
    ],
    "department_name": "ฝ่าย IT Supprot",
    "license_plate": null
  },
  {
    "id": 145, // กิจกรรม ทักษ์ดนัย & partner2 วันที่ 15
    "type": "Service",
    "name": "ประชุมกับพี่วัต",
    "start": "2025-12-15T01:00:00.000Z",
    "end": "2025-12-15T11:00:00.000Z",
    "color": "#c7afaf",
    "allDay": false,
    "assignee_firstname": [
      "ทักษ์ดนัย",
      "partner2"
    ],
    "department_name": "ฝ่าย IT Supprot",
    "license_plate": null
  },
  {
    "id": 146, // กิจกรรม สัมฤทธิ์ & partner1 วันที่ 22
    "type": "Service",
    "name": "ประชุมกับพี่วัต",
    "start": "2025-12-22T01:00:00.000Z",
    "end": "2025-12-22T11:00:00.000Z",
    "color": "#c7afaf",
    "allDay": false,
    "assignee_firstname": [
      "สัมฤทธิ์",
      "partner1"
    ],
    "department_name": "ฝ่าย IT Supprot",
    "license_plate": null
  },
  {
    "id": 147, // กิจกรรม สัมฤทธิ์ & partner2 วันที่ 24
    "type": "Service",
    "name": "ประชุมกับพี่วัต",
    "start": "2025-12-24T01:00:00.000Z",
    "end": "2025-12-24T11:00:00.000Z",
    "color": "#c7afaf",
    "allDay": false,
    "assignee_firstname": [
      "สัมฤทธิ์",
      "partner2"
    ],
    "department_name": "ฝ่าย IT Supprot",
    "license_plate": null
  },
  {
    "id": 148, // กิจกรรม สัมฤทธิ์ & partner2 วันที่ 24 (ซ้ำ)
    "type": "Service",
    "name": "ประชุมกับพี่วัต",
    "start": "2025-12-24T01:00:00.000Z",
    "end": "2025-12-24T11:00:00.000Z",
    "color": "#c7afaf",
    "allDay": false,
    "assignee_firstname": [
      "สัมฤทธิ์",
      "partner2"
    ],
    "department_name": "ฝ่าย IT Supprot",
    "license_plate": null
  },
  {
    "id": 149, // กิจกรรม กรต & piriwat วันที่ 23
    "type": "Service",
    "name": "ประชุมกับพี่วัต",
    "start": "2025-12-23T01:00:00.000Z",
    "end": "2025-12-23T11:00:00.000Z",
    "color": "#c7afaf",
    "allDay": false,
    "assignee_firstname": [
      "กรต",
      "piriwat"
    ],
    "department_name": "ฝ่าย IT Supprot",
    "license_plate": null
  },
  {
    "id": 150, // กิจกรรม วีระศักดิ์ วันที่ 30
    "type": "Service",
    "name": "ประชุมกับพี่วัต",
    "start": "2025-12-30T01:00:00.000Z",
    "end": "2025-12-30T04:00:00.000Z",
    "color": "#c7afaf",
    "allDay": false,
    "assignee_firstname": [
      "วีระศักดิ์"
    ],
    "department_name": "ฝ่าย IT Supprot",
    "license_plate": null
  },
    
];