import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Bell,
  CheckCircle2,
  ExternalLink,
  Download,
  X,
  Pill,
  Shield,
  Sparkles,
  Smartphone,
  ChevronRight
} from 'lucide-react';
import {
  parseMedicineSchedule,
  buildGoogleCalendarUrl,
  buildMasterGoogleCalendarUrl,
  buildFollowUpGoogleCalendarUrl,
  downloadClientIcsFile
} from '../utils/calendarService';

export default function MedicineCalendarModal({
  isOpen,
  onClose,
  visit,
  patientName = 'Nisha Patel',
  doctorName = 'Dr. Shweta Grover',
  hospitalName = 'Vedam Diagnostics',
  showToast
}) {
  if (!isOpen || !visit) return null;

  const medicinesText = visit.medicines_list || '';
  const followUpDate = visit.follow_up_date || null;
  const parsedMeds = parseMedicineSchedule(medicinesText);

  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleOpenMasterGoogleCalendar = () => {
    const url = buildMasterGoogleCalendarUrl({
      medicinesText,
      patientName,
      doctorName,
      hospitalName
    });
    window.open(url, '_blank');
    if (showToast) {
      showToast('Opening Google Calendar! Tap the blue "Save" button to set reminders.', 'success');
    }
  };

  const handleOpenSingleDoseGoogleCalendar = (med, slot) => {
    const today = new Date();
    today.setHours(slot.hour, slot.minute, 0, 0);

    const title = `💊 Take ${med.medicine} (${slot.label})`;
    const details = `HospiSynAI Medicine Reminder\n` +
      `Medicine: ${med.medicine}\n` +
      `Timing: ${slot.timeStr} (${slot.label})\n` +
      `Instructions: ${med.food}\n` +
      `Course: ${med.days} days\n` +
      `Patient: ${patientName}\n` +
      `Doctor: ${doctorName}\n` +
      `Hospital: ${hospitalName}\n\n` +
      `Elder Care Tip: Take your pill with a glass of water on time.`;

    const url = buildGoogleCalendarUrl({
      title,
      details,
      location: hospitalName,
      startDate: today,
      durationMinutes: 15,
      recurDays: med.days
    });

    window.open(url, '_blank');
    if (showToast) {
      showToast(`Opening Google Calendar for ${med.medicine}! Tap "Save" to finish.`, 'success');
    }
  };

  const handleOpenFollowUpGoogleCalendar = () => {
    if (!followUpDate) return;
    const url = buildFollowUpGoogleCalendarUrl({
      followUpDate,
      patientName,
      doctorName,
      hospitalName
    });
    window.open(url, '_blank');
    if (showToast) {
      showToast('Opening Google Calendar for Follow-up! Tap "Save" to finish.', 'success');
    }
  };

  const handleDownloadIcs = () => {
    try {
      downloadClientIcsFile({
        medicinesText,
        followUpDate,
        patientName,
        doctorName,
        hospitalName
      });
      setDownloadSuccess(true);
      if (showToast) {
        showToast('📅 Calendar .ics downloaded! Open it to add alarms with sound to your phone.', 'success');
      }
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (e) {
      console.error(e);
      if (showToast) {
        showToast('Could not generate calendar file. Please use Google Calendar button.', 'error');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-teal-500/10 via-cyan-500/5 to-indigo-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20 flex-shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                Set Reminders for Medicines & Timetable
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically configures daily dosage notifications with 1-click Save
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 compact-scroll">
          {/* Patient & Doctor Context Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span className="text-slate-400 font-medium">Patient:</span>
              <strong className="font-bold">{patientName}</strong>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span className="text-slate-400 font-medium">Doctor:</span>
              <strong className="font-bold">{doctorName}</strong>
            </div>
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <Shield className="w-3 h-3" />
              <span>{hospitalName}</span>
            </div>
          </div>

          {/* PRIMARY OPTION 1: Google Calendar Direct Save */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-teal-50/60 dark:from-indigo-950/30 dark:to-teal-950/20 border-2 border-indigo-200 dark:border-indigo-800/60 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-indigo-600 text-white rounded-md inline-block mb-1">
                  Recommended • 1-Click Save
                </span>
                <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Open in Google Calendar
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Opens Google Calendar directly in a new tab with your recurring daily medicine schedule already filled in. Simply click the blue <strong>"Save"</strong> button!
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenMasterGoogleCalendar}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 active:scale-98 cursor-pointer group"
            >
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              <span>Open Google Calendar & Click "Save"</span>
            </button>
          </div>

          {/* Prescribed Dosage Schedule Breakdown */}
          {parsedMeds.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-teal-600" />
                  Specific Dosage Timings ({parsedMeds.length} Medication{parsedMeds.length > 1 ? 's' : ''})
                </span>
                <span className="text-[11px] text-slate-400">Click any dose to add individual alarm</span>
              </div>

              <div className="space-y-2">
                {parsedMeds.map((med, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-2xs hover:border-teal-300 dark:hover:border-teal-700 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                          {med.medicine}
                        </p>
                        <p className="text-[11px] text-teal-700 dark:text-teal-300 font-medium mt-0.5">
                          {med.food} • Course: {med.days} Days
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {med.slots.map((slot, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleOpenSingleDoseGoogleCalendar(med, slot)}
                            className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                            title={`Add ${slot.label} (${slot.timeStr}) alarm to Google Calendar with Save button`}
                          >
                            <Clock className="w-3 h-3 text-teal-600" />
                            <span>{slot.label}: {slot.timeStr}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* OPTION 2: Download .ics for Phone / Device Calendar */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Download Calendar File (.ics)
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Best for iPhone Calendar, Samsung Calendar, or Outlook. Includes sound alarms.
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadIcs}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 flex-shrink-0 active:scale-95 cursor-pointer"
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .ics File</span>
                </>
              )}
            </button>
          </div>

          {/* OPTION 3: Doctor Follow-Up Consultation Date */}
          {followUpDate && (
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 block mb-0.5">
                  Doctor Follow-Up Consultation
                </span>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Scheduled for: <strong>{followUpDate}</strong>
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  Consulting Doctor: {doctorName} ({hospitalName})
                </p>
              </div>

              <button
                onClick={handleOpenFollowUpGoogleCalendar}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 flex-shrink-0 active:scale-95 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Save Follow-up to Calendar</span>
              </button>
            </div>
          )}

          {/* Helpful Elder Care Tip Note */}
          <div className="p-3 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 rounded-xl text-xs text-teal-800 dark:text-teal-200 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Elder Care Note:</strong> Once saved in Google Calendar or your phone calendar, daily reminders will ring with audio alerts at each mealtime so medicines are never forgotten.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 sm:px-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Done / Close
          </button>
        </div>
      </div>
    </div>
  );
}
