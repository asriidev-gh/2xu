'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import DashboardAdminHeader from '@/components/DashboardAdminHeader';
import { formatCompletedAgeLabel, getAgeYearsFromBirthday } from '@/lib/completedAge';

type RaceEventRow = {
  _id: string;
  name: string;
  details: string;
  location: string;
  eventDateTime: string | null;
  participantUserIds: string[];
  participantRanks?: Record<string, number>;
  createdAt: string | null;
  updatedAt: string | null;
};

type PickerUser = {
  _id: string;
  name: string;
  birthday: string;
  affiliations: string;
  promoCode?: string;
};

type ParticipantRow = {
  _id: string;
  name: string;
  email: string;
  birthday: string;
  affiliations: string;
  promoCode?: string;
  createdBy?: string;
  overallRank?: number | null;
};

const fieldClass =
  'w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm font-sweet-sans text-sm transition-colors hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500';

const btnPrimary =
  'inline-flex items-center justify-center px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-fira-sans font-medium shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500/30 disabled:opacity-50';

const btnSecondary =
  'inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 text-sm font-fira-sans font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20';

function formatEventWhen(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/** Rank 1 first; unranked rows last (name order). */
function sortParticipantsByOverallRank<T extends { _id: string; name?: string; overallRank?: number | null }>(
  rows: T[],
  rankMap: Record<string, number>
): T[] {
  const resolvedRank = (row: T): number | null => {
    const fromMap = rankMap[row._id];
    if (typeof fromMap === 'number' && Number.isFinite(fromMap)) return fromMap;
    const o = row.overallRank;
    if (typeof o === 'number' && Number.isFinite(o)) return o;
    return null;
  };
  return [...rows].sort((a, b) => {
    const ra = resolvedRank(a);
    const rb = resolvedRank(b);
    const aHas = ra != null;
    const bHas = rb != null;
    if (aHas && bHas) return (ra as number) - (rb as number);
    if (aHas && !bHas) return -1;
    if (!aHas && bHas) return 1;
    return String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' });
  });
}

export default function RaceEventsPage() {
  const router = useRouter();
  const [emailBlastEnabled, setEmailBlastEnabled] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [events, setEvents] = useState<RaceEventRow[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedEventDetails, setSelectedEventDetails] = useState<RaceEventRow | null>(null);
  const [selectedEventParticipants, setSelectedEventParticipants] = useState<ParticipantRow[]>([]);
  const [detailsParticipantRanks, setDetailsParticipantRanks] = useState<Record<string, number>>({});
  const [detailsRankEditingId, setDetailsRankEditingId] = useState<string | null>(null);
  const [detailsRankSaving, setDetailsRankSaving] = useState(false);

  const [view, setView] = useState<'list' | 'wizard'>('list');
  const [step, setStep] = useState<1 | 2>(1);
  const [eventId, setEventId] = useState<string | null>(null);
  const [savingStep1, setSavingStep1] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDetails, setEventDetails] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDateTimeLocal, setEventDateTimeLocal] = useState('');

  const [participantUserIds, setParticipantUserIds] = useState<string[]>([]);
  const [participantsDetail, setParticipantsDetail] = useState<ParticipantRow[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);

  const [pickerName, setPickerName] = useState('');
  const [pickerPage, setPickerPage] = useState(1);
  const pickerLimit = 25;
  const [pickerTotalPages, setPickerTotalPages] = useState(1);
  const [pickerUsers, setPickerUsers] = useState<PickerUser[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  const [manualOpen, setManualOpen] = useState(false);
  const [manualSaving, setManualSaving] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualBirthday, setManualBirthday] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualContact, setManualContact] = useState('');
  const [manualGender, setManualGender] = useState('Male');

  const participantSet = useMemo(() => new Set(participantUserIds), [participantUserIds]);

  const sortedDetailParticipants = useMemo(
    () => sortParticipantsByOverallRank(selectedEventParticipants, detailsParticipantRanks),
    [selectedEventParticipants, detailsParticipantRanks]
  );

  const sortedWizardParticipants = useMemo(
    () => sortParticipantsByOverallRank(participantsDetail, {}),
    [participantsDetail]
  );

  const fetchConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/users/config');
      if (response.ok) {
        const data = await response.json();
        setEmailBlastEnabled(data.emailBlastEnabled === true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const loadEvents = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await fetch('/api/race-events');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load events');
      setEvents(data.events || []);
    } catch (e) {
      console.error(e);
      await Swal.fire({
        title: 'Error',
        text: 'Could not load race events.',
        icon: 'error',
        confirmButtonColor: '#ea580c',
      });
    } finally {
      setListLoading(false);
    }
  }, [router]);

  const openEventDetails = useCallback(
    async (id: string) => {
      setDetailsOpen(true);
      setDetailsLoading(true);
      try {
        const res = await fetch(`/api/race-events/${id}`);
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load event details');
        const ev = data.event || null;
        setSelectedEventDetails(ev);
        setSelectedEventParticipants(data.participants || []);
        setDetailsParticipantRanks(
          ev?.participantRanks && typeof ev.participantRanks === 'object' ? { ...ev.participantRanks } : {}
        );
        setDetailsRankEditingId(null);
      } catch (error) {
        setDetailsOpen(false);
        setSelectedEventDetails(null);
        setSelectedEventParticipants([]);
        setDetailsParticipantRanks({});
        setDetailsRankEditingId(null);
        const msg = error instanceof Error ? error.message : 'Could not load event details.';
        await Swal.fire({
          title: 'Error',
          text: msg,
          icon: 'error',
          confirmButtonColor: '#ea580c',
        });
      } finally {
        setDetailsLoading(false);
      }
    },
    [router]
  );

  const saveDetailsParticipantRanks = useCallback(
    async (nextMap: Record<string, number>): Promise<boolean> => {
      const id = selectedEventDetails?._id;
      if (!id) return false;
      setDetailsRankSaving(true);
      try {
        const res = await fetch(`/api/race-events/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ participantRanks: nextMap }),
        });
        const data = await res.json();
        if (res.status === 401) {
          router.push('/login');
          return false;
        }
        if (!res.ok) throw new Error(data.error || 'Failed to save rank');
        const ranksOut =
          data.event?.participantRanks && typeof data.event.participantRanks === 'object'
            ? { ...data.event.participantRanks }
            : nextMap;
        setDetailsParticipantRanks(ranksOut);
        setSelectedEventDetails((prev) =>
          prev && data.event ? { ...prev, participantRanks: data.event.participantRanks } : prev
        );
        setSelectedEventParticipants((rows) =>
          rows.map((row) => ({
            ...row,
            overallRank: typeof ranksOut[row._id] === 'number' ? ranksOut[row._id] : null,
          }))
        );
        return true;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to save rank';
        await Swal.fire({ title: 'Error', text: msg, icon: 'error', confirmButtonColor: '#ea580c' });
        return false;
      } finally {
        setDetailsRankSaving(false);
      }
    },
    [router, selectedEventDetails?._id]
  );

  const exportEventDetailParticipantsExcel = useCallback(() => {
    if (!selectedEventDetails || sortedDetailParticipants.length === 0) return;
    try {
      const eventTitle = selectedEventDetails.name || 'race-event';
      const rows = sortedDetailParticipants.map((p) => {
        const age = getAgeYearsFromBirthday(p.birthday);
        const rank = detailsParticipantRanks[p._id] ?? p.overallRank;
        return {
          'Overall rank': rank != null && Number.isFinite(rank) ? rank : '',
          Name: p.name,
          'Age (yrs)': age != null ? age : '',
          Email: p.email || '',
          'Promo code': p.promoCode || '',
          Club: p.affiliations || '',
          'Registrant ID': p._id,
          'Manual entry (createdBy)': p.createdBy || '',
        };
      });
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants');
      const safeFile = eventTitle.replace(/[\\/:*?"<>|]+/g, '-').trim().slice(0, 80) || 'race-event';
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      XLSX.writeFile(workbook, `${safeFile}-participants-${stamp}.xlsx`);
      void Swal.fire({
        title: 'Exported',
        text: 'Participant list downloaded.',
        icon: 'success',
        confirmButtonColor: '#ea580c',
        timer: 2000,
      });
    } catch (e) {
      console.error(e);
      void Swal.fire({
        title: 'Error',
        text: 'Could not export Excel file.',
        icon: 'error',
        confirmButtonColor: '#ea580c',
      });
    }
  }, [selectedEventDetails, sortedDetailParticipants, detailsParticipantRanks]);

  const resetAllDetailParticipantRanks = useCallback(async () => {
    if (!selectedEventDetails?._id || sortedDetailParticipants.length === 0) return;
    const hasRanks =
      Object.keys(detailsParticipantRanks).length > 0 ||
      selectedEventParticipants.some((p) => typeof p.overallRank === 'number' && Number.isFinite(p.overallRank));
    if (!hasRanks) {
      await Swal.fire({
        title: 'Nothing to reset',
        text: 'No participants have an overall rank yet.',
        icon: 'info',
        confirmButtonColor: '#ea580c',
      });
      return;
    }
    const c = await Swal.fire({
      title: 'Reset all ranks?',
      text: 'Every overall rank for this event will be cleared. You can assign ranks again afterward.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Reset all',
    });
    if (!c.isConfirmed) return;
    setDetailsRankEditingId(null);
    const ok = await saveDetailsParticipantRanks({});
    if (ok) {
      await Swal.fire({
        title: 'Ranks cleared',
        icon: 'success',
        confirmButtonColor: '#ea580c',
        timer: 1800,
      });
    }
  }, [
    selectedEventDetails?._id,
    sortedDetailParticipants.length,
    detailsParticipantRanks,
    selectedEventParticipants,
    saveDetailsParticipantRanks,
  ]);

  useEffect(() => {
    void fetchConfig();
    void loadEvents();
  }, [fetchConfig, loadEvents]);

  const refreshParticipants = useCallback(async (id: string) => {
    setParticipantsLoading(true);
    try {
      const res = await fetch(`/api/race-events/${id}`);
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load event');
      setParticipantUserIds(data.event?.participantUserIds || []);
      setParticipantsDetail(data.participants || []);
    } catch (e) {
      console.error(e);
      await Swal.fire({
        title: 'Error',
        text: 'Could not load participants.',
        icon: 'error',
        confirmButtonColor: '#ea580c',
      });
    } finally {
      setParticipantsLoading(false);
    }
  }, [router]);

  const fetchPickerUsers = useCallback(async () => {
    setPickerLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('page', String(pickerPage));
      q.set('limit', String(pickerLimit));
      q.set('sortBy', 'name');
      q.set('sortDir', 'asc');
      if (pickerName.trim()) q.set('name', pickerName.trim());
      const res = await fetch(`/api/users?${q.toString()}`);
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load users');
      const rows: PickerUser[] = (data.users || []).map(
        (u: { _id: string; name: string; birthday: string; affiliations: string; promoCode?: string }) => ({
          _id: u._id,
          name: u.name,
          birthday: u.birthday,
          affiliations: u.affiliations || '',
          promoCode: u.promoCode || '',
        })
      );
      setPickerUsers(rows);
      setPickerTotalPages(data.totalPages ?? 1);
    } catch (e) {
      console.error(e);
    } finally {
      setPickerLoading(false);
    }
  }, [pickerPage, pickerName, router]);

  useEffect(() => {
    if (view === 'wizard' && step === 2 && eventId) {
      void refreshParticipants(eventId);
    }
  }, [view, step, eventId, refreshParticipants]);

  useEffect(() => {
    if (view === 'wizard' && step === 2 && eventId) {
      void fetchPickerUsers();
    }
  }, [view, step, eventId, fetchPickerUsers]);

  useEffect(() => {
    setPickerPage(1);
  }, [pickerName]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  const resetWizardForm = () => {
    setStep(1);
    setEventId(null);
    setEventName('');
    setEventDetails('');
    setEventLocation('');
    setEventDateTimeLocal('');
    setParticipantUserIds([]);
    setParticipantsDetail([]);
    setPickerName('');
    setPickerPage(1);
  };

  const openCreate = () => {
    resetWizardForm();
    setView('wizard');
  };

  const openEdit = async (row: RaceEventRow) => {
    setEventId(row._id);
    setEventName(row.name);
    setEventDetails(row.details || '');
    setEventLocation(row.location || '');
    if (row.eventDateTime) {
      const d = new Date(row.eventDateTime);
      const pad = (n: number) => String(n).padStart(2, '0');
      const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      setEventDateTimeLocal(local);
    } else {
      setEventDateTimeLocal('');
    }
    setParticipantUserIds(row.participantUserIds || []);
    setStep(1);
    setView('wizard');
  };

  const toIsoFromDatetimeLocal = (v: string) => {
    if (!v.trim()) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  };

  const handleNextStep1 = async () => {
    const iso = toIsoFromDatetimeLocal(eventDateTimeLocal);
    if (!eventName.trim()) {
      await Swal.fire({ title: 'Name required', text: 'Enter an event name.', icon: 'warning', confirmButtonColor: '#ea580c' });
      return;
    }
    if (!iso) {
      await Swal.fire({
        title: 'Date required',
        text: 'Choose a valid event date and time.',
        icon: 'warning',
        confirmButtonColor: '#ea580c',
      });
      return;
    }

    setSavingStep1(true);
    try {
      if (eventId) {
        const res = await fetch(`/api/race-events/${eventId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: eventName.trim(),
            details: eventDetails,
            location: eventLocation.trim(),
            eventDateTime: iso,
          }),
        });
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Update failed');
      } else {
        const res = await fetch('/api/race-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: eventName.trim(),
            details: eventDetails,
            location: eventLocation.trim(),
            eventDateTime: iso,
            participantUserIds: [],
          }),
        });
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Create failed');
        setEventId(data.event._id);
      }
      setStep(2);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      await Swal.fire({ title: 'Error', text: msg, icon: 'error', confirmButtonColor: '#ea580c' });
    } finally {
      setSavingStep1(false);
    }
  };

  const patchParticipants = async (nextIds: string[]) => {
    if (!eventId) return;
    const res = await fetch(`/api/race-events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantUserIds: nextIds }),
    });
    if (res.status === 401) {
      router.push('/login');
      return;
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update participants');
    setParticipantUserIds(data.event.participantUserIds || nextIds);
    await refreshParticipants(eventId);
  };

  const handleAddFromPicker = async (userId: string) => {
    if (!eventId || participantSet.has(userId)) return;
    try {
      await patchParticipants([...participantUserIds, userId]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Update failed';
      await Swal.fire({ title: 'Error', text: msg, icon: 'error', confirmButtonColor: '#ea580c' });
    }
  };

  const handleRemoveParticipant = async (userId: string) => {
    if (!eventId) return;
    try {
      await patchParticipants(participantUserIds.filter((id) => id !== userId));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Update failed';
      await Swal.fire({ title: 'Error', text: msg, icon: 'error', confirmButtonColor: '#ea580c' });
    }
  };

  const handleBackToStep1 = () => {
    setStep(1);
  };

  const finishWizard = async () => {
    await loadEvents();
    setView('list');
    resetWizardForm();
    await Swal.fire({
      title: 'Saved',
      text: 'Race event has been saved.',
      icon: 'success',
      confirmButtonColor: '#ea580c',
      timer: 1800,
    });
  };

  const handleDeleteEvent = async (row: RaceEventRow) => {
    const c = await Swal.fire({
      title: 'Delete event?',
      text: `"${row.name}" will be removed. Registrant records are not deleted.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete',
    });
    if (!c.isConfirmed) return;
    try {
      const res = await fetch(`/api/race-events/${row._id}`, { method: 'DELETE' });
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      await loadEvents();
      await Swal.fire({ title: 'Deleted', icon: 'success', confirmButtonColor: '#ea580c', timer: 1500 });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Delete failed';
      await Swal.fire({ title: 'Error', text: msg, icon: 'error', confirmButtonColor: '#ea580c' });
    }
  };

  const closeManual = () => {
    setManualOpen(false);
    setManualName('');
    setManualBirthday('');
    setManualEmail('');
    setManualContact('');
    setManualGender('Male');
  };

  const submitManual = async () => {
    if (!eventId) return;
    if (!manualName.trim() || !manualEmail.trim() || !manualContact.trim() || !manualBirthday.trim()) {
      await Swal.fire({
        title: 'Missing fields',
        text: 'Fill in all manual participant fields.',
        icon: 'warning',
        confirmButtonColor: '#ea580c',
      });
      return;
    }
    setManualSaving(true);
    try {
      const res = await fetch(`/api/race-events/${eventId}/manual-participant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: manualName.trim(),
          email: manualEmail.trim(),
          contact: manualContact.trim(),
          gender: manualGender,
          birthday: manualBirthday.trim(),
        }),
      });
      const data = await res.json();
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Could not add participant');
      closeManual();
      await refreshParticipants(eventId);
      await fetchPickerUsers();
      await Swal.fire({
        title: 'Added',
        text: `Promo code for this event: RaceEvent${eventId}`,
        icon: 'success',
        confirmButtonColor: '#ea580c',
        timer: 2500,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not add participant';
      await Swal.fire({ title: 'Error', text: msg, icon: 'error', confirmButtonColor: '#ea580c' });
    } finally {
      setManualSaving(false);
    }
  };

  const promoPreview = eventId ? `RaceEvent${eventId}` : '';

  const exportRaceEventsListExcel = useCallback(() => {
    if (events.length === 0) return;
    try {
      const rows = events.map((ev) => ({
        'Event name': ev.name,
        'Date & time': formatEventWhen(ev.eventDateTime),
        Location: ev.location || '',
        Participants: ev.participantUserIds?.length ?? 0,
        Details: ev.details || '',
        'Event ID': ev._id,
      }));
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Race events');
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      XLSX.writeFile(workbook, `race-events-${stamp}.xlsx`);
      void Swal.fire({
        title: 'Exported',
        text: 'Downloaded race events spreadsheet.',
        icon: 'success',
        confirmButtonColor: '#ea580c',
        timer: 2000,
      });
    } catch (e) {
      console.error(e);
      void Swal.fire({
        title: 'Error',
        text: 'Could not export Excel file.',
        icon: 'error',
        confirmButtonColor: '#ea580c',
      });
    }
  }, [events]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <DashboardAdminHeader emailBlastEnabled={emailBlastEnabled} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'list' ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-fira-sans font-semibold text-gray-900">Race events</h1>
                <p className="text-sm text-gray-600 font-sweet-sans mt-1">
                  Create events and attach registrants from your database or add participants manually.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className={btnSecondary}
                  disabled={listLoading || events.length === 0}
                  onClick={() => exportRaceEventsListExcel()}
                >
                  Export Excel
                </button>
                <button type="button" className={btnPrimary} onClick={openCreate}>
                  New event
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200/90 bg-white shadow-sm overflow-hidden">
              {listLoading ? (
                <p className="p-8 text-center text-gray-500 font-sweet-sans">Loading…</p>
              ) : events.length === 0 ? (
                <p className="p-8 text-center text-gray-500 font-sweet-sans">No events yet. Create one to get started.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-fira-sans font-medium text-gray-600 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-fira-sans font-medium text-gray-600 uppercase tracking-wider">
                          When
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-fira-sans font-medium text-gray-600 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-fira-sans font-medium text-gray-600 uppercase tracking-wider">
                          Participants
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-fira-sans font-medium text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {events.map((ev) => (
                        <tr
                          key={ev._id}
                          className="hover:bg-orange-50/40 cursor-pointer"
                          onClick={() => void openEventDetails(ev._id)}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 font-sweet-sans">{ev.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 font-sweet-sans whitespace-nowrap">
                            {formatEventWhen(ev.eventDateTime)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 font-sweet-sans">{ev.location || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 font-sweet-sans tabular-nums">
                            {ev.participantUserIds?.length ?? 0}
                          </td>
                          <td className="px-4 py-3 text-sm text-right space-x-2 whitespace-nowrap">
                            <button
                              type="button"
                              className="text-orange-700 hover:underline font-fira-sans"
                              onClick={(e) => {
                                e.stopPropagation();
                                void openEdit(ev);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="text-red-600 hover:underline font-fira-sans"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDeleteEvent(ev);
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-fira-sans font-semibold text-gray-900">
                  {eventId ? 'Edit race event' : 'New race event'}
                </h1>
                <p className="text-sm text-gray-600 font-sweet-sans mt-1">Step {step} of 2</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={btnSecondary}
                  onClick={() => {
                    setView('list');
                    resetWizardForm();
                    void loadEvents();
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 p-1 rounded-xl bg-gray-100 border border-gray-200 w-fit">
              <span
                className={`px-3 py-1.5 rounded-lg text-sm font-fira-sans ${
                  step === 1 ? 'bg-white shadow text-orange-800' : 'text-gray-600'
                }`}
              >
                1. Event details
              </span>
              <span className="text-gray-400">→</span>
              <span
                className={`px-3 py-1.5 rounded-lg text-sm font-fira-sans ${
                  step === 2 ? 'bg-white shadow text-orange-800' : 'text-gray-600'
                }`}
              >
                2. Participants
              </span>
            </div>

            {step === 1 && (
              <div className="rounded-xl border border-gray-200/90 bg-white shadow-sm p-6 space-y-4 max-w-2xl">
                <div>
                  <label className="block text-sm font-fira-sans font-medium text-gray-700 mb-1">Event name</label>
                  <input className={fieldClass} value={eventName} onChange={(e) => setEventName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-fira-sans font-medium text-gray-700 mb-1">Details</label>
                  <textarea
                    className={`${fieldClass} min-h-[120px]`}
                    value={eventDetails}
                    onChange={(e) => setEventDetails(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-fira-sans font-medium text-gray-700 mb-1">Event date & time</label>
                  <input
                    type="datetime-local"
                    className={fieldClass}
                    value={eventDateTimeLocal}
                    onChange={(e) => setEventDateTimeLocal(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-fira-sans font-medium text-gray-700 mb-1">Location</label>
                  <input className={fieldClass} value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" className={btnPrimary} disabled={savingStep1} onClick={() => void handleNextStep1()}>
                    {savingStep1 ? 'Saving…' : 'Next: participants'}
                  </button>
                </div>
              </div>
            )}

            {step === 2 && eventId && (
              <div className="space-y-4">
                {promoPreview && (
                  <p className="text-sm text-gray-600 font-sweet-sans">
                    Manual-entry promo code for this event:{' '}
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-orange-800">{promoPreview}</code>
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={btnSecondary} onClick={handleBackToStep1}>
                    ← Back to details
                  </button>
                  <button type="button" className={btnPrimary} onClick={() => void finishWizard()}>
                    Done
                  </button>
                  <button type="button" className={btnPrimary} onClick={() => setManualOpen(true)}>
                    Add manually
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  <div className="rounded-xl border border-gray-200/90 bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <h2 className="text-sm font-fira-sans font-semibold text-gray-800">All registrants</h2>
                      <p className="text-xs text-gray-500 font-sweet-sans mt-0.5">Search by name, then add to this event.</p>
                      <input
                        className={`${fieldClass} mt-2`}
                        placeholder="Filter by name…"
                        value={pickerName}
                        onChange={(e) => setPickerName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void fetchPickerUsers();
                        }}
                      />
                    </div>
                    <div className="max-h-[480px] overflow-y-auto">
                      {pickerLoading ? (
                        <p className="p-4 text-sm text-gray-500">Loading…</p>
                      ) : (
                        <table className="min-w-full text-sm">
                          <thead className="bg-white sticky top-0 border-b border-gray-100">
                            <tr>
                              <th className="px-3 py-2 text-left font-fira-sans text-xs uppercase text-gray-600">Name</th>
                              <th className="px-3 py-2 text-left font-fira-sans text-xs uppercase text-gray-600">Promo</th>
                              <th className="px-3 py-2 text-left font-fira-sans text-xs uppercase text-gray-600">Club</th>
                              <th className="px-3 py-2 text-right font-fira-sans text-xs uppercase text-gray-600">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pickerUsers.map((u) => {
                              const age = getAgeYearsFromBirthday(u.birthday);
                              const ageLabel = age != null ? ` ${formatCompletedAgeLabel(age)}` : '';
                              const inEvent = participantSet.has(u._id);
                              return (
                                <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50/80">
                                  <td className="px-3 py-2 font-sweet-sans text-gray-900">
                                    {u.name}
                                    <span className="text-gray-500">{ageLabel}</span>
                                  </td>
                                  <td className="px-3 py-2 font-sweet-sans text-gray-600 truncate max-w-[100px]" title={u.promoCode}>
                                    {u.promoCode || '—'}
                                  </td>
                                  <td className="px-3 py-2 font-sweet-sans text-gray-600 truncate max-w-[120px]" title={u.affiliations}>
                                    {u.affiliations || '—'}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    {inEvent ? (
                                      <span className="text-xs text-gray-400 font-sweet-sans">Added</span>
                                    ) : (
                                      <button
                                        type="button"
                                        className="text-orange-700 hover:underline font-fira-sans text-xs font-medium"
                                        onClick={() => void handleAddFromPicker(u._id)}
                                      >
                                        + Add
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50/80 text-xs">
                      <button
                        type="button"
                        className="text-orange-700 disabled:text-gray-400 font-fira-sans"
                        disabled={pickerPage <= 1}
                        onClick={() => setPickerPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </button>
                      <span className="text-gray-600 font-sweet-sans tabular-nums">
                        Page {pickerPage} / {pickerTotalPages}
                      </span>
                      <button
                        type="button"
                        className="text-orange-700 disabled:text-gray-400 font-fira-sans"
                        disabled={pickerPage >= pickerTotalPages}
                        onClick={() => setPickerPage((p) => p + 1)}
                      >
                        Next
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200/90 bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-orange-50/60">
                      <h2 className="text-sm font-fira-sans font-semibold text-gray-800">In this event</h2>
                      <p className="text-xs text-gray-600 font-sweet-sans mt-0.5">
                        {participantsLoading ? 'Updating…' : `${participantUserIds.length} participant(s)`}
                      </p>
                    </div>
                    <div className="max-h-[520px] overflow-y-auto">
                      {participantsDetail.length === 0 && !participantsLoading ? (
                        <p className="p-4 text-sm text-gray-500 font-sweet-sans">No participants yet. Add from the left or use Add manually.</p>
                      ) : (
                        <table className="min-w-full text-sm">
                          <thead className="bg-white sticky top-0 border-b border-gray-100">
                            <tr>
                              <th className="px-3 py-2 text-left font-fira-sans text-xs uppercase text-gray-600">Name</th>
                              <th className="px-3 py-2 text-left font-fira-sans text-xs uppercase text-gray-600">Promo</th>
                              <th className="px-3 py-2 text-right font-fira-sans text-xs uppercase text-gray-600">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedWizardParticipants.map((p) => {
                              const age = getAgeYearsFromBirthday(p.birthday);
                              const ageLabel = age != null ? ` ${formatCompletedAgeLabel(age)}` : '';
                              return (
                                <tr key={p._id} className="border-b border-gray-50">
                                  <td className="px-3 py-2 font-sweet-sans text-gray-900">
                                    {p.name}
                                    <span className="text-gray-500">{ageLabel}</span>
                                    {p.createdBy ? (
                                      <span className="block text-[10px] text-gray-400">via {p.createdBy}</span>
                                    ) : null}
                                  </td>
                                  <td className="px-3 py-2 font-sweet-sans text-gray-600">{p.promoCode || '—'}</td>
                                  <td className="px-3 py-2 text-right">
                                    <button
                                      type="button"
                                      className="text-red-600 hover:underline font-fira-sans text-xs"
                                      onClick={() => void handleRemoveParticipant(p._id)}
                                    >
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {manualOpen && eventId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-fira-sans font-semibold text-gray-900">Add participant manually</h3>
            <p className="text-xs text-gray-500 font-sweet-sans">
              Saves a new user with race <strong>Individual</strong>, promo <code className="bg-gray-100 px-1 rounded">RaceEvent{eventId}</code>, and{' '}
              <strong>createdBy</strong> set to this event name.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-fira-sans text-gray-600 mb-0.5">Name</label>
                <input className={fieldClass} value={manualName} onChange={(e) => setManualName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-fira-sans text-gray-600 mb-0.5">Birthday</label>
                <input className={fieldClass} type="date" value={manualBirthday} onChange={(e) => setManualBirthday(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-fira-sans text-gray-600 mb-0.5">Email</label>
                <input className={fieldClass} type="email" value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-fira-sans text-gray-600 mb-0.5">Contact</label>
                <input className={fieldClass} value={manualContact} onChange={(e) => setManualContact(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-fira-sans text-gray-600 mb-0.5">Gender</label>
                <select className={fieldClass} value={manualGender} onChange={(e) => setManualGender(e.target.value)}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className={btnSecondary} onClick={closeManual} disabled={manualSaving}>
                Cancel
              </button>
              <button type="button" className={btnPrimary} onClick={() => void submitManual()} disabled={manualSaving}>
                {manualSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-fira-sans font-semibold text-gray-900">Race event details</h3>
              <button
                type="button"
                className={btnSecondary}
                onClick={() => {
                  setDetailsOpen(false);
                  setSelectedEventDetails(null);
                  setSelectedEventParticipants([]);
                  setDetailsParticipantRanks({});
                  setDetailsRankEditingId(null);
                }}
              >
                Close
              </button>
            </div>

            {detailsLoading ? (
              <p className="p-6 text-gray-500 font-sweet-sans">Loading details…</p>
            ) : !selectedEventDetails ? (
              <p className="p-6 text-gray-500 font-sweet-sans">No event details available.</p>
            ) : (
              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-76px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-fira-sans uppercase text-gray-500">Event name</p>
                    <p className="text-sm font-sweet-sans text-gray-900 mt-1">{selectedEventDetails.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-fira-sans uppercase text-gray-500">Date & time</p>
                    <p className="text-sm font-sweet-sans text-gray-900 mt-1">{formatEventWhen(selectedEventDetails.eventDateTime)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-fira-sans uppercase text-gray-500">Location</p>
                    <p className="text-sm font-sweet-sans text-gray-900 mt-1">{selectedEventDetails.location || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-fira-sans uppercase text-gray-500">Participants</p>
                    <p className="text-sm font-sweet-sans text-gray-900 mt-1 tabular-nums">{sortedDetailParticipants.length}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-fira-sans uppercase text-gray-500">Details</p>
                  <p className="text-sm font-sweet-sans text-gray-800 mt-1 whitespace-pre-wrap">
                    {selectedEventDetails.details || '—'}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-fira-sans font-semibold text-gray-800">Participants list</h4>
                    {sortedDetailParticipants.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          className={btnSecondary}
                          disabled={detailsRankSaving}
                          onClick={() => exportEventDetailParticipantsExcel()}
                        >
                          Export Excel
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-red-200 bg-white text-red-700 text-sm font-fira-sans font-medium shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-50"
                          disabled={
                            detailsRankSaving ||
                            (Object.keys(detailsParticipantRanks).length === 0 &&
                              !selectedEventParticipants.some(
                                (p) => typeof p.overallRank === 'number' && Number.isFinite(p.overallRank)
                              ))
                          }
                          onClick={() => void resetAllDetailParticipantRanks()}
                        >
                          Reset all ranks
                        </button>
                      </div>
                    ) : null}
                  </div>
                  {sortedDetailParticipants.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500 font-sweet-sans">No participants in this event yet.</p>
                  ) : (
                    <div className="max-h-[340px] overflow-y-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-white sticky top-0 border-b border-gray-100">
                          <tr>
                            <th className="px-3 py-2 text-left font-fira-sans text-xs uppercase text-gray-600">Name</th>
                            <th className="px-3 py-2 text-left font-fira-sans text-xs uppercase text-gray-600">Email</th>
                            <th className="px-3 py-2 text-left font-fira-sans text-xs uppercase text-gray-600">Promo</th>
                            <th className="px-3 py-2 text-left font-fira-sans text-xs uppercase text-gray-600">Club</th>
                            <th className="px-3 py-2 text-left font-fira-sans text-xs uppercase text-gray-600">Overall rank</th>
                            <th className="px-3 py-2 text-right font-fira-sans text-xs uppercase text-gray-600">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedDetailParticipants.map((p) => {
                            const age = getAgeYearsFromBirthday(p.birthday);
                            const ageLabel = age != null ? ` ${formatCompletedAgeLabel(age)}` : '';
                            const n = sortedDetailParticipants.length;
                            const rankForRow = detailsParticipantRanks[p._id] ?? p.overallRank ?? null;
                            const takenByOthers = new Set<number>();
                            for (const [uid, r] of Object.entries(detailsParticipantRanks)) {
                              if (uid !== p._id && Number.isInteger(r)) takenByOthers.add(r);
                            }
                            const editing = detailsRankEditingId === p._id;
                            return (
                              <tr key={p._id} className="border-b border-gray-50">
                                <td className="px-3 py-2 font-sweet-sans text-gray-900">
                                  {p.name}
                                  <span className="text-gray-500">{ageLabel}</span>
                                </td>
                                <td className="px-3 py-2 font-sweet-sans text-gray-700">{p.email || '—'}</td>
                                <td className="px-3 py-2 font-sweet-sans text-gray-600">{p.promoCode || '—'}</td>
                                <td className="px-3 py-2 font-sweet-sans text-gray-600">{p.affiliations || '—'}</td>
                                <td className="px-3 py-2 font-sweet-sans text-gray-800 tabular-nums align-middle">
                                  {editing ? (
                                    <select
                                      key={`rank-select-${p._id}`}
                                      className={`${fieldClass} py-1.5 text-sm max-w-[120px]`}
                                      disabled={detailsRankSaving}
                                      defaultValue={rankForRow != null ? String(rankForRow) : ''}
                                      aria-label={`Overall rank for ${p.name}`}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        if (v === '') {
                                          const next = { ...detailsParticipantRanks };
                                          delete next[p._id];
                                          void saveDetailsParticipantRanks(next).then(() => setDetailsRankEditingId(null));
                                          return;
                                        }
                                        const rank = parseInt(v, 10);
                                        if (!Number.isInteger(rank)) return;
                                        const next = { ...detailsParticipantRanks, [p._id]: rank };
                                        void saveDetailsParticipantRanks(next).then(() => setDetailsRankEditingId(null));
                                      }}
                                    >
                                      <option value="">Unranked</option>
                                      {Array.from({ length: n }, (_, i) => i + 1).map((r) => (
                                        <option key={r} value={r} disabled={takenByOthers.has(r)}>
                                          {r}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <span>{rankForRow != null ? rankForRow : '—'}</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-right align-middle whitespace-nowrap">
                                  {editing ? (
                                    <button
                                      type="button"
                                      className="text-gray-600 hover:underline font-fira-sans text-xs"
                                      disabled={detailsRankSaving}
                                      onClick={() => setDetailsRankEditingId(null)}
                                    >
                                      Cancel
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="text-orange-700 hover:underline font-fira-sans text-xs font-medium"
                                      disabled={detailsRankSaving || n === 0}
                                      onClick={() => setDetailsRankEditingId(p._id)}
                                    >
                                      Update rank
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
