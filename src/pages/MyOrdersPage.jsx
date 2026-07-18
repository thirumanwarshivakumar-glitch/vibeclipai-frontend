import { useState, useEffect } from 'react';
import { useUser } from '@insforge/react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle, Clock, AlertCircle, RefreshCw, Mail, Download,
    ExternalLink, Package, Image as ImageIcon, Video, RotateCcw, ChevronRight,
    Inbox
} from 'lucide-react';
import { fetchUserOrders, resendEmail } from '../lib/api';

/* ─── Status helpers ─────────────────────────────────────────── */
function getOrderStatus(order) {
    const { payment_status, generation_status, refund_status } = order;

    if (payment_status === 'pending') return {
        label: 'Awaiting Payment', color: 'yellow',
        icon: Clock,
        message: 'Complete your payment to begin creation.',
        showTrack: false,
    };
    if (generation_status === 'failed') return {
        label: 'Generation Failed', color: 'red',
        icon: AlertCircle,
        message: order.failure_reason || 'Something went wrong during generation. Our team has been notified.',
        refundNote: refund_status === 'completed'
            ? `Refund of ₹${order.amount} has been issued to your original payment method.`
            : refund_status === 'initiated'
                ? 'A refund is being processed — it usually arrives within 5–7 business days.'
                : 'If you were charged, a refund will be processed automatically.',
        showTrack: false,
    };
    if (generation_status === 'completed') return {
        label: 'Delivered', color: 'green',
        icon: CheckCircle,
        message: 'Your creation is ready and has been sent to your email.',
        showTrack: false,
    };
    if (generation_status === 'awaiting_image_confirmation') return {
        label: 'Review Needed', color: 'purple',
        icon: ImageIcon,
        message: 'Your preview image is ready — please review and approve it.',
        showTrack: true,
    };
    if (generation_status === 'generating_image') return {
        label: 'Generating Preview', color: 'blue',
        icon: RefreshCw,
        message: 'Creating your preview image — usually done in a few minutes.',
        showTrack: true,
    };
    if (generation_status === 'generating') return {
        label: 'Generating', color: 'blue',
        icon: RefreshCw,
        message: `Generating your ${order.template_type === 'image' ? 'image' : 'video'} — this can take a few minutes.`,
        showTrack: true,
    };
    if (generation_status === 'uploading') return {
        label: 'Finishing Up', color: 'blue',
        icon: RefreshCw,
        message: 'Almost done! Uploading and sending your creation.',
        showTrack: true,
    };
    return {
        label: 'Processing', color: 'blue',
        icon: Clock,
        message: 'Your order is being processed.',
        showTrack: true,
    };
}

const COLOR_MAP = {
    green:  { badge: 'bg-green-500/15 text-green-400 border-green-500/25', glow: 'group-hover:border-green-500/30', dot: 'bg-green-400' },
    blue:   { badge: 'bg-blue-500/15 text-blue-400 border-blue-500/25',   glow: 'group-hover:border-blue-500/30',  dot: 'bg-blue-400 animate-pulse' },
    yellow: { badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25', glow: 'group-hover:border-yellow-500/30', dot: 'bg-yellow-400' },
    red:    { badge: 'bg-red-500/15 text-red-400 border-red-500/25',       glow: 'group-hover:border-red-500/30',   dot: 'bg-red-400' },
    purple: { badge: 'bg-violet-500/15 text-violet-400 border-violet-500/25', glow: 'group-hover:border-violet-500/30', dot: 'bg-violet-400 animate-pulse' },
};

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function relativeTime(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return formatDate(dateStr);
}

/* ─── Order Card ─────────────────────────────────────────────── */
function OrderCard({ order, index }) {
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);
    const [resentError, setResentError] = useState('');

    const status = getOrderStatus(order);
    const colors = COLOR_MAP[status.color];
    const StatusIcon = status.icon;
    const isImage = order.template_type === 'image';
    const TypeIcon = isImage ? ImageIcon : Video;

    const deliveryUrl = order.video_url || order.generated_image_url;
    const canResend = order.generation_status === 'completed' && deliveryUrl;

    async function handleResend() {
        setResending(true);
        setResentError('');
        try {
            await resendEmail(order.id, order.email, deliveryUrl);
            setResent(true);
        } catch (err) {
            setResentError('Failed to resend. Please try again.');
        } finally {
            setResending(false);
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.06 }}
            className={`group relative rounded-2xl border bg-white/[0.03] backdrop-blur-sm transition-all duration-300
                hover:bg-white/[0.06] ${colors.glow}
                ${status.color === 'red' ? 'border-red-500/20' : 'border-white/8'}`}
        >
            {/* Top accent line for non-failed orders */}
            {status.color !== 'red' && (
                <div className={`absolute top-0 left-6 right-6 h-px ${status.color === 'green' ? 'bg-gradient-to-r from-transparent via-green-500/40 to-transparent' : status.color === 'blue' || status.color === 'purple' ? 'bg-gradient-to-r from-transparent via-violet-500/40 to-transparent' : 'bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent'}`} />
            )}

            <div className="p-5 sm:p-6">
                {/* Row 1: ID + Badge + Amount */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isImage ? 'bg-pink-500/10 text-pink-400' : 'bg-violet-500/10 text-violet-400'}`}>
                            <TypeIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-mono text-zinc-500 leading-none mb-1">
                                {order.readable_id || `#${order.id.slice(0, 8).toUpperCase()}`}
                            </p>
                            <p className="text-sm font-semibold text-white truncate">
                                {order.templates?.name || '—'}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className="text-base font-bold text-white">₹{Number(order.amount).toFixed(0)}</span>
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colors.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                            {status.label}
                        </span>
                    </div>
                </div>

                {/* Status message */}
                <p className={`text-xs leading-relaxed mb-4 ${status.color === 'red' ? 'text-red-400/80' : 'text-zinc-400'}`}>
                    {status.message}
                </p>

                {/* Refund note for failed orders */}
                {status.refundNote && (
                    <div className="mb-4 px-3 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/20 text-xs text-amber-300/80 flex items-start gap-2">
                        <RotateCcw className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        {status.refundNote}
                    </div>
                )}

                {/* Action buttons row */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Delivered: Download + Resend */}
                    {order.generation_status === 'completed' && deliveryUrl && (
                        <a
                            href={deliveryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white text-xs font-semibold rounded-full transition-all duration-200 shadow-lg shadow-violet-500/20"
                        >
                            <Download className="w-3.5 h-3.5" />
                            {isImage ? 'View Image' : 'Download Video'}
                        </a>
                    )}

                    {/* Resend email */}
                    {canResend && (
                        <button
                            onClick={handleResend}
                            disabled={resending || resent}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white text-xs font-medium rounded-full transition-all duration-200 disabled:opacity-50"
                        >
                            <Mail className="w-3.5 h-3.5" />
                            {resending ? 'Sending…' : resent ? 'Sent ✓' : 'Resend Email'}
                        </button>
                    )}

                    {/* Track in-progress */}
                    {status.showTrack && (
                        <Link
                            to={`/success?orderId=${order.id}`}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white text-xs font-medium rounded-full transition-all duration-200"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Track Order
                        </Link>
                    )}

                    {/* Review image if awaiting */}
                    {order.generation_status === 'awaiting_image_confirmation' && (
                        <Link
                            to={`/success?orderId=${order.id}`}
                            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:opacity-90 text-white text-xs font-semibold rounded-full transition-all duration-200"
                        >
                            Review Preview <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    )}
                </div>

                {resentError && <p className="mt-2 text-xs text-red-400">{resentError}</p>}

                {/* Footer: date */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-600">
                    <span>{formatDate(order.created_at)}</span>
                    <span>{relativeTime(order.updated_at || order.created_at)}</span>
                </div>
            </div>
        </motion.div>
    );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function MyOrdersPage() {
    const { user, isLoaded } = useUser();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all | active | completed | failed

    useEffect(() => {
        if (isLoaded && !user) { navigate('/login'); return; }
        if (isLoaded && user) {
            fetchUserOrders(user.email)
                .then(d => setOrders(d || []))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [isLoaded, user, navigate]);

    if (!isLoaded) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const filterFns = {
        all:       () => true,
        active:    o => !['completed', 'failed'].includes(o.generation_status) && o.payment_status === 'paid',
        completed: o => o.generation_status === 'completed',
        failed:    o => o.generation_status === 'failed' || o.payment_status === 'pending',
    };
    const filtered = orders.filter(filterFns[filter] || (() => true));

    const counts = {
        all: orders.length,
        active: orders.filter(filterFns.active).length,
        completed: orders.filter(filterFns.completed).length,
        failed: orders.filter(filterFns.failed).length,
    };

    const TABS = [
        { id: 'all',       label: 'All Orders' },
        { id: 'active',    label: 'In Progress' },
        { id: 'completed', label: 'Delivered' },
        { id: 'failed',    label: 'Failed / Pending' },
    ];

    return (
        <div className="min-h-screen pt-24 pb-20 text-white">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 mb-4 backdrop-blur-md">
                        <Package className="w-3 h-3 text-violet-400" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-300">My Orders</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2">Your Creations</h1>
                    <p className="text-zinc-400">Track your AI-generated videos and images.</p>
                </motion.div>

                {/* Filter tabs */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                    className="flex gap-2 flex-wrap mb-8"
                >
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-200 ${
                                filter === tab.id
                                    ? 'bg-gradient-to-r from-violet-600 to-violet-500 border-transparent text-white shadow-lg shadow-violet-500/20'
                                    : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/8'
                            }`}
                        >
                            {tab.label}
                            {counts[tab.id] > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${filter === tab.id ? 'bg-white/20' : 'bg-white/10'}`}>
                                    {counts[tab.id]}
                                </span>
                            )}
                        </button>
                    ))}
                </motion.div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-zinc-500 text-sm">Loading your orders…</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-24 gap-4 rounded-2xl border border-white/8 bg-white/[0.02]"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <Inbox className="w-7 h-7 text-zinc-600" />
                        </div>
                        <div className="text-center">
                            <p className="text-white font-semibold mb-1">
                                {filter === 'all' ? 'No orders yet' : `No ${TABS.find(t=>t.id===filter)?.label.toLowerCase()} orders`}
                            </p>
                            <p className="text-zinc-500 text-sm max-w-xs">
                                {filter === 'all' ? 'Browse our templates and create your first AI video or image.' : 'Try a different filter above.'}
                            </p>
                        </div>
                        {filter === 'all' && (
                            <Link
                                to="/templates"
                                className="mt-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-violet-500 hover:opacity-90 text-white text-sm font-semibold rounded-full transition-all duration-200 shadow-lg shadow-violet-500/20"
                            >
                                Browse Templates
                            </Link>
                        )}
                    </motion.div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={filter}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col gap-4"
                        >
                            {filtered.map((order, i) => (
                                <OrderCard key={order.id} order={order} index={i} />
                            ))}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
