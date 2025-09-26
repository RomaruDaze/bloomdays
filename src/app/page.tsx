'use client'

import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar as CalendarIcon, Droplets, Heart, Zap, Moon, LogOut, User } from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns'
import { firebaseDB, PeriodEntry } from '@/lib/firebase-db'
import { useAuth } from '@/lib/auth-context'
import ProtectedRoute from '@/components/protected-route'

interface CycleDay {
  date: Date
  phase: 'period' | 'follicular' | 'ovulation' | 'luteal' | 'unknown'
  symptoms?: string[]
  isPrediction: boolean
}

export default function MenstrualTracker() {
  const { user, logout } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [periodEntries, setPeriodEntries] = useState<PeriodEntry[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [newEntry, setNewEntry] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    symptoms: '',
    notes: ''
  })

  // Load data from Firebase on mount
  useEffect(() => {
    if (!user) return

    const loadData = async () => {
      try {
        setIsLoading(true)
        const entries = await firebaseDB.getPeriodEntries()
        setPeriodEntries(entries)
      } catch (error) {
        console.error('Error loading data:', error)
        // Fallback to localStorage if Firebase fails
        const saved = localStorage.getItem('periodEntries')
        if (saved) {
          setPeriodEntries(JSON.parse(saved))
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return

    const unsubscribe = firebaseDB.subscribeToPeriodEntries((entries) => {
      setPeriodEntries(entries)
    })

    return unsubscribe
  }, [user])

  const calculateCyclePhases = (date: Date): CycleDay => {
    if (periodEntries.length === 0) {
      return { date, phase: 'unknown', isPrediction: false }
    }

    // Sort entries by start date
    const sortedEntries = [...periodEntries].sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )

    // Find the most recent period before or on this date
    let lastPeriod = sortedEntries[0]
    for (const entry of sortedEntries) {
      if (new Date(entry.startDate) <= date) {
        lastPeriod = entry
      } else {
        break
      }
    }

    const periodStart = new Date(lastPeriod.startDate)
    const periodEnd = lastPeriod.endDate ? new Date(lastPeriod.endDate) : new Date(periodStart.getTime() + 5 * 24 * 60 * 60 * 1000)

    // Calculate average cycle length from historical data
    const cycleLengths: number[] = []
    for (let i = 1; i < sortedEntries.length; i++) {
      const prevStart = new Date(sortedEntries[i - 1].startDate)
      const currStart = new Date(sortedEntries[i].startDate)
      cycleLengths.push(Math.round((currStart.getTime() - prevStart.getTime()) / (1000 * 60 * 60 * 24)))
    }
    
    const avgCycleLength = cycleLengths.length > 0 
      ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
      : 28

    const daysSincePeriodStart = Math.floor((date.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))
    const periodLength = Math.floor((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))

    // Determine phase based on days since period start
    if (daysSincePeriodStart >= 0 && daysSincePeriodStart <= periodLength) {
      return { date, phase: 'period', isPrediction: false }
    } else if (daysSincePeriodStart > periodLength && daysSincePeriodStart <= periodLength + 7) {
      return { date, phase: 'follicular', isPrediction: false }
    } else if (daysSincePeriodStart > periodLength + 7 && daysSincePeriodStart <= periodLength + 14) {
      return { date, phase: 'ovulation', isPrediction: false }
    } else if (daysSincePeriodStart > periodLength + 14 && daysSincePeriodStart < avgCycleLength) {
      return { date, phase: 'luteal', isPrediction: false }
    } else {
      // Future predictions
      const futureDays = daysSincePeriodStart % avgCycleLength
      if (futureDays <= periodLength) {
        return { date, phase: 'period', isPrediction: true }
      } else if (futureDays <= periodLength + 7) {
        return { date, phase: 'follicular', isPrediction: true }
      } else if (futureDays <= periodLength + 14) {
        return { date, phase: 'ovulation', isPrediction: true }
      } else {
        return { date, phase: 'luteal', isPrediction: true }
      }
    }
  }

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'period': return 'bg-red-100 text-red-800 border-red-200'
      case 'follicular': return 'bg-green-100 text-green-800 border-green-200'
      case 'ovulation': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'luteal': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'period': return <Droplets className="w-4 h-4" />
      case 'follicular': return <Heart className="w-4 h-4" />
      case 'ovulation': return <Zap className="w-4 h-4" />
      case 'luteal': return <Moon className="w-4 h-4" />
      default: return <CalendarIcon className="w-4 h-4" />
    }
  }

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'period': return 'Period'
      case 'follicular': return 'Follicular'
      case 'ovulation': return 'Ovulation'
      case 'luteal': return 'Luteal'
      default: return 'Unknown'
    }
  }

  const addPeriodEntry = async () => {
    try {
      const symptoms = newEntry.symptoms.split(',').map(s => s.trim()).filter(Boolean)
      const entryData = {
        startDate: newEntry.startDate,
        endDate: newEntry.endDate,
        symptoms,
        notes: newEntry.notes,
        userId: user?.uid
      }
      
      await firebaseDB.addPeriodEntry(entryData)
      
      setNewEntry({
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        symptoms: '',
        notes: ''
      })
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error adding entry:', error)
      // Fallback to localStorage
      const symptoms = newEntry.symptoms.split(',').map(s => s.trim()).filter(Boolean)
      const entry: PeriodEntry = {
        id: Date.now().toString(),
        startDate: newEntry.startDate,
        endDate: newEntry.endDate,
        symptoms,
        notes: newEntry.notes,
        userId: user?.uid
      }
      
      setPeriodEntries([...periodEntries, entry])
      localStorage.setItem('periodEntries', JSON.stringify([...periodEntries, entry]))
      
      setNewEntry({
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        symptoms: '',
        notes: ''
      })
      setIsDialogOpen(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const getCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    return eachDayOfInterval({ start: monthStart, end: monthEnd })
  }

  const selectedDayInfo = calculateCyclePhases(selectedDate)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
        <div className="max-w-md mx-auto">
          {/* Header with User Info */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <User className="w-5 h-5 text-gray-600" />
                )}
                <span className="text-sm text-gray-600">
                  {user?.displayName || user?.email}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Menstrual Cycle Tracker</h1>
            <p className="text-gray-600">Track and predict menstrual cycles</p>
          </div>

          {/* Calendar */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  ←
                </Button>
                <CardTitle className="text-lg">
                  {format(currentMonth, 'MMMM yyyy')}
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  →
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                month={currentMonth}
                className="rounded-md border"
                components={{
                  DayContent: ({ date, ...props }) => {
                    const cycleDay = calculateCyclePhases(date)
                    const isCurrentMonth = isSameMonth(date, currentMonth)
                    
                    return (
                      <div className="relative w-full h-full">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
                            ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                            ${cycleDay.phase !== 'unknown' ? getPhaseColor(cycleDay.phase) + ' border' : ''}
                            ${isSameDay(date, selectedDate) ? 'ring-2 ring-pink-500' : ''}
                          `}
                        >
                          {format(date, 'd')}
                        </div>
                        {cycleDay.isPrediction && (
                          <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-full"></div>
                        )}
                      </div>
                    )
                  }
                }}
              />
            </CardContent>
          </Card>

          {/* Selected Day Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {getPhaseIcon(selectedDayInfo.phase)}
                {format(selectedDate, 'MMMM d, yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Phase:</span>
                  <Badge className={getPhaseColor(selectedDayInfo.phase)}>
                    {getPhaseLabel(selectedDayInfo.phase)}
                    {selectedDayInfo.isPrediction && ' (Predicted)'}
                  </Badge>
                </div>
                
                {selectedDayInfo.phase === 'period' && (
                  <div className="text-sm text-gray-600">
                    This is expected to be a period day. Track symptoms and mood changes.
                  </div>
                )}
                
                {selectedDayInfo.phase === 'ovulation' && (
                  <div className="text-sm text-gray-600">
                    This is the ovulation phase. Fertility is typically highest during this time.
                  </div>
                )}
                
                {selectedDayInfo.phase === 'follicular' && (
                  <div className="text-sm text-gray-600">
                    This is the follicular phase. Energy levels typically increase during this time.
                  </div>
                )}
                
                {selectedDayInfo.phase === 'luteal' && (
                  <div className="text-sm text-gray-600">
                    This is the luteal phase. Mood swings and PMS symptoms may occur.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="mb-20">
            <CardHeader>
              <CardTitle className="text-lg">Phase Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-100 border border-red-200"></div>
                  <span className="text-sm">Period</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-100 border border-green-200"></div>
                  <span className="text-sm">Follicular</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-100 border border-blue-200"></div>
                  <span className="text-sm">Ovulation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-purple-100 border border-purple-200"></div>
                  <span className="text-sm">Luteal</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                <span className="text-sm text-gray-600">Predicted day</span>
              </div>
            </CardContent>
          </Card>

          {/* Floating Action Button */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg bg-pink-500 hover:bg-pink-600"
              >
                <Plus className="w-6 h-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Period Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newEntry.startDate}
                    onChange={(e) => setNewEntry({...newEntry, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newEntry.endDate}
                    onChange={(e) => setNewEntry({...newEntry, endDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="symptoms">Symptoms (comma-separated)</Label>
                  <Input
                    id="symptoms"
                    placeholder="cramps, headache, fatigue"
                    value={newEntry.symptoms}
                    onChange={(e) => setNewEntry({...newEntry, symptoms: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes..."
                    value={newEntry.notes}
                    onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})}
                  />
                </div>
                <Button onClick={addPeriodEntry} className="w-full">
                  Add Entry
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </ProtectedRoute>
  )
}