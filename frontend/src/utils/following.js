const CACHE_KEY = 'vibetok_following_set';
 
export const getFollowingSet = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(CACHE_KEY) || '[]'));
  } catch {
    return new Set();
  }
};
 
const saveFollowingSet = (set) => {
  localStorage.setItem(CACHE_KEY, JSON.stringify([...set]));
};
 
export const isFollowingUser = (userId) => {
  if (!userId) return false;
  return getFollowingSet().has(String(userId));
};
 
export const addFollowing = (userId) => {
  const set = getFollowingSet();
  set.add(String(userId));
  saveFollowingSet(set);
};
 
export const removeFollowing = (userId) => {
  const set = getFollowingSet();
  set.delete(String(userId));
  saveFollowingSet(set);
};
 
export const toggleFollowing = (userId) => {
  const set = getFollowingSet();
  const sid = String(userId);
  if (set.has(sid)) {
    set.delete(sid);
    saveFollowingSet(set);
    return false;
  } else {
    set.add(sid);
    saveFollowingSet(set);
    return true;
  }
};
 
/** Khởi tạo cache từ danh sách userId (gọi sau khi fetch suggestions/profile) */
export const seedFollowingCache = (userIds = []) => {
  const set = getFollowingSet();
  userIds.forEach(id => set.add(String(id)));
  saveFollowingSet(set);
};
 
export const clearFollowingCache = () => {
  localStorage.removeItem(CACHE_KEY);
};