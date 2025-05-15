<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { personOutline } from 'ionicons/icons';
import { useRouter, useRoute } from 'vue-router';
import supabase from '@/supabaseClient';

const route = useRoute();
const router = useRouter();

const userId = route.query.userId as string;

const userName = ref('');
const userEmail = ref('');
const newPassword = ref('');
const profilePictureUrl = ref<string | null>(null);
const loading = ref(true);
const errorMessage = ref('');

const loadUserData = async () => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    if (data) {
      userName.value = data.name || '';
      userEmail.value = data.email || '';
      profilePictureUrl.value = data.profile_picture_url || null;
    } else {
      errorMessage.value = 'No se encontró información del usuario.';
    }
  } catch (error: any) {
    errorMessage.value = 'Error al cargar datos del usuario: ' + error.message;
  } finally {
    loading.value = false;
  }
};

onMounted(loadUserData);

const saveChanges = async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const { error: authError } = await supabase.auth.updateUser({
      email: userEmail.value
    });

    if (authError) throw authError;

    const updates = {
      name: userName.value,
      email: userEmail.value,
      profile_picture_url: profilePictureUrl.value,
    };

    const { error: dbError } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('user_id', userId);

    if (dbError) throw dbError;

    alert('Canvis guardats!');
    newPassword.value = '';
  } catch (error: any) {
    errorMessage.value = 'Error al guardar: ' + error.message;
    alert(errorMessage.value);
  } finally {
    loading.value = false;
  }
};

function changeProfilePicture() {
  alert("Funció per canviar la foto de perfil.");
}

function deleteAccount() {
  alert("Compte eliminat.");
}

function logout() {
  alert("Sessió tancada.");
  router.push('/Principal');
}

function closeInfoUser() {
  router.push(`/Principal?userId=${userId}`);
}
</script>

<template>
  <div class="container py-5 position-relative" style="max-width: 480px;">
    <!-- Close Button -->
    <button
      type="button"
      class="btn-close position-absolute top-0 end-0 m-3"
      aria-label="Close"
      @click="closeInfoUser"
    ></button>

    <div class="card shadow-sm p-4">
      <div class="text-center mb-4">
        <template v-if="profilePictureUrl">
          <img
            :src="profilePictureUrl"
            alt="Foto perfil"
            class="rounded-circle img-thumbnail"
            style="width: 120px; height: 120px; object-fit: cover;"
          />
        </template>
        <template v-else>
          <ion-icon
            :icon="personOutline"
            style="font-size: 120px; color: #6c757d;"
          ></ion-icon>
        </template>
        <button
          class="btn btn-outline-primary d-block mx-auto mt-3"
          @click="changeProfilePicture"
          type="button"
        >
          Canviar foto
        </button>
      </div>

      <div v-if="loading" class="d-flex justify-content-center my-4">
        <ion-spinner name="crescent" />
      </div>

      <div v-else>
        <div class="mb-3">
          <label for="username" class="form-label">Nom d'usuari</label>
          <input
            id="username"
            type="text"
            class="form-control"
            v-model="userName"
            placeholder="Nom d'usuari"
          />
        </div>

        <div class="mb-3">
          <label for="email" class="form-label">Correu electrònic</label>
          <input
            id="email"
            type="email"
            class="form-control"
            v-model="userEmail"
            placeholder="Correu electrònic"
          />
        </div>

        <a
          :href="`/infoFavourites?userId=${userId}`"
          class="btn btn-primary w-100 mb-3"
          role="button"
        >
          Veure continguts favorits
        </a>

        <button
          class="btn btn-success w-100 mb-3"
          @click="saveChanges"
          :disabled="loading"
          type="button"
        >
          Guardar canvis
        </button>

        <button
          class="btn btn-danger w-100 mb-3"
          @click="deleteAccount"
          type="button"
        >
          Eliminar compte
        </button>

        <button
          class="btn btn-secondary w-100"
          @click="logout"
          type="button"
        >
          Tancar sessió
        </button>

        <p v-if="errorMessage" class="text-danger mt-3 text-center">
          {{ errorMessage }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Puedes eliminar estilos personalizados ya que Bootstrap maneja la mayoría */
</style>
