import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import {
  FileDown, RefreshCw, Search, Trash2, ChevronUp, ChevronDown, Eye
} from 'lucide-react'
import { getPatients, downloadReport, deletePatient } from '../api.js'
import SeverityBadge from '../components/SeverityBadge.jsx'
import StatsBar from '../components/StatsBar.jsx'
import { formatConfidence, formatDate } from '../utils.js'

const SORT_FIELDS = {
  name: (a, b) => a.name.localeCompare(b.name),
  age: (a, b) => a.age - b.age,
  result: (a, b) => a.result.localeCompare(b.result),
  confidence: (a, b) => b.confidence - a.confidence,
  created_at: (a, b) => new Date(b.created_at) - new Date(a.created_at),
}

export default function DashboardPage() {
  const [patients, setPatients] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('created_at')
  const [sortAsc, setSortAsc] = useState(true)
  const [downloading, setDownloading] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [imageModal, setImageModal] = useState(null)

  const fetchPatients = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getPatients()
      setPatients(data)
    } catch (err) {
      toast.error(err.message || 'Failed to load patients.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPatients() }, [fetchPatients])

  useEffect(() => {
    let list = patients.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.result.toLowerCase().includes(search.toLowerCase()) ||
      p.gender.toLowerCase().includes(search.toLowerCase())
    )
    const cmp = SORT_FIELDS[sortField]
    if (cmp) list = [...list].sort(sortAsc ? cmp : (a, b) => -cmp(a, b))
    setFiltered(list)
  }, [patients, search, sortField, sortAsc])

  const handleSort = (field) => {
    if (sortField === field) setSortAsc(a => !a)
    else { setSortField(field); setSortAsc(true) }
  }

  const handleDownload = async (patient) => {
    setDownloading(patient.id)
    try {
      await downloadReport(patient.id, patient.name)
      toast.success('Report downloaded!')
    } catch (err) {
      toast.error(err.message || 'Download failed.')
    } finally {
      setDownloading(null)
    }
  }

  const handleDelete = async (patient) => {
    if (!window.confirm(`Delete record for ${patient.name}? This cannot be undone.`)) return
    setDeleting(patient.id)
    try {
      await deletePatient(patient.id)
      setPatients(p => p.filter(x => x.id !== patient.id))
      toast.success('Patient record deleted.')
    } catch (err) {
      toast.error(err.message || 'Delete failed.')
    } finally {
      setDeleting(null)
    }
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronUp size={12} className="text-[var(--text-muted)] opacity-30" />
    return sortAsc
      ? <ChevronUp size={12} className="text-blue-400" />
      : <ChevronDown size={12} className="text-blue-400" />
  }

  const SortTh = ({ field, children }) => (
    <th
      className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-secondary)] select-none"
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1.5">
        {children}
        <SortIcon field={field} />
      </span>
    </th>
  )

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-blue-400 text-xs font-mono uppercase tracking-widest mb-1">Patient Records</p>
          <h1 className="font-display font-bold text-3xl text-[var(--text-primary)]">Dashboard</h1>
        </div>
        <button
          onClick={fetchPatients}
          disabled={loading}
          className="btn-secondary"
          title="Refresh"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      {patients.length > 0 && <StatsBar patients={patients} />}

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Search by name, result, or gender…"
          className="input-field pl-10"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[var(--text-muted)] text-sm gap-3">
            <RefreshCw size={16} className="animate-spin" /> Loading patient records…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Eye size={32} className="mx-auto text-[var(--text-muted)] mb-3 opacity-40" />
            <p className="text-[var(--text-secondary)] text-sm">
              {patients.length === 0 ? 'No patient records yet.' : 'No results match your search.'}
            </p>
            {patients.length === 0 && (
              <p className="text-[var(--text-muted)] text-xs mt-1">
                Submit a scan to get started.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
                    ID
                  </th>
                  <SortTh field="name">Name</SortTh>
                  <SortTh field="age">Age</SortTh>
                  <th className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
                    Gender
                  </th>
                  <SortTh field="result">Result</SortTh>
                  <SortTh field="confidence">Confidence</SortTh>
                  <SortTh field="created_at">Date</SortTh>
                  <th className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
                    Image
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((patient) => (
                  <tr key={patient.id} className="table-row-hover transition-colors duration-150">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-[var(--text-muted)]">
                        #{String(patient.id).padStart(4, '0')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-[var(--text-primary)] text-sm">{patient.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[var(--text-secondary)] text-sm">{patient.age}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[var(--text-secondary)] text-sm capitalize">{patient.gender}</span>
                    </td>
                    <td className="px-4 py-3">
                      <SeverityBadge result={patient.result} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-[var(--text-secondary)]">
                        {formatConfidence(patient.confidence)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
                        {formatDate(patient.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {patient.image_path && (
                        <button
                          onClick={() => setImageModal(`/uploads/${patient.image_path.split('/').pop()}`)}
                          className="w-10 h-10 rounded-lg overflow-hidden border border-[var(--border)] hover:border-blue-500/50 transition-colors"
                          title="View image"
                        >
                          <img
                            src={`/uploads/${patient.image_path.split('/').pop()}`}
                            alt="retinal thumbnail"
                            className="w-full h-full object-cover"
                            onError={e => { e.target.style.display = 'none' }}
                          />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleDownload(patient)}
                          disabled={downloading === patient.id}
                          className="btn-secondary px-3 py-1.5 text-xs"
                          title="Download PDF report"
                        >
                          {downloading === patient.id
                            ? <RefreshCw size={13} className="animate-spin" />
                            : <FileDown size={13} />
                          }
                          Report
                        </button>
                        <button
                          onClick={() => handleDelete(patient)}
                          disabled={deleting === patient.id}
                          className="p-2 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
                          title="Delete record"
                        >
                          {deleting === patient.id
                            ? <RefreshCw size={13} className="animate-spin" />
                            : <Trash2 size={13} />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-[var(--text-muted)] text-xs font-mono">
              Showing {filtered.length} of {patients.length} records
            </span>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-blue-400 text-xs hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>

      {/* Image modal */}
      {imageModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setImageModal(null)}
        >
          <div className="max-w-lg w-full animate-slide-up" onClick={e => e.stopPropagation()}>
            <img
              src={imageModal}
              alt="Retinal image"
              className="w-full rounded-2xl border border-[var(--border)]"
            />
            <button
              onClick={() => setImageModal(null)}
              className="mt-3 w-full btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
