import { db } from './firebase-config.js';
import {
    collection,
    doc,
    setDoc,
    updateDoc,
    increment,
    onSnapshot,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

const SHEET_URL = 'https://sheets.googleapis.com/v4/spreadsheets/1nw0SDop0IeFr6q776thp_eSCZZulaxZBtM55ECrHD5A/values/additions?key=AIzaSyBdnupZe6bJH43XE0Hj77n0AmlR3wVfN9M';
const REACTIONS_COLLECTION = 'request_reactions';

// --- Hashing / ID Generation ---
// We need a stable ID for each row in the sheet to attach reactions to it.
// We'll use a simple hash of "Timestamp+MainText".
// Note: If the sheet data changes slightly (typo fix), the ID changes and reactions are lost. 
// This is an accepted trade-off for not having a real DB with IDs.
async function generateHash(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

// --- Sheet Fetching ---
export async function fetchSheetData() {
    try {
        const res = await fetch(SHEET_URL);
        if (!res.ok) throw new Error('Sheet fetch failed');
        const json = await res.json();

        if (!json.values || json.values.length < 2) return [];

        const headers = json.values[0].map(h => (h || '').toLowerCase());
        const rows = json.values.slice(1);

        // Basic mapping (simplified from original for robustness)
        const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('time'));
        const statusIdx = headers.findIndex(h => h.includes('status'));
        const catIdx = headers.findIndex(h => h.includes('select one') || h.includes('category'));
        // Fallback for main text: try specific columns or generic logic
        const descIdx = headers.findIndex(h => h.includes('description') || h.includes('details'));

        const items = await Promise.all(rows.map(async (row) => {
            const dateStr = row[dateIdx] || '';
            const status = row[statusIdx] || '';
            const category = (row[catIdx] || 'other').toLowerCase();

            // Determine display text
            let mainText = '';
            if (category.includes('glitch')) mainText = row[descIdx] || row[1] || ''; // fallback to col 1
            else if (category.includes('movie')) {
                const nameIdx = headers.findIndex(h => h.includes('movie') && h.includes('name'));
                mainText = row[nameIdx] || row[1] || '';
            }
            else if (category.includes('game')) {
                const nameIdx = headers.findIndex(h => h.includes('game') && h.includes('name'));
                mainText = row[nameIdx] || row[1] || '';
            }
            else {
                mainText = row[descIdx] || row[1] || row[catIdx] || '';
            }
            mainText = mainText.trim();
            if (!mainText) return null; // skip empty

            // Generate ID
            const uniqueString = `${dateStr}_${mainText}`;
            const id = await generateHash(uniqueString);

            return {
                id,
                date: dateStr,
                category,
                status,
                title: mainText,
                description: row[descIdx] || '', // Keep description separate if possible
                originalRow: row
            };
        }));

        return items.filter(i => i !== null);
    } catch (e) {
        console.error("Sheet Error", e);
        return [];
    }
}

// --- Reaction Logic ---

/**
 * Subscribes to ALL reactions. 
 * Since we don't know IDs ahead of time easily, we just fetch the whole collection 
 * or we could bind individually. For efficiency with this small app, 
 * we'll start by just getting all document changes.
 */
export function subscribeToReactions(callback) {
    // Listen to the whole collection
    return onSnapshot(collection(db, REACTIONS_COLLECTION), (snapshot) => {
        const reactionMap = {};
        snapshot.forEach(doc => {
            reactionMap[doc.id] = doc.data().count || 0;
        });
        callback(reactionMap);
    });
}

export async function toggleReaction(id) {
    const key = `gp_liked_${id}`;
    const hasLiked = localStorage.getItem(key) === 'true';
    const ref = doc(db, REACTIONS_COLLECTION, id);

    try {
        if (hasLiked) {
            // Decrement
            await updateDoc(ref, { count: increment(-1) });
            localStorage.removeItem(key);
            return false;
        } else {
            // Increment (Initialize doc if missing)
            try {
                await updateDoc(ref, { count: increment(1) });
            } catch (e) {
                // If doc doesn't exist, Create it
                await setDoc(ref, { count: 1 });
            }
            localStorage.setItem(key, 'true');
            return true;
        }
    } catch (e) {
        console.error("Reaction Error", e);
        return hasLiked; // revert status
    }
}

export function hasLiked(id) {
    return localStorage.getItem(`gp_liked_${id}`) === 'true';
}
