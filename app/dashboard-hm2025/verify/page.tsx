'use client'
import { useEffect, useState, useCallback } from 'react'

interface VerifiedUser {
  id: string
  discordUserId: string
  guildId: string
  username: string | null
  globalName: string | null
  avatar: string | null
  verifiedAt: string
  ip: string | null
}

interface Stats {
  total: number
  todayCount: number
  uniqueUsers: number
  uniqueGuilds: number
  guilds: { guildId: string; count: number }[]
}

function avatarUrl(userId: string, avatar: string | null) {
  if (!avatar) return `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(userId) >> BigInt(22)) % 6}.png`
  return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png?size=64`
}

function displayName(u: VerifiedUser) {
  return u.globalName || u.username || u.discordUserId
}

export default function VerifyDashboard() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [logging, setLogging] = useState(false)

  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<VerifiedUser[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [guildFilter, setGuildFilter] = useState('')

  const [modal, setModal] = useState<{ user: VerifiedUser } | null>(null)
  const [targetGuild, setTargetGuild] = useState('')
  const [addStatus, setAddStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [addError, setAddError] = useState('')

  async function login() {
    setLogging(true)
    setPwError('')
    try {
      const res = await fetch('/api/admin/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) { setAuthed(true) }
      else { setPwError('Wrong password.') }
    } catch { setPwError('Network error.') }
    setLogging(false)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [statsRes, usersRes] = await Promise.all([
      fetch('/api/admin/verify/stats'),
      fetch(`/api/admin/verify/users?limit=200${guildFilter ? `&guild=${guildFilter}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}`),
    ])
    if (statsRes.ok) setStats(await statsRes.json())
    if (usersRes.ok) setUsers((await usersRes.json()).users)
    setLoading(false)
  }, [guildFilter, search])

  useEffect(() => {
    if (authed) fetchData()
  }, [authed, fetchData])

  async function addToGuild() {
    if (!modal || !targetGuild.trim()) return
    setAddStatus('loading')
    setAddError('')
    try {
      const res = await fetch('/api/admin/verify/add-to-guild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordUserId: modal.user.discordUserId, guildId: targetGuild.trim() }),
      })
      if (res.ok) {
        setAddStatus('ok')
      } else {
        const d = await res.json()
        setAddError(d.error || 'Unknown error.')
        setAddStatus('error')
      }
    } catch {
      setAddError('Network error.')
      setAddStatus('error')
    }
  }

  function closeModal() {
    setModal(null)
    setTargetGuild('')
    setAddStatus('idle')
    setAddError('')
  }

  // ── Login screen ─────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 16, padding: '40px 32px', maxWidth: 380, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>🔐</div>
          <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Verify Dashboard</h1>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            placeholder="Dashboard password"
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
          {pwError && <p style={{ color: '#ff6b6b', fontSize: 13, marginTop: 8 }}>{pwError}</p>}
          <button
            onClick={login}
            disabled={logging}
            style={{ marginTop: 16, width: '100%', padding: '10px 0', borderRadius: 8, background: '#5865F2', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}
          >
            {logging ? 'Signing in…' : 'Sign in'}
          </button>
          <a href="/dashboard-hm2025" style={{ display: 'block', marginTop: 16, color: '#555', fontSize: 12 }}>← Back to dashboard</a>
        </div>
      </div>
    )
  }

  // ── Main dashboard ────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #1a1a1a', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/dashboard-hm2025" style={{ color: '#555', fontSize: 13, textDecoration: 'none' }}>← Dashboard</a>
          <span style={{ color: '#333' }}>/</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Discord Verify</span>
        </div>
        <button onClick={fetchData} style={{ background: '#1a1a1a', border: '1px solid #333', color: '#aaa', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
          {loading ? '⟳' : '↺ Refresh'}
        </button>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Total verifications', value: stats.total, icon: '✅' },
              { label: 'Today', value: stats.todayCount, icon: '📅' },
              { label: 'Unique users', value: stats.uniqueUsers, icon: '👤' },
              { label: 'Unique servers', value: stats.uniqueGuilds, icon: '🏠' },
            ].map(s => (
              <div key={s.label} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: '20px 24px' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{s.value.toLocaleString()}</div>
                <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchData()}
            placeholder="Search by username or ID..."
            style={{ flex: 1, minWidth: 200, padding: '8px 14px', borderRadius: 8, border: '1px solid #2a2a2a', background: '#111', color: '#fff', fontSize: 14, outline: 'none' }}
          />
          <select
            value={guildFilter}
            onChange={e => setGuildFilter(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #2a2a2a', background: '#111', color: '#fff', fontSize: 14, outline: 'none', minWidth: 180 }}
          >
            <option value="">All servers</option>
            {stats?.guilds.map(g => (
              <option key={g.guildId} value={g.guildId}>{g.guildId} ({g.count})</option>
            ))}
          </select>
          <button
            onClick={fetchData}
            style={{ padding: '8px 20px', borderRadius: 8, background: '#5865F2', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}
          >
            Cerca
          </button>
        </div>

        {/* Table */}
        <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e1e1e', fontSize: 13, color: '#555', fontWeight: 600 }}>
            {users.length} verified users
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#555' }}>Loading...</div>
          ) : users.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#555' }}>No users found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e1e1e' }}>
                    {['Utente', 'Discord ID', 'Server (Guild ID)', 'Data verifica', 'IP', 'Azioni'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: '#555', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? '1px solid #161616' : 'none' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={avatarUrl(u.discordUserId, u.avatar)}
                            alt=""
                            style={{ width: 32, height: 32, borderRadius: '50%', background: '#222' }}
                          />
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{displayName(u)}</div>
                            {u.username && u.globalName && u.username !== u.globalName && (
                              <div style={{ fontSize: 11, color: '#555' }}>@{u.username}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#888', fontFamily: 'monospace' }}>{u.discordUserId}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#888', fontFamily: 'monospace' }}>{u.guildId}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#666', whiteSpace: 'nowrap' }}>
                        {new Date(u.verifiedAt).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#555', fontFamily: 'monospace' }}>{u.ip ?? '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          onClick={() => { setModal({ user: u }); setAddStatus('idle') }}
                          style={{ background: '#1a1a2e', border: '1px solid #5865F2', color: '#7289da', padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                        >
                          + Add to server
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

      {/* Add-to-guild modal */}
      {modal && (
        <div
          onClick={closeModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 16, padding: '32px', maxWidth: 420, width: '100%', margin: '0 16px' }}
          >
            {addStatus === 'ok' ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <h2 style={{ color: '#fff', fontWeight: 700, marginBottom: 8 }}>Fatto!</h2>
                <p style={{ color: '#888', fontSize: 14 }}>{displayName(modal.user)} è stato aggiunto al server.</p>
                <button onClick={closeModal} style={{ marginTop: 20, padding: '8px 24px', borderRadius: 8, background: '#222', border: '1px solid #333', color: '#fff', cursor: 'pointer' }}>
                  Chiudi
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarUrl(modal.user.discordUserId, modal.user.avatar)} alt="" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                  <div>
                    <div style={{ color: '#fff', fontWeight: 700 }}>{displayName(modal.user)}</div>
                    <div style={{ color: '#555', fontSize: 12 }}>{modal.user.discordUserId}</div>
                  </div>
                </div>
                <h2 style={{ color: '#fff', fontWeight: 700, marginBottom: 6, fontSize: 16 }}>Add to another server</h2>
                <p style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>Enter the target Discord server's Guild ID. The bot must already be in that server.</p>
                <input
                  value={targetGuild}
                  onChange={e => setTargetGuild(e.target.value)}
                  placeholder="Guild ID (es. 123456789012345678)"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #2a2a2a', background: '#0a0a0a', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
                {addStatus === 'error' && <p style={{ color: '#ff6b6b', fontSize: 13, marginTop: 8 }}>{addError}</p>}
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button
                    onClick={closeModal}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 8, background: '#1a1a1a', border: '1px solid #333', color: '#888', cursor: 'pointer', fontSize: 14 }}
                  >
                    Annulla
                  </button>
                  <button
                    onClick={addToGuild}
                    disabled={addStatus === 'loading' || !targetGuild.trim()}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 8, background: '#5865F2', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', opacity: addStatus === 'loading' ? 0.7 : 1 }}
                  >
                    {addStatus === 'loading' ? 'Adding…' : 'Add'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
