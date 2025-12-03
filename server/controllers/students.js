import { loadDB, saveDB } from "../models/db.js";

/**
 * Get all slots the authenticated student has signed up for
 */
export async function getMySignups(req, res) {
    const username = req.user.username;
    const db = await loadDB();

    // Find member records for this user across all courses
    const myMembers = db.members.filter(m => m.username === username);
    const myMemberIds = myMembers.map(m => m.id);

    // Find all slots where this student is signed up
    const mySlots = db.slots.filter(slot =>
        slot.signupMemberIds.some(id => myMemberIds.includes(id))
    );

    // Enrich with course and sheet info
    const enriched = mySlots.map(slot => {
        const sheet = db.sheets.find(s => s.id === slot.sheetId);
        const course = sheet ? db.courses.find(c => c.id === sheet.courseId) : null;

        // Find member ID for this slot
        const memberId = slot.signupMemberIds.find(id => myMemberIds.includes(id));
        const member = db.members.find(m => m.id === memberId);

        // Get grade if exists
        const grade = db.grades.find(g =>
            g.slotId === slot.id && g.memberId === memberId
        );

        return {
            slot,
            sheet,
            course,
            member,
            grade: grade || null
        };
    });

    res.json({ ok: true, signups: enriched });
}

/**
 * Get all available slots for courses the student is enrolled in
 */
export async function getAvailableSlots(req, res) {
    const username = req.user.username;
    const db = await loadDB();

    // Find courses where this student is a member
    const myMembers = db.members.filter(m => m.username === username);
    const myCourseIds = [...new Set(myMembers.map(m => m.courseId))];

    // Get sheets for those courses
    const mySheets = db.sheets.filter(s => myCourseIds.includes(s.courseId));
    const mySheetIds = mySheets.map(s => s.id);

    // Get all slots for those sheets
    const allSlots = db.slots.filter(s => mySheetIds.includes(s.sheetId));

    // Filter to available slots (not full, at least 1 hour ahead)
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    const available = allSlots
        .filter(slot => {
            const startTime = new Date(slot.startTime);
            const isFuture = startTime >= oneHourFromNow;
            const notFull = slot.signupMemberIds.length < slot.maxMembers;
            return isFuture && notFull;
        })
        .map(slot => {
            const sheet = db.sheets.find(s => s.id === slot.sheetId);
            const course = sheet ? db.courses.find(c => c.id === sheet.courseId) : null;

            return {
                slot,
                sheet,
                course,
                availableSpots: slot.maxMembers - slot.signupMemberIds.length
            };
        });

    res.json({ ok: true, availableSlots: available });
}

/**
 * Sign up for a slot
 */
export async function signupForSlot(req, res) {
    console.log("!!! ENTERING signupForSlot !!!");
    const slotId = Number(req.params.slotId);
    const username = req.user.username;
    const db = await loadDB();

    const slot = db.slots.find(s => s.id === slotId);
    if (!slot) {
        return res.status(404).json({ ok: false, error: "Slot not found" });
    }

    // Get sheet and course to find the member record
    const sheet = db.sheets.find(s => s.id === slot.sheetId);
    if (!sheet) {
        return res.status(404).json({ ok: false, error: "Signup sheet not found" });
    }

    // Find member record for this student in this course
    const member = db.members.find(m =>
        m.courseId === sheet.courseId && m.username === username
    );

    if (!member) {
        return res.status(403).json({
            ok: false,
            error: "You are not enrolled in this course"
        });
    }

    // Check if already signed up
    console.log(`[Signup] Checking duplicate. MemberID: ${member.id}, Existing: ${JSON.stringify(slot.signupMemberIds)}`);
    if (slot.signupMemberIds.includes(member.id)) {
        return res.status(400).json({
            ok: false,
            error: "Already signed up for this slot"
        });
    }

    // Check if slot is at least 1 hour ahead
    const now = new Date();
    const startTime = new Date(slot.startTime);
    const oneHour = 60 * 60 * 1000;

    if (startTime.getTime() - now.getTime() < oneHour) {
        return res.status(400).json({
            ok: false,
            error: "Cannot sign up for slots less than 1 hour away"
        });
    }

    // Check if slot is full
    if (slot.signupMemberIds.length >= slot.maxMembers) {
        return res.status(400).json({
            ok: false,
            error: "Slot is full"
        });
    }

    // Add signup
    slot.signupMemberIds.push(member.id);
    await saveDB(db);

    res.json({
        ok: true,
        message: "Successfully signed up for slot",
        slot
    });
}

/**
 * Leave a slot
 */
export async function leaveSlot(req, res) {
    const slotId = Number(req.params.slotId);
    const username = req.user.username;
    const db = await loadDB();

    const slot = db.slots.find(s => s.id === slotId);
    if (!slot) {
        return res.status(404).json({ ok: false, error: "Slot not found" });
    }

    // Get sheet and course
    const sheet = db.sheets.find(s => s.id === slot.sheetId);
    if (!sheet) {
        return res.status(404).json({ ok: false, error: "Signup sheet not found" });
    }

    const member = db.members.find(m =>
        m.courseId === sheet.courseId && m.username === username
    );

    if (!member) {
        return res.status(403).json({ ok: false, error: "Not enrolled in this course" });
    }

    // Check if signed up
    const index = slot.signupMemberIds.indexOf(member.id);
    if (index === -1) {
        return res.status(400).json({
            ok: false,
            error: "Not signed up for this slot"
        });
    }

    // Check if slot is at least 2 hours ahead
    const now = new Date();
    const startTime = new Date(slot.startTime);
    const twoHours = 2 * 60 * 60 * 1000;

    console.log(`[Leave] Time check. Start: ${startTime.toISOString()}, Now: ${now.toISOString()}, Diff: ${startTime.getTime() - now.getTime()}, Limit: ${twoHours}`);

    if (startTime.getTime() - now.getTime() < twoHours) {
        return res.status(400).json({
            ok: false,
            error: "Cannot leave slots less than 2 hours away"
        });
    }

    // Remove signup
    slot.signupMemberIds.splice(index, 1);
    await saveDB(db);

    res.json({
        ok: true,
        message: "Successfully left slot",
        slot
    });
}
