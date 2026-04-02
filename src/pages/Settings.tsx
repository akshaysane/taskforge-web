import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { refreshToken as refreshAuthToken } from '../api/auth'
import { createFamily, updateFamily, addChild, getMembers, updateMember, removeMember } from '../api/family'
import type { FamilyMember } from '../api/family'
import Header from '../components/Header'
import FamilySetup from '../components/FamilySetup'
import AddChildForm from '../components/AddChildForm'
import MemberList from '../components/MemberList'
import EditMemberModal from '../components/EditMemberModal'

export default function Settings() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const familyId = user?.familyId
  const setFamilyId = useAuthStore((s) => s.setFamilyId)

  const [familyName, setFamilyName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  const fetchMembers = useCallback(async () => {
    if (!familyId) return
    setLoadingMembers(true)
    try { setMembers(await getMembers(familyId)) } catch {}
    finally { setLoadingMembers(false) }
  }, [familyId])

  useEffect(() => {
    if (familyId) fetchMembers()
  }, [familyId, fetchMembers])

  const login = useAuthStore((s) => s.login)
  const currentRefreshToken = useAuthStore((s) => s.refreshToken)

  const handleFamilyCreated = async (newFamilyId: string) => {
    // Update local store immediately
    setFamilyId(newFamilyId)

    // Refresh the JWT so the token has the new familyId
    if (currentRefreshToken) {
      try {
        const tokens = await refreshAuthToken(currentRefreshToken)
        // Update tokens in store (user info stays, just new tokens)
        const currentUser = useAuthStore.getState().user
        if (currentUser) {
          login(tokens.accessToken, tokens.refreshToken, { ...currentUser, familyId: newFamilyId })
        }
      } catch {
        // Token refresh failed — store update still works for this session
      }
    }
  }

  const handleUpdateMember = async (input: { name?: string; pin?: string }) => {
    if (!familyId || !editingMember) return
    await updateMember(familyId, editingMember.id, input)
    fetchMembers()
  }

  const handleRemoveMember = async (userId: string) => {
    if (!familyId) return
    await removeMember(familyId, userId)
    fetchMembers()
  }

  const handleSaveName = async () => {
    if (!familyId || !familyName.trim()) return
    try {
      await updateFamily(familyId, familyName.trim())
      setEditingName(false)
    } catch {}
  }

  // No family — onboarding mode
  if (!familyId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Header />
        <main className="max-w-md mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <FamilySetup onCreated={handleFamilyCreated} createFamily={createFamily} />
          </div>
        </main>
      </div>
    )
  }

  // Has family — management mode
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Family Name */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-accent mb-3">🏠 Family</h3>
          {editingName ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="flex-1 bg-surface rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              />
              <button onClick={handleSaveName}
                className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-full text-sm transition-colors">
                Save
              </button>
              <button onClick={() => setEditingName(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-2 px-4 rounded-full text-sm transition-colors">
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-semibold">{user?.familyId ? 'Your family' : ''}</span>
              <button onClick={() => { setFamilyName(''); setEditingName(true) }}
                className="text-sm hover:scale-110 transition-transform" title="Edit name">✏️</button>
            </div>
          )}
        </div>

        {/* Add Child */}
        <AddChildForm onAdded={fetchMembers} addChild={async (input) => { await addChild(familyId, input) }} />

        {/* Member List */}
        <MemberList
          members={members}
          loading={loadingMembers}
          onEdit={(m) => { setEditingMember(m); setEditModalOpen(true) }}
          onRemove={handleRemoveMember}
        />

        {/* Go to Dashboard */}
        <button
          onClick={() => navigate('/home')}
          className="w-full bg-accent hover:bg-accent-dark text-white font-bold py-3 rounded-full text-lg transition-colors"
        >
          Go to Dashboard →
        </button>
      </main>

      <EditMemberModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleUpdateMember}
        member={editingMember}
      />
    </div>
  )
}
