/**
 * calendarService.js
 * Comprehensive utility for generating Google Calendar URLs with direct "Save" button
 * and client-side .ics iCalendar downloads with recurring daily dosage alarms.
 * Works 100% in the browser without relying on remote server endpoints.
 */

/**
 * Format a Date object into YYYYMMDDTHHmmss local format for Google Calendar template
 */
export function formatGoogleCalendarDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${y}${m}${d}T${hh}${mm}${ss}`;
}

/**
 * Parse a raw medicines_list text into structured dosage slots, food instructions, and duration
 */
export function parseMedicineSchedule(medicinesText) {
  if (!medicinesText || typeof medicinesText !== 'string') return [];

  const lines = medicinesText
    .split(/\r?\n|;/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const results = [];

  for (const rawLine of lines) {
    // Strip leading numbering or bullet points: e.g. "1.", "1)", "-", "•"
    const cleaned = rawLine.replace(/^[0-9]+[.)]\s*|^[•\-*]\s*/, '').trim();
    if (!cleaned) continue;

    // Detect duration in days
    let days = 5;
    const durMatch = cleaned.match(/(\d+)\s*(?:days?|din|दिन|mahine|months?|weeks?|hafte)/i);
    if (durMatch) {
      const val = parseInt(durMatch[1], 10);
      const matchedUnit = durMatch[0].toLowerCase();
      if (matchedUnit.includes('month') || matchedUnit.includes('mahine')) {
        days = Math.min(val * 30, 90);
      } else if (matchedUnit.includes('week') || matchedUnit.includes('hafte')) {
        days = val * 7;
      } else {
        days = Math.min(val, 90);
      }
    }

    // Detect food instructions
    const lower = cleaned.toLowerCase();
    let food = 'After Meal (Khane ke baad)';
    if (
      lower.includes('before meal') ||
      lower.includes('before food') ||
      lower.includes('ac') ||
      lower.includes('khali pet') ||
      lower.includes('before breakfast') ||
      lower.includes('empty stomach')
    ) {
      food = 'Before Meal (Khali pet)';
    } else if (
      lower.includes('bedtime') ||
      lower.includes('sone se pehle') ||
      lower.includes('hs') ||
      lower.includes('at night') ||
      lower.includes('raat ko')
    ) {
      food = 'At Bedtime (Raat ko sone se pehle)';
    } else if (
      lower.includes('after meal') ||
      lower.includes('after food') ||
      lower.includes('pc') ||
      lower.includes('khane ke baad') ||
      lower.includes('post meal')
    ) {
      food = 'After Meal (Khane ke baad)';
    }

    // Detect dosage frequency and slots
    let slots = [];
    if (
      lower.includes('1-1-1-1') ||
      lower.includes('qid') ||
      lower.includes('4 times') ||
      lower.includes('char bar') ||
      lower.includes('4 bar')
    ) {
      slots = [
        { label: 'Morning Dose', hour: 8, minute: 0, timeStr: '08:00 AM' },
        { label: 'Afternoon Dose', hour: 13, minute: 0, timeStr: '01:00 PM' },
        { label: 'Evening Dose', hour: 17, minute: 30, timeStr: '05:30 PM' },
        { label: 'Night Dose', hour: 21, minute: 0, timeStr: '09:00 PM' }
      ];
    } else if (
      lower.includes('1-1-1') ||
      lower.includes('tid') ||
      lower.includes('thrice') ||
      lower.includes('3 times') ||
      lower.includes('teen bar') ||
      lower.includes('3 bar') ||
      lower.includes('subah dopahar raat')
    ) {
      slots = [
        { label: 'Morning Dose', hour: 8, minute: 30, timeStr: '08:30 AM' },
        { label: 'Afternoon Dose', hour: 13, minute: 30, timeStr: '01:30 PM' },
        { label: 'Night Dose', hour: 20, minute: 30, timeStr: '08:30 PM' }
      ];
    } else if (
      lower.includes('1-0-1') ||
      lower.includes('bd') ||
      lower.includes('bid') ||
      lower.includes('twice') ||
      lower.includes('2 times') ||
      lower.includes('do bar') ||
      lower.includes('2 bar') ||
      lower.includes('subah shaam') ||
      lower.includes('subah raat')
    ) {
      slots = [
        { label: 'Morning Dose', hour: 8, minute: 30, timeStr: '08:30 AM' },
        { label: 'Night Dose', hour: 20, minute: 30, timeStr: '08:30 PM' }
      ];
    } else if (
      lower.includes('0-0-1') ||
      lower.includes('bedtime') ||
      lower.includes('night only') ||
      lower.includes('hs') ||
      lower.includes('raat ko')
    ) {
      slots = [{ label: 'Night Dose', hour: 21, minute: 30, timeStr: '09:30 PM' }];
    } else if (lower.includes('0-1-0') || lower.includes('afternoon') || lower.includes('dopahar')) {
      slots = [{ label: 'Afternoon Dose', hour: 13, minute: 30, timeStr: '01:30 PM' }];
    } else {
      slots = [{ label: 'Morning Dose', hour: 8, minute: 30, timeStr: '08:30 AM' }];
    }

    // Extract medicine name
    const parts = cleaned.split(/\s*[-—–]\s*|\s+for\s+/i);
    const medName = parts[0].trim();

    results.push({
      raw: cleaned,
      medicine: medName || cleaned,
      slots,
      food,
      days
    });
  }

  return results;
}

/**
 * Generate a direct Google Calendar Web URL for a specific dosage reminder
 * When opened, Google Calendar will present the event with the blue "Save" button.
 */
export function buildGoogleCalendarUrl({
  title,
  details,
  location = 'Home / Medicine Box',
  startDate,
  durationMinutes = 15,
  recurDays = 5
}) {
  const start = new Date(startDate);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const startStr = formatGoogleCalendarDate(start);
  const endStr = formatGoogleCalendarDate(end);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startStr}/${endStr}`,
    details: details,
    location: location
  });

  if (recurDays && recurDays > 1) {
    params.set('recur', `RRULE:FREQ=DAILY;COUNT=${recurDays}`);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Build master Google Calendar URL containing all medicines scheduled for the patient
 */
export function buildMasterGoogleCalendarUrl({
  medicinesText,
  patientName = 'Patient',
  doctorName = 'Dr. Shweta Grover',
  hospitalName = 'Vedam Diagnostics'
}) {
  const parsed = parseMedicineSchedule(medicinesText);
  const maxDays = parsed.reduce((acc, m) => Math.max(acc, m.days), 5);

  const title = `💊 Daily Medicine Schedule - ${patientName}`;
  const detailsList = parsed
    .map((m) => {
      const times = m.slots.map((s) => `${s.label} (${s.timeStr})`).join(', ');
      return `• ${m.medicine}\n  Timing: ${times}\n  Instruction: ${m.food}\n  Duration: ${m.days} days`;
    })
    .join('\n\n');

  const fullDetails = `HospiSynAI Digital Prescription Medicine Schedule\n` +
    `Patient: ${patientName}\n` +
    `Prescribed by: ${doctorName}\n` +
    `Hospital: ${hospitalName}\n\n` +
    `DAILY DOSAGE REMINDERS:\n${detailsList}\n\n` +
    `Elder Care Reminder: Take medicines with water on time as advised by doctor.`;

  // Start with morning 08:30 AM today
  const today = new Date();
  today.setHours(8, 30, 0, 0);

  return buildGoogleCalendarUrl({
    title,
    details: fullDetails,
    location: hospitalName,
    startDate: today,
    durationMinutes: 30,
    recurDays: maxDays
  });
}

/**
 * Parse follow-up date string (handles ISO YYYY-MM-DD or phrases like "Review in 3 days", "after 1 week")
 */
export function parseFollowUpDate(followUpText) {
  const d = new Date();
  if (!followUpText) {
    d.setDate(d.getDate() + 3); // default to 3 days
    return d;
  }

  // Check if direct valid date
  const directDate = new Date(followUpText);
  if (!isNaN(directDate.getTime()) && directDate.getFullYear() >= 2024) {
    return directDate;
  }

  const str = String(followUpText).toLowerCase();

  // Match days: e.g. "3 days", "2-3 days", "in 5 days"
  const dayMatch = str.match(/(\d+)\s*(?:-|to)?\s*\d*\s*day/);
  if (dayMatch) {
    const days = parseInt(dayMatch[1], 10) || 3;
    d.setDate(d.getDate() + days);
    return d;
  }

  // Match weeks: e.g. "1 week", "2 weeks", "after 4 weeks"
  const weekMatch = str.match(/(\d+)\s*(?:-|to)?\s*\d*\s*week/);
  if (weekMatch) {
    const weeks = parseInt(weekMatch[1], 10) || 1;
    d.setDate(d.getDate() + (weeks * 7));
    return d;
  }

  // Match months: e.g. "1 month"
  const monthMatch = str.match(/(\d+)\s*(?:-|to)?\s*\d*\s*month/);
  if (monthMatch) {
    const months = parseInt(monthMatch[1], 10) || 1;
    d.setMonth(d.getMonth() + months);
    return d;
  }

  if (str.includes('tomorrow')) {
    d.setDate(d.getDate() + 1);
    return d;
  }

  // Fallback: 3 days from today
  d.setDate(d.getDate() + 3);
  return d;
}

/**
 * Build Google Calendar URL for Follow-Up Doctor Consultation
 */
export function buildFollowUpGoogleCalendarUrl({
  followUpDate,
  patientName = 'Patient',
  doctorName = 'Dr. Shweta Grover',
  hospitalName = 'Vedam Diagnostics'
}) {
  const apptDate = parseFollowUpDate(followUpDate);
  // Default follow-up appointment time to 10:30 AM
  apptDate.setHours(10, 30, 0, 0);

  const title = `🩺 Doctor Follow-Up Consultation: ${doctorName}`;
  const details = `HospiSynAI OPD Follow-Up Consultation\n` +
    `Patient: ${patientName}\n` +
    `Consulting Doctor: ${doctorName}\n` +
    `Hospital: ${hospitalName}\n` +
    `Advised Timeframe: ${followUpDate || 'Routine OPD Follow-Up'}\n\n` +
    `Please bring past prescription, test reports, and HospiSynAI Health Pass during the visit.`;

  return buildGoogleCalendarUrl({
    title,
    details,
    location: hospitalName,
    startDate: apptDate,
    durationMinutes: 45,
    recurDays: 1
  });
}

/**
 * Client-Side .ICS File Generator
 * Creates an iCalendar .ics file directly in browser memory and downloads it.
 * Zero dependency on external backend; works immediately anywhere.
 */
export function downloadClientIcsFile({
  medicinesText,
  followUpDate = null,
  patientName = 'Patient',
  doctorName = 'Dr. Shweta Grover',
  hospitalName = 'Vedam Diagnostics'
}) {
  const parsed = parseMedicineSchedule(medicinesText);
  const now = new Date();
  const formatIcsDt = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  };

  const stamp = formatIcsDt(now);

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HospiSynAI//MedicineReminders//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:HospiSynAI - ${patientName} Medicine Reminders`,
    `X-WR-TIMEZONE:Asia/Kolkata`
  ];

  parsed.forEach((med, mIdx) => {
    med.slots.forEach((slot, sIdx) => {
      const startDate = new Date();
      startDate.setHours(slot.hour, slot.minute, 0, 0);
      const endDate = new Date(startDate.getTime() + 15 * 60 * 1000);

      const uid = `med-${Date.now()}-${mIdx}-${sIdx}@hospisyn.ai`;

      ics.push('BEGIN:VEVENT');
      ics.push(`UID:${uid}`);
      ics.push(`DTSTAMP:${stamp}`);
      ics.push(`DTSTART:${formatIcsDt(startDate)}`);
      ics.push(`DTEND:${formatIcsDt(endDate)}`);
      ics.push(`RRULE:FREQ=DAILY;COUNT=${med.days}`);
      ics.push(`SUMMARY:💊 Take ${med.medicine} (${slot.label})`);
      ics.push(
        `DESCRIPTION:Medicine: ${med.medicine}\\nDosage Time: ${slot.timeStr}\\nInstruction: ${med.food}\\nDuration: ${med.days} days\\nPrescribed by: ${doctorName}\\nHospital: ${hospitalName}`
      );
      ics.push(`LOCATION:Home / Medicine Box`);
      ics.push(`STATUS:CONFIRMED`);

      // Native audio & visual alarm
      ics.push('BEGIN:VALARM');
      ics.push('TRIGGER:-PT0M');
      ics.push('ACTION:DISPLAY');
      ics.push(`DESCRIPTION:🔔 Time to take ${med.medicine} (${med.food})`);
      ics.push('END:VALARM');

      // 10 minutes prior heads-up alarm
      ics.push('BEGIN:VALARM');
      ics.push('TRIGGER:-PT10M');
      ics.push('ACTION:DISPLAY');
      ics.push(`DESCRIPTION:⏰ Upcoming Medicine: Take ${med.medicine} in 10 minutes`);
      ics.push('END:VALARM');

      ics.push('END:VEVENT');
    });
  });

  // Add follow-up appointment event if set
  if (followUpDate) {
    let fDate = new Date(followUpDate);
    if (isNaN(fDate.getTime())) {
      fDate = new Date();
      fDate.setDate(fDate.getDate() + 7);
    }
    fDate.setHours(10, 30, 0, 0);
    const fEnd = new Date(fDate.getTime() + 45 * 60 * 1000);

    ics.push('BEGIN:VEVENT');
    ics.push(`UID:followup-${Date.now()}@hospisyn.ai`);
    ics.push(`DTSTAMP:${stamp}`);
    ics.push(`DTSTART:${formatIcsDt(fDate)}`);
    ics.push(`DTEND:${formatIcsDt(fEnd)}`);
    ics.push(`SUMMARY:🩺 Doctor Follow-Up: ${doctorName}`);
    ics.push(
      `DESCRIPTION:Follow-Up Consultation at ${hospitalName}\\nPatient: ${patientName}\\nDoctor: ${doctorName}\\nPlease bring your prescription and previous lab reports.`
    );
    ics.push(`LOCATION:${hospitalName}`);
    ics.push('BEGIN:VALARM');
    ics.push('TRIGGER:-PT120M'); // 2 hours before
    ics.push('ACTION:DISPLAY');
    ics.push(`DESCRIPTION:🩺 Reminder: Doctor Follow-up today with ${doctorName}`);
    ics.push('END:VALARM');
    ics.push('END:VEVENT');
  }

  ics.push('END:VCALENDAR');

  const icsContent = ics.join('\r\n');
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const downloadUrl = URL.createObjectURL(blob);

  const cleanName = (patientName || 'patient').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const filename = `medicine_alarms_${cleanName}.ics`;

  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);

  return true;
}
