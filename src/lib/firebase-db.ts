import { database } from './firebase'
import { ref, set, get, push, remove, onValue, off } from 'firebase/database'
import { auth } from './firebase'

export interface PeriodEntry {
  id: string
  startDate: string
  endDate?: string
  symptoms?: string[]
  notes?: string
  userId?: string
}

export class FirebaseDB {
  private get userId(): string {
    return auth.currentUser?.uid || 'anonymous'
  }

  // Get all period entries for a user
  async getPeriodEntries(): Promise<PeriodEntry[]> {
    try {
      const entriesRef = ref(database, `users/${this.userId}/periodEntries`)
      const snapshot = await get(entriesRef)
      
      if (snapshot.exists()) {
        const data = snapshot.val()
        return Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }))
      }
      return []
    } catch (error) {
      console.error('Error fetching period entries:', error)
      return []
    }
  }

  // Add a new period entry
  async addPeriodEntry(entry: Omit<PeriodEntry, 'id'>): Promise<string> {
    try {
      const entriesRef = ref(database, `users/${this.userId}/periodEntries`)
      const newEntryRef = push(entriesRef)
      await set(newEntryRef, entry)
      return newEntryRef.key!
    } catch (error) {
      console.error('Error adding period entry:', error)
      throw error
    }
  }

  // Update an existing period entry
  async updatePeriodEntry(id: string, entry: Partial<PeriodEntry>): Promise<void> {
    try {
      const entryRef = ref(database, `users/${this.userId}/periodEntries/${id}`)
      await set(entryRef, entry)
    } catch (error) {
      console.error('Error updating period entry:', error)
      throw error
    }
  }

  // Delete a period entry
  async deletePeriodEntry(id: string): Promise<void> {
    try {
      const entryRef = ref(database, `users/${this.userId}/periodEntries/${id}`)
      await remove(entryRef)
    } catch (error) {
      console.error('Error deleting period entry:', error)
      throw error
    }
  }

  // Listen to real-time updates
  subscribeToPeriodEntries(callback: (entries: PeriodEntry[]) => void): () => void {
    const entriesRef = ref(database, `users/${this.userId}/periodEntries`)
    
    const unsubscribe = onValue(entriesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const entries = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }))
        callback(entries)
      } else {
        callback([])
      }
    })

    return () => off(entriesRef, 'value', unsubscribe)
  }
}

// Export a default instance
export const firebaseDB = new FirebaseDB()
