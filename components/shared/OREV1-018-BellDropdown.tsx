'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, FileCheck, CalendarDays, CreditCard, UserCheck, Bell } from 'lucide-react';

type NotifType = 'kyc' | 'event' | 'payment' | 'profile' | 'general';
interface Notification { id: number; type: NotifType; title: string; description: string; time: string; read: boolean; }

const DUMMY_NOTIFICATIONS: Notification[] = [
  { id: 1, type: 'kyc',     title: 'KYC submitted',       description: 'Sunrise Academy submitted KYC documents',        time: '2 mins ago',  read: false },
  { id: 2, type: 'event',   title: 'New registration',    description: 'Drawing Championship 2026 received a new entry', time: '18 mins ago', read: false },
  { id: 3, type: 'profile', title: 'Profile tag request', description: "Arjun's parent requested a profile link",        time: '1 hour ago',  read: false },
  { id: 4, type: 'payment', title: 'Payment failed',      description: 'Athletics Meet payment encountered an error',    time: 'Yesterday',   read: true  },
  { id: 5, type: 'kyc',     title: 'KYC approved',        description: 'Chennai Chess Club KYC has been approved',       time: '2 days ago',  read: true  },
];

const TYPE_CONFIG: Record<NotifType, { icon: React.ReactNode; bg: string; color: string }> = {
  kyc:     { icon: <FileCheck size={15} />,    bg: 'bg-blue-50',   color: 'text-blue-700'   },
  event:   { icon: <CalendarDays size={15} />, bg: 'bg-green-50',  color: 'text-green-700'  },
  payment: { icon: <CreditCard size={15} />,   bg: 'bg-yellow-50', color: 'text-yellow-700' },
  profile: { icon: <UserCheck size={15} />,    bg: 'bg-purple-50', color: 'text-purple-700' },
  general: { icon: <Bell size={15} />,         bg: 'bg-gray-100',  color: 'text-gray-600'   },
};

function NotifRow({ notif, onDismiss, onRead }: {
  notif: Notification;
  onDismiss: (id: number) => void;
  onRead: (id: number) => void;
}) {
  const cfg = TYPE_CONFIG[notif.type];
  return (
    <div onClick={() => onRead(notif.id)}
      className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.color}`}>
        {cfg.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-900 shrink-0" />}
          <span className={`text-xs font-medium ${notif.read ? 'text-gray-500' : 'text-gray-800'}`}>{notif.title}</span>
        </div>
        <p className="text-xs text-gray-500 leading-snug truncate">{notif.description}</p>
        <p className="text-[10px] text-gray-400 mt-1">{notif.time}</p>
      </div>
      <button onClick={e => { e.stopPropagation(); onDismiss(notif.id); }}
        className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors mt-0.5" aria-label="Dismiss">
        <X size={13} />
      </button>
    </div>
  );
}

export default function BellDropdown({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(DUMMY_NOTIFICATIONS);
  const unreadCount = notifications.filter(n => !n.read).length;

  const dismiss  = (id: number) => setNotifications(prev => prev.filter(n => n.id !== id));
  const markRead = (id: number) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAll  = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const viewAll  = () => { onClose(); router.push('/notifications'); };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-medium bg-blue-900 text-white px-2 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAll} className="text-xs font-medium text-blue-900 hover:underline">Mark all read</button>
        )}
      </div>

      <div className="overflow-y-auto max-h-80">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell size={28} className="text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-400">All caught up!</p>
            <p className="text-xs text-gray-300 mt-1">No new notifications</p>
          </div>
        ) : notifications.map(n => (
          <NotifRow key={n.id} notif={n} onDismiss={dismiss} onRead={markRead} />
        ))}
      </div>

      <div className="px-4 py-2.5 border-t border-gray-100 text-center">
        <button onClick={viewAll} className="text-xs font-medium text-blue-900 hover:underline">
          View all notifications →
        </button>
      </div>
    </div>
  );
}