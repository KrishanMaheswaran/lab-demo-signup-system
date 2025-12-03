import { loadDB, saveDB } from "../models/db.js";

/**
 * Utility to generate unique IDs
 */
function nextId(collection) {
    if (collection.length === 0) return 1;
    return Math.max(...collection.map(x => x.id)) + 1;
}

/**
 * Get current slot based on current time for grading mode
 */
export async function getCurrentSlot(req, res) {
    const sheetId = Number(req.params.sheetId);
    const db = await loadDB();

    const now = new Date();
    const slots = db.slots
        .filter(s => s.sheetId === sheetId)
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    // Find the current or most recently passed slot
    let currentSlot = null;
    for (const slot of slots) {
        const start = new Date(slot.startTime);
        const end = new Date(slot.endTime);

        if (now >= start && now <= end) {
            currentSlot = slot;
            break;
        } else if (now > end) {
            currentSlot = slot;
        }
    }

    if (!currentSlot && slots.length > 0) {
        currentSlot = slots[0];
    }

    if (!currentSlot) {
        return res.status(404).json({ ok: false, error: "No slots found" });
    }

    // Get member details and grades for this slot
    const memberIds = currentSlot.signupMemberIds || [];
    const members = db.members.filter(m => memberIds.includes(m.id));

    const membersWithGrades = members.map(member => {
        const grade = db.grades.find(g =>
            g.slotId === currentSlot.id && g.memberId === member.id
        );

        return {
            ...member,
            grade: grade || null
        };
    });

    res.json({
        ok: true,
        slot: currentSlot,
        members: membersWithGrades
    });
}

/**
 * Add or update a grade for a member in a slot
 */
export async function addOrUpdateGrade(req, res) {
    const slotId = Number(req.params.slotId);
    const memberId = Number(req.params.memberId);
    const { baseMark, bonus, penalty, comment } = req.body || {};

    if (baseMark === undefined) {
        return res.status(400).json({ ok: false, error: "baseMark is required" });
    }

    const db = await loadDB();
    const username = req.user.username;

    // Find existing grade
    let grade = db.grades.find(g =>
        g.slotId === slotId && g.memberId === memberId
    );

    const bonusVal = Number(bonus || 0);
    const penaltyVal = Number(penalty || 0);
    const finalMark = Number(baseMark) + bonusVal - penaltyVal;

    if (grade) {
        // Update existing grade - require comment if changing
        if (!comment || comment.trim() === "") {
            return res.status(400).json({
                ok: false,
                error: "Comment is required when modifying grade"
            });
        }

        grade.baseMark = Number(baseMark);
        grade.bonus = bonusVal;
        grade.penalty = penaltyVal;
        grade.finalMark = finalMark;

        // Append new comment to existing
        const timestamp = new Date().toISOString();
        const newCommentEntry = `[${timestamp}] ${comment}`;
        grade.comment = grade.comment
            ? `${grade.comment}\n${newCommentEntry}`
            : newCommentEntry;

        grade.taUsername = username;
        grade.gradedAt = timestamp;
    } else {
        // Create new grade
        grade = {
            id: nextId(db.grades),
            slotId,
            memberId,
            baseMark: Number(baseMark),
            bonus: bonusVal,
            penalty: penaltyVal,
            finalMark,
            comment: comment || "",
            taUsername: username,
            gradedAt: new Date().toISOString()
        };
        db.grades.push(grade);
    }

    // Create audit log entry
    const audit = {
        id: nextId(db.audits),
        gradeId: grade.id,
        changedBy: username,
        changedAt: grade.gradedAt,
        summary: `Updated grade to ${finalMark} (base: ${baseMark}, bonus: ${bonusVal}, penalty: ${penaltyVal})`
    };

    // Remove old audits for this grade, keep only latest
    db.audits = db.audits.filter(a => a.gradeId !== grade.id);
    db.audits.push(audit);

    await saveDB(db);

    res.json({ ok: true, grade, audit });
}

/**
 * Get audit history for a grade
 */
export async function getAuditHistory(req, res) {
    const gradeId = Number(req.params.gradeId);
    const db = await loadDB();

    const audit = db.audits.find(a => a.gradeId === gradeId);

    if (!audit) {
        return res.status(404).json({ ok: false, error: "No audit history found" });
    }

    res.json({ ok: true, audit });
}

/**
 * Navigate to adjacent slot (prev/next)
 */
export async function getAdjacentSlot(req, res) {
    const slotId = Number(req.params.slotId);
    const direction = req.query.direction; // 'prev' or 'next'

    const db = await loadDB();
    const currentSlot = db.slots.find(s => s.id === slotId);

    if (!currentSlot) {
        return res.status(404).json({ ok: false, error: "Slot not found" });
    }

    const slots = db.slots
        .filter(s => s.sheetId === currentSlot.sheetId)
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    const currentIndex = slots.findIndex(s => s.id === slotId);
    let targetSlot = null;

    if (direction === 'prev' && currentIndex > 0) {
        targetSlot = slots[currentIndex - 1];
    } else if (direction === 'next' && currentIndex < slots.length - 1) {
        targetSlot = slots[currentIndex + 1];
    }

    if (!targetSlot) {
        return res.status(400).json({ ok: false, error: "No adjacent slot available" });
    }

    // Get member details and grades
    const memberIds = targetSlot.signupMemberIds || [];
    const members = db.members.filter(m => memberIds.includes(m.id));

    const membersWithGrades = members.map(member => {
        const grade = db.grades.find(g =>
            g.slotId === targetSlot.id && g.memberId === member.id
        );

        return {
            ...member,
            grade: grade || null
        };
    });

    res.json({
        ok: true,
        slot: targetSlot,
        members: membersWithGrades
    });
}
