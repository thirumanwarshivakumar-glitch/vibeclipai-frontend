import { useState, useEffect } from 'react';
import { useUser } from '@insforge/react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchAllOrdersAdmin, fetchUserOrders } from '../lib/api';

export default function OrdersPage() {
    const { user, isLoaded } = useUser();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchEmail, setSearchEmail] = useState('');
    const [filterDate, setFilterDate] = useState('all');

    const isAdmin = user?.email === 'thirumanwarshivakumar@gmail.com';

    useEffect(() => {
        if (isLoaded && !user) {
            navigate('/login');
            return;
        }

        const loadOrders = async () => {
            setLoading(true);
            try {
                let data;
                if (isAdmin) {
                    data = await fetchAllOrdersAdmin();
                } else {
                    data = await fetchUserOrders(user.email);
                }
                setOrders(data || []);
            } catch (err) {
                console.error('Failed to load orders:', err);
            } finally {
                setLoading(false);
            }
        };

        if (isLoaded && user) {
            loadOrders();
        }
    }, [isLoaded, user, isAdmin, navigate]);

    if (!isLoaded) {
        return (
            <div className="page" style={{ textAlign: 'center', padding: '100px 20px', background: 'var(--bg-secondary)', minHeight: '100vh' }}>
                <div className="spinner" style={{ margin: '0 auto', width: 40, height: 40 }}></div>
                <p style={{ marginTop: 20, color: 'var(--text-tertiary)' }}>Loading your orders...</p>
            </div>
        );
    }

    const filteredOrders = orders.filter((o) => {
        if (searchEmail && !o.email?.toLowerCase().includes(searchEmail.toLowerCase())) return false;
        if (filterDate !== 'all') {
            const orderDate = new Date(o.created_at);
            const today = new Date();
            if (filterDate === 'today') {
                if (orderDate.toDateString() !== today.toDateString()) return false;
            } else if (filterDate === 'yesterday') {
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                if (orderDate.toDateString() !== yesterday.toDateString()) return false;
            } else if (filterDate === 'month') {
                if (orderDate.getMonth() !== today.getMonth() || orderDate.getFullYear() !== today.getFullYear()) return false;
            }
        }
        return true;
    });

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.amount || 0), 0);

    return (
        <div className="page" id="orders-history-page" style={{ padding: '40px 20px', background: 'var(--bg-secondary)', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
                <div className="page-header" style={{ marginBottom: 32, textAlign: 'left', padding: '0 8px' }}>
                    <h1 className="page-title" style={{ fontSize: '2.5rem', marginBottom: 8 }}>
                        {isAdmin ? 'Orders Management' : 'My Orders'}
                    </h1>
                    <p className="page-subtitle" style={{ fontSize: '1rem', color: 'var(--text-tertiary)' }}>
                        {isAdmin ? 'Track and manage all customer video generation orders' : 'View your history and download your AI creations'}
                    </p>
                </div>

                {/* Stats & Filters for Admin */}
                <div style={{ display: 'flex', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
                    {isAdmin && (
                        <div className="card" style={{ flex: '1 1 500px', display: 'flex', padding: 24, alignItems: 'center', flexWrap: 'wrap', gap: 24, border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                            <div style={{ flex: '1 1 200px' }}>
                                <label className="form-label" style={{ marginBottom: 8, fontSize: '0.85rem' }}>Filter by Email</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Search user email..."
                                    value={searchEmail}
                                    onChange={(e) => setSearchEmail(e.target.value)}
                                />
                            </div>
                            <div style={{ flex: '1 1 200px' }}>
                                <label className="form-label" style={{ marginBottom: 8, fontSize: '0.85rem' }}>Filter by Date</label>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {['all', 'today', 'yesterday', 'month'].map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => setFilterDate(f)}
                                            className={`btn ${filterDate === f ? 'btn-primary' : 'btn-ghost'}`}
                                            style={{ padding: '6px 14px', fontSize: '0.85rem', textTransform: 'capitalize' }}
                                        >
                                            {f === 'month' ? 'This Month' : f}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 16, flex: '1 1 300px' }}>
                        <div className="card" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                                {isAdmin ? 'Total Orders' : 'Your Orders'}
                            </p>
                            <p style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: 4, color: 'var(--text-primary)' }}>{filteredOrders.length}</p>
                        </div>
                        {isAdmin && (
                            <div className="card" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Revenue</p>
                                <p style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: 4, color: 'var(--accent-primary)' }}>₹{totalRevenue.toFixed(2)}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
                    {loading ? (
                        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                            <div className="spinner" style={{ margin: '0 auto 16px', borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)', width: 32, height: 32 }}></div>
                            Loading orders...
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                            <p style={{ fontSize: '1.2rem', marginBottom: 16 }}>No orders found.</p>
                            {!isAdmin && (
                                <Link to="/templates" className="btn btn-primary">Start Creating</Link>
                            )}
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto', width: '100%' }}>
                            <table className="admin-table" style={{ width: '100%', minWidth: isAdmin ? '1000px' : '800px' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--text-secondary)' }}>ID</th>
                                        {isAdmin && <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--text-secondary)' }}>Customer</th>}
                                        <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--text-secondary)' }}>Template</th>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--text-secondary)' }}>Amount</th>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--text-secondary)' }}>Payment</th>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--text-secondary)' }}>Status</th>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--text-secondary)' }}>Date</th>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--text-secondary)' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map((o) => (
                                        <tr key={o.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '16px 24px', fontFamily: 'monospace' }}>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                                    {o.readable_id || o.id.slice(0, 8)}
                                                </div>
                                            </td>
                                            {isAdmin && (
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ fontSize: '0.85rem' }}>{o.email}</div>
                                                </td>
                                            )}
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{o.templates?.name || '—'}</div>
                                            </td>
                                            <td style={{ padding: '16px 24px', fontWeight: 700 }}>
                                                ₹{Number(o.amount).toFixed(2)}
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span className={`tag ${o.payment_status === 'paid' ? 'tag-success' : 'tag-warning'}`} style={{ fontWeight: 700, fontSize: '0.7rem' }}>
                                                    {o.payment_status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span className={`tag ${o.generation_status === 'completed' ? 'tag-success' : o.generation_status === 'failed' ? 'tag-danger' : 'tag-info'}`} style={{ fontWeight: 700, fontSize: '0.7rem' }}>
                                                    {o.generation_status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                                                {new Date(o.created_at).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                {o.video_url && o.video_url.startsWith('https') ? (
                                                    <a href={o.video_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>
                                                        Download
                                                    </a>
                                                ) : (
                                                    <Link to={`/success?order_id=${o.id}`} className="btn btn-ghost btn-sm" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>
                                                        Track
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
