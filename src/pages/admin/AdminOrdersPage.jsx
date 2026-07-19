import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@insforge/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, X, RefreshCw, Mail, CheckCircle, AlertCircle, Clock,
    Download, ExternalLink, ChevronDown, ChevronUp, Copy, Check,
    Image as ImageIcon, Video, User, FileText, Zap, Shield,
    BarChart2, TrendingUp, Filter, Save
} from 'lucide-react';
import {
    fetchAllOrdersAdmin,
    resendEmail,
    pollGenerationStatus,
    updateOrderAdminNotes,
    updateOrderGenerationStatus,
} from '../../lib/api';

/* ─── Constants ──────────────────────────────────────────────── */
const ADMIN_EMAIL = 'thirumanwarshivakumar@gmail.com';

const STATUS_TABS = [
    { id: 'all',        label: 'All' },
    { id: 'failed',     label: 'Failed',     color: 'red' },
    { id: 'processing', label: 'Processing', color: 'blue' },
    { id: 'completed',  label: 'Completed',  color: 'green' },
    { id: 'refunded',   label: 'Refunded',   color: 'amber' },
    { id: 'pending',    label: 'Pending Pmt', color: 'yellow' },
];

const GEN_STATUS_LABELS = {
    pending:                    { label: 'Pending',     color: 'yellow' },
    paid:                       { label: 'Paid',        color: 'blue' },
    generating_image:           { label: 'Gen. Image',  color: 'blue' },
    awaiting_image_confirmation:{ label: 'Needs Review', color: 'violet' },
    generating:                 { label: 'Generating',  color: 'blue' },
    uploading:                  { label: 'Uploading',   color: 'blue' },
    completed:                  { label: 'Completed',   color: 'green' },
    failed:                     { label: 'Failed',      color: 'red' },
    resolved:                   { label: 'Resolved',    color: 'zinc' },
};

const BADGE_COLORS = {
    green:  'bg-green-500/15 text-green-400 border-green-500/25',
    blue:   'bg-blue-500/15 text-blue-400 border-blue-500/25',
    yellow: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
    red:    'bg-red-500/15 text-red-400 border-red-500/25',
    violet: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
    amber:  'bg-amber-500/15 text-amber-400 border-amber-500/25',
    zinc:   'bg-zinc-500/15 text-zinc-400 border-zinc-500/25',
};

/* ─── Helpers ────────────────────────────────────────────────── */
function formatDate(s) {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function formatShort(s) {
    if (!s) return '—';
    const d = new Date(s);
    const diff = Date.now() - d.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function StatusBadge({ status }) {
    const s = GEN_STATUS_LABELS[status] || { label: status, color: 'zinc' };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${BADGE_COLORS[s.color]}`}>
            {s.label}
        </span>
    );
}

function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);
    function copy() {
        navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    }
    return (
        <button onClick={copy} className="ml-1 p-0.5 text-zinc-600 hover:text-zinc-300 transition-colors">
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
        </button>
    );
}

/* ─── Order Detail Drawer ────────────────────────────────────── */
function OrderDrawer({ order, onClose, onUpdated }) {
    const [notes, setNotes]           = useState(order.admin_notes || '');
    const [savingNotes, setSavingNotes] = useState(false);
    const [notesSaved, setNotesSaved]  = useState(false);
    const [actionLoading, setActionLoading] = useState('');
    const [actionMsg, setActionMsg]    = useState('');
    const [openSection, setOpenSection] = useState('timeline');

    const deliveryUrl = order.video_url || order.generated_image_url;

    async function saveNotes() {
        setSavingNotes(true);
        try {
            const updated = await updateOrderAdminNotes(order.id, notes);
            setNotesSaved(true);
            setTimeout(() => setNotesSaved(false), 2000);
            onUpdated({ ...order, admin_notes: updated.admin_notes });
        } catch (e) { alert('Failed to save notes: ' + e.message); }
        finally { setSavingNotes(false); }
    }

    async function handleResend() {
        if (!deliveryUrl) return alert('No delivery URL available to resend.');
        setActionLoading('resend');
        setActionMsg('');
        try {
            await resendEmail(order.id, order.email, deliveryUrl);
            setActionMsg('✓ Email resent successfully.');
        } catch (e) { setActionMsg('✗ Failed: ' + e.message); }
        finally { setActionLoading(''); }
    }

    async function handleRetry() {
        setActionLoading('retry');
        setActionMsg('');
        try {
            const type = order.generation_status === 'failed' && order.failure_stage === 'image_generation'
                ? 'generating_image' : 'generating';
            await pollGenerationStatus(order.id, type);
            setActionMsg('✓ Retry triggered. Refresh list to see updated status.');
        } catch (e) { setActionMsg('✗ Failed: ' + e.message); }
        finally { setActionLoading(''); }
    }

    async function handleResolve() {
        setActionLoading('resolve');
        setActionMsg('');
        try {
            const updated = await updateOrderGenerationStatus(order.id, 'resolved');
            onUpdated({ ...order, generation_status: updated.generation_status });
            setActionMsg('✓ Order marked as resolved.');
        } catch (e) { setActionMsg('✗ Failed: ' + e.message); }
        finally { setActionLoading(''); }
    }

    // Build timeline steps
    const timelineSteps = [];
    timelineSteps.push({ label: 'Order Placed', done: true, time: order.created_at });
    timelineSteps.push({ label: 'Payment Confirmed', done: order.payment_status === 'paid', time: order.payment_status === 'paid' ? order.created_at : null });
    if (order.image_task_id || order.generated_image_url || ['generating_image','awaiting_image_confirmation'].includes(order.generation_status)) {
        timelineSteps.push({ label: 'Image Generated', done: !!order.generated_image_url, failed: order.generation_status === 'failed' && order.failure_stage === 'image_generation' });
    }
    if (order.template_type !== 'image' || order.video_url) {
        timelineSteps.push({ label: `${order.template_type === 'image' ? 'Image' : 'Video'} Generated`, done: order.generation_status === 'completed' || !!order.video_url, failed: order.generation_status === 'failed' });
    }
    timelineSteps.push({ label: 'Email Sent', done: order.email_status === 'sent' || (order.generation_status === 'completed' && !order.email_status), failed: order.email_status === 'bounced', time: order.email_sent_at });
    if (order.refund_status && order.refund_status !== 'none') {
        timelineSteps.push({ label: `Refund ${order.refund_status === 'completed' ? 'Issued' : 'Initiated'}`, done: order.refund_status === 'completed', time: order.refund_initiated_at, refund: true });
    }

    function Section({ id, title, icon: Icon, children }) {
        const open = openSection === id;
        return (
            <div className="border border-white/8 rounded-xl overflow-hidden">
                <button onClick={() => setOpenSection(open ? '' : id)} className="w-full flex items-center justify-between px-4 py-3 bg-white/3 hover:bg-white/6 transition-colors">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Icon className="w-4 h-4 text-violet-400" />
                        {title}
                    </div>
                    {open ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                </button>
                <AnimatePresence>
                    {open && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                            <div className="px-4 pb-4 pt-2">{children}</div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div className="flex-1 bg-black/60 backdrop-blur-sm cursor-pointer" onClick={onClose} />

            {/* Panel */}
            <motion.div
                initial={{ x: 520 }} animate={{ x: 0 }} exit={{ x: 520 }}
                transition={{ type: 'spring', damping: 32, stiffness: 280 }}
                className="w-full max-w-[520px] bg-zinc-950 border-l border-white/10 overflow-y-auto flex flex-col"
            >
                {/* Panel header */}
                <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm border-b border-white/8 px-5 py-4 flex items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm font-bold text-white">{order.readable_id || `#${order.id.slice(0,8).toUpperCase()}`}</span>
                            <CopyButton text={order.readable_id || order.id} />
                            <StatusBadge status={order.generation_status} />
                        </div>
                        <p className="text-xs text-zinc-400">{order.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-white">₹{Number(order.amount).toFixed(0)}</span>
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 text-zinc-500 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="p-5 flex flex-col gap-4">

                    {/* Failure banner */}
                    {order.generation_status === 'failed' && (
                        <div className="rounded-xl bg-red-500/8 border border-red-500/25 p-4">
                            <div className="flex items-center gap-2 mb-1.5">
                                <AlertCircle className="w-4 h-4 text-red-400" />
                                <span className="text-sm font-semibold text-red-400">Generation Failed</span>
                                {order.failure_stage && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">{order.failure_stage.replace(/_/g,' ')}</span>}
                            </div>
                            <p className="text-xs text-red-300/70">{order.failure_reason || 'No failure reason recorded.'}</p>
                        </div>
                    )}

                    {/* Quick meta row */}
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { label: 'Template', value: order.templates?.name || '—' },
                            { label: 'Type', value: order.template_type === 'image' ? '🖼 Image' : '🎬 Video' },
                            { label: 'Payment', value: order.payment_status },
                            { label: 'Method', value: order.payment_method || '—' },
                            { label: 'Placed', value: formatShort(order.created_at) },
                            { label: 'Updated', value: formatShort(order.updated_at) },
                        ].map(({ label, value }) => (
                            <div key={label} className="rounded-lg bg-white/3 border border-white/6 px-3 py-2">
                                <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-0.5">{label}</p>
                                <p className="text-xs text-zinc-200 font-medium truncate">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Timeline */}
                    <Section id="timeline" title="Order Timeline" icon={Zap}>
                        <ol className="relative ml-2">
                            {timelineSteps.map((step, i) => (
                                <li key={i} className="flex gap-3 pb-4 last:pb-0 relative">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 ${step.done ? 'bg-green-500/20 border-green-500' : step.failed ? 'bg-red-500/20 border-red-500' : 'bg-zinc-800 border-zinc-600'}`}>
                                            {step.done ? <Check className="w-2.5 h-2.5 text-green-400" /> : step.failed ? <X className="w-2.5 h-2.5 text-red-400" /> : <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />}
                                        </div>
                                        {i < timelineSteps.length - 1 && (
                                            <div className={`w-px flex-1 mt-1 ${step.done ? 'bg-green-500/30' : 'bg-zinc-700/50'}`} style={{ minHeight: '16px' }} />
                                        )}
                                    </div>
                                    <div className="pb-1 min-w-0">
                                        <p className={`text-xs font-semibold ${step.done ? 'text-white' : step.failed ? 'text-red-400' : 'text-zinc-500'}`}>{step.label}</p>
                                        {step.time && <p className="text-[10px] text-zinc-600 mt-0.5">{formatDate(step.time)}</p>}
                                        {step.refund && order.refund_amount && <p className="text-[10px] text-amber-400 mt-0.5">₹{order.refund_amount} refunded</p>}
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </Section>

                    {/* Customer Inputs */}
                    <Section id="inputs" title="Customer Inputs" icon={User}>
                        <div className="space-y-3">
                            {order.reference_image_url && (
                                <div>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">Reference Image</p>
                                    <a href={order.reference_image_url} target="_blank" rel="noopener noreferrer">
                                        <img src={order.reference_image_url} alt="Reference" className="w-full max-h-48 object-cover rounded-lg border border-white/10 hover:border-violet-500/40 transition-colors" />
                                    </a>
                                </div>
                            )}
                            {order.form_values && Object.keys(order.form_values).length > 0 && (
                                <div>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">Form Values</p>
                                    <div className="space-y-1.5">
                                        {Object.entries(order.form_values).map(([key, val]) => (
                                            <div key={key} className="flex gap-2 text-xs">
                                                <span className="text-zinc-500 capitalize min-w-[80px]">{key.replace(/_/g,' ')}:</span>
                                                <span className="text-zinc-200 break-words">{String(val)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Section>

                    {/* AI Output */}
                    {(order.generated_image_url || order.video_url) && (
                        <Section id="output" title="AI Output" icon={ImageIcon}>
                            <div className="space-y-3">
                                {order.generated_image_url && (
                                    <div>
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">Generated Image</p>
                                        <a href={order.generated_image_url} target="_blank" rel="noopener noreferrer">
                                            <img src={order.generated_image_url} alt="Generated" className="w-full max-h-48 object-cover rounded-lg border border-white/10 hover:border-violet-500/40 transition-colors" />
                                        </a>
                                    </div>
                                )}
                                {order.video_url && (
                                    <a href={order.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-violet-500/10 hover:bg-violet-500/15 border border-violet-500/25 rounded-lg text-violet-400 text-sm font-medium transition-colors">
                                        <Download className="w-4 h-4" />
                                        Download Delivered {order.template_type === 'image' ? 'Image' : 'Video'}
                                    </a>
                                )}
                            </div>
                        </Section>
                    )}

                    {/* Technical Details */}
                    <Section id="tech" title="Technical Details" icon={FileText}>
                        <div className="space-y-2">
                            {[
                                { label: 'Order UUID', value: order.id },
                                { label: 'Stripe Session', value: order.stripe_session_id },
                                { label: 'Razorpay Payment ID', value: order.razorpay_payment_id },
                                { label: 'Razorpay Order ID', value: order.razorpay_order_id },
                                { label: 'Image Task ID', value: order.image_task_id },
                                { label: 'Video Task ID', value: order.video_task_id },
                            ].filter(x => x.value).map(({ label, value }) => (
                                <div key={label} className="flex gap-2 text-xs">
                                    <span className="text-zinc-600 min-w-[120px] flex-shrink-0">{label}:</span>
                                    <span className="font-mono text-zinc-400 break-all text-[11px] flex items-center gap-1">
                                        {value.length > 36 ? `${value.slice(0,16)}…${value.slice(-8)}` : value}
                                        <CopyButton text={value} />
                                    </span>
                                </div>
                            ))}
                            {(order.constructed_image_prompt || order.constructed_video_prompt || order.constructed_prompt) && (
                                <div className="mt-2">
                                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1.5">Constructed Prompt</p>
                                    <pre className="text-[11px] text-zinc-400 bg-zinc-900 border border-white/6 rounded-lg p-3 whitespace-pre-wrap break-words font-mono leading-relaxed max-h-48 overflow-y-auto">
                                        {order.constructed_image_prompt || order.constructed_video_prompt || order.constructed_prompt}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </Section>

                    {/* Admin Notes */}
                    <Section id="notes" title="Admin Notes" icon={FileText}>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Log support actions here — e.g. 'Contacted customer 12 Jul, waiting on refund confirmation'. Never shown to customer."
                            rows={4}
                            className="w-full bg-zinc-900 border border-white/8 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none mb-2"
                        />
                        <button
                            onClick={saveNotes}
                            disabled={savingNotes}
                            className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                            <Save className="w-3.5 h-3.5" />
                            {savingNotes ? 'Saving…' : notesSaved ? 'Saved ✓' : 'Save Notes'}
                        </button>
                    </Section>

                    {/* Action Buttons */}
                    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                        <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-3 font-semibold">Admin Actions</p>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handleResend}
                                disabled={!!actionLoading || !deliveryUrl}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/8 border border-white/10 disabled:opacity-40 text-sm font-medium text-white rounded-lg transition-colors text-left"
                            >
                                <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                <span>Resend Delivery Email</span>
                                {actionLoading === 'resend' && <RefreshCw className="w-3.5 h-3.5 animate-spin ml-auto text-zinc-500" />}
                            </button>

                            {order.generation_status === 'failed' && (
                                <button
                                    onClick={handleRetry}
                                    disabled={!!actionLoading}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/8 border border-white/10 disabled:opacity-40 text-sm font-medium text-white rounded-lg transition-colors text-left"
                                >
                                    <RefreshCw className="w-4 h-4 text-violet-400 flex-shrink-0" />
                                    <span>Retry Generation</span>
                                    {actionLoading === 'retry' && <RefreshCw className="w-3.5 h-3.5 animate-spin ml-auto text-zinc-500" />}
                                </button>
                            )}

                            {!['completed','resolved'].includes(order.generation_status) && (
                                <button
                                    onClick={handleResolve}
                                    disabled={!!actionLoading}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/8 border border-white/10 disabled:opacity-40 text-sm font-medium text-white rounded-lg transition-colors text-left"
                                >
                                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                                    <span>Mark as Resolved</span>
                                    {actionLoading === 'resolve' && <RefreshCw className="w-3.5 h-3.5 animate-spin ml-auto text-zinc-500" />}
                                </button>
                            )}

                            <div className="mt-1 px-4 py-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 flex items-start gap-2">
                                <Shield className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                <p className="text-[11px] text-amber-400/70 leading-relaxed">
                                    Refunds are processed automatically by the backend pipeline. Manual refunds are not yet exposed here to prevent double-refund risk.
                                    {order.refund_status && <span className="block mt-1 font-semibold text-amber-300">Current refund status: {order.refund_status}</span>}
                                </p>
                            </div>
                        </div>

                        {actionMsg && (
                            <p className={`mt-3 text-xs ${actionMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
                                {actionMsg}
                            </p>
                        )}
                    </div>

                    {/* Template link */}
                    {order.templates?.id && (
                        <Link
                            to={`/template/${order.template_id}`}
                            className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group"
                        >
                            <div className="flex items-center gap-2 text-sm text-zinc-400 group-hover:text-white transition-colors">
                                <ExternalLink className="w-4 h-4" />
                                View Template: {order.templates.name}
                            </div>
                        </Link>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function AdminOrdersPage() {
    const { user, isLoaded } = useUser();
    const [orders, setOrders]           = useState([]);
    const [loading, setLoading]         = useState(true);
    const [search, setSearch]           = useState('');
    const [activeTab, setActiveTab]     = useState('all');
    const [filterDate, setFilterDate]   = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const searchRef = useRef(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchAllOrdersAdmin();
            setOrders(data || []);
        } catch (err) {
            console.error('Failed to load orders:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isLoaded && user?.email === ADMIN_EMAIL) {
            load();
        }
    }, [isLoaded, user, load]);

    // ── Guard ──────────────────────────────────────────────────
    if (!isLoaded) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (user?.email !== ADMIN_EMAIL) return (
        <div className="min-h-screen pt-24 pb-12 flex items-center justify-center text-center">
            <div className="glass-panel p-10 rounded-[2rem] max-w-md w-full">
                <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
                <p className="text-zinc-400 mb-6">You do not have administrative privileges.</p>
                <Link to="/"><button className="glass-button w-full px-6 py-3 rounded-full text-white font-semibold">Back to Home</button></Link>
            </div>
        </div>
    );

    // ── Filtering ──────────────────────────────────────────────
    const tabFilters = {
        all:        () => true,
        failed:     o => o.generation_status === 'failed',
        processing: o => ['paid','generating_image','awaiting_image_confirmation','generating','uploading'].includes(o.generation_status),
        completed:  o => o.generation_status === 'completed',
        refunded:   o => ['initiated','completed'].includes(o.refund_status),
        pending:    o => o.payment_status === 'pending',
    };

    const tabCounts = Object.fromEntries(
        STATUS_TABS.map(t => [t.id, orders.filter(tabFilters[t.id] || (() => true)).length])
    );

    const q = search.toLowerCase();
    const filtered = orders
        .filter(tabFilters[activeTab] || (() => true))
        .filter(o => {
            if (!q) return true;
            return (
                (o.readable_id || '').toLowerCase().includes(q) ||
                (o.email || '').toLowerCase().includes(q) ||
                (o.razorpay_payment_id || '').toLowerCase().includes(q) ||
                (o.stripe_session_id || '').toLowerCase().includes(q) ||
                (o.id || '').toLowerCase().includes(q)
            );
        })
        .filter(o => {
            if (filterDate === 'all') return true;
            const d = new Date(o.created_at);
            const today = new Date();
            if (filterDate === 'today') return d.toDateString() === today.toDateString();
            if (filterDate === 'yesterday') {
                const y = new Date(today); y.setDate(y.getDate() - 1);
                return d.toDateString() === y.toDateString();
            }
            if (filterDate === 'week') {
                const w = new Date(today); w.setDate(w.getDate() - 7);
                return d >= w;
            }
            if (filterDate === 'month') return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
            return true;
        });

    const totalRevenue = orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + Number(o.amount || 0), 0);
    const failedCount  = orders.filter(o => o.generation_status === 'failed').length;
    const pendingCount = orders.filter(o => ['paid','generating_image','generating','uploading'].includes(o.generation_status)).length;

    function handleOrderUpdate(updated) {
        setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o));
        if (selectedOrder?.id === updated.id) setSelectedOrder(u => ({ ...u, ...updated }));
    }

    return (
        <div className="min-h-screen pt-24 pb-20 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* ── Page Header ── */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 mb-3 backdrop-blur-md">
                            <BarChart2 className="w-3 h-3 text-violet-400" />
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-300">Admin</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold mb-1">Orders Management</h1>
                        <p className="text-zinc-400 text-sm">Support, diagnose, and manage all customer orders.</p>
                    </div>
                    <button
                        onClick={load}
                        className="flex items-center gap-2 px-4 py-2 glass-button rounded-xl text-sm font-semibold self-start sm:self-auto"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* ── Stats Bar ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                        { label: 'Total Orders', value: orders.length, icon: TrendingUp, color: 'violet' },
                        { label: 'Revenue (paid)', value: `₹${totalRevenue.toFixed(0)}`, icon: BarChart2, color: 'green' },
                        { label: 'Failed', value: failedCount, icon: AlertCircle, color: 'red' },
                        { label: 'Processing', value: pendingCount, icon: RefreshCw, color: 'blue' },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="glass-panel rounded-2xl p-4 border border-white/8">
                            <div className="flex items-center gap-2 mb-2">
                                <Icon className={`w-3.5 h-3.5 ${color === 'red' ? 'text-red-400' : color === 'green' ? 'text-green-400' : color === 'blue' ? 'text-blue-400' : 'text-violet-400'}`} />
                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</span>
                            </div>
                            <p className={`text-2xl font-bold ${color === 'red' && failedCount > 0 ? 'text-red-400' : 'text-white'}`}>{value}</p>
                        </div>
                    ))}
                </div>

                {/* ── Toolbar ── */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="Search by order ID, email, or Razorpay payment ID…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        {['all','today','yesterday','week','month'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilterDate(f)}
                                className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-colors capitalize ${filterDate === f ? 'bg-violet-600 text-white' : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white'}`}
                            >
                                {f === 'all' ? 'All Time' : f === 'week' ? '7 Days' : f === 'month' ? 'This Month' : f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Status Tabs ── */}
                <div className="flex gap-2 flex-wrap mb-5">
                    {STATUS_TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-200 ${
                                activeTab === tab.id
                                    ? 'bg-gradient-to-r from-violet-600 to-violet-500 border-transparent text-white shadow-lg shadow-violet-500/20'
                                    : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/8'
                            }`}
                        >
                            {tab.label}
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.id ? 'bg-white/20' : tab.color === 'red' && tabCounts[tab.id] > 0 ? 'bg-red-500/30 text-red-300' : 'bg-white/10'}`}>
                                {tabCounts[tab.id]}
                            </span>
                        </button>
                    ))}
                </div>

                {/* ── Table ── */}
                <div className="glass-panel rounded-2xl border border-white/8 overflow-hidden">
                    {loading ? (
                        <div className="py-20 text-center text-zinc-500 flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
                            Loading orders…
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-16 text-center text-zinc-500">
                            <Filter className="w-8 h-8 mx-auto mb-3 opacity-30" />
                            No orders match your current filters.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full" style={{ minWidth: '900px' }}>
                                <thead>
                                    <tr className="border-b border-white/8">
                                        {['Order ID','Customer','Template','Amount','Payment','Status','Email','Date',''].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-zinc-600">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(order => (
                                        <tr
                                            key={order.id}
                                            onClick={() => setSelectedOrder(order)}
                                            className={`border-b border-white/5 last:border-0 cursor-pointer transition-colors hover:bg-white/[0.03] ${order.generation_status === 'failed' ? 'bg-red-500/[0.03]' : ''} ${selectedOrder?.id === order.id ? 'bg-violet-500/[0.05]' : ''}`}
                                        >
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-xs font-semibold text-zinc-300">{order.readable_id || `#${order.id.slice(0,8).toUpperCase()}`}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs text-zinc-300 max-w-[160px] block truncate">{order.email}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    {order.template_type === 'image' ? <ImageIcon className="w-3 h-3 text-pink-400 flex-shrink-0" /> : <Video className="w-3 h-3 text-violet-400 flex-shrink-0" />}
                                                    <span className="text-xs text-zinc-400 max-w-[120px] truncate">{order.templates?.name || '—'}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs font-bold text-white">₹{Number(order.amount).toFixed(0)}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${order.payment_status === 'paid' ? BADGE_COLORS.green : BADGE_COLORS.yellow}`}>
                                                    {order.payment_status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <StatusBadge status={order.generation_status} />
                                                    {order.failure_stage && (
                                                        <p className="text-[10px] text-red-400/70 mt-0.5">{order.failure_stage.replace(/_/g,' ')}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {order.email_status ? (
                                                    <span className={`text-[10px] font-medium ${order.email_status === 'sent' ? 'text-green-400' : order.email_status === 'bounced' ? 'text-red-400' : 'text-zinc-500'}`}>
                                                        {order.email_status}
                                                    </span>
                                                ) : order.generation_status === 'completed' ? (
                                                    <span className="text-[10px] text-zinc-500">—</span>
                                                ) : (
                                                    <span className="text-[10px] text-zinc-700">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-[11px] text-zinc-500" title={formatDate(order.created_at)}>{formatShort(order.created_at)}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button className="p-1.5 rounded-lg hover:bg-white/8 text-zinc-600 hover:text-white transition-colors">
                                                    <ChevronDown className="w-4 h-4 -rotate-90" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <p className="mt-3 text-center text-xs text-zinc-600">
                    {filtered.length} order{filtered.length !== 1 ? 's' : ''} shown
                    {search && ` matching "${search}"`}
                </p>
            </div>

            {/* ── Detail Drawer ── */}
            <AnimatePresence>
                {selectedOrder && (
                    <OrderDrawer
                        order={selectedOrder}
                        onClose={() => setSelectedOrder(null)}
                        onUpdated={handleOrderUpdate}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
