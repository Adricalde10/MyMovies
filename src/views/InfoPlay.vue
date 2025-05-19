<script setup lang="ts">
import { ref, onMounted } from 'vue';
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
const fileInput = ref<HTMLInputElement | null>(null);

const loadUserData = async () => {
  loading.value = true;
  errorMessage.value = '';

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
      profilePictureUrl.value = data.photo || null;
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
    // Opcional: actualizar email en Auth
    const { error: authError } = await supabase.auth.updateUser({
      email: userEmail.value,
    });
    if (authError) throw authError;

    const updates = {
      name: userName.value,
      email: userEmail.value,
      photo: profilePictureUrl.value,
    };

    const { error: dbError } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('user_id', userId);

    if (dbError) throw dbError;

    alert('Cambios guardados!');
    newPassword.value = '';
  } catch (error: any) {
    errorMessage.value = 'Error al guardar: ' + error.message;
    alert(errorMessage.value);
  } finally {
    loading.value = false;
  }
};

function triggerFileInput() {
  fileInput.value?.click();
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  loading.value = true;
  errorMessage.value = '';

  try {
    const fileExt = file.name.split('.').pop();
    const filePath = `butaca1/${userId}-${Date.now()}.${fileExt}`;

    // 1. Subir archivo al bucket 'butaca1'
    const { error: uploadError } = await supabase.storage
      .from('butaca1')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // 2. Obtener URL pública después de confirmar la subida
    const { data } = supabase.storage
      .from('butaca1')
      .getPublicUrl(filePath);

    const publicUrl = data.publicUrl;
    if (!publicUrl) throw new Error('No se pudo obtener la URL pública');

    // 3. Actualizar la columna 'photo' en la tabla 'usuarios'
    const { error: dbError } = await supabase
      .from('usuarios')
      .update({ photo: publicUrl })
      .eq('user_id', userId);

    if (dbError) throw dbError;

    // 4. Actualizar variable local para mostrar la nueva foto
    profilePictureUrl.value = publicUrl;
    alert('Foto de perfil actualizada!');
  } catch (error: any) {
    errorMessage.value = 'Error al actualizar la foto: ' + error.message;
    alert(errorMessage.value);
  } finally {
    loading.value = false;
    if (fileInput.value) fileInput.value.value = '';
  }
};

function deleteAccount() {
  alert("Cuenta eliminada.");
}

function logout() {
  alert("Sesión cerrada.");
  router.push('/Principal');
}

function closeInfoUser() {
  router.push(`/Principal?userId=${userId}`);
}
</script>

<template>
  <div class="container py-5 position-relative" style="max-width: 480px;">
    <!-- Botón cerrar -->
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
          <img
            src="https://via.placeholder.com/120?text=Usuari"
            alt="Usuari"
            class="rounded-circle img-thumbnail"
            style="width: 120px; height: 120px; object-fit: cover;"
          />
        </template>

        <input
          type="file"
          accept="image/*"
          ref="fileInput"
          @change="handleFileChange"
          style="display: none;"
        />

        <button
          class="btn btn-outline-primary d-block mx-auto mt-3"
          @click="triggerFileInput"
          type="button"
        >
          Cambiar foto
        </button>
      </div>

      <div v-if="loading" class="d-flex justify-content-center my-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>

      <div v-else>
        <div class="mb-3">
          <label for="username" class="form-label">Nombre de usuario</label>
          <input
            id="username"
            type="text"
            class="form-control"
            v-model="userName"
            placeholder="Nombre de usuario"
          />
        </div>

        <div class="mb-3">
          <label for="email" class="form-label">Correo electrónico</label>
          <input
            id="email"
            type="email"
            class="form-control"
            v-model="userEmail"
            placeholder="Correo electrónico"
          />
        </div>

        <a
          :href="`/infoFavourites?userId=${userId}`"
          class="btn btn-primary w-100 mb-3"
          role="button"
        >
          Ver contenidos favoritos
        </a>

        <button
          class="btn btn-success w-100 mb-3"
          @click="saveChanges"
          :disabled="loading"
          type="button"
        >
          Guardar cambios
        </button>

        <button
          class="btn btn-danger w-100 mb-3"
          @click="deleteAccount"
          type="button"
        >
          Eliminar cuenta
        </button>

        <button
          class="btn btn-secondary w-100"
          @click="logout"
          type="button"
        >
          Cerrar sesión
        </button>

        <p v-if="errorMessage" class="text-danger mt-3 text-center">
          {{ errorMessage }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Bootstrap ya gestiona la mayoría de estilos */
</style>
