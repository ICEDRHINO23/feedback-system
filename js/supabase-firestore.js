function collection(db, name) { return { __kind: "collection", db, name }; }
function doc(db, collection, id) { return { __kind: "doc", db, collection, id: String(id) }; }
function where(field, operator, value) { return { __kind: "where", field, operator, value }; }
function query(ref, ...constraints) { return { __kind: "query", db: ref.db, collection: ref.name, constraints }; }

function applyConstraints(builder, constraints = []) {
    for (const c of constraints) {
        if (c.operator === "==") builder = builder.eq(c.field, c.value);
        else if (c.operator === "!=") builder = builder.neq(c.field, c.value);
        else if (c.operator === ">") builder = builder.gt(c.field, c.value);
        else if (c.operator === ">=") builder = builder.gte(c.field, c.value);
        else if (c.operator === "<") builder = builder.lt(c.field, c.value);
        else if (c.operator === "<=") builder = builder.lte(c.field, c.value);
        else if (c.operator === "in") builder = builder.in(c.field, c.value);
    }
    return builder;
}

function info(target) {
    if (target.__kind === "query") return { db: target.db, table: target.collection, constraints: target.constraints };
    if (target.__kind === "collection") return { db: target.db, table: target.name, constraints: [] };
    throw new Error("Invalid Supabase target");
}

function wrapDoc(row) {
    return { id: row?.id == null ? "" : String(row.id), exists: () => !!row, data: () => row ? { ...row } : undefined };
}
function wrapSnapshot(rows) {
    const docs = (rows || []).map(wrapDoc);
    return { docs, empty: docs.length === 0, size: docs.length, forEach: cb => docs.forEach(cb) };
}

async function getDocs(target) {
    const { db, table, constraints } = info(target);
    let request = applyConstraints(db.from(table).select("*"), constraints);
    const { data, error } = await request;
    if (error) throw error;
    return wrapSnapshot(data);
}
async function getDoc(ref) {
    const { data, error } = await ref.db.from(ref.collection).select("*").eq("id", ref.id).maybeSingle();
    if (error) throw error;
    return wrapDoc(data);
}
async function addDoc(ref, payload) {
    const { data, error } = await ref.db.from(ref.name).insert(payload).select("*").single();
    if (error) throw error;
    return { id: String(data.id), ...wrapDoc(data) };
}
async function setDoc(ref, payload) {
    const { data, error } = await ref.db.from(ref.collection).upsert({ id: ref.id, ...payload }, { onConflict: "id" }).select("*").single();
    if (error) throw error;
    return wrapDoc(data);
}
async function updateDoc(ref, payload) {
    const { data, error } = await ref.db.from(ref.collection).update(payload).eq("id", ref.id).select("*").single();
    if (error) throw error;
    return wrapDoc(data);
}
async function deleteDoc(ref) {
    const { error } = await ref.db.from(ref.collection).delete().eq("id", ref.id);
    if (error) throw error;
}
async function getCountFromServer(target) {
    const { db, table, constraints } = info(target);
    let request = applyConstraints(db.from(table).select("id", { count: "exact", head: true }), constraints);
    const { count, error } = await request;
    if (error) throw error;
    return { data: () => ({ count: count || 0 }) };
}
async function runTransaction(db, callback) {
    const pending = [];
    const tx = { get: getDoc, set: (ref, payload) => pending.push([ref, payload]) };
    const result = await callback(tx);
    for (const [ref, payload] of pending) await setDoc(ref, payload);
    return result;
}

export { collection, doc, where, query, getDocs, getDoc, addDoc, setDoc, updateDoc, deleteDoc, getCountFromServer, runTransaction };
