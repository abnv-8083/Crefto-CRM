import { useState, useEffect } from 'react';
import { followUpsAPI, tasksAPI } from '../../api';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, PageHeader, Skeleton, Badge } from '../../components/ui';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const startDate = new Date(year, month, 1).toISOString();
      const endDate = new Date(year, month + 1, 0).toISOString();
      try {
        const [fuRes, tRes] = await Promise.all([
          followUpsAPI.getAll({ startDate, endDate, limit: 100 }),
          tasksAPI.getAll({ startDate, endDate, limit: 100 }),
        ]);

        const fuEvents = (fuRes.data.data || []).map(fu => ({
          id: fu._id, title: fu.title, date: fu.scheduledAt, type: 'followup', status: fu.status,
          color: 'bg-orange-500', label: '📅'
        }));
        const taskEvents = (tRes.data.data || []).filter(t => t.dueDate).map(t => ({
          id: t._id, title: t.title, date: t.dueDate, type: 'task', status: t.status,
          color: 'bg-indigo-500', label: '✅'
        }));
        setEvents([...fuEvents, ...taskEvents]);
      } catch {}
      setLoading(false);
    };
    load();
  }, [year, month]);

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const getEventsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date?.startsWith(dateStr));
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  return (
    <div>
      <PageHeader title="Calendar" subtitle="View follow-ups and task deadlines" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <Card>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">{MONTHS[month]} {year}</h2>
              <div className="flex gap-2">
                <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1.5 text-sm font-medium bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100">
                  Today
                </button>
                <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            {loading ? <Skeleton className="h-96" /> : (
              <div className="grid grid-cols-7 border-l border-t border-slate-100">
                {cells.map((day, i) => {
                  const dayEvents = day ? getEventsForDay(day) : [];
                  const isToday = day && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                  const isSelected = selectedDay === day;

                  return (
                    <div key={i}
                      onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                      className={`min-h-16 sm:min-h-24 p-1.5 sm:p-2 border-r border-b border-slate-100 transition-colors
                        ${day ? 'cursor-pointer hover:bg-slate-50' : 'bg-slate-50/50'}
                        ${isSelected ? 'bg-indigo-50' : ''}
                      `}>
                      {day && (
                        <>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium mb-1
                            ${isToday ? 'bg-indigo-600 text-white ring-2 ring-indigo-300' : 'text-slate-600 hover:bg-slate-100'}`}>
                            {day}
                          </div>
                          <div className="space-y-0.5">
                            {dayEvents.slice(0, 3).map(ev => (
                              <div key={ev.id} className={`text-[10px] font-medium text-white px-1.5 py-0.5 rounded-md truncate ${ev.color} opacity-90`}>
                                {ev.label} {ev.title}
                              </div>
                            ))}
                            {dayEvents.length > 3 && (
                              <div className="text-[10px] text-slate-400 font-medium pl-1">+{dayEvents.length - 3} more</div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-3 h-3 rounded-sm bg-orange-500" />
                Follow-ups
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-3 h-3 rounded-sm bg-indigo-500" />
                Tasks
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar: selected day events */}
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-slate-800 mb-3">
              {selectedDay ? `${MONTHS[month]} ${selectedDay}` : 'Select a day'}
            </h3>
            {selectedDay ? (
              selectedEvents.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No events</p>
              ) : (
                <div className="space-y-3">
                  {selectedEvents.map(ev => (
                    <div key={ev.id} className="flex gap-3">
                      <div className="text-lg">{ev.label}</div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{ev.title}</p>
                        <p className="text-xs text-slate-400 capitalize">
                          {ev.type} • <span className={ev.status === 'Completed' ? 'text-emerald-500' : ev.status === 'Overdue' ? 'text-red-500' : 'text-slate-400'}>{ev.status}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">Click a date to see events</p>
            )}
          </Card>

          {/* Upcoming events */}
          <Card>
            <h3 className="font-semibold text-slate-800 mb-3">Coming Up</h3>
            <div className="space-y-3">
              {events.filter(e => new Date(e.date) >= new Date()).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5).map(ev => (
                <div key={ev.id} className="flex gap-3">
                  <div className="text-base">{ev.label}</div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{ev.title}</p>
                    <p className="text-[10px] text-slate-400">{new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
              ))}
              {events.filter(e => new Date(e.date) >= new Date()).length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2">No upcoming events</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
