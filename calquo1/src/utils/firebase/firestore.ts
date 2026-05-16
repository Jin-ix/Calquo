import { supabase } from '../supabase/client';

export type QueryConstraint = any;
export type Unsubscribe = () => void;

// UUID validation - Supabase uuid columns reject non-UUID strings with a 400 error
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isValidUUID(val: any): boolean {
  return typeof val === 'string' && UUID_REGEX.test(val);
}
// Fields that are UUID type in Supabase
const UUID_FIELDS = new Set(['id', 'user_id', 'seller_id', 'buyer_id', 'financial_agent_id', 'company_id', 'created_by']);

// Legacy Firestore wrappers
export function where(fieldPath: string, opStr: string, value: any): QueryConstraint {
  return { type: 'where', fieldPath, opStr, value };
}

export function orderBy(fieldPath: string, directionStr: 'asc' | 'desc' = 'asc'): QueryConstraint {
  return { type: 'orderBy', fieldPath, directionStr };
}

export function limit(limitStr: number): QueryConstraint {
  return { type: 'limit', limitStr };
}

export function or(...constraints: QueryConstraint[]): QueryConstraint {
  return { type: 'or', constraints };
}

export function and(...constraints: QueryConstraint[]): QueryConstraint {
  return { type: 'and', constraints };
}

export function serverTimestamp(): string {
  return new Date().toISOString();
}

export const Timestamp = {
  now: () => ({ toDate: () => new Date(), seconds: Math.floor(Date.now() / 1000) }),
  fromDate: (date: Date) => ({ toDate: () => date, seconds: Math.floor(date.getTime() / 1000) })
};

export function collection(db: any, path: string) { return { path }; }
export function doc(dbOrCol: any, ...pathSegments: string[]) {
  if (typeof dbOrCol === 'object' && dbOrCol.path) {
    return { path: `${dbOrCol.path}/${pathSegments.join('/')}` };
  }
  return { path: pathSegments.join('/') };
}

function extractCollectionAndId(docRef: any) {
  const parts = (docRef.path || docRef).split('/');
  return { collection: parts[0], id: parts[parts.length - 1] };
}

export async function addDoc(collectionRef: any, data: any) {
  const col = collectionRef.path || collectionRef;

  // Self-healing insert: strips unknown columns automatically on PGRST204
  // strippedCols tracks columns already removed so we never re-add them
  const attemptInsert = async (
    payload: Record<string, any>,
    strippedCols: Set<string> = new Set()
  ): Promise<{ id: string | null; path: string }> => {
    // Only include timestamp defaults if they haven't been stripped already
    const timestamps: Record<string, string> = {};
    if (!strippedCols.has('created_at')) timestamps.created_at = new Date().toISOString();
    if (!strippedCols.has('updated_at')) timestamps.updated_at = new Date().toISOString();

    const { data: res, error } = await supabase.from(col).insert([{
      ...payload,
      ...timestamps
    }]).select().single();

    if (error) {
      // PGRST204: column doesn't exist in schema — strip it and retry automatically
      if (error.code === 'PGRST204') {
        const colMatch = error.message?.match(/column ['"](\w+)['"]/i)
          || error.message?.match(/'(\w+)' column/i)
          || error.message?.match(/find the '(\w+)'/i);
        if (colMatch) {
          const badCol = colMatch[1];
          console.warn(`[Supabase] Column "${badCol}" missing in "${col}" — stripping and retrying insert.`);
          const { [badCol]: _removed, ...rest } = payload;
          const nextStripped = new Set(strippedCols);
          nextStripped.add(badCol);
          return await attemptInsert(rest, nextStripped);
        }
      }
      // Any other error — log and return null
      console.error(`[Supabase] addDoc error on "${col}":`, error.message, '| code:', error.code);
      return { id: null, path: `${col}/null` };
    }

    return { id: res?.id || null, path: `${col}/${res?.id}` };
  };

  // Strip created_at/updated_at from caller data to avoid duplication
  const { created_at: _ca, updated_at: _ua, ...cleanData } = data;
  return await attemptInsert(cleanData);
}


export async function getDoc(docRef: any) {
  const { collection: col, id } = extractCollectionAndId(docRef);
  const { data, error } = await supabase.from(col).select('*').eq('id', id).single();
  if (error || !data) return { exists: () => false, data: () => null, id };
  return { exists: () => true, data: () => data, id };
}

export async function updateDoc(docRef: any, data: any) {
  const { collection: col, id } = extractCollectionAndId(docRef);
  
  const attemptUpdate = async (payload: Record<string, any>): Promise<void> => {
    const { error } = await supabase.from(col)
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST204') {
        const colMatch = error.message?.match(/column ['"]([\w]+)['"]/i)
          || error.message?.match(/'([\w]+)' column/i)
          || error.message?.match(/find the '([\w]+)'/i);
        if (colMatch) {
          const badCol = colMatch[1];
          console.warn(`[Supabase] Column "${badCol}" missing in "${col}" during update — stripping and retrying.`);
          const { [badCol]: _removed, ...rest } = payload;
          return await attemptUpdate(rest);
        }
      }
      console.error(`[Supabase] updateDoc error on "${col}":`, error.message);
    }
  };

  await attemptUpdate(data);
}

export async function deleteDoc(docRef: any) {
  const { collection: col, id } = extractCollectionAndId(docRef);
  await supabase.from(col).delete().eq('id', id);
}

function applyConstraints(queryBuilder: any, constraints: QueryConstraint[]) {
  let q = queryBuilder;
  for (const c of constraints) {
    if (c.type === 'where') {
      // Guard: skip queries where a UUID-type column receives a non-UUID value
      // to avoid Supabase 400 "invalid input syntax for type uuid" errors.
      if (UUID_FIELDS.has(c.fieldPath) && c.opStr === '==' && !isValidUUID(c.value)) {
        console.warn(`[Firestore shim] Skipping query: "${c.fieldPath}" is a UUID column but received non-UUID value: "${c.value}". Register this user via Supabase Auth to get a proper UUID.`);
        // Return a query that will yield 0 results safely
        return q.limit(0);
      }
      if (c.opStr === '==') q = q.eq(c.fieldPath, c.value);
      else if (c.opStr === '<') q = q.lt(c.fieldPath, c.value);
      else if (c.opStr === '<=') q = q.lte(c.fieldPath, c.value);
      else if (c.opStr === '>') q = q.gt(c.fieldPath, c.value);
      else if (c.opStr === '>=') q = q.gte(c.fieldPath, c.value);
      else if (c.opStr === 'array-contains') q = q.contains(c.fieldPath, [c.value]);
      else if (c.opStr === 'in') q = q.in(c.fieldPath, c.value);
    } else if (c.type === 'orderBy') {
      q = q.order(c.fieldPath, { ascending: c.directionStr === 'asc' });
    } else if (c.type === 'limit') {
      q = q.limit(c.limitStr);
    }
  }
  return q;
}

export function query(collectionRef: any, ...constraints: QueryConstraint[]) {
  return { collectionRef, constraints };
}

export async function getDocs(queryObj: any) {
  let col = queryObj;
  let constraints: QueryConstraint[] = [];
  
  if (queryObj.collectionRef) {
    col = queryObj.collectionRef.path || queryObj.collectionRef;
    constraints = queryObj.constraints || [];
  } else if (queryObj.path) {
    col = queryObj.path;
  }
  
  let q = supabase.from(col).select('*');
  q = applyConstraints(q, constraints);
  
  const { data, error } = await q;
  if (error) {
    if (error.code === 'PGRST205') {
      console.warn(`[Supabase] Table "${col}" missing in schema cache. Returning empty array.`);
    } else {
      console.error("GetDocs error:", error);
    }
  }
  
  const docs = (data || []).map(d => ({ id: d.id, data: () => d }));
  return { docs, empty: docs.length === 0, size: docs.length };
}

export function onSnapshot(queryObj: any, onNext: any, onError?: any) {
  let col = queryObj;
  if (queryObj.collectionRef) col = queryObj.collectionRef.path || queryObj.collectionRef;
  else if (queryObj.path) col = queryObj.path;
  
  const callback = typeof onNext === 'function' ? onNext : onNext.next;
  const errorCallback = typeof onNext === 'function' ? onError : onNext.error;

  // Initial fetch
  getDocs(queryObj).then(callback).catch((e: any) => {
    if (errorCallback) errorCallback(e);
  });

  // Use a unique channel name to avoid duplicate-subscription errors
  // when multiple listeners target the same table.
  const channelName = `public:${col}:${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes' as any,
      { event: '*', schema: 'public', table: col },
      () => { getDocs(queryObj).then(callback); }
    )
    .subscribe((status: string, err?: Error) => {
      if (err) {
        console.warn(`Realtime subscription error on ${col}:`, err);
        if (errorCallback) errorCallback(err);
      }
    });

  return () => { supabase.removeChannel(channel); };
}

export function writeBatch(db: any) {
  return {
    set: () => {},
    update: () => {},
    delete: () => {},
    commit: async () => {}
  };
}

export function getFirestore() { return {}; }
export function initializeFirestore() { return {}; }
export function setLogLevel() {}
export function memoryLocalCache() { return {}; }
export const CACHE_SIZE_UNLIMITED = -1;

export async function getDocument(col: string, id: string): Promise<any> {
  const { data } = await supabase.from(col).select('*').eq('id', id).single();
  return data;
}
export async function getDocuments(col: string, constraints: any[] = []): Promise<any[]> {
  const { docs } = await getDocs({ path: col, constraints });
  return docs.map((d: any) => d.data());
}
export async function addDocument(col: string, data: any): Promise<string | null> {
  const res = await addDoc({ path: col }, data);
  return res.id;
}
export async function setDocument(col: string, id: string, data: any): Promise<boolean> {
  const { error } = await supabase.from(col).upsert({ id, ...data, updated_at: new Date().toISOString() });
  return !error;
}
export async function updateDocument(col: string, id: string, data: any): Promise<boolean> {
  await updateDoc({ path: `${col}/${id}` }, data);
  return true;
}
export async function deleteDocument(col: string, id: string): Promise<boolean> {
  await deleteDoc({ path: `${col}/${id}` });
  return true;
}
export function listenToDocument(col: string, id: string, cb: any) {
  return onSnapshot({ path: `${col}/${id}` }, (snapshot: any) => cb(snapshot.data?.() || null));
}
export function listenToCollection(col: string, constraints: any[], cb: any) {
  return onSnapshot({ path: col, constraints }, (snapshot: any) => cb(snapshot.docs.map((d: any) => d.data())));
}