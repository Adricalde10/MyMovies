<script setup lang="ts">
// Imports de Vue i del client de Supabase
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import supabase from '@/supabaseClient';

// Inicialització del router i de la ruta actual
const route = useRoute();
const router = useRouter();

// Obtenció del userId des dels paràmetres de la ruta
const userId = route.query.userId as string;

// Variables reactives per guardar informació de l'usuari
const userName = ref('');
const userEmail = ref('');
const newPassword = ref('');
const profilePictureUrl = ref<string | null>(null);
const loading = ref(true); // Indica si s'estan carregant dades
const errorMessage = ref('');
const fileInput = ref<HTMLInputElement | null>(null); // Referència a l'input de fitxer

// Funció per carregar les dades de l'usuari des de la base de dades
const loadUserData = async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    // Consulta la informació de l'usuari
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    // Si es troba l'usuari, s'assignen les dades a les variables reactives
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

// Carrega les dades de l'usuari quan es munta el component
onMounted(loadUserData);

// Funció per guardar els canvis de l'usuari
const saveChanges = async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    // (Opcional) Actualitza el correu a l'autenticació de Supabase
    const { error: authError } = await supabase.auth.updateUser({
      email: userEmail.value,
    });
    if (authError) throw authError;

    // Actualitza les dades a la base de dades
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

// Funció per obrir l'explorador de fitxers
function triggerFileInput() {
  fileInput.value?.click();
}

// Gestor de canvi de fitxer (foto de perfil)
const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  loading.value = true;
  errorMessage.value = '';

  try {
    // Genera un path únic per a la imatge
    const fileExt = file.name.split('.').pop();
    const filePath = `butaca1/${userId}-${Date.now()}.${fileExt}`;

    // 1. Pujar el fitxer al bucket 'butaca1'
    const { error: uploadError } = await supabase.storage
      .from('butaca1')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // 2. Obtenir la URL pública del fitxer pujat
    const { data } = supabase.storage
      .from('butaca1')
      .getPublicUrl(filePath);

    const publicUrl = data.publicUrl;
    if (!publicUrl) throw new Error('No se pudo obtener la URL pública');

    // 3. Actualitzar la URL de la imatge al registre de l'usuari
    const { error: dbError } = await supabase
      .from('usuarios')
      .update({ photo: publicUrl })
      .eq('user_id', userId);

    if (dbError) throw dbError;

    // 4. Assignar la nova URL a la variable reactiva
    profilePictureUrl.value = publicUrl;
    alert('Foto de perfil actualizada!');
  } catch (error: any) {
    errorMessage.value = 'Error al actualizar la foto: ' + error.message;
    alert(errorMessage.value);
  } finally {
    loading.value = false;
    // Netejar l'input de fitxer
    if (fileInput.value) fileInput.value.value = '';
  }
};

// Funció per eliminar el compte (placeholder)
function deleteAccount() {
  alert("Cuenta eliminada.");
}

// Funció per tancar la sessió (placeholder)
function logout() {
  alert("Sesión cerrada.");
  router.push('/Principal'); // Redirigeix a la pàgina principal
}

// Funció per tancar la pantalla InfoUser i tornar a la pàgina principal
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
          Canviar foto
        </button>
      </div>

      <div v-if="loading" class="d-flex justify-content-center my-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Carregant...</span>
        </div>
      </div>

      <div v-else>
        <div class="mb-3">
          <label for="username" class="form-label">Nom d'usuari</label>
          <input
            id="username"
            type="text"
            class="form-control"
            v-model="userName"
            placeholder="Nombre de usuario"
          />
        </div>

        <div class="mb-3">
          <label for="email" class="form-label">Correu electronic</label>
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
          Veure continguts favorits
        </a>

        <button
           class="btn btn-primary w-100 mb-3"
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
/* Bootstrap ya gestiona la mayoría de estilos */
</style>
