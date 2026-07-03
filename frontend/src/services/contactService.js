import api from '../api/api';

/* POST /api/users/sync-google-contacts. Gửi Google access_token lên backend để đồng bộ danh bạ và tìm bạn bè
 */
export const syncGoogleContacts = async (accessToken) => {
    const res = await api.post('/users/sync-google-contacts', {
        access_token: accessToken,
    });
    return { data: res.data };
};
