import { loadDB, saveDB } from "../models/db.js";

/**
 * Utility to generate unique IDs
 */
function nextId(collection) {
  if (collection.length === 0) return 1;
  return Math.max(...collection.map(x => x.id)) + 1;
}

/**
 * Check if two time ranges overlap
 */
function checkTimeOverlap(start1, end1, start2, end2) {
  return start1 < end2 && start2 < end1;
}

/**
 * List all slots for a signup sheet
 */
export async function listSlots(req, res) {
  const sheetId = Number(req.params.sheetId);
  const db = await loadDB();
  
  const slots = db.slots.filter(s => s.sheetId === sheetId);
  res.json({ ok: true, slots });
}

/**
 * Create a new slot with overlap validation
 */
export async function addSlot(req, res) {
  const sheetId = Number(req.params.sheetId);
  const { startTime, endTime, maxMembers } = req.body || {};
  
  if (!startTime || !endTime || !maxMembers) {
    return res.status(400).json({ 
      ok: false, 
      error: "startTime, endTime, and maxMembers are required" 
    });
  }
  
  const db = await loadDB();
  
  // Validate sheet exists
  const sheet = db.sheets.find(s => s.id === sheetId);
  if (!sheet) {
    return res.status(404).json({ ok: false, error: "Signup sheet not found" });
  }
  
  const newStart = new Date(startTime);
  const newEnd = new Date(endTime);
  
  // Check for overlap with existing slots in same sheet
  for (const slot of db.slots) {
    if (slot.sheetId === sheetId) {
      const existStart = new Date(slot.startTime);
      const existEnd = new Date(slot.endTime);
      
      if (checkTimeOverlap(newStart, newEnd, existStart, existEnd)) {
        return res.status(400).json({ 
          ok: false, 
          error: "Slot times overlap with existing slot" 
        });
      }
    }
  }
  
  const newSlot = {
    id: nextId(db.slots),
    sheetId,
    startTime,
    endTime,
    maxMembers: Number(maxMembers),
    signupMemberIds: []
  };
  
  db.slots.push(newSlot);
  await saveDB(db);
  
  res.json({ ok: true, slot: newSlot });
}

/**
 * Update an existing slot with validation
 */
export async function updateSlot(req, res) {
  const slotId = Number(req.params.slotId);
  const { startTime, endTime, maxMembers } = req.body || {};
  
  const db = await loadDB();
  const slot = db.slots.find(s => s.id === slotId);
  
  if (!slot) {
    return res.status(404).json({ ok: false, error: "Slot not found" });
  }
  
  // Check if new maxMembers is less than current signup count
  if (maxMembers !== undefined) {
    const currentSignups = slot.signupMemberIds.length;
    if (Number(maxMembers) < currentSignups) {
      return res.status(400).json({ 
        ok: false, 
        error: `Cannot reduce maxMembers below current signup count (${currentSignups})` 
      });
    }
  }
  
  // Check time overlap if times are being updated
  if (startTime || endTime) {
    const newStart = new Date(startTime || slot.startTime);
    const newEnd = new Date(endTime || slot.endTime);
    
    for (const other of db.slots) {
      if (other.id !== slotId && other.sheetId === slot.sheetId) {
        const existStart = new Date(other.startTime);
        const existEnd = new Date(other.endTime);
        
        if (checkTimeOverlap(newStart, newEnd, existStart, existEnd)) {
          return res.status(400).json({ 
            ok: false, 
            error: "Updated slot times overlap with another slot" 
          });
        }
      }
    }
    
    slot.startTime = startTime || slot.startTime;
    slot.endTime = endTime || slot.endTime;
  }
  
  if (maxMembers !== undefined) {
    slot.maxMembers = Number(maxMembers);
  }
  
  await saveDB(db);
  res.json({ ok: true, slot });
}

/**
 * Delete a slot only if no signups exist
 */
export async function deleteSlot(req, res) {
  const slotId = Number(req.params.slotId);
  const db = await loadDB();
  
  const slot = db.slots.find(s => s.id === slotId);
  
  if (!slot) {
    return res.status(404).json({ ok: false, error: "Slot not found" });
  }
  
  // Check if slot has signups
  if (slot.signupMemberIds.length > 0) {
    return res.status(400).json({ 
      ok: false, 
      error: "Cannot delete slot with existing signups" 
    });
  }
  
  db.slots = db.slots.filter(s => s.id !== slotId);
  await saveDB(db);
  
  res.json({ ok: true });
}
