"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Calendar as CalendarIcon,
  Droplets,
  Heart,
  Zap,
  Moon,
  LogOut,
  User,
  Clock,
  TrendingUp,
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
  addDays,
  isValid,
} from "date-fns";
import { firebaseDB, PeriodEntry } from "@/lib/firebase-db";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/protected-route";

interface CycleDay {
  date: Date;
  phase: "period" | "follicular" | "ovulation" | "luteal" | "unknown";
  symptoms?: string[];
  isPrediction: boolean;
}

interface CycleInfo {
  averageCycleLength: number;
  averagePeriodLength: number;
  nextPeriodStart: Date | null;
  nextOvulation: Date | null;
  currentPhase: string;
  daysUntilNextPeriod: number | null;
}

export default function MenstrualTracker() {
  const { user, logout } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [periodEntries, setPeriodEntries] = useState<PeriodEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [newEntry, setNewEntry] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
  });

  // Ensure client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load data from Firebase on mount
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const entries = await firebaseDB.getPeriodEntries();
        setPeriodEntries(entries);
      } catch (error) {
        console.error("Error loading data:", error);
        // Fallback to localStorage if Firebase fails
        const saved = localStorage.getItem("periodEntries");
        if (saved) {
          setPeriodEntries(JSON.parse(saved));
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    const unsubscribe = firebaseDB.subscribeToPeriodEntries((entries) => {
      setPeriodEntries(entries);
    });

    return unsubscribe;
  }, [user]);

  // Enhanced cycle calculation function
  const calculateCycleInfo = (): CycleInfo => {
    if (periodEntries.length === 0) {
      return {
        averageCycleLength: 28,
        averagePeriodLength: 5,
        nextPeriodStart: null,
        nextOvulation: null,
        currentPhase: "unknown",
        daysUntilNextPeriod: null,
      };
    }

    // Sort entries by start date
    const sortedEntries = [...periodEntries].sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    // Calculate average cycle length
    const cycleLengths: number[] = [];
    for (let i = 1; i < sortedEntries.length; i++) {
      const prevStart = new Date(sortedEntries[i - 1].startDate);
      const currStart = new Date(sortedEntries[i].startDate);

      // Only add valid cycle lengths (between 21-35 days)
      if (isValid(prevStart) && isValid(currStart)) {
        const cycleLength = Math.round(
          (currStart.getTime() - prevStart.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (cycleLength >= 21 && cycleLength <= 35) {
          cycleLengths.push(cycleLength);
        }
      }
    }

    const averageCycleLength =
      cycleLengths.length > 0
        ? Math.round(
            cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length
          )
        : 28;

    // Calculate average period length (default to 5 days)
    const averagePeriodLength = 5;

    // Find the most recent period
    const lastPeriod = sortedEntries[sortedEntries.length - 1];
    const lastPeriodStart = new Date(lastPeriod.startDate);

    // Validate the last period start date
    if (!isValid(lastPeriodStart)) {
      return {
        averageCycleLength,
        averagePeriodLength,
        nextPeriodStart: null,
        nextOvulation: null,
        currentPhase: "unknown",
        daysUntilNextPeriod: null,
      };
    }

    // Calculate next period start
    const nextPeriodStart = addDays(lastPeriodStart, averageCycleLength);

    // Validate next period start
    if (!isValid(nextPeriodStart)) {
      return {
        averageCycleLength,
        averagePeriodLength,
        nextPeriodStart: null,
        nextOvulation: null,
        currentPhase: "unknown",
        daysUntilNextPeriod: null,
      };
    }

    // Calculate next ovulation (typically 14 days before next period)
    const nextOvulation = addDays(nextPeriodStart, -14);

    // Calculate current phase
    const today = new Date();
    const daysSinceLastPeriod = Math.floor(
      (today.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysUntilNextPeriod = Math.floor(
      (nextPeriodStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    let currentPhase = "unknown";
    if (
      daysSinceLastPeriod >= 0 &&
      daysSinceLastPeriod <= averagePeriodLength
    ) {
      currentPhase = "period";
    } else if (
      daysSinceLastPeriod > averagePeriodLength &&
      daysSinceLastPeriod <= averagePeriodLength + 7
    ) {
      currentPhase = "follicular";
    } else if (
      daysSinceLastPeriod > averagePeriodLength + 7 &&
      daysSinceLastPeriod <= averagePeriodLength + 14
    ) {
      currentPhase = "ovulation";
    } else if (
      daysSinceLastPeriod > averagePeriodLength + 14 &&
      daysSinceLastPeriod < averageCycleLength
    ) {
      currentPhase = "luteal";
    }

    return {
      averageCycleLength,
      averagePeriodLength,
      nextPeriodStart,
      nextOvulation,
      currentPhase,
      daysUntilNextPeriod: daysUntilNextPeriod > 0 ? daysUntilNextPeriod : null,
    };
  };

  const calculateCyclePhases = (date: Date): CycleDay => {
    const cycleInfo = calculateCycleInfo();

    if (periodEntries.length === 0) {
      return { date, phase: "unknown", isPrediction: false };
    }

    // Sort entries by start date
    const sortedEntries = [...periodEntries].sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    // Find the most recent period before or on this date
    let lastPeriod = sortedEntries[0];
    for (const entry of sortedEntries) {
      if (new Date(entry.startDate) <= date) {
        lastPeriod = entry;
      } else {
        break;
      }
    }

    const periodStart = new Date(lastPeriod.startDate);
    const periodEnd = new Date(
      periodStart.getTime() +
        cycleInfo.averagePeriodLength * 24 * 60 * 60 * 1000
    );

    // Validate dates
    if (!isValid(periodStart)) {
      return { date, phase: "unknown", isPrediction: false };
    }

    const daysSincePeriodStart = Math.floor(
      (date.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const periodLength = Math.floor(
      (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Determine phase based on days since period start
    if (daysSincePeriodStart >= 0 && daysSincePeriodStart <= periodLength) {
      return { date, phase: "period", isPrediction: false };
    } else if (
      daysSincePeriodStart > periodLength &&
      daysSincePeriodStart <= periodLength + 7
    ) {
      return { date, phase: "follicular", isPrediction: false };
    } else if (
      daysSincePeriodStart > periodLength + 7 &&
      daysSincePeriodStart <= periodLength + 14
    ) {
      return { date, phase: "ovulation", isPrediction: false };
    } else if (
      daysSincePeriodStart > periodLength + 14 &&
      daysSincePeriodStart < cycleInfo.averageCycleLength
    ) {
      return { date, phase: "luteal", isPrediction: false };
    } else {
      // Future predictions
      const futureDays = daysSincePeriodStart % cycleInfo.averageCycleLength;
      if (futureDays <= periodLength) {
        return { date, phase: "period", isPrediction: true };
      } else if (futureDays <= periodLength + 7) {
        return { date, phase: "follicular", isPrediction: true };
      } else if (futureDays <= periodLength + 14) {
        return { date, phase: "ovulation", isPrediction: true };
      } else {
        return { date, phase: "luteal", isPrediction: true };
      }
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "period":
        return "bg-red-100 text-red-800 border-red-200";
      case "follicular":
        return "bg-green-100 text-green-800 border-green-200";
      case "ovulation":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "luteal":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case "period":
        return <Droplets className="w-4 h-4" />;
      case "follicular":
        return <Heart className="w-4 h-4" />;
      case "ovulation":
        return <Zap className="w-4 h-4" />;
      case "luteal":
        return <Moon className="w-4 h-4" />;
      default:
        return <CalendarIcon className="w-4 h-4" />;
    }
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case "period":
        return "Period";
      case "follicular":
        return "Follicular";
      case "ovulation":
        return "Ovulation";
      case "luteal":
        return "Luteal";
      default:
        return "Unknown";
    }
  };

  const addPeriodEntry = async () => {
    try {
      const entryData: Omit<PeriodEntry, "id"> = {
        startDate: newEntry.date,
        userId: user?.uid,
      };

      await firebaseDB.addPeriodEntry(entryData);

      setNewEntry({
        date: format(new Date(), "yyyy-MM-dd"),
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error adding entry:", error);
      // Fallback to localStorage
      const entry: PeriodEntry = {
        id: Date.now().toString(),
        startDate: newEntry.date,
        userId: user?.uid,
      };

      setPeriodEntries([...periodEntries, entry]);
      localStorage.setItem(
        "periodEntries",
        JSON.stringify([...periodEntries, entry])
      );

      setNewEntry({
        date: format(new Date(), "yyyy-MM-dd"),
      });
      setIsDialogOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const getCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  };

  const selectedDayInfo = calculateCyclePhases(selectedDate);
  const cycleInfo = calculateCycleInfo();

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
            <div className="flex justify-center items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                BLOOMDAYS
              </h1>
            </div>
          </div>

          {/* Selected Day Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {getPhaseIcon(selectedDayInfo.phase)}
                {format(selectedDate, "MMMM d, yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Phase:</span>
                  <Badge className={getPhaseColor(selectedDayInfo.phase)}>
                    {getPhaseLabel(selectedDayInfo.phase)}
                    {selectedDayInfo.isPrediction && " (Predicted)"}
                  </Badge>
                </div>

                {selectedDayInfo.phase === "period" && (
                  <div className="text-sm text-gray-600">
                    This is expected to be a period day. Track symptoms and mood
                    changes.
                  </div>
                )}

                {selectedDayInfo.phase === "ovulation" && (
                  <div className="text-sm text-gray-600">
                    This is the ovulation phase. Fertility is typically highest
                    during this time.
                  </div>
                )}

                {selectedDayInfo.phase === "follicular" && (
                  <div className="text-sm text-gray-600">
                    This is the follicular phase. Energy levels typically
                    increase during this time.
                  </div>
                )}

                {selectedDayInfo.phase === "luteal" && (
                  <div className="text-sm text-gray-600">
                    This is the luteal phase. Mood swings and PMS symptoms may
                    occur.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Calendar */}
          <Card className="mb-6 px-6 py-4 bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  ←
                </Button>
                <CardTitle className="text-lg font-bold text-pink-800">
                  {format(currentMonth, "MMMM yyyy")}
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
            <CardContent className="pt-0 flex justify-center">
              {isClient ? (
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  month={currentMonth}
                  className="rounded-md border mx-auto"
                  components={{
                    Nav: () => <></>, // Remove navigation buttons
                    MonthCaption: () => <></>, // Remove month caption
                  }}
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Loading calendar...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cycle Overview */}
          <Card className="mb-20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Cycle Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Current Phase:</span>
                  <Badge className={getPhaseColor(cycleInfo.currentPhase)}>
                    {getPhaseIcon(cycleInfo.currentPhase)}
                    <span className="ml-1">
                      {getPhaseLabel(cycleInfo.currentPhase)}
                    </span>
                  </Badge>
                </div>

                {cycleInfo.daysUntilNextPeriod && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">
                      Days until next period:
                    </span>
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <Clock className="w-3 h-3" />
                      {cycleInfo.daysUntilNextPeriod} days
                    </Badge>
                  </div>
                )}

                {cycleInfo.nextPeriodStart &&
                  isValid(cycleInfo.nextPeriodStart) && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Next period:</span>
                      <span className="text-sm font-medium">
                        {format(cycleInfo.nextPeriodStart, "MMM d")}
                      </span>
                    </div>
                  )}

                {cycleInfo.nextOvulation &&
                  isValid(cycleInfo.nextOvulation) && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Next ovulation:</span>
                      <span className="text-sm font-medium">
                        {format(cycleInfo.nextOvulation, "MMM d")}
                      </span>
                    </div>
                  )}

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Avg cycle length:</span>
                  <span className="text-sm font-medium">
                    {cycleInfo.averageCycleLength} days
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ultra-Simple Add Entry Dialog */}
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
                <DialogDescription>
                  Select the date when your period started.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newEntry.date}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, date: e.target.value })
                    }
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
  );
}
