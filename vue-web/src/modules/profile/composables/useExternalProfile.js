import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { profileService } from '@/modules/profile/services/profileService';

export function useExternalProfile(isMyProfile) {
  const route = useRoute();
  
  const user = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const fetchProfile = async () => {
    if (isMyProfile.value) {
        user.value = null;
        return;
    }

    const username = route.params.username;
    if (!username) return;

    loading.value = true;
    error.value = null;
    
    try {
      user.value = await profileService.getByUsername(username);
    } catch (err) {
      console.error(err);
      error.value = "User not found or access denied.";
    } finally {
      loading.value = false;
    }
  };

  watch(() => route.params.username, fetchProfile);

  return {
    externalUser: user,
    externalLoading: loading,
    externalError: error,
    fetchProfile
  };
}