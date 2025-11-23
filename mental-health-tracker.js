const fs = require('fs');
const path = require('path');
const ChartUtils = require('./chart-utils');
const PDFDocument = require('pdfkit');
const ReminderService = require('./reminder-service');

class MentalHealthTracker {
    constructor(dataFile = 'mental-health-data.json') {
        this.dataFile = dataFile;
        this.data = this.loadData();
        this.reminderService = new ReminderService();
    }

    loadData() {
        try {
            if (fs.existsSync(this.dataFile)) {
                const rawData = fs.readFileSync(this.dataFile, 'utf8');
                return JSON.parse(rawData);
            }
        } catch (error) {
            console.error('Error loading data:', error.message);
        }
        return {
            profile: {
                accidentDate: null,
                accidentDescription: null,
                createdAt: new Date().toISOString()
            },
            moodEntries: [],
            journalEntries: [],
            symptoms: [],
            triggers: [],
            copingStrategies: [],
            emergencyContacts: [],
            goals: [],
            therapists: [],
            therapySessions: []
        };
    }

    saveData() {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify(this.data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving data:', error.message);
            return false;
        }
    }

    // Statistics Summary
    showStats() {
        const totalMoods = this.data.moodEntries.length;
        const totalJournal = this.data.journalEntries.length;
        const totalSymptoms = this.data.symptoms.length;
        const totalTriggers = this.data.triggers.length;
        const totalCoping = this.data.copingStrategies.length;
        const totalGoals = this.data.goals.length;
        const completedGoals = this.data.goals.filter(g => g.completed).length;
        const activeGoals = totalGoals - completedGoals;

        // Calculate average mood if entries exist
        let avgMood = 0;
        if (totalMoods > 0) {
            avgMood = (this.data.moodEntries.reduce((sum, e) => sum + e.rating, 0) / totalMoods).toFixed(1);
        }

        // Calculate days tracking (from first entry to now)
        let daysTracking = 0;
        if (totalMoods > 0 || totalJournal > 0 || totalSymptoms > 0) {
            const allDates = [
                ...this.data.moodEntries.map(e => new Date(e.timestamp)),
                ...this.data.journalEntries.map(e => new Date(e.timestamp)),
                ...this.data.symptoms.map(e => new Date(e.timestamp))
            ];
            if (allDates.length > 0) {
                const firstDate = new Date(Math.min(...allDates));
                const daysDiff = Math.ceil((new Date() - firstDate) / (1000 * 60 * 60 * 24));
                daysTracking = daysDiff;
            }
        }

        console.log('\n📊 Mental Health Tracker - Statistics Summary');
        console.log('═'.repeat(60));
        console.log(`\n📅 Tracking Duration: ${daysTracking} days`);
        console.log('\n🎭 Mood & Emotions:');
        console.log(`   Total mood entries: ${totalMoods}`);
        if (totalMoods > 0) {
            console.log(`   Average mood: ${avgMood}/10 ${this.getMoodEmoji(Math.round(avgMood))}`);
        }

        console.log('\n📝 Journal:');
        console.log(`   Total entries: ${totalJournal}`);

        console.log('\n🩺 Symptoms:');
        console.log(`   Total logged: ${totalSymptoms}`);

        console.log('\n⚡ Triggers:');
        console.log(`   Identified: ${totalTriggers}`);

        console.log('\n💪 Coping Strategies:');
        console.log(`   Available: ${totalCoping}`);

        console.log('\n🎯 Recovery Goals:');
        console.log(`   Active: ${activeGoals}`);
        console.log(`   Completed: ${completedGoals}`);
        console.log(`   Total: ${totalGoals}`);

        if (this.data.profile && this.data.profile.accidentDate) {
            const accidentDate = new Date(this.data.profile.accidentDate);
            const daysSinceAccident = Math.ceil((new Date() - accidentDate) / (1000 * 60 * 60 * 24));
            console.log(`\n🕐 Days since accident: ${daysSinceAccident}`);
        }

        console.log('\n═'.repeat(60));
    }

    // ==================== THERAPY SESSION MANAGER ====================

    addTherapist(name, specialty, phone, email) {
        const therapist = {
            id: Date.now(),
            name,
            specialty,
            phone,
            email,
            addedAt: new Date().toISOString()
        };

        this.data.therapists.push(therapist);

        if (this.saveData()) {
            console.log('\n✅ Therapist added successfully!');
            console.log(`   Name: ${name}`);
            console.log(`   Specialty: ${specialty}`);
            console.log(`   Phone: ${phone}`);
            if (email) console.log(`   Email: ${email}`);
            return therapist;
        }
        return null;
    }

     scheduleSession(therapistId, date, time, type = 'regular') {
      try {
        // Accept therapistId as number or string
        const lookupId = typeof therapistId === 'string' && /^\d+$/.test(therapistId)
          ? parseInt(therapistId, 10)
          : therapistId;

        const therapist = this.data.therapists.find(t => t.id === lookupId);
        if (!therapist) {
          console.log('❌ Therapist not found');
          return false; // tests expect false for not-found case
        }

        const id = Date.now();
        const session = {
          id,
          therapistId: therapist.id,
          therapistName: therapist.name,
          date,
          time,
          type: type || 'regular',
          status: 'scheduled',
          preSessionMood: null,
          preSessionNotes: '',
          postSessionMood: null,
          postSessionNotes: '',
          effectiveness: null,
          createdAt: new Date().toISOString()
        };

         // Append to sessions
        this.data.therapySessions.push(session);

        // Persist; if save fails, rollback and return null (tests expect null on save failure)
        const saved = this.saveData();
        if (!saved) {
          // rollback
          this.data.therapySessions = this.data.therapySessions.filter(s => s.id !== id);
          return null;
        }

        console.log('\n✅ Therapy session scheduled!');
        console.log(`   Therapist: ${therapist.name}`);
        console.log(`   Date: ${date} at ${time}`);
        console.log(`   Type: ${session.type}`);
        console.log(`   Session ID: ${session.id}`);
        return session;
      } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        console.error('Error scheduling session:', msg);
        return null;
      }
    }

    // Other methods remain unchanged...